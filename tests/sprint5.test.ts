// Mock environment variables before importing
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

import {
  entryQR,
  entryRfid,
  entryManual,
  toggleLockdown,
  getLockdownStatus,
  getGateAnalytics,
  checkinVisitorQR
} from '../src/controllers/gate';

import {
  processReservationQueue
} from '../src/controllers/library';

import {
  getEquipmentMaintenanceLogs
} from '../src/controllers/fitzone';

import {
  mockGateLockdown,
  mockEquipmentMaintenanceLogs,
  mockVisitorPasses,
  mockGymEquipment,
  mockBookReservations
} from '../src/config/supabase';

function makeReq(overrides: Record<string, any> = {}) {
  return {
    params: {},
    query: {},
    body: {},
    user: { id: 'b0000000-0000-0000-0000-000000000002', role: 'Admin', institution_id: 'a0000000-0000-0000-0000-000000000001' },
    headers: {},
    ...overrides
  } as any;
}

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('Sprint 5 - Smart Gate System', () => {
  beforeEach(() => {
    mockGateLockdown.length = 0;
    mockVisitorPasses.length = 0;
  });

  it('should toggle lockdown and check lockdown status', async () => {
    // 1. Toggle lockdown ON
    let req = makeReq({
      body: { is_locked_down: true, reason: 'Active Shooter Drill' }
    });
    let res = makeRes();
    await toggleLockdown(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockGateLockdown.length).toBe(1);
    expect(mockGateLockdown[0].is_locked_down).toBe(true);

    // 2. Check status
    req = makeReq();
    res = makeRes();
    await getLockdownStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        is_locked_down: true
      })
    );
  });

  it('should block standard entries (QR/RFID) during lockdown but permit manual bypass', async () => {
    // Enable lockdown
    mockGateLockdown.push({
      id: 'lock-1',
      institution_id: 'a0000000-0000-0000-0000-000000000001',
      is_locked_down: true,
      created_at: new Date().toISOString()
    });

    // 1. Test entryQR (should block)
    let tokenPayload = JSON.stringify({
      person_id: 'b0000000-0000-0000-0000-000000000006',
      timestamp: new Date().toISOString(),
      person_type: 'student'
    });
    let req = makeReq({ body: { qr_token: tokenPayload } });
    let res = makeRes();
    await entryQR(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('lockdown')
      })
    );

    // 2. Test entryManual (should allow override)
    req = makeReq({
      body: {
        person_name: 'Warden Bypass',
        person_type: 'staff',
        entry_method: 'manual',
        direction: 'in',
        reason: 'Authorized Emergency Crew'
      }
    });
    res = makeRes();
    await entryManual(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should aggregate gate analytics summary', async () => {
    const req = makeReq();
    const res = makeRes();
    await getGateAnalytics(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        traffic: expect.any(Object),
        occupancy: expect.any(Object),
        incidents: expect.any(Object)
      })
    );
  });

  it('should scan and check in visitor via QR pass', async () => {
    // Setup approved visitor pass
    mockVisitorPasses.push({
      id: 'pass-1',
      institution_id: 'a0000000-0000-0000-0000-000000000001',
      visitor_name: 'John Guest',
      visitor_phone: '+919999988887',
      pass_number: 'VP-99887',
      qr_code: 'QR-VP-99887',
      valid_from: new Date(Date.now() - 3600 * 1000).toISOString(), // 1h ago
      valid_until: new Date(Date.now() + 3600 * 1000).toISOString(), // 1h future
      is_used: false
    });

    const req = makeReq({
      body: { qr_code: 'QR-VP-99887' }
    });
    const res = makeRes();
    await checkinVisitorQR(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockVisitorPasses[0].is_used).toBe(true);
  });
});

describe('Sprint 5 - Library System', () => {
  beforeEach(() => {
    mockBookReservations.length = 0;
  });

  it('should process expired reservations and advance FIFO queue', async () => {
    const now = new Date();
    // 1. Expired notified reservation (should turn expired)
    mockBookReservations.push({
      id: 'res-exp',
      book_id: 'b1',
      student_id: 'student-old',
      status: 'notified',
      reserved_at: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString(),
      expires_at: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString() // expired 2 days ago
    });

    // 2. Next waiting reservation (should turn notified)
    mockBookReservations.push({
      id: 'res-next',
      book_id: 'b1',
      student_id: 'student-next',
      status: 'waiting',
      reserved_at: new Date(now.getTime() - 4 * 24 * 3600 * 1000).toISOString()
    });

    const req = makeReq();
    const res = makeRes();
    await processReservationQueue(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockBookReservations.find(r => r.id === 'res-exp')?.status).toBe('expired');
    expect(mockBookReservations.find(r => r.id === 'res-next')?.status).toBe('notified');
    expect(mockBookReservations.find(r => r.id === 'res-next')?.expires_at).toBeDefined();
  });
});

describe('Sprint 5 - FitZone Gym', () => {
  beforeEach(() => {
    mockEquipmentMaintenanceLogs.length = 0;
  });

  it('should fetch equipment maintenance logs', async () => {
    mockEquipmentMaintenanceLogs.push({
      id: 'log-1',
      equipment_id: 'equip-1',
      maintenance_type: 'Routine Belt Tensioning',
      performed_by: 'Gym Mechanic',
      date: new Date().toISOString().split('T')[0],
      cost: 500,
      notes: 'Lubricated and aligned'
    });

    const req = makeReq({
      params: { id: 'equip-1' }
    });
    const res = makeRes();
    await getEquipmentMaintenanceLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        logs: expect.any(Array)
      })
    );
  });
});
