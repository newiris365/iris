import logger from '../config/logger';
import { supabaseAdmin } from '../config/supabase';

// Cached config - reloaded every 5 minutes
let cachedConfig: any = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface WhatsAppConfig {
  provider: string;
  api_url: string;
  api_key: string | null;
  phone_number_id: string | null;
  from_number: string;
  verify_token: string | null;
  access_token: string | null;
  template_namespace: string | null;
  extra_config: Record<string, any>;
}

async function loadConfig(): Promise<WhatsAppConfig | null> {
  const now = Date.now();
  if (cachedConfig && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_api_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      // Fallback to env vars for backward compatibility
      const envFallback: WhatsAppConfig = {
        provider: 'twilio',
        api_url: 'https://api.twilio.com/2010-04-01/Accounts',
        api_key: process.env.TWILIO_AUTH_TOKEN || null,
        phone_number_id: null,
        from_number: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
        verify_token: process.env.WHATSAPP_VERIFY_TOKEN || 'iris365-whatsapp-verify',
        access_token: null,
        template_namespace: process.env.TWILIO_ACCOUNT_SID || null,
        extra_config: {},
      };

      if (!envFallback.api_key) {
        cachedConfig = null;
        cacheTimestamp = now;
        return null; // No config at all - sandbox mode
      }

      cachedConfig = envFallback;
      cacheTimestamp = now;
      return envFallback;
    }

    cachedConfig = {
      provider: data.provider || 'twilio',
      api_url: data.api_url,
      api_key: data.api_key,
      phone_number_id: data.phone_number_id,
      from_number: data.from_number,
      verify_token: data.verify_token,
      access_token: data.access_token,
      template_namespace: data.template_namespace,
      extra_config: data.extra_config || {},
    };
    cacheTimestamp = now;
    return cachedConfig;
  } catch (err: any) {
    logger.error(`Failed to load WhatsApp config: ${err.message}`);
    return null;
  }
}

/** Force-reload config (called after admin saves new config) */
export function reloadWhatsAppConfig(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
}

function isSandboxMode(): boolean {
  return !cachedConfig && Date.now() - cacheTimestamp > CACHE_TTL_MS;
}

// ─── Twilio Provider ──────────────────────────────────────────

async function twilioSend(to: string, body: string, config: WhatsAppConfig): Promise<boolean> {
  const url = `${config.api_url}/${config.template_namespace}/Messages.json`;
  const auth = Buffer.from(`${config.template_namespace}:${config.api_key}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: to,
      From: config.from_number,
      Body: body,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio API error ${response.status}: ${errorText}`);
  }
  return true;
}

async function twilioSendTemplate(to: string, templateName: string, params: Record<string, string>, config: WhatsAppConfig): Promise<boolean> {
  const url = `${config.api_url}/${config.template_namespace}/Messages.json`;
  const auth = Buffer.from(`${config.template_namespace}:${config.api_key}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: to,
      From: config.from_number,
      ContentTemplateSid: templateName,
      ContentVariables: JSON.stringify(params),
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio API error ${response.status}: ${errorText}`);
  }
  return true;
}

// ─── Meta Cloud API Provider ──────────────────────────────────

async function metaCloudSend(to: string, body: string, config: WhatsAppConfig): Promise<boolean> {
  const url = `${config.api_url}/${config.phone_number_id}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to.replace('whatsapp:', '').replace('+', ''),
      type: 'text',
      text: { body },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Meta Cloud API error ${response.status}: ${errorText}`);
  }
  return true;
}

// ─── Generic HTTP Provider (Gupshup, WATI, Custom) ────────────

