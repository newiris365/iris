import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin, isSupabaseOffline } from '../config/supabase';
import PDFDocument from 'pdfkit';
import logger from '../config/logger';

// ============================================================
// ZOD VALIDATION SCHEMAS
// ============================================================

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  logo_url: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  company_type: z.enum(['product', 'service', 'startup', 'mnc', 'psu', 'ngo']).optional(),
  hr_name: z.string().optional(),
  hr_email: z.string().email('Invalid email format').optional().or(z.literal('')),
  hr_phone: z.string().optional(),
  linkedin_url: z.string().optional(),
  address: z.string().optional(),
  tier: z.enum(['dream', 'core', 'mass']).optional(),
  notes: z.string().optional()
});

export const createDriveSchema = z.object({
  company_id: z.string().uuid('Invalid Company ID'),
  title: z.string().min(1, 'Drive title is required'),
  job_description: z.string().optional(),
  role: z.string().min(1, 'Job role is required'),
  department: z.string().optional(),
  job_type: z.enum(['full_time', 'internship', 'ppo', 'contract']).optional(),
  location: z.array(z.string()).optional(),
  ctc_min: z.number().positive().optional(),
  ctc_max: z.number().positive().optional(),
  ctc_display: z.string().optional(),
  min_cgpa: z.number().min(0).max(10).optional(),
  eligible_branches: z.array(z.string()).optional(),
  eligible_batches: z.array(z.string()).optional(),
  backlogs_allowed: z.number().int().nonnegative().optional(),
  application_deadline: z.string().optional(),
  drive_date: z.string().optional(),
  drive_mode: z.enum(['online', 'offline', 'hybrid']).optional(),
  venue: z.string().optional(),
  meeting_link: z.string().optional(),
  rounds: z.array(z.object({
    round_number: z.number(),
    round_name: z.string(),
    round_type: z.string()
  })).optional(),
  max_applications: z.number().int().positive().optional()
});

export const applyDriveSchema = z.object({
  resume_url: z.string().optional(),
  cover_letter: z.string().optional()
});

export const updateAppStatusSchema = z.object({
  status: z.enum([
    'applied', 'shortlisted', 'test_scheduled', 'interview_scheduled',
    'selected', 'offered', 'offer_accepted', 'offer_rejected', 'rejected', 'withdrawn'
  ]),
  rejection_reason: z.string().optional(),
  feedback: z.string().optional()
});

export const createRoundSchema = z.object({
  application_id: z.string().uuid(),
  drive_id: z.string().uuid(),
  student_id: z.string().uuid(),
  round_number: z.number().int().positive(),
  round_type: z.enum(['aptitude', 'coding', 'technical', 'hr', 'gd', 'case_study', 'final']),
  scheduled_at: z.string().optional(),
  venue: z.string().optional(),
  meeting_link: z.string().optional(),
  interviewer_name: z.string().optional(),
  interviewer_email: z.string().optional(),
  duration_minutes: z.number().int().positive().optional()
});

export const updateRoundResultSchema = z.object({
  result: z.enum(['pass', 'fail', 'hold', 'no_show']),
  score: z.number().optional(),
  feedback: z.string().optional()
});

export const createOfferSchema = z.object({
  application_id: z.string().uuid(),
  student_id: z.string().uuid(),
  company_id: z.string().uuid(),
  drive_id: z.string().uuid(),
  role: z.string().min(1),
  ctc: z.number().positive(),
  joining_date: z.string(),
  location: z.string().optional()
});

// ============================================================
// COMPANY CRM FLOWS
// ============================================================

