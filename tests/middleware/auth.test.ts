import jwt from 'jsonwebtoken';
import { authMiddleware, requireRole } from '../../src/middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-that-is-at-least-32-characters-long';

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

describe('authMiddleware', () => {
  it('returns 401 when no Authorization header', () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header lacks Bearer prefix', () => {
    const req = makeReq({ headers: { authorization: 'Token abc' } });
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 for invalid/expired token', () => {
    const req = makeReq({
      headers: { authorization: 'Bearer invalid-token-here' },
    });
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    // jwt.verify throws for invalid token, caught in catch block
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and sets req.user for valid token', () => {
    const payload = {
      id: 'user-123',
      institution_id: 'inst-1',
      role: 'student',
      email: 'test@example.com',
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user?.id).toBe('user-123');
    expect(req.user?.role).toBe('Student');
  });
});

describe('requireRole', () => {
  function makeUserReq(role: string) {
    return makeReq({
      user: { id: 'u1', institution_id: 'i1', role, email: 'a@b.com' },
    });
  }

  it('returns 401 when req.user is undefined', () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    requireRole(['admin'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when role is not allowed', () => {
    const req = makeUserReq('student');
    const res = makeRes();
    const next = jest.fn();

    requireRole(['admin', 'director'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when role is allowed', () => {
    const req = makeUserReq('admin');
    const res = makeRes();
    const next = jest.fn();

    requireRole(['admin', 'director'])(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
