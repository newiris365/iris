import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabaseAdmin, getDynamicSupabaseClient } from '../config/supabase';
import { getFingerprintHash, normalizeRole } from '../lib/auth-helpers';
import { sendTextMessage } from '../services/whatsapp';
import logger from '../config/logger';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('CRITICAL SECURITY VIOLATION: JWT_SECRET environment variable is required and must be at least 32 characters in length to prevent brute-force signature forgery!');
}
const JWT_SECRET = process.env.JWT_SECRET;

// In-memory store for account lockout
const failedAttemptsMap = new Map<string, { count: number; lockUntil: number }>();

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
    const normalizedEmail = email.toLowerCase().trim();

    // Check account lockout status
    const now = Date.now();
    const attempts = failedAttemptsMap.get(normalizedEmail);
    if (attempts && attempts.lockUntil > now) {
      const remainingMinutes = Math.ceil((attempts.lockUntil - now) / 60000);
      return res.status(429).json({
        success: false,
        error: `Too many failed login attempts. Please try again after ${remainingMinutes} minute(s).`
      });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user || !authData.session) {
      // Record failed attempt
      const currentAttempts = attempts ? attempts.count + 1 : 1;
      if (currentAttempts >= 5) {
        failedAttemptsMap.set(normalizedEmail, {
          count: currentAttempts,
          lockUntil: now + 30 * 60 * 1000 // 30 min cooldown
        });
        return res.status(429).json({
          success: false,
          error: 'Too many failed login attempts. Account locked out for 30 minutes.'
        });
      } else {
        failedAttemptsMap.set(normalizedEmail, {
          count: currentAttempts,
          lockUntil: 0
        });
        return res.status(401).json({
          success: false,
          error: authError?.message || 'Authentication failed. Please check your credentials.'
        });
      }
    }

    // Clear failed attempts on successful login
    failedAttemptsMap.delete(normalizedEmail);

    // Fetch profile records from DB
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*, institutions(name, plan_tier, institute_type)')
      .eq('email', email)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({ success: false, error: 'Corresponding platform profile record not found.' });
    }

    if (!userProfile.is_active) {
      return res.status(403).json({ success: false, error: 'Your user profile has been suspended by the administrator.' });
    }

    // Normalize role to proper casing for consistent RBAC matching
    const normalizedRole = normalizeRole(userProfile.role);

    const fingerprintHash = getFingerprintHash(req);
    const tokenClaims = {
      id: userProfile.id,
      institution_id: userProfile.institution_id,
      role: normalizedRole,
      email: userProfile.email,
      fingerprint: fingerprintHash,
      supabase_token: authData.session.access_token,
      supabase_refresh_token: authData.session.refresh_token,
      institute_type: userProfile.institutions?.institute_type || 'college'
    };

    // Generate stateless JWT valid for 15 minutes
    const token = jwt.sign(tokenClaims, JWT_SECRET, { expiresIn: '15m' });

    return res.status(200).json({
      success: true,
      token,
      refreshToken: authData.session.refresh_token,
      profile: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        role: normalizedRole,
        institution_id: userProfile.institution_id,
        institution_name: userProfile.institutions?.name,
        plan_tier: userProfile.institutions?.plan_tier,
        institute_type: userProfile.institutions?.institute_type || 'college'
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
      .select('*, institutions(name, plan_tier, institute_type)')
      .eq('id', req.user.id)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    // Normalize role to proper casing
    const normalizedRole = normalizeRole(userProfile.role);

    return res.status(200).json({
      success: true,
      profile: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        role: normalizedRole,
        institution_id: userProfile.institution_id,
        institution_name: userProfile.institutions?.name,
        plan_tier: userProfile.institutions?.plan_tier,
        institute_type: userProfile.institutions?.institute_type || 'college'
      }
    });

  } catch (err: any) {
    console.error('getMe error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error retrieving profile data.' });
  }
}

const refreshSchema = z.object({
  refresh_token: z.string({ required_error: 'Refresh token is required' })
});

