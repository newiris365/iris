import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';

import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'iris-365-super-secret-key-for-jwt-signing';

function getFingerprintHash(req: Request): string {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const ipSegment = ip.split('.').slice(0, 3).join('.'); // Use IP subnet to tolerate mobile network switching
  const raw = `${userAgent}-${ipSegment}`;
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

    let userProfile = null;

    // 1. Direct local sandbox fallback: check email and allow bypass for testing credentials
    const isLocalSandboxEmail = email === 'khushal@gmail.com' || email === 'director@siet.edu.in' || email === 'admin@siet.edu.in' || email === 'guard@siet.edu.in';
    
    if (isLocalSandboxEmail) {
      // Attempt to load profile from Database
      const { data: dbProfile, error: dbError } = await supabaseAdmin
        .from('users')
        .select('*, institutions(name, plan_tier)')
        .eq('email', email)
        .single();
      
      if (!dbError && dbProfile) {
        userProfile = dbProfile;
      } else {
        // Ultimate code-fallback if database connection is empty or offline
        if (email === 'khushal@gmail.com') {
          userProfile = {
            id: 'b0000000-0000-0000-0000-000000000006',
            institution_id: 'a0000000-0000-0000-0000-000000000001',
            role: 'Student',
            name: 'Khushal Gehlot (Mock Sandbox)',
            email: 'khushal@gmail.com',
            phone: '+919999988888',
            is_active: true,
            institutions: {
              name: 'SIN Institute of Engineering & Technology (SIET)',
              plan_tier: 'University'
            }
          };
        } else if (email === 'guard@siet.edu.in') {
          userProfile = {
            id: 'b0000000-0000-0000-0000-000000000015',
            institution_id: 'a0000000-0000-0000-0000-000000000001',
            role: 'Security',
            name: 'Vikram Singh (Security Guard Mock)',
            email: 'guard@siet.edu.in',
            phone: '+919876543299',
            is_active: true,
            institutions: {
              name: 'SIN Institute of Engineering & Technology (SIET)',
              plan_tier: 'University'
            }
          };
        } else {
          userProfile = {
            id: 'b0000000-0000-0000-0000-000000000002',
            institution_id: 'a0000000-0000-0000-0000-000000000001',
            role: 'Director',
            name: 'Dr. K. R. Sharma (Mock Sandbox)',
            email: 'director@siet.edu.in',
            phone: '+919876543211',
            is_active: true,
            institutions: {
              name: 'SIN Institute of Engineering & Technology (SIET)',
              plan_tier: 'University'
            }
          };
        }
      }
    }

    // 2. If no bypass match, execute standard Supabase Auth verify
    if (!userProfile) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !authData.user) {
        return res.status(401).json({ success: false, error: authError?.message || 'Authentication failed' });
      }

      // Fetch profile records from DB
      const { data: profileRecord, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*, institutions(name, plan_tier)')
        .eq('email', email)
        .single();

      if (profileError || !profileRecord) {
        return res.status(404).json({ success: false, error: 'Corresponding platform profile record not found.' });
      }

      userProfile = profileRecord;
    }

    if (!userProfile.is_active) {
      return res.status(403).json({ success: false, error: 'Your user profile has been suspended by the administrator.' });
    }


    // 3. Generate stateless JWT with custom tenant claims + device fingerprint
    const fingerprintHash = getFingerprintHash(req);
    const tokenClaims = {
      id: userProfile.id,
      institution_id: userProfile.institution_id,
      role: userProfile.role,
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
        role: userProfile.role,
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

    return res.status(200).json({
      success: true,
      profile: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
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
