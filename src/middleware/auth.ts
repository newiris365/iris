import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authLocalStorage } from '../config/supabase';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('CRITICAL SECURITY VIOLATION: JWT_SECRET environment variable is required and must be at least 32 characters in length to prevent brute-force signature forgery!');
}
const JWT_SECRET = process.env.JWT_SECRET;

import { getFingerprintHash, normalizeRole } from '../lib/auth-helpers';

export interface AuthenticatedUser {
  id: string;
  institution_id: string;
  role: string;
  email: string;
  fingerprint?: string;
  institute_type?: string;
}

// Extend Express Request object to hold user details
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      rawBody?: any;
    }
  }
}


export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  let authHeader = req.headers.authorization;
  
  if (!authHeader && req.query && req.query.token) {
    authHeader = `Bearer ${req.query.token}`;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization token required. Access Denied.' });
  }

  const token = authHeader.split(' ')[1];

  authLocalStorage.run(token, () => {
    if (token.startsWith('mock-sandbox-jwt-token-value.')) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ success: false, error: 'Sandbox mock tokens are disabled in production.' });
      }
      try {
        const parts = token.split('.');
        const payloadBase64 = parts[1];
        const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
        const decoded = JSON.parse(payloadJson) as AuthenticatedUser;
        if (decoded.role) {
          decoded.role = normalizeRole(decoded.role);
        }
        req.user = decoded;
        return next();
      } catch (err) {
        return res.status(403).json({ success: false, error: 'Invalid or corrupted sandbox mock token.' });
      }
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
      if (decoded.role) {
        decoded.role = normalizeRole(decoded.role);
      }
      
      // Verify device fingerprint claim if present
      if (decoded.fingerprint) {
        const currentFingerprint = getFingerprintHash(req);
        if (decoded.fingerprint !== currentFingerprint) {
          return res.status(403).json({ 
            success: false, 
            error: 'Session security integrity compromised (device mismatch). Re-authentication required.' 
          });
        }
      }
      
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired authentication token.' });
    }
  });
}

// Role-based claim gateway (case-insensitive comparison to tolerate DB casing variations)
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const normalizedUserRole = req.user.role.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false, 
        error: `Access denied. Role '${req.user.role}' is not authorized for this operation.` 
      });
    }

    next();
  };
}
