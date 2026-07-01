import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';

// Input Zod schemas
const allocateRoomSchema = z.object({
  room_id: z.string().uuid(),
  student_id: z.string().uuid(),
  allotted_date: z.string()
});

const raiseComplaintSchema = z.object({
  student_id: z.string().uuid(),
  room_id: z.string().uuid(),
  category: z.string(),
  description: z.string()
});

const updateComplaintSchema = z.object({
  status: z.enum(['Open', 'In Progress', 'Resolved']),
  assigned_to: z.string().uuid().optional()
});

const logGateEntrySchema = z.object({
  person_id: z.string().uuid(),
  person_type: z.enum(['Student', 'Staff']),
  entry_type: z.enum(['IN', 'OUT']),
  method: z.enum(['Biometric', 'QR', 'RFID', 'Override']),
  gate_number: z.string().optional()
});

// 1. HOSTEL ROOM ALLOCATION WITH CONFLICT PREVENTION
export async function allocateRoom(req: Request, res: Response) {
  try {
    const parseResult = allocateRoomSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { room_id, student_id, allotted_date } = parseResult.data;

    // Call atomic RPC to prevent race conditions (overbooking rooms)
    const { data, error } = await supabaseAdmin
      .rpc('allocate_room', {
        p_institution_id: req.user?.institution_id,
        p_room_id: room_id,
        p_student_id: student_id,
        p_date: allotted_date
      });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!data.success) {
      return res.status(409).json({ success: false, error: data.error });
    }

    return res.status(200).json({
      success: true,
      message: 'Room allocated successfully.',
      allocation: {
        id: data.allocation_id,
        room_id,
        student_id,
        allotted_date,
        is_current: true
      }
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error processing room allocation.' });
  }
}

// 2. GET HOSTEL ROOMS
export async function getRooms(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('hostel_rooms')
      .select('*, hostel_blocks(name, type)')
      .eq('institution_id', req.user?.institution_id);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, rooms: data });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error fetching rooms.' });
  }
}

// 3. COMPLAINT HANDLERS
export async function raiseComplaint(req: Request, res: Response) {
  try {
    const parseResult = raiseComplaintSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { student_id, room_id, category, description } = parseResult.data;

    const { data, error } = await supabaseAdmin
      .from('hostel_complaints')
      .insert({
        institution_id: req.user?.institution_id,
        student_id,
        room_id,
        category,
        description,
        status: 'Open'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, message: 'Complaint filed successfully.', complaint: data });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error filing complaint.' });
  }
}

export async function updateComplaint(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parseResult = updateComplaintSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { status, assigned_to } = parseResult.data;
    const updatePayload: any = { status };
    if (status === 'Resolved') {
      updatePayload.resolved_at = new Date();
    }
    if (assigned_to) {
      updatePayload.assigned_to = assigned_to;
    }

    const { data, error } = await supabaseAdmin
      .from('hostel_complaints')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Complaint not found.' });
    }

    return res.status(200).json({ success: true, message: 'Complaint log updated.', complaint: data });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error updating complaint logs.' });
  }
}

export async function getComplaints(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('hostel_complaints')
      .select('*, students(users(name)), hostel_rooms(room_number)')
      .eq('institution_id', req.user?.institution_id);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, complaints: data });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error fetching complaints.' });
  }
}

// 4. GATE LOGS CONTROLLERS
export async function logGateActivity(req: Request, res: Response) {
  try {
    const parseResult = logGateEntrySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { person_id, person_type, entry_type, method, gate_number } = parseResult.data;
    const timeNow = new Date();

    if (entry_type === 'IN') {
      const { data, error } = await supabaseAdmin
        .from('gate_logs')
        .insert({
          institution_id: req.user?.institution_id,
          person_id,
          person_type,
          entry_type,
          method,
          gate_number,
          in_time: timeNow
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.status(200).json({ success: true, message: 'Gate activity logged successfully.', log: data });
    } else {
      // Find open IN entry for the person
      const { data: openLog, error: fetchError } = await supabaseAdmin
        .from('gate_logs')
        .select('*')
        .eq('person_id', person_id)
        .eq('entry_type', 'IN')
        .is('out_time', null)
        .order('in_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (openLog) {
        // Update existing record
        const { data, error } = await supabaseAdmin
          .from('gate_logs')
          .update({ out_time: timeNow })
          .eq('id', openLog.id)
          .select()
          .single();

        if (error) {
          return res.status(500).json({ success: false, error: error.message });
        }

        return res.status(200).json({ success: true, message: 'Gate activity logged successfully.', log: data });
      } else {
        // Fallback: create a new OUT entry
        const { data, error } = await supabaseAdmin
          .from('gate_logs')
          .insert({
            institution_id: req.user?.institution_id,
            person_id,
            person_type,
            entry_type,
            method,
            gate_number,
            in_time: null,
            out_time: timeNow
          })
          .select()
          .single();

        if (error) {
          return res.status(500).json({ success: false, error: error.message });
        }

        return res.status(200).json({ success: true, message: 'Gate activity logged successfully.', log: data });
      }
    }

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error logging gate activity.' });
  }
}

export async function getGateLogs(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('gate_logs')
      .select('*, users(name, role)')
      .eq('institution_id', req.user?.institution_id)
      .order('in_time', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, logs: data });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error fetching gate logs.' });
  }
}

export async function getInsideCount(req: Request, res: Response) {
  try {
    // Queries count of people inside (open gate logs where entry_type is IN and out_time is NULL)
    const { count, error } = await supabaseAdmin
      .from('gate_logs')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', req.user?.institution_id)
      .eq('entry_type', 'IN')
      .is('out_time', null);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, inside_count: count || 0 });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error calculating counts.' });
  }
}
