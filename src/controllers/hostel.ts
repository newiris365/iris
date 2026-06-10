import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';

// ============================================================
// ZOD VALIDATION SCHEMAS
// ============================================================

const createBlockSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['boys', 'girls', 'co-ed', 'staff']),
  total_rooms: z.number().int().nonnegative().default(0),
  total_floors: z.number().int().positive().default(1),
  warden_id: z.string().uuid().optional(),
  amenities: z.array(z.string()).default([]),
  is_active: z.boolean().default(true)
});

const createRoomSchema = z.object({
  block_id: z.string().uuid(),
  room_number: z.string().min(1),
  floor: z.number().int().nonnegative().default(0),
  capacity: z.number().int().positive(),
  room_type: z.enum(['single', 'double', 'triple', 'dormitory']),
  amenities: z.array(z.string()).default([]),
  monthly_rent: z.number().nonnegative(),
  is_active: z.boolean().default(true)
});

const allocateRoomSchema = z.object({
  room_id: z.string().uuid(),
  student_id: z.string().uuid(),
  allotted_date: z.string(),
  deposit_amount: z.number().nonnegative(),
  deposit_status: z.enum(['pending', 'paid', 'refunded']).default('pending'),
  agreement_url: z.string().url().optional()
});

const vacateRoomSchema = z.object({
  vacated_date: z.string(),
  vacating_reason: z.string().min(1),
  refund_amount: z.number().nonnegative().default(0),
  inspection_checklist: z.record(z.boolean()).default({})
});

const swapRoomSchema = z.object({
  student_id: z.string().uuid(),
  target_room_id: z.string().uuid(),
  reason: z.string().min(1)
});

const visitorRegisterSchema = z.object({
  student_id: z.string().uuid(),
  visitor_name: z.string().min(1),
  visitor_phone: z.string().optional(),
  visitor_id_type: z.string().min(1),
  visitor_id_number: z.string().min(1),
  visitor_photo_url: z.string().url().optional(),
  purpose: z.string().optional(),
  relation: z.string().optional()
});

const complaintSchema = z.object({
  student_id: z.string().uuid(),
  room_id: z.string().uuid(),
  category: z.enum(['maintenance', 'cleanliness', 'electrical', 'plumbing', 'internet', 'security', 'roommate', 'food', 'other']),
  title: z.string().min(1),
  description: z.string().optional(),
  photo_urls: z.array(z.string().url()).default([]),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium')
});

const leaveRequestSchema = z.object({
  student_id: z.string().uuid(),
  leave_from: z.string(),
  leave_to: z.string(),
  reason: z.string().min(1),
  destination: z.string().optional(),
  parent_consent: z.boolean().default(false)
});

const addNoticeSchema = z.object({
  block_id: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().min(1),
  expires_at: z.string().optional()
});

const payFeeSchema = z.object({
  fee_id: z.string().uuid(),
  transaction_id: z.string().min(1)
});

// Helper to resolve student_id from logged-in user
async function resolveStudentId(req: Request): Promise<string | null> {
  if (req.user?.role === 'Student') {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('user_id', req.user.id)
      .single();
    if (data && !error) return data.id;
  }
  return null;
}

// ============================================================
// 1. ROOMS & BLOCKS
// ============================================================

