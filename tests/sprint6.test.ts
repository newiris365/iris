process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

import {
  ingestGpsTelemetry,
  recordStudentTransitTap
} from '../src/controllers/transit';

import {
  generateEventCertificates,
  getEventCertificates,
  verifyCertificate
} from '../src/controllers/events';

import {
  mockStudentTransitLogs,
  mockEventCertificates
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

describe('Sprint 6 - GPS Ingestion & Student Boarding Logs', () => {
  beforeEach(() => {
    mockStudentTransitLogs.length = 0;
  });

  it('should ingest GPS hardware telemetry successfully without user auth', async () => {
    const req = makeReq({
      user: undefined, // Simulated unauthenticated telemetry request
      body: {
        device_id: 'GPS-DEV-4050',
        latitude: 26.2912,
        longitude: 73.0156,
        speed: 35.5,
        heading: 180
      }
    });
    const res = makeRes();

    await ingestGpsTelemetry(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining('telemetry updated')
      })
    );
  });

  it('should fail telemetry if device_id does not exist', async () => {
    const req = makeReq({
      user: undefined,
      body: {
        device_id: 'NON-EXISTENT-DEVICE',
        latitude: 26.2912,
        longitude: 73.0156
      }
    });
    const res = makeRes();

    await ingestGpsTelemetry(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should log student boarding scan and notify parents', async () => {
    const req = makeReq({
      params: { id: '70000000-0000-0000-0000-000000000001' }, // tripId
      body: {
        student_id: 'c0000000-0000-0000-0000-000000000006', // Khushal
        direction: 'boarding',
        stop_name: 'Mogra Highway Stop'
      }
    });
    const res = makeRes();

    await recordStudentTransitTap(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockStudentTransitLogs.length).toBe(1);
    expect(mockStudentTransitLogs[0].direction).toBe('boarding');
    expect(mockStudentTransitLogs[0].stop_name).toBe('Mogra Highway Stop');
  });
});

describe('Sprint 6 - Events certificate generation', () => {
  beforeEach(() => {
    mockEventCertificates.length = 0;
  });

  it('should generate real event certificates and store them', async () => {
    const req = makeReq({
      params: { id: 'e0000000-0000-0000-0000-000000000001' }, // eventId
      body: {
        certificate_type: 'participation'
      }
    });
    const res = makeRes();

    await generateEventCertificates(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockEventCertificates.length).toBeGreaterThan(0);
    expect(mockEventCertificates[0].certificate_type).toBe('participation');
    expect(mockEventCertificates[0].url).toContain('.pdf');
  });

  it('should list generated event certificates', async () => {
    mockEventCertificates.push({
      id: 'cert-mock-1',
      institution_id: 'a0000000-0000-0000-0000-000000000001',
      event_id: 'e0000000-0000-0000-0000-000000000001',
      student_id: 'c0000000-0000-0000-0000-000000000006',
      certificate_type: 'winner',
      rank: 1,
      url: 'https://example.com/cert.pdf',
      verification_code: 'CERT-VERIFY-1234'
    });

    const req = makeReq({
      params: { id: 'e0000000-0000-0000-0000-000000000001' }
    });
    const res = makeRes();

    await getEventCertificates(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        certificates: expect.arrayContaining([
          expect.objectContaining({
            verification_code: 'CERT-VERIFY-1234'
          })
        ])
      })
    );
  });

  it('should verify event certificates by code', async () => {
    mockEventCertificates.push({
      id: 'cert-mock-2',
      institution_id: 'a0000000-0000-0000-0000-000000000001',
      event_id: 'e0000000-0000-0000-0000-000000000001',
      student_id: 'c0000000-0000-0000-0000-000000000006',
      certificate_type: 'speaker',
      url: 'https://example.com/cert2.pdf',
      verification_code: 'CERT-SPEAK-7788'
    });

    const req = makeReq({
      params: { code: 'CERT-SPEAK-7788' }
    });
    const res = makeRes();

    await verifyCertificate(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        valid: true
      })
    );
  });
});