async function genericSend(to: string, body: string, config: WhatsAppConfig): Promise<boolean> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.access_token) {
    headers['Authorization'] = `Bearer ${config.access_token}`;
  }
  if (config.api_key) {
    headers['apikey'] = config.api_key;
    headers['api-key'] = config.api_key;
  }

  const phone = to.replace('whatsapp:', '').replace('+', '');

  const response = await fetch(config.api_url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      to: phone,
      message: body,
      text: body,
      ...config.extra_config,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp API error ${response.status}: ${errorText}`);
  }
  return true;
}

// ─── Unified Send ─────────────────────────────────────────────

export async function sendTextMessage(to: string, body: string, channelPurpose: string = 'general'): Promise<boolean> {
  const config = await loadConfig();

  // Log to delivery log
  const logEntry: any = {
    to_phone: to,
    from_phone: config?.from_number || null,
    message_body: body,
    status: 'sent',
    provider: config?.provider || 'sandbox',
    channel_purpose: channelPurpose,
  };

  if (!config) {
    logger.info(`[WHATSAPP SANDBOX] To: ${to}, Purpose: ${channelPurpose}, Body: ${body.substring(0, 80)}...`);
    logEntry.status = 'sandbox';
    try { await supabaseAdmin.from('whatsapp_delivery_log').insert(logEntry); } catch {}
    return true;
  }

  try {
    switch (config.provider) {
      case 'twilio':
        await twilioSend(to, body, config);
        break;
      case 'meta_cloud':
        await metaCloudSend(to, body, config);
        break;
      case 'gupshup':
      case 'wati':
      case 'custom':
      default:
        await genericSend(to, body, config);
        break;
    }

    logger.info(`WhatsApp message sent to ${to} via ${config.provider} (${channelPurpose})`);
    logEntry.status = 'sent';
    try { await supabaseAdmin.from('whatsapp_delivery_log').insert(logEntry); } catch {}
    return true;
  } catch (err: any) {
    logger.error(`Failed to send WhatsApp to ${to}: ${err.message}`);
    logEntry.status = 'failed';
    logEntry.error_message = err.message;
    try { await supabaseAdmin.from('whatsapp_delivery_log').insert(logEntry); } catch {}
    return false;
  }
}

export async function sendWhatsAppMessage(
  to: string,
  templateName: string,
  params: Record<string, string>
): Promise<boolean> {
  const config = await loadConfig();

  if (!config) {
    logger.info(`[WHATSAPP SANDBOX] To: ${to}, Template: ${templateName}, Params: ${JSON.stringify(params)}`);
    return true;
  }

  try {
    if (config.provider === 'twilio') {
      await twilioSendTemplate(to, templateName, params, config);
    } else {
      // For non-Twilio providers, render template as text
      let body = templateName;
      for (const [key, value] of Object.entries(params)) {
        body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
      await sendTextMessage(to, body, 'template');
    }
    logger.info(`WhatsApp message sent to ${to} using template ${templateName}`);
    return true;
  } catch (err: any) {
    logger.error(`Failed to send WhatsApp message to ${to}: ${err.message}`);
    return false;
  }
}

export async function sendFeeReminder(
  studentPhone: string,
  studentName: string,
  feeName: string,
  amount: number,
  dueDate: string,
  daysOverdue: number
): Promise<boolean> {
  const messageBody = daysOverdue > 0
    ? `Dear ${studentName}, your fee payment of ₹${amount} for "${feeName}" was due on ${dueDate} and is now ${daysOverdue} day(s) overdue. Please pay immediately to avoid late charges. - IRIS 365`
    : `Dear ${studentName}, this is a reminder that your fee payment of ₹${amount} for "${feeName}" is due on ${dueDate}. Please ensure timely payment. - IRIS 365`;

  return sendTextMessage(studentPhone, messageBody, 'fee_reminder');
}

export interface FeeReminderEntry {
  student_id: string;
  student_name: string;
  student_phone: string;
  fee_name: string;
  amount: number;
  due_date: string;
  days_overdue: number;
}

export interface AttendanceWarningEntry {
  student_id: string;
  student_name: string;
  student_phone: string;
  guardian_phone: string | null;
  attendance_pct: number;
  total_classes: number;
  attended_classes: number;
  warning_type: 'warning_80' | 'critical_75' | 'final_60';
  department_name: string;
}

export async function sendAttendanceWarning(entry: AttendanceWarningEntry): Promise<{ student: boolean; parent: boolean }> {
  const levelMap = {
    warning_80: { label: 'Warning', emoji: '⚠️', threshold: '80%' },
    critical_75: { label: 'Critical', emoji: '🚨', threshold: '75%' },
    final_60: { label: 'Final Notice', emoji: '🔴', threshold: '60%' },
  };
  const level = levelMap[entry.warning_type];

  const studentMsg = `${level.emoji} ATTENDANCE ${level.label.toUpperCase()}: Dear ${entry.student_name}, your attendance has dropped to ${entry.attendance_pct}% (below ${level.threshold} threshold). You have attended ${entry.attended_classes}/${entry.total_classes} classes. Continued shortage may bar you from exams. - IRIS 365 ${entry.department_name}`;

  const parentMsg = `${level.emoji} ATTENDANCE ALERT: Your child ${entry.student_name} (${entry.department_name}) has ${entry.attendance_pct}% attendance (attended ${entry.attended_classes}/${entry.total_classes} classes). This is below the ${level.threshold} requirement. Please contact the college. - IRIS 365`;

  let studentSent = false;
  let parentSent = false;

  if (entry.student_phone) {
    studentSent = await sendTextMessage(entry.student_phone, studentMsg, 'attendance_warning');
  }

  if (entry.guardian_phone) {
    parentSent = await sendTextMessage(entry.guardian_phone, parentMsg, 'attendance_warning');
  }

  return { student: studentSent, parent: parentSent };
}

export interface FeeEscalationEntry {
  student_id: string;
  student_name: string;
  student_phone: string;
  guardian_phone: string | null;
  hod_phone: string | null;
  fee_name: string;
  amount: number;
  amount_overdue: number;
  days_overdue: number;
  stage: string;
  total_due: number;
}

export async function sendFeeEscalation(entry: FeeEscalationEntry): Promise<{ student: boolean; parent: boolean; hod: boolean }> {
  let studentSent = false;
  let parentSent = false;
  let hodSent = false;

  const stageMessages: Record<string, string> = {
    reminder_7day: `Dear ${entry.student_name}, your fee "${entry.fee_name}" of ₹${entry.amount} is due in 7 days (on ${new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN')}). Please plan your payment. - IRIS 365`,
    reminder_1day: `Dear ${entry.student_name}, your fee "${entry.fee_name}" of ₹${entry.amount} is due TOMORROW. Please ensure timely payment. - IRIS 365`,
    due_today: `Dear ${entry.student_name}, your fee "${entry.fee_name}" of ₹${entry.amount} is due TODAY. Please pay immediately. - IRIS 365`,
    overdue_7day: `URGENT: Dear ${entry.student_name}, your fee "${entry.fee_name}" is ${entry.days_overdue} days overdue. Amount: ₹${entry.amount_overdue}. Late fees are now being charged. Pay immediately. - IRIS 365`,
    overdue_30day: `FINAL NOTICE: Dear ${entry.student_name}, your fee "${entry.fee_name}" is ${entry.days_overdue} days overdue (₹${entry.total_due} total). A formal notice will be generated. Pay now to avoid escalation. - IRIS 365`,
  };

  const msg = stageMessages[entry.stage] || stageMessages.reminder_7day;

  if (entry.student_phone) {
    studentSent = await sendTextMessage(entry.student_phone, msg, 'fee_escalation');
  }

  if (entry.guardian_phone && ['due_today', 'overdue_7day', 'overdue_30day'].includes(entry.stage)) {
    const parentMsg = `Dear Parent, your child ${entry.student_name} has an overdue fee "${entry.fee_name}" of ₹${entry.total_due} (${entry.days_overdue} days overdue). Please ensure timely payment. - IRIS 365`;
    parentSent = await sendTextMessage(entry.guardian_phone, parentMsg, 'fee_escalation');
  }

  if (entry.hod_phone && ['overdue_7day', 'overdue_30day'].includes(entry.stage)) {
    const hodMsg = `NOTICE: Student ${entry.student_name} has fee "${entry.fee_name}" overdue by ${entry.days_overdue} days (₹${entry.total_due} total). Please follow up. - IRIS 365`;
    hodSent = await sendTextMessage(entry.hod_phone, hodMsg, 'fee_escalation');
  }

  return { student: studentSent, parent: parentSent, hod: hodSent };
}

export interface DailyDigestEntry {
  parent_phone: string;
  student_name: string;
  date: string;
  attendance_present: number;
  attendance_total: number;
  attendance_pct: number;
  canteen_spend: number;
  bus_boarded: boolean;
  bus_time: string | null;
  pending_fees: number;
}

export async function sendDailyDigest(entry: DailyDigestEntry): Promise<boolean> {
  const attendanceStatus = entry.attendance_pct >= 75 ? '✅' : entry.attendance_pct >= 60 ? '⚠️' : '🚨';
  const busStatus = entry.bus_boarded
    ? `🚌 Boarded at ${entry.bus_time || 'N/A'}`
    : '🚌 Not boarded today';

  const message = [
    `📊 *Daily Summary — ${entry.date}*`,
    ``,
    `${attendanceStatus} *Attendance:* ${entry.attendance_present}/${entry.attendance_total} classes (${entry.attendance_pct}%)`,
    `🍽️ *Canteen Spend:* ₹${entry.canteen_spend}`,
    busStatus,
    entry.pending_fees > 0 ? `💰 *Pending Fees:* ₹${entry.pending_fees.toLocaleString('en-IN')}` : '',
    ``,
    `— IRIS 365`,
  ].filter(Boolean).join('\n');

  return sendTextMessage(entry.parent_phone, message, 'daily_digest');
}

export async function sendBulkReminders(reminders: FeeReminderEntry[]): Promise<{ sent: number; failed: number; details: { student_id: string; status: string }[] }> {
  let sent = 0;
  let failed = 0;
  const details: { student_id: string; status: string }[] = [];

  for (const reminder of reminders) {
    if (!reminder.student_phone) {
      failed++;
      details.push({ student_id: reminder.student_id, status: 'no_phone' });
      continue;
    }

    const success = await sendFeeReminder(
      reminder.student_phone,
      reminder.student_name,
      reminder.fee_name,
      reminder.amount,
      reminder.due_date,
      reminder.days_overdue
    );

    if (success) {
      sent++;
      details.push({ student_id: reminder.student_id, status: 'sent' });
    } else {
      failed++;
      details.push({ student_id: reminder.student_id, status: 'failed' });
    }
  }

  logger.info(`Bulk reminders: ${sent} sent, ${failed} failed out of ${reminders.length}`);
  return { sent, failed, details };
}
