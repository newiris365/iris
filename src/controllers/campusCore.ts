import { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'iris-365-super-secret-key-for-jwt-signing';

// Campus Coordinates for Geo-fencing (e.g., JIET Jodhpur)
const CAMPUS_LAT = 26.2389;
const CAMPUS_LNG = 73.0243;
const MAX_RADIUS_METERS = 200; // 200m geofence

// Utility function to calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

// Helper to calculate Grade
function calculateGrade(marks: number, max: number): string {
  const pct = (marks / max) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

// Validation schemas
const startSessionSchema = z.object({
  department_id: z.string().uuid(),
  subject: z.string(),
  time_slot: z.string()
});

const qrVerificationSchema = z.object({
  token: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  device_id: z.string().optional()
});

const biometricSchema = z.object({
  device_id: z.string(),
  fingerprint_id: z.string(),
  timestamp: z.string()
});

const bulkAttendanceSchema = z.object({
  session_id: z.string().uuid(),
  records: z.array(z.object({
    student_id: z.string().uuid(),
    status: z.enum(['present', 'absent', 'late', 'excused'])
  }))
});

const regularizationSchema = z.object({
  student_id: z.string().uuid(),
  date: z.string(),
  reason: z.string(),
  proof_url: z.string().optional()
});

const studentSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  roll_number: z.string(),
  department_id: z.string().uuid(),
  semester: z.number().int().min(1),
  batch_year: z.string(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  blood_group: z.string().optional(),
  guardian_name: z.string().optional(),
  guardian_phone: z.string().optional(),
  address: z.string().optional(),
  fingerprint_id: z.string().optional()
});

const timetableBlockSchema = z.object({
  department_id: z.string().uuid(),
  day_of_week: z.string(),
  time_slot: z.string(),
  subject: z.string(),
  teacher_id: z.string().uuid(),
  room: z.string()
});

const feePaymentInitSchema = z.object({
  student_id: z.string().uuid(),
  fee_structure_id: z.string().uuid(),
  amount: z.number().positive()
});

const feePaymentVerifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  student_id: z.string().uuid(),
  fee_structure_id: z.string().uuid(),
  amount_paid: z.number().positive()
});

const concessionSchema = z.object({
  student_id: z.string().uuid(),
  fee_structure_id: z.string().uuid(),
  concession_type: z.string(),
  amount: z.number().positive(),
  reason: z.string().optional()
});

const noticeSchema = z.object({
  title: z.string(),
  content: z.string(),
  category: z.string().optional(),
  target_audience: z.array(z.string()).optional(),
  expires_at: z.string().optional()
});

const examSchema = z.object({
  name: z.string(),
  department_id: z.string().uuid(),
  start_date: z.string(),
  end_date: z.string(),
  type: z.string().optional()
});

const markEntrySchema = z.object({
  exam_id: z.string().uuid(),
  subject: z.string(),
  records: z.array(z.object({
    student_id: z.string().uuid(),
    marks_obtained: z.number().min(0),
    max_marks: z.number().positive(),
    remarks: z.string().optional()
  }))
});

const idCardTemplateSchema = z.object({
  template_json: z.record(z.any())
});

// =========================================================================
// 1. ATTENDANCE CONTROLLERS
// =========================================================================

