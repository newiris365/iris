// Mock environment variables before importing
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

import {
  uploadStudentPhoto,
  uploadStudentDocument,
  getStudentDocuments,
  deleteStudentDocument,
  getTimetableVersions,
  saveTimetableVersion,
  rollbackTimetableVersion,
  getExamAnalytics,
  applySupplementary,
  getSupplementaryApplications,
  updateSupplementaryStatus,
  applyReEvaluation,
  getReEvaluationApplications,
  updateReEvaluationStatus,
} from '../src/controllers/campusCore';

import {
  registerAlumni,
  updateAlumniProfile
} from '../src/controllers/placements';

import {
  mockStudentDocuments,
  mockTimetableHistory,
  mockSupplementaryExams,
  mockReEvaluationRequests,
  mockAlumni
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

describe('Sprint 4 - Student Management', () => {
  beforeEach(() => {
    mockStudentDocuments.length = 0;
    mockStudentDocuments.push({
      id: 'doc-1',
      institution_id: 'a0000000-0000-0000-0000-000000000001',
      student_id: 'test-student-id',
      document_name: 'Marksheet',
      document_type: '10th_marksheet',
      file_url: 'https://example.com/file.pdf',
      file_size_kb: 100,
      uploaded_by: 'u1'
    });
  });

  it('should list student documents', async () => {
    const req = makeReq({ params: { id: 'test-student-id' } });
    const res = makeRes();
    await getStudentDocuments(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        documents: expect.any(Array)
      })
    );
  });

  it('should upload a student document', async () => {
    const req = makeReq({
      params: { id: 'test-student-id' },
      body: {
        document_name: 'Degree Certificate',
        document_type: 'degree',
        file_name: 'degree.pdf',
        file_data: 'data:application/pdf;base64,abcdef'
      }
    });
    const res = makeRes();
    await uploadStudentDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        document: expect.objectContaining({
          document_name: 'Degree Certificate',
          document_type: 'degree'
        })
      })
    );
  });

  it('should delete a student document', async () => {
    const req = makeReq({ params: { id: 'test-student-id', docId: 'doc-1' } });
    const res = makeRes();
    await deleteStudentDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String)
      })
    );
  });
});

describe('Sprint 4 - Timetable History & versioning', () => {
  beforeEach(() => {
    mockTimetableHistory.length = 0;
    mockTimetableHistory.push({
      id: 'v1',
      institution_id: 'a0000000-0000-0000-0000-000000000001',
      department_id: 'd1',
      semester: 5,
      batch_year: '2024',
      version: 1,
      timetable_data: []
    });
  });

  it('should get timetable versions list', async () => {
    const req = makeReq({
      query: { department_id: 'd1', semester: '5', batch_year: '2024' }
    });
    const res = makeRes();
    await getTimetableVersions(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        versions: expect.any(Array)
      })
    );
  });

  it('should save a new timetable version', async () => {
    const req = makeReq({
      body: { department_id: 'd1', semester: 5, batch_year: '2024', notes: 'Saves active slots' }
    });
    const res = makeRes();
    await saveTimetableVersion(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        version: expect.objectContaining({
          version: 2
        })
      })
    );
  });

  it('should rollback to a timetable version', async () => {
    const req = makeReq({
      body: { department_id: 'd1', semester: 5, batch_year: '2024', version: 1 }
    });
    const res = makeRes();
    await rollbackTimetableVersion(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String)
      })
    );
  });
});

describe('Sprint 4 - Placements Alumni Tracking', () => {
  beforeEach(() => {
    mockAlumni.length = 0;
    mockAlumni.push({
      id: 'alumni-123',
      institution_id: 'a0000000-0000-0000-0000-000000000001',
      student_id: 'test-student-id',
      graduation_year: 2026,
      current_company: 'Google',
      current_role: 'SWE',
      is_mentor: true,
      created_at: new Date().toISOString()
    });
  });

  it('should register a student as alumni', async () => {
    const req = makeReq({
      body: {
        student_id: 'test-student-id',
        graduation_year: 2026,
        current_company: 'Google',
        current_role: 'SWE',
        is_mentor: true
      }
    });
    const res = makeRes();
    await registerAlumni(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        alumni: expect.any(Object)
      })
    );
  });

  it('should update alumni profile', async () => {
    const req = makeReq({
      params: { id: 'alumni-123' },
      body: {
        current_company: 'Meta',
        current_role: 'Senior SWE'
      }
    });
    const res = makeRes();
    await updateAlumniProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        alumni: expect.any(Object)
      })
    );
  });
});

describe('Sprint 4 - Exams & Workflows', () => {
  beforeEach(() => {
    mockSupplementaryExams.length = 0;
    mockSupplementaryExams.push({
      id: 'supp-1',
      institution_id: 'a0000000-0000-0000-0000-000000000001',
      exam_id: 'exam-1',
      student_id: 'test-student-id',
      subject: 'Maths',
      status: 'applied'
    });

    mockReEvaluationRequests.length = 0;
    mockReEvaluationRequests.push({
      id: 'reeval-1',
      institution_id: 'a0000000-0000-0000-0000-000000000001',
      result_id: 'res-1',
      student_id: 'test-student-id',
      exam_id: 'exam-1',
      subject: 'Maths',
      status: 'applied'
    });
  });

  it('should compute exam result analytics', async () => {
    const req = makeReq({ params: { id: 'exam-1' } });
    const res = makeRes();
    await getExamAnalytics(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true
      })
    );
  });

  it('should apply for supplementary exams', async () => {
    const req = makeReq({
      body: {
        student_id: 'test-student-id',
        exam_id: 'exam-1',
        subject: 'Physics'
      }
    });
    const res = makeRes();
    await applySupplementary(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should approve a supplementary exam application', async () => {
    const req = makeReq({
      params: { id: 'supp-1' },
      body: { status: 'approved', remarks: 'Eligible for backup check' }
    });
    const res = makeRes();
    await updateSupplementaryStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should apply for exam result re-evaluation', async () => {
    const req = makeReq({
      body: {
        result_id: 'res-1',
        student_id: 'test-student-id',
        exam_id: 'exam-1',
        subject: 'Maths',
        reason: 'Incorrect calculation'
      }
    });
    const res = makeRes();
    await applyReEvaluation(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should approve a re-evaluation request and recalculate grade', async () => {
    const req = makeReq({
      params: { id: 'reeval-1' },
      body: { status: 'approved', new_marks: 85, remarks: 'Marks verified and corrected.' }
    });
    const res = makeRes();
    await updateReEvaluationStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
