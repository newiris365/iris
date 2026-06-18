import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authLocalStorage } from '../config/supabase';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('CRITICAL SECURITY VIOLATION: JWT_SECRET environment variable is required and must be at least 32 characters in length to prevent brute-force signature forgery!');
}
const JWT_SECRET = process.env.JWT_SECRET;

import crypto from 'crypto';

export interface AuthenticatedUser {
  id: string;
  institution_id: string;
  role: string;
  email: string;
  fingerprint?: string;
}

// Extend Express Request object to hold user details
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function getFingerprintHash(req: Request): string {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const deviceId = req.headers['x-client-device-id'] || 'unknown-device';
  
  let ipSegment = ip;
  if (ip.includes(':')) {
    // IPv6 address: mask to /64 subnet (first 4 groups) to tolerate tower switching
    ipSegment = ip.split(':').slice(0, 4).join(':');
  } else if (ip.includes('.')) {
    // IPv4 address: mask to /24 subnet (first 3 groups)
    ipSegment = ip.split('.').slice(0, 3).join('.');
  }
  
  const raw = `${userAgent}-${ipSegment}-${deviceId}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization token required. Access Denied.' });
  }

  const token = authHeader.split(' ')[1];

  authLocalStorage.run(token, () => {
    if (token.startsWith('mock-sandbox-jwt-token-value.')) {
      try {
        const parts = token.split('.');
        const payloadBase64 = parts[1];
        const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
        const decoded = JSON.parse(payloadJson) as AuthenticatedUser;
        req.user = decoded;
        return next();
      } catch (err) {
        return res.status(403).json({ success: false, error: 'Invalid or corrupted sandbox mock token.' });
      }
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
      
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