export async function listBlocks(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    const { data, error } = await supabaseAdmin
      .from('hostel_blocks')
      .select('*, staff(name)')
      .eq('institution_id', institution_id)
      .eq('is_active', true);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, blocks: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function listRooms(req: Request, res: Response) {
  try {
    const { blockId, status } = req.query;
    let query = supabaseAdmin
      .from('hostel_rooms')
      .select('*, hostel_blocks(name, type)')
      .eq('is_active', true);

    if (blockId) query = query.eq('block_id', blockId as string);

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    let rooms = data || [];
    
    // Filter rooms based on occupancy status if requested
    if (status) {
      if (status === 'available') {
        rooms = rooms.filter(r => r.occupied < r.capacity);
      } else if (status === 'occupied') {
        rooms = rooms.filter(r => r.occupied > 0 && r.occupied < r.capacity);
      } else if (status === 'full') {
        rooms = rooms.filter(r => r.occupied >= r.capacity);
      }
    }

    return res.status(200).json({ success: true, rooms });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function createBlock(req: Request, res: Response) {
  try {
    const parse = createBlockSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { data, error } = await supabaseAdmin
      .from('hostel_blocks')
      .insert({
        ...parse.data,
        institution_id: req.user?.institution_id
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, block: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function createRoom(req: Request, res: Response) {
  try {
    const parse = createRoomSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { data, error } = await supabaseAdmin
      .from('hostel_rooms')
      .insert({
        ...parse.data,
        institution_id: req.user?.institution_id
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, room: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 2. ROOM ALLOCATIONS
// ============================================================

export async function listAllocations(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    const { studentId } = req.query;

    let query = supabaseAdmin
      .from('hostel_allocations')
      .select('*, hostel_rooms(*, hostel_blocks(*)), students(*)')
      .eq('is_current', true);

    if (studentId) {
      query = query.eq('student_id', studentId as string);
    } else {
      // General list filter by institution
      const { data: students } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('institution_id', institution_id);
      const studentIds = (students || []).map(s => s.id);
      query = query.in('student_id', studentIds);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, allocations: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function allocateRoom(req: Request, res: Response) {
  try {
    const parse = allocateRoomSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { room_id, student_id, allotted_date, deposit_amount, deposit_status, agreement_url } = parse.data;

    // 1. Get room and block details
    const { data: room, error: roomErr } = await supabaseAdmin
      .from('hostel_rooms')
      .select('*, hostel_blocks(*)')
      .eq('id', room_id)
      .single();

    if (roomErr || !room) return res.status(404).json({ success: false, error: 'Room not found.' });

    // Check capacity
    if (room.occupied >= room.capacity) {
      return res.status(400).json({ success: false, error: 'Selected room is already at full capacity.' });
    }

    // 2. Get student details (gender check)
    const { data: student, error: stdErr } = await supabaseAdmin
      .from('students')
      .select('gender, user_id')
      .eq('id', student_id)
      .single();

    if (stdErr || !student) return res.status(404).json({ success: false, error: 'Student not found.' });

    // Gender check: boys blocks vs girls blocks
    const blockType = room.hostel_blocks.type?.toLowerCase();
    const studentGender = student.gender?.toLowerCase();
    
    if (blockType === 'boys' && studentGender !== 'male') {
      return res.status(400).json({ success: false, error: 'Cannot allocate male-only block room to a female student.' });
    }
    if (blockType === 'girls' && studentGender !== 'female') {
      return res.status(400).json({ success: false, error: 'Cannot allocate female-only block room to a male student.' });
    }

    // 3. Check for existing active allocation
    const { data: existingAlloc } = await supabaseAdmin
      .from('hostel_allocations')
      .select('id')
      .eq('student_id', student_id)
      .eq('is_current', true)
      .maybeSingle();

    if (existingAlloc) {
      return res.status(400).json({ success: false, error: 'Student already has an active room allocation.' });
    }

    // 4. Create allocation
    const { data: allocation, error: allocErr } = await supabaseAdmin
      .from('hostel_allocations')
      .insert({
        room_id,
        student_id,
        allotted_date,
        deposit_amount,
        deposit_status,
        agreement_url,
        allotted_by: req.user?.id,
        is_current: true
      })
      .select()
      .single();

    if (allocErr) return res.status(500).json({ success: false, error: allocErr.message });

    // 5. Update room occupancy
    await supabaseAdmin
      .from('hostel_rooms')
      .update({ occupied: room.occupied + 1 })
      .eq('id', room_id);

    return res.status(201).json({ success: true, message: 'Room allocated successfully.', allocation });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function vacateRoom(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parse = vacateRoomSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { vacated_date, vacating_reason, refund_amount } = parse.data;

    // Get active allocation
    const { data: allocation, error: allocErr } = await supabaseAdmin
      .from('hostel_allocations')
      .select('*, hostel_rooms(id, occupied)')
      .eq('id', id)
      .eq('is_current', true)
      .single();

    if (allocErr || !allocation) return res.status(404).json({ success: false, error: 'Active allocation not found.' });

    // Check outstanding fees
    const { data: pendingFees } = await supabaseAdmin
      .from('hostel_fees')
      .select('id')
      .eq('allocation_id', id)
      .eq('payment_status', 'pending');

    if (pendingFees && pendingFees.length > 0) {
      return res.status(400).json({ success: false, error: 'Cannot vacate. Student has outstanding hostel fees.' });
    }

    // Check unresolved complaints
    const { data: pendingComplaints } = await supabaseAdmin
      .from('hostel_complaints')
      .select('id')
      .eq('student_id', allocation.student_id)
      .eq('status', 'open');

    if (pendingComplaints && pendingComplaints.length > 0) {
      return res.status(400).json({ success: false, error: 'Cannot vacate. Student has open maintenance complaints.' });
    }

    // Vacate allocation
    const { data: updatedAlloc, error: vacateErr } = await supabaseAdmin
      .from('hostel_allocations')
      .update({
        is_current: false,
        vacated_date,
        vacating_reason,
        deposit_status: 'refunded'
      })
      .eq('id', id)
      .select()
      .single();

    if (vacateErr) return res.status(500).json({ success: false, error: vacateErr.message });

    // Update room occupancy
    const currentOccupied = allocation.hostel_rooms.occupied;
    await supabaseAdmin
      .from('hostel_rooms')
      .update({ occupied: Math.max(0, currentOccupied - 1) })
      .eq('id', allocation.hostel_rooms.id);

    return res.status(200).json({ success: true, message: 'Room vacated successfully.', allocation: updatedAlloc });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function requestRoomSwap(req: Request, res: Response) {
  try {
    const parse = swapRoomSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { student_id, target_room_id, reason } = parse.data;

    // Get current allocation
    const { data: currentAlloc, error: allocErr } = await supabaseAdmin
      .from('hostel_allocations')
      .select('*, hostel_rooms(id, occupied, capacity, block_id)')
      .eq('student_id', student_id)
      .eq('is_current', true)
      .single();

    if (allocErr || !currentAlloc) {
      return res.status(404).json({ success: false, error: 'Active room allocation not found for the student.' });
    }

    // Get target room
    const { data: targetRoom, error: trgErr } = await supabaseAdmin
      .from('hostel_rooms')
      .select('*, hostel_blocks(type)')
      .eq('id', target_room_id)
      .single();

    if (trgErr || !targetRoom) return res.status(404).json({ success: false, error: 'Target room not found.' });

    // Target room capacity check
    if (targetRoom.occupied >= targetRoom.capacity) {
      return res.status(400).json({ success: false, error: 'Target room is already full.' });
    }

    // Swap allocations
    // 1. Vacate current room
    await supabaseAdmin
      .from('hostel_allocations')
      .update({ is_current: false, vacated_date: new Date().toISOString().split('T')[0], vacating_reason: `Room swap: ${reason}` })
      .eq('id', currentAlloc.id);

    await supabaseAdmin
      .from('hostel_rooms')
      .update({ occupied: Math.max(0, currentAlloc.hostel_rooms.occupied - 1) })
      .eq('id', currentAlloc.hostel_rooms.id);

    // 2. Allocate new room
    const { data: newAlloc, error: newAllocErr } = await supabaseAdmin
      .from('hostel_allocations')
      .insert({
        room_id: target_room_id,
        student_id,
        allotted_date: new Date().toISOString().split('T')[0],
        allotted_by: req.user?.id,
        is_current: true,
        deposit_amount: currentAlloc.deposit_amount,
        deposit_status: 'paid'
      })
      .select()
      .single();

    if (newAllocErr) return res.status(500).json({ success: false, error: newAllocErr.message });

    // Update target room occupancy
    await supabaseAdmin
      .from('hostel_rooms')
      .update({ occupied: targetRoom.occupied + 1 })
      .eq('id', target_room_id);

    return res.status(200).json({ success: true, message: 'Room swapped successfully.', allocation: newAlloc });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 3. VISITOR MANAGEMENT
// ============================================================

export async function registerVisitor(req: Request, res: Response) {
  try {
    const parse = visitorRegisterSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const gatePassId = 'GP-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data, error } = await supabaseAdmin
      .from('hostel_visitors')
      .insert({
        ...parse.data,
        institution_id: req.user?.institution_id,
        gate_pass_id: gatePassId,
        in_time: new Date().toISOString(),
        status: 'inside',
        is_approved: false
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, message: 'Visitor logged in. Awaiting student approval.', visitor: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function approveVisitor(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { approve } = req.body; // boolean

    const { data: visitor, error: visErr } = await supabaseAdmin
      .from('hostel_visitors')
      .select('id')
      .eq('id', id)
      .single();

    if (visErr || !visitor) return res.status(404).json({ success: false, error: 'Visitor record not found.' });

    const { data, error } = await supabaseAdmin
      .from('hostel_visitors')
      .update({
        is_approved: !!approve,
        approved_by: req.user?.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, message: approve ? 'Visitor approved.' : 'Visitor rejected.', visitor: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function checkoutVisitor(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('hostel_visitors')
      .update({
        out_time: new Date().toISOString(),
        status: 'checked_out'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, message: 'Visitor checked out.', visitor: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function listVisitors(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    const { studentId, date } = req.query;

    let query = supabaseAdmin
      .from('hostel_visitors')
      .select('*, students(name, roll_number)')
      .eq('institution_id', institution_id)
      .order('in_time', { ascending: false });

    if (studentId) query = query.eq('student_id', studentId as string);
    if (date) query = query.gte('in_time', `${date}T00:00:00Z`).lte('in_time', `${date}T23:59:59Z`);

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, visitors: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function listInsideVisitors(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    const { data, error } = await supabaseAdmin
      .from('hostel_visitors')
      .select('*, students(name, roll_number)')
      .eq('institution_id', institution_id)
      .eq('status', 'inside');

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, visitors: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 4. COMPLAINT MANAGEMENT
// ============================================================

export async function listComplaints(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    const { studentId, category, priority } = req.query;

    let query = supabaseAdmin
      .from('hostel_complaints')
      .select('*, students(name, roll_number), hostel_rooms(room_number, floor)')
      .eq('institution_id', institution_id)
      .order('created_at', { ascending: false });

    if (studentId) query = query.eq('student_id', studentId as string);
    if (category) query = query.eq('category', category as string);
    if (priority) query = query.eq('priority', priority as string);

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, complaints: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function raiseComplaint(req: Request, res: Response) {
  try {
    const parse = complaintSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { data, error } = await supabaseAdmin
      .from('hostel_complaints')
      .insert({
        ...parse.data,
        institution_id: req.user?.institution_id,
        status: 'open'
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, complaint: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function assignComplaint(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { staff_id } = req.body;

    if (!staff_id) return res.status(400).json({ success: false, error: 'staff_id is required.' });

    const { data, error } = await supabaseAdmin
      .from('hostel_complaints')
      .update({
        assigned_to: staff_id,
        status: 'assigned'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, complaint: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function updateComplaintStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;

    if (!status) return res.status(400).json({ success: false, error: 'status is required.' });

    const updateFields: any = { status };
    if (status === 'resolved') {
      updateFields.resolved_at = new Date().toISOString();
      updateFields.resolution_notes = resolution_notes || 'Resolved';
    }

    const { data, error } = await supabaseAdmin
      .from('hostel_complaints')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, complaint: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function rateComplaintResolution(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 5.' });
    }

    const { data, error } = await supabaseAdmin
      .from('hostel_complaints')
      .update({ student_rating: rating })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, complaint: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 5. LEAVE MANAGEMENT
// ============================================================

export async function applyLeave(req: Request, res: Response) {
  try {
    const parse = leaveRequestSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { data, error } = await supabaseAdmin
      .from('hostel_leave_requests')
      .insert({
        ...parse.data,
        status: 'pending'
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, leave_request: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function listStudentLeaves(req: Request, res: Response) {
  try {
    const { studentId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('hostel_leave_requests')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, leave_requests: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function listAllLeaves(req: Request, res: Response) {
  try {
    const { status } = req.query;
    let query = supabaseAdmin
      .from('hostel_leave_requests')
      .select('*, students(name, roll_number)')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status as string);

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, leave_requests: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function approveLeave(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, approval_notes } = req.body; // approved / rejected

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be approved or rejected.' });
    }

    const { data, error } = await supabaseAdmin
      .from('hostel_leave_requests')
      .update({
        status,
        approval_notes: approval_notes || '',
        approved_by: req.user?.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, leave_request: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 6. FEE MANAGEMENT
// ============================================================

export async function listFees(req: Request, res: Response) {
  try {
    const { studentId } = req.query;
    let query = supabaseAdmin
      .from('hostel_fees')
      .select('*, hostel_allocations(room_id, hostel_rooms(room_number, floor))')
      .order('month', { ascending: false });

    if (studentId) query = query.eq('student_id', studentId as string);

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, fees: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function payHostelFee(req: Request, res: Response) {
  try {
    const parse = payFeeSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { fee_id, transaction_id } = parse.data;

    const { data, error } = await supabaseAdmin
      .from('hostel_fees')
      .update({
        payment_status: 'paid',
        paid_date: new Date().toISOString(),
        transaction_id
      })
      .eq('id', fee_id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, fee: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function listFeeDefaulters(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    
    const { data, error } = await supabaseAdmin
      .from('hostel_fees')
      .select('*, students(name, roll_number, guardian_phone, user_id)')
      .eq('payment_status', 'pending')
      .lt('due_date', new Date().toISOString().split('T')[0]);

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Filter by student's institution
    const filtered = (data || []).filter((f: any) => f.students?.institution_id === institution_id);
    return res.status(200).json({ success: true, defaulters: filtered });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 7. BULK / DASHBOARD UTILITIES
// ============================================================

export async function getDashboardOverview(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;

    // Get blocks count
    const { count: blocksCount } = await supabaseAdmin
      .from('hostel_blocks')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institution_id);

    // Get blocks IDs
    const { data: blocks } = await supabaseAdmin
      .from('hostel_blocks')
      .select('id')
      .eq('institution_id', institution_id);
    const blockIds = (blocks || []).map(b => b.id);

    // Get rooms occupancy details
    const { data: rooms } = await supabaseAdmin
      .from('hostel_rooms')
      .select('occupied, capacity, block_id, monthly_rent')
      .in('block_id', blockIds);

    let totalCapacity = 0;
    let totalOccupied = 0;
    let totalRentPotential = 0;

    (rooms || []).forEach(r => {
      totalCapacity += r.capacity || 0;
      totalOccupied += r.occupied || 0;
      totalRentPotential += (r.monthly_rent || 0) * (r.occupied || 0);
    });

    // Get open complaints
    const { count: complaintsCount } = await supabaseAdmin
      .from('hostel_complaints')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institution_id)
      .eq('status', 'open');

    // Get visitors inside
    const { count: visitorsCount } = await supabaseAdmin
      .from('hostel_visitors')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institution_id)
      .eq('status', 'inside');

    return res.status(200).json({
      success: true,
      stats: {
        total_blocks: blocksCount || 0,
        total_rooms: rooms?.length || 0,
        total_capacity: totalCapacity,
        occupied_count: totalOccupied,
        available_count: totalCapacity - totalOccupied,
        occupancy_rate: totalCapacity ? ((totalOccupied / totalCapacity) * 100).toFixed(1) + '%' : '0%',
        open_complaints: complaintsCount || 0,
        visitors_inside: visitorsCount || 0,
        monthly_revenue_est: totalRentPotential
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 8. NOTICES
// ============================================================

export async function listNotices(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    const { blockId } = req.query;

    let query = supabaseAdmin
      .from('hostel_notices')
      .select('*')
      .eq('institution_id', institution_id)
      .order('posted_at', { ascending: false });

    if (blockId) query = query.eq('block_id', blockId as string);

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, notices: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function createNotice(req: Request, res: Response) {
  try {
    const parse = addNoticeSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { data, error } = await supabaseAdmin
      .from('hostel_notices')
      .insert({
        ...parse.data,
        institution_id: req.user?.institution_id,
        posted_by: req.user?.id
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, notice: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 9. PDF DOCUMENT RENDERERS (pdfkit)
// Note: Gate pass, allotment letters, custom warden reports
// ============================================================

export async function generateGatePassPdf(req: Request, res: Response) {
  try {
    const { visitorId } = req.params;
    const PDFDocument = require('pdfkit');

    // Fetch visitor
    const { data: visitor } = await supabaseAdmin
      .from('hostel_visitors')
      .select('*, students(name, roll_number)')
      .eq('id', visitorId)
      .single();

    if (!visitor) return res.status(404).json({ success: false, error: 'Visitor not found.' });

    const doc = new PDFDocument({ margin: 50, size: 'A6' }); // Small card format
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="gatepass-${visitorId.slice(0, 8)}.pdf"`);
    doc.pipe(res);

    // Border
    doc.rect(10, 10, doc.page.width - 20, doc.page.height - 20).stroke('#6C2BD9');

    // Header
    doc.fontSize(14).fillColor('#6C2BD9').text('IRIS Hostel Gate Pass', { align: 'center' });
    doc.moveDown(0.5);

    // Pass details
    doc.fontSize(9).fillColor('#333');
    doc.text(`Gate Pass ID: `, { continued: true }).font('Courier-Bold').text(visitor.gate_pass_id).font('Helvetica');
    doc.text(`Visitor Name: ${visitor.visitor_name}`);
    doc.text(`Relationship: ${visitor.relation || 'N/A'}`);
    doc.text(`Visiting Student: ${visitor.students?.name} (${visitor.students?.roll_number})`);
    doc.text(`In-Time: ${new Date(visitor.in_time).toLocaleString()}`);
    doc.text(`Status: ${visitor.is_approved ? 'APPROVED' : 'PENDING APPROVAL'}`);
    doc.moveDown(1);

    // QR Code simulation card box
    doc.rect(doc.page.width / 2 - 30, doc.y, 60, 60).fill('#13102A').stroke('#6C2BD9');
    doc.fillColor('#C4B5FD').fontSize(6).text('SCAN FOR EXIT', doc.page.width / 2 - 30, doc.y + 25, { width: 60, align: 'center' });

    doc.end();
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to generate PDF gatepass.' });
  }
}

export async function generateAllotmentLetterPdf(req: Request, res: Response) {
  try {
    const { allocationId } = req.params;
    const PDFDocument = require('pdfkit');

    // Fetch allocation
    const { data: alloc } = await supabaseAdmin
      .from('hostel_allocations')
      .select('*, students(name, roll_number), hostel_rooms(room_number, monthly_rent, hostel_blocks(name))')
      .eq('id', allocationId)
      .single();

    if (!alloc) return res.status(404).json({ success: false, error: 'Allocation record not found.' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="allotment-${allocationId.slice(0, 8)}.pdf"`);
    doc.pipe(res);

    // Design Header
    doc.fontSize(22).fillColor('#6C2BD9').text('IRIS Hostel Allotment Letter', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666').text('Official Room Allotment Slip', { align: 'center' });
    doc.moveDown(1);
    doc.strokeColor('#6C2BD9').lineWidth(2).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown(1.5);

    // Content
    doc.fontSize(12).fillColor('#333');
    doc.text(`This is to certify that student `, { continued: true })
       .font('Helvetica-Bold').text(alloc.students?.name)
       .font('Helvetica').text(` (Roll Number: `, { continued: true })
       .font('Helvetica-Bold').text(alloc.students?.roll_number)
       .font('Helvetica').text(`) has been officially allotted room details in the institution hostel:`);
    doc.moveDown(1);

    // Block/Room specifications box
    doc.rect(50, doc.y, doc.page.width - 100, 100).fill('#13102A');
    doc.fillColor('#white');
    
    let boxY = doc.y + 15;
    doc.fontSize(11).fillColor('#C4B5FD').text(`Hostel Block: ${alloc.hostel_rooms.hostel_blocks.name}`, 70, boxY);
    doc.text(`Room Number: ${alloc.hostel_rooms.room_number}`, 70, boxY + 20);
    doc.text(`Allotment Date: ${new Date(alloc.allotted_date).toLocaleDateString()}`, 70, boxY + 40);
    doc.text(`Monthly Rent: ₹${alloc.hostel_rooms.monthly_rent}`, 70, boxY + 60);

    doc.y = boxY + 95;
    doc.moveDown(2.5);

    doc.fontSize(10).fillColor('#666');
    doc.text('Terms & Regulations:\n1. Rent must be paid by the 5th of each calendar month.\n2. Damage to college property will lead to deposit deduction.\n3. Swapping rooms without written consent from warden is prohibited.');

    doc.moveDown(3);
    doc.text('Warden Signature _______________________', { align: 'right' });

    doc.end();
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to generate allotment letter PDF.' });
  }
}
