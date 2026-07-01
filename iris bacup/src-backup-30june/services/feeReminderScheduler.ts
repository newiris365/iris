import cron from 'node-cron';
import { supabaseAdmin, isSupabaseOffline } from '../config/supabase';
import logger from '../config/logger';
import { sendBulkReminders, FeeReminderEntry } from './whatsapp';

const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000;

async function getUnpaidFeesDueForReminder(): Promise<FeeReminderEntry[]> {
  const today = new Date();
  const results: FeeReminderEntry[] = [];

  const targetDays = [2, 1, 7, 14, 30];

  for (const days of targetDays) {
    let targetDate: Date;
    let daysOverdue: number;

    if (days === 2) {
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() + 2);
      daysOverdue = 0;
    } else {
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() - days);
      daysOverdue = days;
    }

    const dateStr = targetDate.toISOString().split('T')[0];

    let query = supabaseAdmin
      .from('fee_structures')
      .select('id, name, amount, due_date')
      .eq('due_date', dateStr);

    const { data: feeStructures, error: feeErr } = await query;

    if (feeErr || !feeStructures || feeStructures.length === 0) {
      continue;
    }

    for (const fee of feeStructures) {
      const { data: paidStudents, error: paidErr } = await supabaseAdmin
        .from('fee_payments')
        .select('student_id')
        .eq('fee_structure_id', fee.id)
        .eq('status', 'Completed');

      const paidIds = new Set((paidStudents || []).map(p => p.student_id));

      const { data: allStudents, error: stuErr } = await supabaseAdmin
        .from('students')
        .select('id, user_id, users(name, phone)');

      if (stuErr || !allStudents) continue;

      for (const student of allStudents) {
        if (paidIds.has(student.id)) continue;

        const phone = (student.users as any)?.phone;
        const name = (student.users as any)?.name || 'Student';

        if (!phone) continue;

        results.push({
          student_id: student.id,
          student_name: name,
          student_phone: phone,
          fee_name: fee.name,
          amount: fee.amount,
          due_date: fee.due_date,
          days_overdue: daysOverdue,
        });
      }
    }
  }

  return results;
}

async function deduplicateReminders(entries: FeeReminderEntry[]): Promise<FeeReminderEntry[]> {
  const cutoff = new Date(Date.now() - REMINDER_COOLDOWN_MS).toISOString();

  const { data: recentReminders, error } = await supabaseAdmin
    .from('fee_reminders')
    .select('student_id, fee_name')
    .gte('sent_at', cutoff);

  if (error || !recentReminders) return entries;

  const sentSet = new Set(
    recentReminders.map(r => `${r.student_id}:${r.fee_name}`)
  );

  return entries.filter(e => !sentSet.has(`${e.student_id}:${e.fee_name}`));
}

async function logReminders(
  results: { sent: number; failed: number; details: { student_id: string; status: string }[] },
  entries: FeeReminderEntry[]
): Promise<void> {
  for (const detail of results.details) {
    const entry = entries.find(e => e.student_id === detail.student_id);
    if (!entry) continue;

    await supabaseAdmin.from('fee_reminders').insert({
      student_id: detail.student_id,
      fee_name: entry.fee_name,
      amount: entry.amount,
      channel: 'whatsapp',
      status: detail.status,
      sent_at: new Date().toISOString(),
    });
  }
}

async function runFeeReminderCheck(): Promise<void> {
  if (isSupabaseOffline) {
    logger.debug('Skipping fee reminder check: Supabase offline');
    return;
  }

  logger.info('Running fee reminder check...');

  try {
    const allReminders = await getUnpaidFeesDueForReminder();
    logger.info(`Found ${allReminders.length} unpaid fee entries for reminder`);

    const freshReminders = await deduplicateReminders(allReminders);
    logger.info(`${freshReminders.length} reminders after deduplication (24h cooldown)`);

    if (freshReminders.length === 0) {
      logger.info('No new reminders to send');
      return;
    }

    const results = await sendBulkReminders(freshReminders);

    try {
      await logReminders(results, freshReminders);
    } catch (logErr: any) {
      logger.error('Failed to log reminders to database: ' + logErr.message);
    }

    logger.info(`Fee reminder run complete: ${results.sent} sent, ${results.failed} failed`);
  } catch (err: any) {
    logger.error('Error in fee reminder check: ' + err.message);
  }
}

export function startFeeReminderScheduler(): void {
  cron.schedule('0 9 * * *', async () => {
    await runFeeReminderCheck();
  });

  logger.info('Fee reminder scheduler started (daily at 9:00 AM)');
}
