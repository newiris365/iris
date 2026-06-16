import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';

import crypto from 'crypto';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('CRITICAL SECURITY VIOLATION: JWT_SECRET environment variable is required and must be at least 32 characters in length to prevent brute-force signature forgery!');
}
const JWT_SECRET = process.env.JWT_SECRET;

function getFingerprintHash(req: Request): string {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const deviceId = req.headers['x-client-device-id'] || 'unknown-device';
  
  let ipSegment = ip;
  if (ip.includes(':')) {
    ipSegment = ip.split(':').slice(0, 4).join(':');
  } else if (ip.includes('.')) {
    ipSegment = ip.split('.').slice(0, 3).join('.');
  }
  
  const raw = `${userAgent}-${ipSegment}-${deviceId}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// Login Validation Schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

export async function login(req: Request, res: Response) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { email, password } = parseResult.data;

    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      return res.status(401).json({ success: false, error: authError?.message || 'Authentication failed' });
    }

    // Fetch profile records from DB
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*, institutions(name, plan_tier)')
      .eq('email', email)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({ success: false, error: 'Corresponding platform profile record not found.' });
    }

    if (!userProfile.is_active) {
      return res.status(403).json({ success: false, error: 'Your user profile has been suspended by the administrator.' });
    }


    // 3. Generate stateless JWT with custom tenant claims + device fingerprint
    // Normalize role to proper casing (e.g. "director" -> "Director") for consistent RBAC matching
    const ROLE_CASING_MAP: Record<string, string> = {
      'admin': 'Admin',
      'superadmin': 'SuperAdmin',
      'staff': 'Staff',
      'teacher': 'Teacher',
      'student': 'Student',
      'parent': 'Parent',
      'warden': 'Warden',
      'security': 'Security',
      'vendor': 'Vendor',
      'driver': 'Driver',
      'director': 'Director',
      'tpo': 'TPO',
      'hod': 'HOD',
      'librarian': 'Librarian',
      'gym trainer': 'Gym Trainer',
      'iqac coordinator': 'IQAC Coordinator',
      'admissions officer': 'Admissions Officer',
      'principal': 'Principal',
      'hr admin': 'HR Admin',
      'applicant': 'Applicant',
      'company hr': 'Company HR',
      'alumni': 'Alumni'
    };
    const normalizedRole = ROLE_CASING_MAP[userProfile.role.toLowerCase()] || userProfile.role;

    const fingerprintHash = getFingerprintHash(req);
    const tokenClaims = {
      id: userProfile.id,
      institution_id: userProfile.institution_id,
      role: normalizedRole,
      email: userProfile.email,
      fingerprint: fingerprintHash
    };

    const token = jwt.sign(tokenClaims, JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({
      success: true,
      token,
      profile: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        role: normalizedRole,
        institution_id: userProfile.institution_id,
        institution_name: userProfile.institutions?.name,
        plan_tier: userProfile.institutions?.plan_tier
      }
    });

  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during authentication.' });
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    // Fetch user details from database (bypass RLS as we query via Admin for self context retrieval)
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*, institutions(name, plan_tier)')
      .eq('id', req.user.id)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    // Normalize role to proper casing
    const ROLE_CASING_MAP: Record<string, string> = {
      'admin': 'Admin', 'superadmin': 'SuperAdmin', 'staff': 'Staff',
      'teacher': 'Teacher', 'student': 'Student', 'parent': 'Parent',
      'warden': 'Warden', 'security': 'Security', 'vendor': 'Vendor',
      'driver': 'Driver', 'director': 'Director', 'tpo': 'TPO',
      'hod': 'HOD', 'librarian': 'Librarian', 'gym trainer': 'Gym Trainer',
      'iqac coordinator': 'IQAC Coordinator', 'admissions officer': 'Admissions Officer',
      'principal': 'Principal', 'hr admin': 'HR Admin', 'applicant': 'Applicant',
      'company hr': 'Company HR', 'alumni': 'Alumni'
    };
    const normalizedRole = ROLE_CASING_MAP[userProfile.role?.toLowerCase()] || userProfile.role;

    return res.status(200).json({
      success: true,
      profile: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        role: normalizedRole,
        institution_id: userProfile.institution_id,
        institution_name: userProfile.institutions?.name,
        plan_tier: userProfile.institutions?.plan_tier
      }
    });

  } catch (err: any) {
    console.error('getMe error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error retrieving profile data.' });
  }
}
