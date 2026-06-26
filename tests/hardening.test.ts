process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';

import jwt from 'jsonwebtoken';
import { authMiddleware } from '../src/middleware/auth';
import { razorpayWebhook } from '../src/controllers/campusCore';
import { supabaseAdmin } from '../src/config/supabase';

const JWT_SECRET = process.env.JWT_SECRET;

function makeReq(overrides: Record<string, any> = {}) {
  return {
    headers: {},
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as any;
}

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Hardening - JWT Role Casing Normalization', () => {
  it('should normalize lowercase director role to Director', () => {
    const payload = {
      id: 'user-123',
      institution_id: 'inst-1',
      role: 'director',
      email: 'director@siet.edu.in',
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user?.role).toBe('Director');
  });

  it('should normalize lowercase superadmin role to SuperAdmin', () => {
    const payload = {
      id: 'user-123',
      institution_id: 'inst-1',
      role: 'superadmin',
      email: 'siddharth@sin.education',
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user?.role).toBe('SuperAdmin');
  });
});

describe('Hardening - Razorpay Webhook Multi-Module Reconciliation', () => {
  it('should return 200 and ignore webhook payments missing metadata notes', async () => {
    const req = makeReq({
      headers: { 'x-razorpay-signature': 'mock-sig' },
      body: {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              amount: 50000,
              notes: {}
            }
          }
        }
      }
    });
    const res = makeRes();

    // Disable signature validation in test by setting secret to empty or matching sig
    process.env.RAZORPAY_WEBHOOK_SECRET = '';
    process.env.RAZORPAY_KEY_SECRET = '';

    await razorpayWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining('Ignored')
      })
    );
  });
});
