import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';

const submitGrievanceSchema = z.object({
  category: z.enum(['academic', 'harassment', 'infrastructure', 'examination', 'library', 'canteen', 'hostel', 'transport', 'administration', 'discrimination', 'other']),
  subject: z.string().min(3),
  description: z.string().min(10),
  is_anonymous: z.boolean().optional(),
  evidence_urls: z.array(z.string()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['acknowledged', 'under_investigation', 'resolution_proposed', 'resolved', 'closed']),
  assigned_to: z.string().uuid().optional(),
  resolution_notes: z.string().optional(),
});

export async function submitGrievance(req: Request, res: Response) {
  try {
    const parse = submitGrievanceSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { data, error } = await supabaseAdmin.rpc('submit_grievance', {
      p_institution_id: req.user?.institution_id,
      p_submitted_by: req.user?.id,
      p_category: parse.data.category,
      p_subject: parse.data.subject,
      p_description: parse.data.description,
      p_is_anonymous: parse.data.is_anonymous || false,
      p_evidence_urls: JSON.stringify(parse.data.evidence_urls || []),
      p_priority: parse.data.priority || 'normal',
    });
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getMyGrievances(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('grievances')
      .select('*')
      .eq('submitted_by', req.user?.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.status(200).json({ success: true, grievances: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAllGrievances(req: Request, res: Response) {
  try {
    const { status, category } = req.query;
    let query = supabaseAdmin
      .from('grievances')
      .select('*, users!submitted_by(full_name)')
      .eq('institution_id', req.user?.institution_id)
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;
    const result = (data || []).map((g: any) => ({
      ...g,
      submitted_by_name: g.is_anonymous ? 'Anonymous' : g.users?.full_name,
    }));
    return res.status(200).json({ success: true, grievances: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateGrievanceStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parse = updateStatusSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { data, error } = await supabaseAdmin.rpc('update_grievance_status', {
      p_grievance_id: id,
      p_new_status: parse.data.status,
      p_assigned_to: parse.data.assigned_to || null,
      p_resolution_notes: parse.data.resolution_notes || null,
    });
    if (error) throw error;
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function appealGrievance(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { appeal_reason } = req.body;
    if (!appeal_reason) return res.status(400).json({ success: false, error: 'appeal_reason required.' });

    const { data, error } = await supabaseAdmin.rpc('appeal_grievance', {
      p_grievance_id: id,
      p_appeal_reason: appeal_reason,
    });
    if (error) throw error;
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
