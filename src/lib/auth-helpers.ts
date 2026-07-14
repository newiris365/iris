import { Request } from 'express';
import crypto from 'crypto';

/**
 * Generates a SHA-256 hash representing the device fingerprint of the request.
 * Normalizes IPv4 to /24 and IPv6 to /64 subnet boundaries to tolerate tower/network switching.
 */
export function getFingerprintHash(req: Request): string {
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

/**
 * Standardized mapping of lowercased role strings to their official capitalized casings
 * supported by the IRIS 365 RBAC permission system.
 */
export const ROLE_CASING_MAP: Record<string, string> = {
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
  'vice principal': 'Vice Principal',
  'hr admin': 'HR Admin',
  'applicant': 'Applicant',
  'company hr': 'Company HR',
  'alumni': 'Alumni'
};

/**
 * Normalizes a user role string to the official capitalized version.
 * If the role is not mapped, returns the original string or empty string.
 */
export function normalizeRole(role: string | undefined | null): string {
  if (!role) return '';
  const normalized = ROLE_CASING_MAP[role.toLowerCase()];
  return normalized || role;
}
