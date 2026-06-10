import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'iris-365-super-secret-key-for-jwt-signing';

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
  const ipSegment = ip.split('.').slice(0, 3).join('.'); // Use IP subnet to tolerate mobile network switching
  const raw = `${userAgent}-${ipSegment}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization token required. Access Denied.' });
  }

  const token = authHeader.split(' ')[1];

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
}

// Role-based claim gateway
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false, 
        error: `Access denied. Role '${req.user.role}' is not authorized for this operation.` 
      });
    }

    next();
  };
}
