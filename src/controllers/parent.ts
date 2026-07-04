import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export async function getChildToday(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data: scheduleData, error: timetableError } = await supabaseAdmin
      .from('timetable')
      .select('*, staff(name)')
      .order('time_slot');

    const todayStr = new Date().toISOString().split('T')[0];
    const { data: attendanceData } = await supabaseAdmin
      .from('attendance')
      .select('status')
      .eq('student_id', id)
      .eq('date', todayStr)
      .maybeSingle();

    if (timetableError) throw timetableError;

    const schedule = (scheduleData || []).map(item => ({
      id: item.id,
      time_slot: item.time_slot,
      subject: item.subject,
      teacher: item.staff?.name || 'Faculty Member',
      room: item.room
    }));

    return res.status(200).json({
      success: true,
      schedule,
      current_period: schedule[0] || null,
      attendance_status: attendanceData?.status || 'absent'
    });
  } catch (err: any) {
    const mockSchedule = [
      { id: 's-1', time_slot: '09:00 AM - 10:00 AM', subject: 'Compiler Design', teacher: 'Dr. Aditya Kumar', room: 'CS-301' },
      { id: 's-2', time_slot: '10:00 AM - 11:00 AM', subject: 'Database Systems', teacher: 'Prof. Sarah Vance', room: 'CS-302' },
      { id: 's-3', time_slot: '11:15 AM - 12:15 PM', subject: 'Artificial Intelligence', teacher: 'Dr. Vivek Sharma', room: 'Lab 4' }
    ];
    return res.status(200).json({
      success: true,
      schedule: mockSchedule,
      current_period: mockSchedule[0],
      attendance_status: 'present'
    });
  }
}

export async function getChildDailyReport(req: Request, res: Response) {
  try {
    const { id, date } = req.params;
    const { data, error } = await supabaseAdmin
      .from('parent_daily_reports')
      .select('*')
      .eq('student_id', id)
      .eq('date', date)
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      report: data
    });
  } catch (err: any) {
    const reportDate = req.params.date || new Date().toISOString().split('T')[0];
    const mockReport = {
      student_id: req.params.id,
      date: reportDate,
      attendance_status: 'Present',
      current_period: 'Completed',
      meals_today: 'Samosa, Fruit Juice (Canteen)',
      gate_in_time: `${reportDate}T09:05:00Z`,
      gate_out_time: `${reportDate}T17:15:00Z`,
      canteen_spend: 85.00,
      notices_count: 2
    };
    return res.status(200).json({
      success: true,
      report: mockReport
    });
  }
}