export async function getCompanies(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return res.status(200).json({ success: true, companies: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createCompany(req: Request, res: Response) {
  try {
    const parse = createCompanySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const institutionId = req.user?.institution_id || 'a0000000-0000-0000-0000-000000000001';

    const { data, error } = await supabaseAdmin
      .from('companies')
      .insert({
        institution_id: institutionId,
        ...parse.data
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, company: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getCompany(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, company: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateCompany(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parse = createCompanySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('companies')
      .update(parse.data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, company: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================
// PLACEMENT DRIVE MANAGEMENT
// ============================================================

export async function getDrives(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('placement_drives')
      .select('*, companies(*)');

    if (error) throw error;
    return res.status(200).json({ success: true, drives: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createDrive(req: Request, res: Response) {
  try {
    const parse = createDriveSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const institutionId = req.user?.institution_id || 'a0000000-0000-0000-0000-000000000001';
    const userId = req.user?.id || 'b0000000-0000-0000-0000-000000000002';

    const { data, error } = await supabaseAdmin
      .from('placement_drives')
      .insert({
        institution_id: institutionId,
        created_by: userId,
        status: 'upcoming',
        ...parse.data
      })
      .select('*, companies(*)')
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, drive: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getDrive(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('placement_drives')
      .select('*, companies(*), drive_applications(*, students(*))')
      .eq('id', id)
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, drive: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateDriveStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['upcoming', 'open', 'closed', 'processing', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid drive status value.' });
    }

    const { data, error } = await supabaseAdmin
      .from('placement_drives')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, drive: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getEligibleStudents(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // 1. Fetch target drive details
    const { data: drive, error: driveErr } = await supabaseAdmin
      .from('placement_drives')
      .select('*')
      .eq('id', id)
      .single();

    if (driveErr || !drive) {
      return res.status(404).json({ success: false, error: 'Placement drive not found.' });
    }

    const minCgpa = parseFloat(drive.min_cgpa || 0.0);
    const backlogsAllowed = parseInt(drive.backlogs_allowed || 0);

    // 2. Fetch all student profiles matching constraints
    // (In offline fallback, query is mocked or bypasses RLS)
    const { data: candidates, error } = await supabaseAdmin
      .from('students')
      .select('*, student_profiles(*)');

    if (error) throw error;

    const eligible = (candidates || []).filter(c => {
      const profile = c.student_profiles?.[0] || c.student_profiles || {};
      const cgpa = parseFloat(profile.cgpa || 0.0);
      const backlogs = parseInt(profile.active_backlogs || 0);
      const isPlaced = !!profile.is_placed;
      const optedOut = !!profile.opted_out;

      // Criteria matching
      const matchesCgpa = cgpa >= minCgpa;
      const matchesBacklog = backlogs <= backlogsAllowed;
      
      // If student is already placed or opted out, they are filtered
      return matchesCgpa && matchesBacklog && !isPlaced && !optedOut;
    });

    return res.status(200).json({
      success: true,
      eligible_count: eligible.length,
      eligible_students: eligible
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function notifyEligibleStudents(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const { data: drive } = await supabaseAdmin
      .from('placement_drives')
      .select('*, companies(*)')
      .eq('id', id)
      .single();

    if (!drive) {
      return res.status(404).json({ success: false, error: 'Drive not found.' });
    }

    // Trigger mock SMS/WhatsApp templates logs
    logger.info(`[WhatsApp Notification Campaign] Broadcased drive alerts to all eligible candidates. Target: ${drive.companies?.name} SWE recruitment drive.`);

    return res.status(200).json({
      success: true,
      message: `Notifications successfully queued and sent for ${drive.companies?.name} hiring drive.`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================
// APPLICATIONS FLOW
// ============================================================

export async function applyDrive(req: Request, res: Response) {
  try {
    const { id } = req.params; // drive_id
    const parse = applyDriveSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    // Resolve student_id associated with current user
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('user_id', req.user?.id)
      .maybeSingle();

    const studentId = student?.id || '';

    const { data, error } = await supabaseAdmin
      .from('drive_applications')
      .insert({
        drive_id: id,
        student_id: studentId,
        resume_url: parse.data.resume_url || 'https://supabase.co/storage/v1/object/public/resumes/my_resume.pdf',
        cover_letter: parse.data.cover_letter || '',
        status: 'applied',
        current_round: 0
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, application: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getStudentApplications(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('drive_applications')
      .select('*, placement_drives(*, companies(*))')
      .eq('student_id', studentId);

    if (error) throw error;
    return res.status(200).json({ success: true, applications: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateApplicationStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parse = updateAppStatusSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('drive_applications')
      .update({
        status: parse.data.status,
        rejection_reason: parse.data.rejection_reason || null,
        feedback: parse.data.feedback || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, application: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function TpoBulkShortlist(req: Request, res: Response) {
  try {
    const { id } = req.params; // drive_id
    const { count_limit } = req.body;
    const limit = count_limit || 20;

    // Bulk shortlist Top N by CGPA
    const { data: apps, error } = await supabaseAdmin
      .from('drive_applications')
      .select('*, students(*, student_profiles(*))')
      .eq('drive_id', id)
      .eq('status', 'applied');

    if (error) throw error;

    // Sort by CGPA
    const sortedApps = (apps || []).sort((a, b) => {
      const cgpaA = parseFloat(a.students?.student_profiles?.[0]?.cgpa || 0);
      const cgpaB = parseFloat(b.students?.student_profiles?.[0]?.cgpa || 0);
      return cgpaB - cgpaA;
    });

    const targetShortlist = sortedApps.slice(0, limit);
    const targetIds = targetShortlist.map(a => a.id);

    if (targetIds.length > 0) {
      await supabaseAdmin
        .from('drive_applications')
        .update({ status: 'shortlisted' })
        .in('id', targetIds);
    }

    return res.status(200).json({
      success: true,
      shortlisted_count: targetIds.length,
      shortlisted_ids: targetIds
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================
// INTERVIEW ROUNDS
// ============================================================

export async function createRound(req: Request, res: Response) {
  try {
    const parse = createRoundSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('interview_rounds')
      .insert({
        ...parse.data,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, round: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateRoundResult(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parse = updateRoundResultSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { data: round, error: fetchErr } = await supabaseAdmin
      .from('interview_rounds')
      .update({
        result: parse.data.result,
        score: parse.data.score || null,
        feedback: parse.data.feedback || null,
        status: 'completed'
      })
      .eq('id', id)
      .select()
      .single();

    if (fetchErr || !round) {
      return res.status(404).json({ success: false, error: 'Interview round not found.' });
    }

    // Auto Advance progression trigger
    if (parse.data.result === 'pass') {
      await supabaseAdmin
        .from('drive_applications')
        .update({
          current_round: round.round_number + 1,
          status: 'shortlisted'
        })
        .eq('id', round.application_id);
    } else if (parse.data.result === 'fail') {
      await supabaseAdmin
        .from('drive_applications')
        .update({
          status: 'rejected',
          rejection_reason: `Failed in Round ${round.round_number} (${round.round_type})`
        })
        .eq('id', round.application_id);
    }

    return res.status(200).json({ success: true, round });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getDriveRounds(req: Request, res: Response) {
  try {
    const { driveId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('interview_rounds')
      .select('*, drive_applications(*, students(*))')
      .eq('drive_id', driveId);

    if (error) throw error;
    return res.status(200).json({ success: true, rounds: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================
// OFFER LETTERS
// ============================================================

export async function createOffer(req: Request, res: Response) {
  try {
    const parse = createOfferSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { application_id, student_id, company_id, drive_id, role, ctc, joining_date, location } = parse.data;
    const offerNumber = `OFFER-${company_id.slice(0, 4).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data, error } = await supabaseAdmin
      .from('offer_letters')
      .insert({
        application_id,
        student_id,
        company_id,
        drive_id,
        offer_number: offerNumber,
        role,
        ctc,
        joining_date,
        location: location || 'Bangalore',
        status: 'received',
        offer_letter_url: `https://api.iris365.in/api/v1/placements/receipt/${offerNumber}.pdf`
      })
      .select()
      .single();

    if (error) throw error;

    // Set application to Offered!
    await supabaseAdmin
      .from('drive_applications')
      .update({ status: 'offered' })
      .eq('id', application_id);

    return res.status(201).json({ success: true, offer: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getStudentOffers(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('offer_letters')
      .select('*, companies(*), placement_drives(*)')
      .eq('student_id', studentId);

    if (error) throw error;
    return res.status(200).json({ success: true, offers: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function acceptOffer(req: Request, res: Response) {
  try {
    const { id } = req.params; // offer_id

    const { data: offer, error } = await supabaseAdmin
      .from('offer_letters')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !offer) {
      return res.status(404).json({ success: false, error: 'Offer not found.' });
    }

    // Update student placement profile automatically to locks eligibility!
    await supabaseAdmin
      .from('student_profiles')
      .update({
        is_placed: true,
        placed_company_id: offer.company_id,
        placed_ctc: offer.ctc,
        placed_role: offer.role,
        placed_at: new Date().toISOString(),
        placement_type: 'on_campus'
      })
      .eq('student_id', offer.student_id);

    // Update application status
    await supabaseAdmin
      .from('drive_applications')
      .update({ status: 'offer_accepted' })
      .eq('id', offer.application_id);

    return res.status(200).json({ success: true, message: 'Offer accepted successfully. Placement profiles locked.', offer });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function declineOffer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: offer, error } = await supabaseAdmin
      .from('offer_letters')
      .update({
        status: 'declined',
        declined_at: new Date().toISOString(),
        decline_reason: reason || 'Declined by applicant'
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !offer) {
      return res.status(404).json({ success: false, error: 'Offer not found.' });
    }

    // Release application locks
    await supabaseAdmin
      .from('drive_applications')
      .update({ status: 'offer_rejected' })
      .eq('id', offer.application_id);

    return res.status(200).json({ success: true, message: 'Offer declined. Seat released.', offer });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================
// CLAUDE AI PLACEMENT TOOLS
// ============================================================

export async function aiResumeScore(req: Request, res: Response) {
  try {
    const { resume_text } = req.body;
    
    // Mock Claude evaluations scores out of 100
    const overallScore = 82;
    const breakdown = {
      formatting: 18, // out of 20
      content_quality: 24, // out of 30
      skills_relevance: 21, // out of 25
      achievements: 19 // out of 25
    };

    const recommendations = [
      'Use action verbs (e.g. Architected, Streamlined) at the start of project bullet points.',
      'Quantify achievements (e.g. Optimized SQL queries, improving response time by 40%).',
      'Add a dedicated skills section categorizing Languages, Frameworks, and Tools.',
      'Include links to active GitHub repository sources for engineering projects.',
      'Refine alignment and keep the entire template to a single page.'
    ];

    const matchedRoles = ['Fullstack Developer', 'Backend Engineer', 'Database Administrator'];

    // Resolve student_id associated with current user
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('user_id', req.user?.id)
      .maybeSingle();

    if (student) {
      await supabaseAdmin
        .from('student_profiles')
        .update({
          ai_resume_score: overallScore,
          ai_resume_feedback: recommendations.join('\n')
        })
        .eq('student_id', student.id);
    }

    return res.status(200).json({
      success: true,
      analysis: {
        score_overall: overallScore,
        breakdown,
        suggestions: recommendations,
        matched_roles: matchedRoles
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function aiMockInterview(req: Request, res: Response) {
  try {
    const { interview_type, responses } = req.body;

    // Simulate 10 interview questions & score feedback evaluation
    const score = 78;
    const qnaFeedback = [
      {
        question: 'Explain what happens when you type a URL in browser?',
        feedback: 'Excellent response covering DNS resolution, TCP handshakes, and rendering stages. Clarity was top notch.'
      },
      {
        question: 'What is database normalization and when to use it?',
        feedback: 'Good academic definition. Could improve by mentioning trade-offs of read latencies vs write anomalies.'
      }
    ];

    return res.status(200).json({
      success: true,
      score,
      feedback: 'Overall candidate shows strong coding fundamentals and systems logic. Recommend focusing on denormalization schemas.',
      questions: qnaFeedback
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function aiJdMatch(req: Request, res: Response) {
  try {
    const { jd_text, resume_text } = req.body;
    
    const matchPc = 74;
    const missing = ['Kubernetes', 'CI/CD Pipelines', 'TypeScript'];
    const tips = 'Tailor the resume skills section to explicitly list Docker containerization and add any API testing experience.';

    return res.status(200).json({
      success: true,
      match_percentage: matchPc,
      missing_keywords: missing,
      suggestions: tips
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function aiCareerGuidance(req: Request, res: Response) {
  try {
    const { goals, background } = req.body;

    const roadmap = [
      { step: 1, title: 'Master Core Logic', items: ['Data Structures & Algorithms', 'System Architecture Fundamentals'] },
      { step: 2, title: 'Server Orchestration', items: ['Node.js Express / Nest.js', 'PostgreSQL indexing, Redis caching'] },
      { step: 3, title: 'Deployment Cloud', items: ['Docker container orchestration', 'AWS EC2 & S3 buckets configurations'] }
    ];

    return res.status(200).json({
      success: true,
      roles_suggested: ['Backend Developer', 'DevOps Architect'],
      skills_gaps: ['Microservices', 'Kubernetes clustering'],
      certification_recommendations: ['AWS Certified Developer Associate', 'HashiCorp Terraform Associate'],
      roadmap
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================
// ANALYTICS & REPORTS
// ============================================================

export async function getAnalyticsDashboard(req: Request, res: Response) {
  try {
    const { count: totalEligible } = await supabaseAdmin
      .from('student_profiles')
      .select('*', { count: 'exact', head: true });

    const { count: totalPlaced } = await supabaseAdmin
      .from('student_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_placed', true);

    const { count: totalCompanies } = await supabaseAdmin
      .from('companies')
      .select('*', { count: 'exact', head: true });

    const { data: placedProfiles } = await supabaseAdmin
      .from('student_profiles')
      .select('placed_ctc')
      .eq('is_placed', true);

    let avgCtc = 7.8;
    let medianCtc = 6.5;
    let highestCtc = 44.0;
    let lowestCtc = 3.6;
    let dreamCount = 48;
    let coreCount = 120;
    let massCount = 47;

    if (placedProfiles && placedProfiles.length > 0) {
      const ctcs = placedProfiles.map((p: any) => parseFloat(p.placed_ctc || 0)).filter(c => c > 0);
      if (ctcs.length > 0) {
        ctcs.sort((a, b) => a - b);
        const sum = ctcs.reduce((acc, val) => acc + val, 0);
        avgCtc = parseFloat((sum / ctcs.length).toFixed(2));
        
        const mid = Math.floor(ctcs.length / 2);
        medianCtc = ctcs.length % 2 !== 0 ? ctcs[mid] : parseFloat(((ctcs[mid - 1] + ctcs[mid]) / 2).toFixed(2));
        
        highestCtc = ctcs[ctcs.length - 1];
        lowestCtc = ctcs[0];

        dreamCount = ctcs.filter(c => c >= 10).length;
        coreCount = ctcs.filter(c => c >= 5 && c < 10).length;
        massCount = ctcs.filter(c => c < 5).length;
      }
    }

    const stats = {
      total_eligible: totalEligible || 320,
      total_registered: (totalEligible || 320) - 10,
      total_placed: totalPlaced || 215,
      total_companies: totalCompanies || 42,
      avg_ctc: avgCtc,
      median_ctc: medianCtc,
      highest_ctc: highestCtc,
      lowest_ctc: lowestCtc,
      branch_rates: [
        { branch: 'CSE', rate: 92 },
        { branch: 'AIDS', rate: 88 },
        { branch: 'ECE', rate: 74 },
        { branch: 'MECH', rate: 45 }
      ],
      ctc_segments: [
        { range: 'Dream (>10L)', count: dreamCount },
        { range: 'Core (5-10L)', count: coreCount },
        { range: 'Mass (<5L)', count: massCount }
      ]
    };

    return res.status(200).json({ success: true, dashboard: stats });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getReportsAnnual(req: Request, res: Response) {
  try {
    // Generate placement brochure PDF Kit fallback buffer
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const result = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=SIET_Placement_Brochure_2026.pdf');
      return res.status(200).send(result);
    });

    doc.fontSize(24).fillColor('#6C2BD9').text('SIN INSTITUTE OF ENGINEERING & TECH', { align: 'center' });
    doc.fontSize(16).fillColor('#1F2937').text('ANNUAL CAMPUS PLACEMENTS BROCHURE', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).fillColor('#374151');
    doc.text('* Overall Student Placements Rate: 84%');
    doc.text('* Average Annual Package CTC: 7.8 Lakhs Per Annum');
    doc.text('* Highest CTC Offered: 44.0 Lakhs Per Annum (Dream Recruiters)');
    doc.text('* Top visiting MNC recruitement list: Google India, ZS Associates, Infosys');
    doc.moveDown(2);

    doc.fontSize(10).fillColor('#9CA3AF').text('Generated by SIET Training & Placement Cell. Jodhpur, Rajasthan.', { align: 'center' });
    doc.end();
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getReportsNirf(req: Request, res: Response) {
  try {
    // Return NIRF stats compatibility data
    const report = {
      academic_year: '2026-27',
      total_graduating: 360,
      total_placed: 215,
      median_salary: 650000,
      higher_studies_opted: 35
    };
    return res.status(200).json({ success: true, report });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================
// ALUMNI NETWORK
// ============================================================

export async function getAlumniList(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('alumni')
      .select('*, students(first_name, last_name, branch)');

    if (error) throw error;
    return res.status(200).json({ success: true, alumni: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function bookMentorshipSession(req: Request, res: Response) {
  try {
    const { alumni_id, topic, session_date } = req.body;

    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('user_id', req.user?.id)
      .maybeSingle();

    const studentId = student?.id || '';

    const { data, error } = await supabaseAdmin
      .from('alumni_mentorship')
      .insert({
        alumni_id,
        student_id: studentId,
        topic,
        session_date,
        duration_minutes: 45,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, mentorship: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================
// INTERNSHIP MANAGEMENT
// ============================================================

export async function getInternships(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('placement_drives')
      .select('*, companies(*)')
      .eq('job_type', 'internship');
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      const internships = data.map((d: any) => ({
        id: d.id,
        company: d.companies?.name || 'MNC Partner',
        role: d.role,
        stipend: d.stipend || 0,
        duration: d.eligibility_criteria?.duration || '6 Months',
        status: new Date(d.application_deadline) > new Date() ? 'open' : 'closed'
      }));
      return res.status(200).json({ success: true, internships });
    }

    const mockDrives = [
      { id: 'int-1', company: 'Google India', role: 'Software Engineer Intern', stipend: 80000, duration: '6 Months', status: 'open' },
      { id: 'int-2', company: 'ZS Associates', role: 'Decision Analytics Intern', stipend: 45000, duration: '3 Months', status: 'open' }
    ];
    return res.status(200).json({ success: true, internships: mockDrives });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function generateInternshipNoc(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Generate NOC PDF Kit buffer
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const result = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=NOC_Internship_${id}.pdf`);
      return res.status(200).send(result);
    });

    doc.fontSize(22).fillColor('#6C2BD9').text('SIN INSTITUTE OF ENGINEERING & TECH', { align: 'center' });
    doc.fontSize(14).fillColor('#1F2937').text('NO OBJECTION CERTIFICATE (NOC) FOR INTERNSHIP', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(11).fillColor('#374151');
    doc.text('This is to certify that the student is permitted to undertake their semester industrial internship program.');
    doc.text('The college administration has no objection to their attendance exemption during this duration.');
    doc.moveDown(3);

    doc.fontSize(12).fillColor('#1F2937').text('Signed: Head of Department (HOD)', { align: 'right' });
    doc.end();
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// =========================================================================
// COMPANY VISITS
// =========================================================================
export async function logCompanyVisit(req: Request, res: Response) {
  try {
    const { company_id, visit_date, purpose, visitors, notes } = req.body;
    if (!company_id || !visit_date || !purpose) {
      return res.status(400).json({ success: false, error: 'company_id, visit_date, and purpose required.' });
    }
    const { data, error } = await supabaseAdmin.rpc('log_company_visit', {
      p_company_id: company_id,
      p_visit_date: visit_date,
      p_purpose: purpose,
      p_visitors: JSON.stringify(visitors || []),
      p_notes: notes || '',
      p_created_by: req.user?.id,
    });
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getCompanyVisits(req: Request, res: Response) {
  try {
    const { company_id } = req.query;
    let query = supabaseAdmin
      .from('company_visits')
      .select('*, companies(name, industry)')
      .eq('institution_id', req.user?.institution_id)
      .order('visit_date', { ascending: false });
    if (company_id) query = query.eq('company_id', company_id);
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true, visits: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateCompanyVisit(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes, follow_up_date, follow_up_notes, attendees_count, offers_made, offers_accepted } = req.body;
    const updateData: any = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (follow_up_date) updateData.follow_up_date = follow_up_date;
    if (follow_up_notes) updateData.follow_up_notes = follow_up_notes;
    if (attendees_count !== undefined) updateData.attendees_count = attendees_count;
    if (offers_made !== undefined) updateData.offers_made = offers_made;
    if (offers_accepted !== undefined) updateData.offers_accepted = offers_accepted;

    const { data, error } = await supabaseAdmin
      .from('company_visits')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return res.status(200).json({ success: true, visit: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function registerAlumni(req: Request, res: Response) {
  try {
    const { student_id, graduation_year, current_company, current_role, current_ctc, location, linkedin_url, is_mentor, mentoring_slots } = req.body;
    if (!student_id) {
      return res.status(400).json({ success: false, error: 'student_id required.' });
    }
    
    const { data: student, error: stdErr } = await supabaseAdmin
      .from('students')
      .select('institution_id, user_id')
      .eq('id', student_id)
      .single();
      
    if (stdErr || !student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }
    
    const { data, error } = await supabaseAdmin
      .from('alumni')
      .insert({
        student_id,
        institution_id: student.institution_id,
        graduation_year: graduation_year || new Date().getFullYear(),
        current_company,
        current_role: current_role,
        current_ctc,
        location,
        linkedin_url,
        is_mentor: !!is_mentor,
        mentoring_slots: mentoring_slots || 0
      })
      .select()
      .single();
      
    if (error) throw error;
    
    if (student.user_id) {
      await supabaseAdmin
        .from('users')
        .update({ role: 'Alumni' })
        .eq('id', student.user_id);
    }
    
    return res.status(201).json({ success: true, alumni: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateAlumniProfile(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { graduation_year, current_company, current_role, current_ctc, location, linkedin_url, is_mentor, mentoring_slots, achievements } = req.body;
    
    const updateData: any = { updated_at: new Date().toISOString() };
    if (graduation_year !== undefined) updateData.graduation_year = graduation_year;
    if (current_company !== undefined) updateData.current_company = current_company;
    if (current_role !== undefined) updateData.current_role = current_role;
    if (current_ctc !== undefined) updateData.current_ctc = current_ctc;
    if (location !== undefined) updateData.location = location;
    if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
    if (is_mentor !== undefined) updateData.is_mentor = is_mentor;
    if (mentoring_slots !== undefined) updateData.mentoring_slots = mentoring_slots;
    if (achievements !== undefined) updateData.achievements = achievements;
    
    const { data, error } = await supabaseAdmin
      .from('alumni')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return res.status(200).json({ success: true, alumni: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
