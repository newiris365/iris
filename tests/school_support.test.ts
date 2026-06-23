process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

import { getRoleLabel } from '../src/lib/roleLabels';
import { 
  markSchoolAttendanceBulk, 
  getSchoolAttendanceReport, 
  getStudentAttendance 
} from '../src/controllers/campusCore';
import { mockSchoolAttendance } from '../src/config/supabase';

function makeReq(overrides: Record<string, any> = {}) {
  return {
    params: {},
    query: {},
    body: {},
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    user: { id: 'b0000000-0000-0000-0000-000000000002', role: 'Admin', institution_id: 'a0000000-0000-0000-0000-000000000001', institute_type: 'school' },
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

describe('School Support - Role Naming Display', () => {
  it('should map Admin role to Principal in school mode', () => {
    expect(getRoleLabel('Admin', 'school')).toBe('Principal');
    expect(getRoleLabel('Admin ', 'school')).toBe('Principal');
  });

  it('should retain Admin label in college mode', () => {
    expect(getRoleLabel('Admin', 'college')).toBe('Admin');
    expect(getRoleLabel('Admin')).toBe('Admin');
  });

  it('should retain other roles unchanged in both modes', () => {
    expect(getRoleLabel('Teacher', 'school')).toBe('Teacher');
    expect(getRoleLabel('Teacher', 'college')).toBe('Teacher');
  });
});

describe('School Support - Attendance Controllers', () => {
  beforeEach(() => {
    mockSchoolAttendance.length = 0;
  });

  it('should mark daily register attendance in bulk successfully', async () => {
    const req = makeReq({
      body: {
        records: [
          { student_id: 'std-1', status: 'Present' },
          { student_id: 'std-2', status: 'Absent' }
        ],
        date: '2026-07-01',
        academic_year: '2026-2027'
      }
    });
    const res = makeRes();

    await markSchoolAttendanceBulk(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining('successfully')
      })
    );
    expect(mockSchoolAttendance.length).toBe(2);
    expect(mockSchoolAttendance[0].status).toBe('Present');
  });

  it('should retrieve school attendance report filtered by grade', async () => {
    mockSchoolAttendance.push(
      { id: 'sa-1', student_id: 'std-1', date: '2026-07-01', academic_year: '2026-2027', status: 'Present', institution_id: 'a0000000-0000-0000-0000-000000000001' },
      { id: 'sa-2', student_id: 'std-2', date: '2026-07-01', academic_year: '2026-2027', status: 'Absent', institution_id: 'a0000000-0000-0000-0000-000000000001' }
    );

    const req = makeReq({
      query: {
        grade: '5',
        academic_year: '2026-2027',
        date: '2026-07-01'
      }
    });
    const res = makeRes();

    await getSchoolAttendanceReport(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        reports: expect.any(Array)
      })
    );
  });

  it('should output student attendance formatted as monthly aggregates for school type', async () => {
    mockSchoolAttendance.push(
      { id: 'sa-1', student_id: 'test-student-id', date: '2026-07-01', academic_year: '2026-2027', status: 'Present', institution_id: 'a0000000-0000-0000-0000-000000000001' },
      { id: 'sa-2', student_id: 'test-student-id', date: '2026-07-02', academic_year: '2026-2027', status: 'Half-Day', institution_id: 'a0000000-0000-0000-0000-000000000001' },
      { id: 'sa-3', student_id: 'test-student-id', date: '2026-07-03', academic_year: '2026-2027', status: 'Leave', institution_id: 'a0000000-0000-0000-0000-000000000001' }
    );

    const req = makeReq({
      params: { id: 'test-student-id' }
    });
    const res = makeRes();

    await getStudentAttendance(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        breakdown: expect.any(Array)
      })
    );
  });
});

import { requireFeature } from '../src/middleware/permissions';
import { mockInstitutionFeatures } from '../src/config/supabase';

describe('Feature Toggles Backend Integration', () => {
  beforeEach(() => {
    mockInstitutionFeatures.length = 0;
  });

  it('should allow request next() if feature key is enabled', async () => {
    mockInstitutionFeatures.push({
      institution_id: 'inst-enabled',
      feature_key: 'transit',
      enabled: true
    });

    const middleware = requireFeature('transit');
    const req = makeReq({
      user: { id: 'user-1', role: 'Student', institution_id: 'inst-enabled' }
    });
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject request with 403 if feature key is disabled', async () => {
    mockInstitutionFeatures.push({
      institution_id: 'inst-disabled',
      feature_key: 'transit',
      enabled: false
    });

    const middleware = requireFeature('transit');
    const req = makeReq({
      user: { id: 'user-1', role: 'Student', institution_id: 'inst-disabled' }
    });
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('not enabled')
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