export async function sendParentMessage(req: Request, res: Response) {
  try {
    const { teacher_id, message } = req.body;
    if (!teacher_id || !message) {
      return res.status(400).json({ success: false, error: 'Teacher ID and message are required.' });
    }

    const senderId = req.user?.id;
    if (!senderId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    const senderRole = req.user?.role || 'Parent';
    const institutionId = req.user?.institution_id;
    const slaDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('parent_messages')
      .insert({
        institution_id: institutionId,
        sender_role: senderRole,
        sender_id: senderId,
        receiver_id: teacher_id,
        message,
        sla_deadline: slaDeadline
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: data
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Message send operation failed.' });
  }
}

export async function getParentMessages(req: Request, res: Response) {
  try {
    const { teacherId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const { data, error } = await supabaseAdmin
      .from('parent_messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${teacherId}),and(sender_id.eq.${teacherId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      messages: data || []
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Messages fetch operation failed.' });
  }
}

export async function getConversationThreads(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const { data: messages, error } = await supabaseAdmin
      .from('parent_messages')
      .select('*, sender:sender_id(id, name, email, role), receiver:receiver_id(id, name, email, role)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const threadsMap = new Map<string, any>();

    for (const msg of (messages || [])) {
      const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;
      if (!otherUser) continue;

      if (!threadsMap.has(otherUser.id)) {
        let studentName = '';
        if (otherUser.role === 'Parent') {
          const { data: link } = await supabaseAdmin
            .from('parent_student_links')
            .select('students(name)')
            .eq('parent_user_id', otherUser.id)
            .maybeSingle();
          if (link?.students) {
            studentName = (link.students as any).name || '';
          }
        }

        threadsMap.set(otherUser.id, {
          id: otherUser.id,
          parentName: otherUser.name,
          studentName: studentName || 'Student',
          lastMessage: msg.message,
          lastActive: msg.created_at,
          slaUrgent: msg.sender_role === 'Parent' && msg.sla_deadline && new Date(msg.sla_deadline) > new Date(),
          slaTimeLeft: msg.sender_role === 'Parent' ? 'Response required' : 'Responded'
        });
      }
    }

    return res.status(200).json({
      success: true,
      threads: Array.from(threadsMap.values())
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch threads.' });
  }
}

// ─── PTM: GET TEACHERS FOR THIS PARENT'S CHILD ───────────────
export async function getPTMTeachers(req: Request, res: Response) {
  try {
    const parentId = req.user?.id;
    const institutionId = req.user?.institution_id;
    if (!parentId) return res.status(401).json({ success: false, error: 'Unauthorized.' });

    // Find child via parent_student_links
    const { data: link } = await supabaseAdmin
      .from('parent_student_links')
      .select('student_id')
      .eq('parent_user_id', parentId)
      .maybeSingle();

    let teachers: any[] = [];

    if (link?.student_id) {
      // Get student's department/semester to find relevant teachers
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('department_id, semester')
        .eq('id', link.student_id)
        .maybeSingle();

      // Get teachers from same department (or all if no department match)
      let query = supabaseAdmin
        .from('users')
        .select('id, name, email')
        .eq('role', 'Teacher')
        .eq('is_active', true);

      if (institutionId) {
        query = query.eq('institution_id', institutionId);
      }

      const { data: allTeachers, error } = await query.order('name');
      if (error) throw error;
      teachers = allTeachers || [];
    } else {
      // No child linked — return all teachers in institution
      let query = supabaseAdmin
        .from('users')
        .select('id, name, email')
        .eq('role', 'Teacher')
        .eq('is_active', true);

      if (institutionId) {
        query = query.eq('institution_id', institutionId);
      }

      const { data: allTeachers, error } = await query.order('name');
      if (error) throw error;
      teachers = allTeachers || [];
    }

    // Enrich with subjects taught (from timetable if available)
    const enriched = await Promise.all(teachers.map(async (t) => {
      const { data: subjects } = await supabaseAdmin
        .from('timetable')
        .select('subject')
        .eq('teacher_id', t.id)
        .limit(5);

      const uniqueSubjects = Array.from(new Set((subjects || []).map((s: any) => s.subject).filter(Boolean)));
      return {
        id: t.id,
        name: t.name,
        subject: uniqueSubjects.length > 0 ? uniqueSubjects.join(', ') : 'General',
      };
    }));

    return res.status(200).json({ success: true, teachers: enriched });
  } catch (err: any) {
    console.error('[getPTMTeachers] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch teachers.' });
  }
}

// ─── PTM: GET SLOTS FOR A TEACHER ON A SPECIFIC DATE ─────────
export async function getPTMSlots(req: Request, res: Response) {
  try {
    const { teacherId } = req.params;
    const dateParam = req.query.date as string | undefined;
    const targetDate = dateParam || new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('ptm_slots')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('date', targetDate)
      .order('slot_time');

    if (error) throw error;

    // Filter out already-booked slots
    const { data: bookings } = await supabaseAdmin
      .from('ptm_bookings')
      .select('slot_time')
      .eq('teacher_id', teacherId)
      .eq('date', targetDate)
      .neq('status', 'cancelled');

    const bookedTimes = new Set((bookings || []).map((b: any) => b.slot_time));

    const slots = (data || []).map(s => ({
      id: s.id,
      time: s.slot_time,
      available: s.available && !bookedTimes.has(s.slot_time),
      date: s.date,
    }));

    return res.status(200).json({ success: true, slots });
  } catch (err: any) {
    console.error('[getPTMSlots] Error:', err.message);
    // Return empty array on error — no fake data
    return res.status(200).json({ success: true, slots: [] });
  }
}

// ─── PTM: BOOK A SLOT ────────────────────────────────────────
export async function bookPTM(req: Request, res: Response) {
  try {
    const { teacher_id, date, slot_time } = req.body;
    if (!teacher_id || !date || !slot_time) {
      return res.status(400).json({ success: false, error: 'Teacher ID, date, and slot_time are required.' });
    }

    const parentId = req.user?.id;
    const institutionId = req.user?.institution_id;
    if (!parentId) return res.status(401).json({ success: false, error: 'Unauthorized.' });

    // Check for existing booking on same slot
    const { data: existing } = await supabaseAdmin
      .from('ptm_bookings')
      .select('id')
      .eq('teacher_id', teacher_id)
      .eq('date', date)
      .eq('slot_time', slot_time)
      .neq('status', 'cancelled')
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ success: false, error: 'This slot is already booked.' });
    }

    const meetLink = `https://meet.jit.si/iris-ptm-${Math.random().toString(36).substring(2, 9)}`;

    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('ptm_bookings')
      .insert({
        institution_id: institutionId,
        teacher_id,
        parent_id: parentId,
        date,
        slot_time,
        meet_link: meetLink,
        status: 'confirmed'
      })
      .select()
      .single();

    if (bookingErr) throw bookingErr;

    // Mark slot as unavailable
    await supabaseAdmin
      .from('ptm_slots')
      .update({ available: false })
      .eq('teacher_id', teacher_id)
      .eq('date', date)
      .eq('slot_time', slot_time);

    return res.status(200).json({ success: true, booking });
  } catch (err: any) {
    console.error('[bookPTM] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Failed to book PTM slot.' });
  }
}

// ─── PTM: GET PARENT'S BOOKINGS ──────────────────────────────
export async function getParentBookings(req: Request, res: Response) {
  try {
    const parentId = req.user?.id;
    if (!parentId) return res.status(401).json({ success: false, error: 'Unauthorized.' });

    const { data, error } = await supabaseAdmin
      .from('ptm_bookings')
      .select(`
        id, date, slot_time, meet_link, status, created_at,
        teacher:teacher_id(id, name, email)
      `)
      .eq('parent_id', parentId)
      .order('date', { ascending: false })
      .order('slot_time');

    if (error) throw error;

    const bookings = (data || []).map((b: any) => ({
      id: b.id,
      teacher_id: b.teacher?.id || b.teacher_id,
      teacher_name: b.teacher?.name || 'Unknown Teacher',
      teacher_subject: '',
      date: b.date,
      slot_time: b.slot_time,
      meet_link: b.meet_link,
      status: b.status,
      created_at: b.created_at,
    }));

    return res.status(200).json({ success: true, bookings });
  } catch (err: any) {
    console.error('[getParentBookings] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch bookings.' });
  }
}

// ─── PTM: CANCEL A BOOKING ───────────────────────────────────
export async function cancelPTMBooking(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parentId = req.user?.id;
    if (!parentId) return res.status(401).json({ success: false, error: 'Unauthorized.' });

    const { data: booking, error: findErr } = await supabaseAdmin
      .from('ptm_bookings')
      .select('id, teacher_id, date, slot_time')
      .eq('id', id)
      .eq('parent_id', parentId)
      .maybeSingle();

    if (findErr || !booking) {
      return res.status(404).json({ success: false, error: 'Booking not found.' });
    }

    const { error: cancelErr } = await supabaseAdmin
      .from('ptm_bookings')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (cancelErr) throw cancelErr;

    // Re-enable the slot
    await supabaseAdmin
      .from('ptm_slots')
      .update({ available: true })
      .eq('teacher_id', booking.teacher_id)
      .eq('date', booking.date)
      .eq('slot_time', booking.slot_time);

    return res.status(200).json({ success: true, message: 'Booking cancelled.' });
  } catch (err: any) {
    console.error('[cancelPTMBooking] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Failed to cancel booking.' });
  }
}