export async function refresh(req: Request, res: Response) {
  try {
    const parseResult = refreshSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { refresh_token } = parseResult.data;

    const { data: authData, error: authError } = await supabaseAdmin.auth.refreshSession({
      refresh_token
    });

    if (authError || !authData.user || !authData.session) {
      return res.status(401).json({ success: false, error: authError?.message || 'Refresh session failed' });
    }

    const email = authData.user.email;
    if (!email) {
      return res.status(400).json({ success: false, error: 'User email not found in refreshed session.' });
    }

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*, institutions(name, plan_tier, institute_type)')
      .eq('email', email)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({ success: false, error: 'Corresponding platform profile record not found.' });
    }

    if (!userProfile.is_active) {
      return res.status(403).json({ success: false, error: 'Your user profile has been suspended by the administrator.' });
    }

    const normalizedRole = normalizeRole(userProfile.role);
    const fingerprintHash = getFingerprintHash(req);

    const tokenClaims = {
      id: userProfile.id,
      institution_id: userProfile.institution_id,
      role: normalizedRole,
      email: userProfile.email,
      fingerprint: fingerprintHash,
      supabase_token: authData.session.access_token,
      supabase_refresh_token: authData.session.refresh_token,
      institute_type: userProfile.institutions?.institute_type || 'college'
    };

    const token = jwt.sign(tokenClaims, JWT_SECRET, { expiresIn: '15m' });

    return res.status(200).json({
      success: true,
      token,
      refreshToken: authData.session.refresh_token,
      profile: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        role: normalizedRole,
        institution_id: userProfile.institution_id,
        institution_name: userProfile.institutions?.name,
        plan_tier: userProfile.institutions?.plan_tier,
        institute_type: userProfile.institutions?.institute_type || 'college'
      }
    });
  } catch (err: any) {
    console.error('Refresh token error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during session refresh.' });
  }
}

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address format')
});

export async function forgotPassword(req: Request, res: Response) {
  try {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { email } = parseResult.data;

    // Use default redirect URL back to frontend reset route
    const redirectTo = process.env.RESET_PASSWORD_REDIRECT_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}/auth/reset-password`;
    
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset instructions have been sent to your email.'
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error processing password reset.' });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    // SignOut from Supabase Auth to invalidate tokens globally
    await supabaseAdmin.auth.signOut();
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err: any) {
    console.error('Logout error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during logout.' });
  }
}

// =========================================================================
// PARENT OTP & LINKING CONTROLLERS
// =========================================================================
const parentOtpSchema = z.object({
  phone: z.string(),
  purpose: z.string()
});

export async function parentOtp(req: Request, res: Response) {
  try {
    const parse = parentOtpSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    const { phone, purpose } = parse.data;

    const { data, error } = await supabaseAdmin.rpc('generate_parent_otp', {
      p_phone: phone,
      p_purpose: purpose
    });

    if (error || !data || data.length === 0) {
      logger.error('Failed to generate parent OTP:', error);
      return res.status(500).json({ success: false, error: 'Failed to generate OTP.' });
    }

    const { otp_code } = data[0];

    // Send WhatsApp verification code
    const sent = await sendTextMessage(
      phone,
      `Your IRIS 365 verification code is ${otp_code}. It will expire in 10 minutes.`,
      'auth'
    );

    if (!sent) {
      logger.warn(`WhatsApp message delivery failed for parent OTP to ${phone}`);
    }

    return res.status(200).json({ success: true, message: 'OTP sent successfully.' });
  } catch (err) {
    logger.error('parentOtp error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

const parentVerifyOtpSchema = z.object({
  phone: z.string(),
  otp: z.string(),
  purpose: z.string()
});

export async function parentVerifyOtp(req: Request, res: Response) {
  try {
    const parse = parentVerifyOtpSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    const { phone, otp, purpose } = parse.data;

    const { data, error } = await supabaseAdmin.rpc('verify_parent_otp', {
      p_phone: phone,
      p_otp: otp,
      p_purpose: purpose
    });

    if (error || !data || data.length === 0) {
      logger.error('Failed to verify parent OTP:', error);
      return res.status(500).json({ success: false, error: 'Failed to verify OTP.' });
    }

    const result = data[0];
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }

    return res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    logger.error('parentVerifyOtp error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

const parentLinkChildSchema = z.object({
  roll_number: z.string(),
  child_dob: z.string()
});

export async function parentLinkChild(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const parse = parentLinkChildSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    const { roll_number, child_dob } = parse.data;

    const client = getDynamicSupabaseClient();
    const { data, error } = await client.rpc('link_parent_to_child', {
      p_roll_number: roll_number,
      p_child_dob: child_dob
    });

    if (error || !data || data.length === 0) {
      logger.error('Failed to link parent to child:', error);
      return res.status(500).json({ success: false, error: error?.message || 'Failed to link child.' });
    }

    const result = data[0];
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }

    const { data: studentUser } = await supabaseAdmin
      .from('students')
      .select('users(full_name)')
      .eq('id', result.student_id)
      .maybeSingle();

    const studentName = (studentUser as any)?.users?.full_name || roll_number;

    return res.status(200).json({ 
      success: true, 
      message: result.message, 
      student_id: result.student_id,
      student_name: studentName
    });
  } catch (err) {
    logger.error('parentLinkChild error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}