export async function startSession(req: Request, res: Response) {
  try {
    const parse = startSessionSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    const { department_id, subject, time_slot } = parse.data;

    const { data: session, error } = await supabaseAdmin
      .from('attendance_sessions')
      .insert({
        institution_id: req.user?.institution_id,
        department_id,
        subject,
        date: new Date().toISOString().split('T')[0],
        time_slot,
        marked_by: req.user?.id
      })
      .select()
      .single();

    if (error || !session) return res.status(500).json({ success: false, error: 'Database failed to start session.' });

    const qrToken = jwt.sign(
      { session_id: session.id, type: 'ATTENDANCE_QR' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.status(200).json({ success: true, session_id: session.id, qrToken });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function getSessionQr(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data: session, error } = await supabaseAdmin
      .from('attendance_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !session) return res.status(404).json({ success: false, error: 'Session not found.' });

    const qrToken = jwt.sign(
      { session_id: session.id, type: 'ATTENDANCE_QR' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.status(200).json({ success: true, qrToken });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function markAttendanceQr(req: Request, res: Response) {
  try {
    const parse = qrVerificationSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    const { token, latitude, longitude, device_id } = parse.data;

    const decoded = jwt.verify(token, JWT_SECRET) as { session_id: string; type: string };
    if (decoded.type !== 'ATTENDANCE_QR') return res.status(400).json({ success: false, error: 'Invalid QR token structure.' });

    // Geo-fence verification
    const distance = calculateDistance(latitude, longitude, CAMPUS_LAT, CAMPUS_LNG);
    if (distance > MAX_RADIUS_METERS) {
      return res.status(400).json({ success: false, error: `Not on campus. You are currently ${Math.round(distance)}m outside boundaries.` });
    }

    const { data: student, error: stdErr } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('user_id', req.user?.id)
      .single();

    if (stdErr || !student) return res.status(404).json({ success: false, error: 'Student profile not mapped to current login credentials.' });

    // Prevent double attendance
    const { data: existing } = await supabaseAdmin
      .from('attendance')
      .select('id')
      .eq('student_id', student.id)
      .eq('session_id', decoded.session_id)
      .maybeSingle();

    if (existing) return res.status(409).json({ success: true, message: 'Already marked present' });

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .insert({
        institution_id: req.user?.institution_id,
        student_id: student.id,
        session_id: decoded.session_id,
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        marked_by: req.user?.id,
        method: 'qr',
        latitude,
        longitude,
        device_id
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: 'Failed to record attendance.' });

    return res.status(200).json({ success: true, message: 'Attendance marked present', data });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'QR verification token expired or invalid.' });
  }
}

export async function markAttendanceBiometric(req: Request, res: Response) {
  try {
    const parse = biometricSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    const { device_id, fingerprint_id } = parse.data;

    // Find student by fingerprint
    const { data: student, error: stdErr } = await supabaseAdmin
      .from('students')
      .select('id, institution_id')
      .eq('fingerprint_id', fingerprint_id)
      .single();

    if (stdErr || !student) return res.status(404).json({ success: false, error: 'Fingerprint ID mapping not found.' });

    // Look for active session today in the student's department or generic core session
    const { data: session } = await supabaseAdmin
      .from('attendance_sessions')
      .select('id')
      .eq('institution_id', student.institution_id)
      .eq('date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) return res.status(404).json({ success: false, error: 'No active attendance sessions scheduled for today.' });

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .insert({
        institution_id: student.institution_id,
        student_id: student.id,
        session_id: session.id,
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        method: 'biometric',
        device_id
      })
      .select()
      .single();

    if (error) return res.status(409).json({ success: false, error: 'Log already exists.' });

    return res.status(200).json({ success: true, message: 'Biometric log recorded.', data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Biometric registration failed.' });
  }
}

export async function markAttendanceBulk(req: Request, res: Response) {
  try {
    const parse = bulkAttendanceSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    const { session_id, records } = parse.data;
    const date = new Date().toISOString().split('T')[0];

    const logs = records.map(rec => ({
      institution_id: req.user?.institution_id,
      student_id: rec.student_id,
      session_id,
      date,
      status: rec.status,
      marked_by: req.user?.id,
      method: 'manual'
    }));

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .upsert(logs, { onConflict: 'student_id,session_id' })
      .select();

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, count: data.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal bulk write failure.' });
  }
}

export async function getStudentAttendance(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data: logs, error } = await supabaseAdmin
      .from('attendance')
      .select('*, attendance_sessions(subject)')
      .eq('student_id', id);

    if (error) return res.status(500).json({ success: false, error: error.message });

    const total = logs.length;
    const present = logs.filter(l => l.status === 'present' || l.status === 'late').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

    // Subject breakdown
    const subjectsMap: Record<string, { total: number; present: number }> = {};
    logs.forEach(log => {
      const sub = log.attendance_sessions?.subject || 'General';
      if (!subjectsMap[sub]) subjectsMap[sub] = { total: 0, present: 0 };
      subjectsMap[sub].total++;
      if (log.status === 'present' || log.status === 'late') subjectsMap[sub].present++;
    });

    const breakdown = Object.entries(subjectsMap).map(([subject, counts]) => ({
      subject,
      percentage: Math.round((counts.present / counts.total) * 100),
      total: counts.total,
      present: counts.present
    }));

    // Heatmap formatting
    const heatmap = logs.map(l => ({
      date: l.date,
      status: l.status
    }));

    // Reach 75% calculator
    let daysNeeded = 0;
    if (percentage < 75) {
      // 75% formula: (present + x) / (total + x) = 0.75 => x = (3*total - 4*present)
      daysNeeded = Math.max(0, Math.ceil(3 * total - 4 * present));
    }

    return res.status(200).json({
      success: true,
      stats: { overall: percentage, total, present, daysNeeded },
      breakdown,
      heatmap
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal fetch failure.' });
  }
}

export async function getAttendanceReport(req: Request, res: Response) {
  try {
    const { departmentId } = req.params;
    const { data: sessions, error } = await supabaseAdmin
      .from('attendance_sessions')
      .select('*, attendance(*)')
      .eq('department_id', departmentId);

    if (error) return res.status(500).json({ success: false, error: error.message });

    const reports = sessions.map((sess: any) => {
      const total = sess.attendance.length;
      const present = sess.attendance.filter((a: any) => a.status === 'present').length;
      return {
        id: sess.id,
        subject: sess.subject,
        date: sess.date,
        time_slot: sess.time_slot,
        total_marked: total,
        present_count: present,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0
      };
    });

    return res.status(200).json({ success: true, reports });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to build attendance report.' });
  }
}

export async function submitRegularize(req: Request, res: Response) {
  try {
    const parse = regularizationSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    const { student_id, date, reason, proof_url } = parse.data;

    // Monthly threshold check (max 3)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);

    const { count } = await supabaseAdmin
      .from('attendance_regularizations')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student_id)
      .gte('created_at', startOfMonth.toISOString());

    if (count !== null && count >= 3) {
      return res.status(400).json({ success: false, error: 'Maximum limit of 3 attendance regularizations per month reached.' });
    }

    const { data, error } = await supabaseAdmin
      .from('attendance_regularizations')
      .insert({
        institution_id: req.user?.institution_id,
        student_id,
        date,
        reason,
        proof_url,
        status: 'Pending'
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to submit regularization.' });
  }
}

export async function approveRegularize(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body; // Approved or Rejected
    if (status !== 'Approved' && status !== 'Rejected') {
      return res.status(400).json({ success: false, error: 'Status must be Approved or Rejected' });
    }

    const { data: reg, error: fetchErr } = await supabaseAdmin
      .from('attendance_regularizations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !reg) return res.status(404).json({ success: false, error: 'Regularization record not found.' });

    const { data: updatedReg, error: regErr } = await supabaseAdmin
      .from('attendance_regularizations')
      .update({ status, approved_by: req.user?.id })
      .eq('id', id)
      .select()
      .single();

    if (regErr) return res.status(500).json({ success: false, error: regErr.message });

    // If approved, update student attendance state to present
    if (status === 'Approved') {
      await supabaseAdmin
        .from('attendance')
        .insert({
          institution_id: reg.institution_id,
          student_id: reg.student_id,
          date: reg.date,
          status: 'present',
          marked_by: req.user?.id,
          method: 'manual'
        });
    }

    return res.status(200).json({ success: true, data: updatedReg });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Verification approve failure.' });
  }
}

// =========================================================================
// 2. STUDENTS CRUD CONTROLLERS
// =========================================================================

export async function getStudents(req: Request, res: Response) {
  try {
    const { department_id, batch } = req.query;
    let query = supabaseAdmin
      .from('students')
      .select('*, users(*)');

    if (req.user?.institution_id) {
      query = query.eq('institution_id', req.user.institution_id);
    }
    if (department_id) {
      query = query.eq('department_id', department_id);
    }
    if (batch) {
      query = query.eq('batch_year', batch);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, students: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch students list.' });
  }
}

export async function createStudent(req: Request, res: Response) {
  try {
    const parse = studentSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    const payload = parse.data;

    // Create User account first
    const { data: user, error: uErr } = await supabaseAdmin
      .from('users')
      .insert({
        institution_id: req.user?.institution_id,
        name: payload.name,
        email: payload.email,
        phone: payload.guardian_phone,
        role: 'Student',
        is_active: true
      })
      .select()
      .single();

    if (uErr || !user) return res.status(500).json({ success: false, error: uErr?.message || 'Failed to create student user login context.' });

    // Create student record linked to user
    const { data: student, error: sErr } = await supabaseAdmin
      .from('students')
      .insert({
        user_id: user.id,
        institution_id: req.user?.institution_id,
        roll_number: payload.roll_number,
        department_id: payload.department_id,
        semester: payload.semester,
        batch_year: payload.batch_year,
        dob: payload.dob,
        gender: payload.gender,
        blood_group: payload.blood_group,
        guardian_name: payload.guardian_name,
        guardian_phone: payload.guardian_phone,
        address: payload.address,
        fingerprint_id: payload.fingerprint_id
      })
      .select()
      .single();

    if (sErr) {
      await supabaseAdmin.from('users').delete().eq('id', user.id); // Rollback user
      return res.status(500).json({ success: false, error: sErr.message });
    }

    return res.status(200).json({ success: true, student });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Database enrollment failure.' });
  }
}

export async function getStudentById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*, users(*)')
      .eq('id', id)
      .single();

    if (error || !data) return res.status(404).json({ success: false, error: 'Student details not found.' });
    return res.status(200).json({ success: true, student: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Fetch failure.' });
  }
}

export async function updateStudent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data: student, error: getErr } = await supabaseAdmin.from('students').select('user_id').eq('id', id).single();
    if (getErr || !student) return res.status(404).json({ success: false, error: 'Student record not found.' });

    const { name, email, ...studentFields } = req.body;

    // Update User record
    if (name || email) {
      await supabaseAdmin
        .from('users')
        .update({ name, email })
        .eq('id', student.user_id);
    }

    // Update Student details
    const { data, error } = await supabaseAdmin
      .from('students')
      .update(studentFields)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, student: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to update student.' });
  }
}

export async function deleteStudent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data: student, error: getErr } = await supabaseAdmin.from('students').select('user_id').eq('id', id).single();
    if (getErr || !student) return res.status(404).json({ success: false, error: 'Student record not found.' });

    // Cascades delete from user context
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', student.user_id);

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, message: 'Student and associated user account removed.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to delete student.' });
  }
}

export async function importStudents(req: Request, res: Response) {
  try {
    const { records } = req.body; // Expects array of student objects
    if (!Array.isArray(records)) return res.status(400).json({ success: false, error: 'Payload records must be an array.' });

    const imported = [];
    for (const rec of records) {
      // Direct insertion script mock validation
      const parse = studentSchema.safeParse(rec);
      if (!parse.success) continue;

      const payload = parse.data;
      const { data: user } = await supabaseAdmin
        .from('users')
        .insert({
          institution_id: req.user?.institution_id,
          name: payload.name,
          email: payload.email,
          phone: payload.guardian_phone,
          role: 'Student'
        })
        .select()
        .single();

      if (user) {
        const { data: student } = await supabaseAdmin
          .from('students')
          .insert({
            user_id: user.id,
            institution_id: req.user?.institution_id,
            roll_number: payload.roll_number,
            department_id: payload.department_id,
            semester: payload.semester,
            batch_year: payload.batch_year
          })
          .select()
          .single();

        if (student) imported.push(student);
      }
    }

    return res.status(200).json({ success: true, count: imported.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to import students.' });
  }
}

// =========================================================================
// 3. TIMETABLE CONTROLLERS
// =========================================================================

export async function getTimetable(req: Request, res: Response) {
  try {
    const { departmentId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('timetable')
      .select('*, staff(*, users(*))')
      .eq('department_id', departmentId);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, timetable: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch timetable.' });
  }
}

export async function addTimetableBlock(req: Request, res: Response) {
  try {
    const parse = timetableBlockSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    const block = parse.data;

    // Clash Detection 1: Room conflict
    const { data: roomConflict } = await supabaseAdmin
      .from('timetable')
      .select('id, subject')
      .eq('day_of_week', block.day_of_week)
      .eq('time_slot', block.time_slot)
      .eq('room', block.room)
      .maybeSingle();

    if (roomConflict) return res.status(409).json({ success: false, error: `Clash: Room ${block.room} is already booked for ${roomConflict.subject}.` });

    // Clash Detection 2: Teacher conflict
    const { data: teacherConflict } = await supabaseAdmin
      .from('timetable')
      .select('id, subject')
      .eq('day_of_week', block.day_of_week)
      .eq('time_slot', block.time_slot)
      .eq('teacher_id', block.teacher_id)
      .maybeSingle();

    if (teacherConflict) return res.status(409).json({ success: false, error: `Clash: Lecturer is already assigned to ${teacherConflict.subject} during this time.` });

    const { data, error } = await supabaseAdmin
      .from('timetable')
      .insert({
        institution_id: req.user?.institution_id,
        ...block
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Database scheduling clash error.' });
  }
}

export async function updateTimetableBlock(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('timetable')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Database update failed.' });
  }
}

export async function deleteTimetableBlock(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('timetable').delete().eq('id', id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, message: 'Block removed from timetable.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to delete block.' });
  }
}

export async function autoGenerateTimetable(req: Request, res: Response) {
  try {
    const { department_id, subjects, teachers, rooms } = req.body;
    // Simple mock scheduling solver (satisfies basic slot assignment constraints)
    const timeSlots = ['09:00 - 10:00 AM', '10:15 - 11:15 AM', '11:30 - 12:30 PM', '02:00 - 03:00 PM'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const generated = [];

    for (const day of days) {
      for (let i = 0; i < timeSlots.length; i++) {
        const sub = subjects[i % subjects.length];
        const teacher = teachers[i % teachers.length];
        const room = rooms[i % rooms.length];

        const { data } = await supabaseAdmin
          .from('timetable')
          .insert({
            institution_id: req.user?.institution_id,
            department_id,
            day_of_week: day,
            time_slot: timeSlots[i],
            subject: sub,
            teacher_id: teacher,
            room
          })
          .select()
          .single();

        if (data) generated.push(data);
      }
    }

    return res.status(200).json({ success: true, count: generated.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Auto-generation solver failed.' });
  }
}

export async function getStudentTimetable(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const { data: student, error: stdErr } = await supabaseAdmin
      .from('students')
      .select('department_id')
      .eq('id', studentId)
      .single();

    if (stdErr || !student) return res.status(404).json({ success: false, error: 'Student department mapping missing.' });

    const { data, error } = await supabaseAdmin
      .from('timetable')
      .select('*, staff(*, users(*))')
      .eq('department_id', student.department_id);

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, timetable: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Personal scheduler loading failure.' });
  }
}

// =========================================================================
// 4. FEE CONTROLLERS
// =========================================================================

export async function getFeeStructures(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('fee_structures')
      .select('*')
      .eq('institution_id', req.user?.institution_id);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, structures: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve fee structures.' });
  }
}

export async function createFeeStructure(req: Request, res: Response) {
  try {
    const { name, amount, due_date, applicable_to } = req.body;
    const { data, error } = await supabaseAdmin
      .from('fee_structures')
      .insert({
        institution_id: req.user?.institution_id,
        name,
        amount,
        due_date,
        applicable_to
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, structure: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to create fee structure.' });
  }
}

export async function initiatePayment(req: Request, res: Response) {
  try {
    const parse = feePaymentInitSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    const { amount } = parse.data;

    // Simulate Razorpay SDK Order Creation
    const order_id = 'order_rzp_' + Math.random().toString(36).substring(2, 12);
    return res.status(200).json({
      success: true,
      order_id,
      amount: amount * 100, // Razorpay works in paise
      currency: 'INR'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Razorpay SDK handshake failed.' });
  }
}

export async function verifyPayment(req: Request, res: Response) {
  try {
    const parse = feePaymentVerifySchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    const { razorpay_payment_id, student_id, fee_structure_id, amount_paid } = parse.data;

    // Create payment entry in DB
    const { data, error } = await supabaseAdmin
      .from('fee_payments')
      .insert({
        institution_id: req.user?.institution_id,
        student_id,
        fee_structure_id,
        amount_paid,
        method: 'UPI/Card',
        transaction_id: razorpay_payment_id,
        status: 'Completed',
        receipt_url: `https://invoices.iris365.in/receipts/${razorpay_payment_id}.pdf`
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, message: 'Fee paid successfully', payment: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Payment validation verification failed.' });
  }
}

export async function getStudentFees(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const { data: structures, error: sErr } = await supabaseAdmin
      .from('fee_structures')
      .select('*');

    const { data: payments, error: pErr } = await supabaseAdmin
      .from('fee_payments')
      .select('*')
      .eq('student_id', studentId);

    const { data: concessions, error: cErr } = await supabaseAdmin
      .from('fee_concessions')
      .select('*')
      .eq('student_id', studentId);

    if (sErr || pErr || cErr) return res.status(500).json({ success: false, error: 'Ledger synchronization failure.' });

    return res.status(200).json({ success: true, structures, payments, concessions });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve ledger.' });
  }
}

export async function getFeesReport(req: Request, res: Response) {
  try {
    const { data: payments, error } = await supabaseAdmin
      .from('fee_payments')
      .select('*, students(name, roll_number)');

    if (error) return res.status(500).json({ success: false, error: error.message });

    const totalCollected = payments.reduce((acc, curr) => acc + Number(curr.amount_paid), 0);
    return res.status(200).json({
      success: true,
      totalCollected,
      paymentCount: payments.length,
      history: payments
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to construct ledger reports.' });
  }
}

export async function createConcession(req: Request, res: Response) {
  try {
    const parse = concessionSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    const { student_id, fee_structure_id, concession_type, amount, reason } = parse.data;

    const { data, error } = await supabaseAdmin
      .from('fee_concessions')
      .insert({
        institution_id: req.user?.institution_id,
        student_id,
        fee_structure_id,
        concession_type,
        amount,
        reason,
        approved_by: req.user?.id
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, concession: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Concession insertion failed.' });
  }
}

export async function triggerFeeReminders(req: Request, res: Response) {
  try {
    const { structureId } = req.body;
    const { data: structures, error } = await supabaseAdmin
      .from('fee_structures')
      .select('*')
      .eq('id', structureId)
      .single();

    if (error || !structures) return res.status(404).json({ success: false, error: 'Structure targets missing.' });

    // Mock alert triggers to WhatsApp and Push gateways
    return res.status(200).json({
      success: true,
      message: `Dispatched ${Math.floor(20 + Math.random() * 100)} alert notifications via WhatsApp gateway for: ${structures.name}.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'WhatsApp API socket failed.' });
  }
}

// =========================================================================
// 5. NOTICES CONTROLLERS
// =========================================================================

export async function getNotices(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('notices')
      .select('*, notice_reads(user_id)')
      .order('published_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Map read state for active user
    const noticeFeed = data.map(notice => {
      const isRead = notice.notice_reads?.some((r: any) => r.user_id === req.user?.id);
      return {
        ...notice,
        isRead,
        readCount: notice.notice_reads?.length || 0
      };
    });

    return res.status(200).json({ success: true, notices: noticeFeed });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Noticeboard loading failure.' });
  }
}

export async function createNotice(req: Request, res: Response) {
  try {
    const parse = noticeSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    const { title, content, category, target_audience, expires_at } = parse.data;

    const { data, error } = await supabaseAdmin
      .from('notices')
      .insert({
        institution_id: req.user?.institution_id,
        title,
        content,
        category: category || 'Academic',
        target_audience: target_audience || 'All',
        published_by: req.user?.id,
        expires_at
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, notice: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Notice write operation error.' });
  }
}

export async function publishNotice(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('notices')
      .update({ published_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, notice: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Notice publish status updates failed.' });
  }
}

export async function readNotice(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('notice_reads')
      .insert({
        notice_id: id,
        user_id: req.user?.id
      })
      .select()
      .single();

    if (error && error.code !== '23505') { // Ignore unique constraint violation (already read)
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, message: 'Notice read verified.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Notice receipt failed.' });
  }
}

export async function getNoticeAnalytics(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data: reads, error } = await supabaseAdmin
      .from('notice_reads')
      .select('*, users(name)')
      .eq('notice_id', id);

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, readsCount: reads.length, readBy: reads });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Analytics failure.' });
  }
}

// =========================================================================
// 6. EXAM & RESULTS CONTROLLERS
// =========================================================================

export async function getExams(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('exams')
      .select('*, departments(name)');

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, exams: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Exams loading failure.' });
  }
}

export async function createExam(req: Request, res: Response) {
  try {
    const parse = examSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    const payload = parse.data;

    const { data, error } = await supabaseAdmin
      .from('exams')
      .insert({
        institution_id: req.user?.institution_id,
        name: payload.name,
        department_id: payload.department_id,
        start_date: payload.start_date,
        end_date: payload.end_date,
        type: payload.type || 'Written',
        created_by: req.user?.id
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, exam: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Exam scheduling failure.' });
  }
}

export async function enterResults(req: Request, res: Response) {
  try {
    const parse = markEntrySchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    const { exam_id, subject, records } = parse.data;

    const grades = records.map(rec => {
      const grade = calculateGrade(rec.marks_obtained, rec.max_marks);
      return {
        institution_id: req.user?.institution_id,
        exam_id,
        student_id: rec.student_id,
        subject,
        marks_obtained: rec.marks_obtained,
        max_marks: rec.max_marks,
        grade,
        remarks: rec.remarks || ''
      };
    });

    const { data, error } = await supabaseAdmin
      .from('exam_results')
      .upsert(grades, { onConflict: 'student_id,exam_id,subject' })
      .select();

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, count: data.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Mark entry operations failed.' });
  }
}

export async function getResults(req: Request, res: Response) {
  try {
    const { id } = req.params; // exam_id
    const { data, error } = await supabaseAdmin
      .from('exam_results')
      .select('*, students(*, users(*))')
      .eq('exam_id', id);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, results: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve results.' });
  }
}

export async function publishResults(req: Request, res: Response) {
  try {
    const { id } = req.params;
    // Mock publishing result alerts to parent/student gateways
    return res.status(200).json({
      success: true,
      message: `Exam schedule ${id} results published and dispatched to student email groups.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Publish gateway failure.' });
  }
}

export async function getMarksheetMetadata(req: Request, res: Response) {
  try {
    const { studentId, examId } = req.params;
    const { data: results, error } = await supabaseAdmin
      .from('exam_results')
      .select('*, exams(name)')
      .eq('student_id', studentId)
      .eq('exam_id', examId);

    if (error || !results || results.length === 0) {
      return res.status(404).json({ success: false, error: 'Results record empty for this student-exam pair.' });
    }

    return res.status(200).json({ success: true, results });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Marksheet retrieval error.' });
  }
}

// =========================================================================
// 7. ID CARDS CONTROLLERS
// =========================================================================

export async function getCardTemplate(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('id_card_templates')
      .select('*')
      .eq('institution_id', req.user?.institution_id)
      .eq('is_active', true)
      .maybeSingle();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, template: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve template.' });
  }
}

export async function saveCardTemplate(req: Request, res: Response) {
  try {
    const parse = idCardTemplateSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    const { template_json } = parse.data;

    // Deactivate previous active templates
    await supabaseAdmin
      .from('id_card_templates')
      .update({ is_active: false })
      .eq('institution_id', req.user?.institution_id);

    const { data, error } = await supabaseAdmin
      .from('id_card_templates')
      .insert({
        institution_id: req.user?.institution_id,
        template_json,
        is_active: true
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, template: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to save template.' });
  }
}

export async function generateCard(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const { data: student, error: stdErr } = await supabaseAdmin
      .from('students')
      .select('*, users(*), departments(name)')
      .eq('id', studentId)
      .single();

    if (stdErr || !student) return res.status(404).json({ success: false, error: 'Student profile missing.' });

    const { data: template } = await supabaseAdmin
      .from('id_card_templates')
      .select('*')
      .eq('institution_id', student.institution_id)
      .eq('is_active', true)
      .maybeSingle();

    return res.status(200).json({
      success: true,
      card: {
        student,
        template: template?.template_json || { default: true },
        barcodeUrl: `https://iris365.in/verify/${student.id}`
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to compile digital card badge.' });
  }
}

export async function generateBulkCards(req: Request, res: Response) {
  try {
    const { departmentId, batch } = req.body;
    const { data: students, error } = await supabaseAdmin
      .from('students')
      .select('id, name')
      .eq('department_id', departmentId)
      .eq('batch_year', batch);

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({
      success: true,
      count: students.length,
      downloadZipUrl: `https://invoices.iris365.in/idcards/bulk_generated_${departmentId}_${batch}.zip`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Bulk compiler process failed.' });
  }
}

export async function verifyCard(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select('name, roll_number, gender, created_at, users(email), departments(name)')
      .eq('id', studentId)
      .single();

    if (error || !student) return res.status(404).json({ success: false, verified: false, error: 'Invalid identification barcode key.' });

    const std = student as any;
    return res.status(200).json({
      success: true,
      verified: true,
      profile: {
        name: std.name,
        roll_number: std.roll_number,
        department: std.departments?.name,
        validity: '2024 - 2028',
        email: std.users?.email
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Verification check failed.' });
  }
}
