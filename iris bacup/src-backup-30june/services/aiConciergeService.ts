import logger from '../config/logger';

export interface MessageContext {
  institution: string;
  name: string;
  role: string;
  language: string;
  // Shared / Student
  attendance: number;
  pending_fees: number;
  timetable: string[];
  notices: { title: string }[];
  hostel_room?: string;
  subscription_status?: any;
  // SuperAdmin
  total_students?: number;
  total_revenue?: number;
  total_campuses?: number;
  // Admin
  campus_students?: number;
  campus_staff?: number;
  campus_attendance_rate?: number;
  campus_fee_collection?: number;
  // HOD
  dept_students?: number;
  dept_attendance?: number;
  dept_faculty?: number;
  // Teacher
  my_classes?: string[];
  my_students_count?: number;
  // Warden
  room_occupancy?: string;
  mess_notices?: string[];
  pending_complaints?: number;
  // Security
  visitor_logs_today?: number;
  rfid_scans_today?: number;
  // Librarian
  book_inventory?: number;
  pending_returns?: number;
  library_hours?: string;
  // Parent
  child_name?: string;
  child_attendance?: number;
  child_fees?: number;
  transport_status?: string;
  // Driver
  today_route?: string;
  bus_schedule?: string;
  passenger_count?: number;
  // Vendor
  orders_today?: number;
  menu_items?: string[];
  queue_status?: string;
  // Staff
  announcements?: string[];
  my_tasks?: string[];
  office_hours?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Helper to check if an API key is a placeholder
 */
function isPlaceholderKey(key: string | undefined): boolean {
  if (!key) return true;
  const k = key.toLowerCase().trim();
  return (
    k === '' ||
    k === 'demo' ||
    k === 'placeholder' ||
    k.startsWith('your-') ||
    k.startsWith('sk-your-') ||
    k.startsWith('sk-proj-your-') ||
    k.includes('placeholder') ||
    k.includes('mock')
  );
}

/**
 * Helper to dispatch to Google Gemini API
 */
async function askGemini(
  userMessage: string,
  userContext: MessageContext,
  history: ChatMessage[],
  apiKey: string
): Promise<string> {
  try {
    const systemPrompt = buildSystemPrompt(userContext);
    
    // Format history for Gemini API
    const contents = [
      ...history.slice(-10).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const data = await response.json() as any;
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
    } else {
      const errText = await response.text();
      logger.error(`Gemini API error status ${response.status}: ${errText}`);
    }
  } catch (err) {
    logger.error('Failed to communicate with Google Gemini API:', err);
  }
  return '';
}

/**
 * Helper to dispatch to OpenAI Chat Completion API
 */
async function askOpenAI(
  userMessage: string,
  userContext: MessageContext,
  history: ChatMessage[],
  apiKey: string
): Promise<string> {
  try {
    const systemPrompt = buildSystemPrompt(userContext);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: userMessage }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const data = await response.json() as any;
      if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content;
      }
    } else {
      const errText = await response.text();
      logger.error(`OpenAI API error status ${response.status}: ${errText}`);
    }
  } catch (err) {
    logger.error('Failed to communicate with OpenAI Chat API:', err);
  }
  return '';
}

/**
 * Helper to dispatch to Anthropic Claude Messages API
 */
async function askClaudeWithKey(
  userMessage: string,
  userContext: MessageContext,
  history: ChatMessage[],
  apiKey: string
): Promise<string> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        system: buildSystemPrompt(userContext),
        messages: [
          ...history.slice(-10).map(msg => ({ role: msg.role, content: msg.content })),
          { role: 'user', content: userMessage }
        ]
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const data = await response.json() as any;
      return data.content[0].text;
    } else {
      const errText = await response.text();
      logger.error(`Claude API error status ${response.status}: ${errText}`);
    }
  } catch (err) {
    logger.error('Failed to communicate with Anthropic Claude API:', err);
  }
  return '';
}

/**
 * Connects to Anthropic Claude Messages, Google Gemini, or OpenAI Chat APIs based on configured keys.
 */
export async function askClaude(
  userMessage: string, 
  userContext: MessageContext, 
  history: ChatMessage[],
  keys?: { gemini_api_key?: string; openai_api_key?: string; claude_api_key?: string }
): Promise<string> {
  // 1. Check custom institution keys (OpenAI first)
  if (keys) {
    if (keys.openai_api_key && !isPlaceholderKey(keys.openai_api_key)) {
      const res = await askOpenAI(userMessage, userContext, history, keys.openai_api_key);
      if (res) return res;
    }
    if (keys.gemini_api_key && !isPlaceholderKey(keys.gemini_api_key)) {
      const res = await askGemini(userMessage, userContext, history, keys.gemini_api_key);
      if (res) return res;
    }
    if (keys.claude_api_key && !isPlaceholderKey(keys.claude_api_key)) {
      const res = await askClaudeWithKey(userMessage, userContext, history, keys.claude_api_key);
      if (res) return res;
    }
  }

  // 2. Fallback to process.env keys (OpenAI first)
  const envOpenAI = process.env.OPENAI_API_KEY;
  if (envOpenAI && !isPlaceholderKey(envOpenAI)) {
    const res = await askOpenAI(userMessage, userContext, history, envOpenAI);
    if (res) return res;
  }

  const envGemini = process.env.GEMINI_API_KEY;
  if (envGemini && !isPlaceholderKey(envGemini)) {
    const res = await askGemini(userMessage, userContext, history, envGemini);
    if (res) return res;
  }

  const envClaude = process.env.ANTHROPIC_API_KEY;
  if (envClaude && !isPlaceholderKey(envClaude)) {
    const res = await askClaudeWithKey(userMessage, userContext, history, envClaude);
    if (res) return res;
  }

  // 3. Fallback to mock responses if no key is configured
  return getMockClaudeResponse(userMessage, userContext);
}


/**
 * Builds a role-specific system prompt for the LLM based on user context.
 * Each role receives only the data and scope relevant to their function.
 */
export function buildSystemPrompt(ctx: MessageContext): string {
  const lang = ctx.language === 'hi'
    ? 'Hindi (conversational Hindi mixed with English for technical terms)'
    : 'English';
  const date = new Date().toLocaleDateString('en-IN');
  const noticesStr = ctx.notices?.length
    ? ctx.notices.map(n => n.title).join(', ')
    : 'No active notices';

  // ── Shared footer rules ──────────────────────────────────────────────────
  const rules = `
Rules:
1. Answer only campus / institutional queries relevant to your role scope.
2. For metrics, rely strictly on the provided context data — never fabricate numbers.
3. Keep responses concise (2-3 sentences max). Use bullet points when listing details.
4. For complaints or complex issues, suggest raising a support ticket or contacting the appropriate authority.
5. Respond in ${lang}.
6. Use a friendly, helpful, and premium tone.
7. If asked about something outside your role scope, politely redirect.`;

  const roleUpper = ctx.role?.toLowerCase();

  // ── SUPERADMIN ──────────────────────────────────────────────────────────
  if (roleUpper === 'superadmin') {
    return `You are IRIS, the AI campus OS assistant for ${ctx.institution}.
User: ${ctx.name} | Role: SuperAdmin | Date: ${date}

Institution-Wide Context:
- Total Students (all campuses): ${ctx.total_students ?? 'N/A'}
- Total Revenue (this FY): ₹${ctx.total_revenue?.toLocaleString('en-IN') ?? 'N/A'}
- Total Campuses / Branches: ${ctx.total_campuses ?? 'N/A'}
- Active Notices: ${noticesStr}

Scope: You have full institution-wide visibility. Respond with institution-level insights, cross-campus aggregates, financial summaries, and system health.
${rules}`;
  }

  // ── ADMIN ────────────────────────────────────────────────────────────────
  if (roleUpper === 'admin') {
    return `You are IRIS, the AI campus assistant for ${ctx.institution}.
User: ${ctx.name} | Role: Admin | Date: ${date}

Campus-Level Context:
- Total Students (this campus): ${ctx.campus_students ?? 'N/A'}
- Total Staff: ${ctx.campus_staff ?? 'N/A'}
- Overall Attendance Rate: ${ctx.campus_attendance_rate ?? 'N/A'}%
- Fee Collection (this month): ₹${ctx.campus_fee_collection?.toLocaleString('en-IN') ?? 'N/A'}
- Active Notices: ${noticesStr}

Scope: You manage a single campus. Respond with campus-level student stats, staff summaries, fee collection figures, and attendance reports.
${rules}`;
  }

  // ── STUDENT ──────────────────────────────────────────────────────────────
  if (roleUpper === 'student') {
    const timetableStr = ctx.timetable?.length ? ctx.timetable.join(', ') : 'No classes scheduled today';
    return `You are IRIS, the AI campus assistant for ${ctx.institution}.
User: ${ctx.name} | Role: Student | Date: ${date}

Personal Academic Context:
- My Attendance: ${ctx.attendance}%
- Outstanding Fees: ₹${ctx.pending_fees}
- Today's Timetable: ${timetableStr}
- My Courses: ${(ctx.subscription_status as any)?.courses ?? 'See /student/courses'}
- Active Notices: ${noticesStr}
${ctx.hostel_room ? `- Hostel Room: ${ctx.hostel_room}` : ''}
${ctx.subscription_status ? `- Subscriptions: ${JSON.stringify(ctx.subscription_status)}` : ''}

Scope: Personal academic data only — attendance, fees, timetable, courses, hostel, library books.
${rules}`;
  }

  // ── HOD ─────────────────────────────────────────────────────────────────
  if (roleUpper === 'hod') {
    return `You are IRIS, the AI campus assistant for ${ctx.institution}.
User: ${ctx.name} | Role: Head of Department (HOD) | Date: ${date}

Department-Level Context:
- Department Students: ${ctx.dept_students ?? 'N/A'}
- Department Attendance Rate: ${ctx.dept_attendance ?? 'N/A'}%
- Department Faculty Count: ${ctx.dept_faculty ?? 'N/A'}
- Active Notices: ${noticesStr}

Scope: Department-level data — student counts, attendance summaries, faculty listing, department notices.
${rules}`;
  }

  // ── TEACHER ──────────────────────────────────────────────────────────────
  if (roleUpper === 'teacher') {
    const classesStr = ctx.my_classes?.length ? ctx.my_classes.join(', ') : 'No classes today';
    return `You are IRIS, the AI campus assistant for ${ctx.institution}.
User: ${ctx.name} | Role: Teacher | Date: ${date}

Class-Level Context:
- My Classes Today: ${classesStr}
- My Total Students: ${ctx.my_students_count ?? 'N/A'}
- My Schedule: ${classesStr}
- Active Notices: ${noticesStr}

Scope: Class-level data — my classes, student attendance in my classes, my schedule, lecture rooms.
${rules}`;
  }

  // ── WARDEN ───────────────────────────────────────────────────────────────
  if (roleUpper === 'warden' || roleUpper === 'hostelwarden') {
    const messNoticesStr = ctx.mess_notices?.length ? ctx.mess_notices.join(', ') : 'No mess notices';
    return `You are IRIS, the AI campus assistant for ${ctx.institution}.
User: ${ctx.name} | Role: Hostel Warden | Date: ${date}

Hostel-Level Context:
- Room Occupancy: ${ctx.room_occupancy ?? 'N/A'}
- Mess Notices: ${messNoticesStr}
- Pending Complaints: ${ctx.pending_complaints ?? 0}
- Active Campus Notices: ${noticesStr}

Scope: Hostel-level data — room occupancy, mess schedule, maintenance complaints, hostel student roster.
${rules}`;
  }

  // ── SECURITY ─────────────────────────────────────────────────────────────
  if (roleUpper === 'security' || roleUpper === 'gatesecurity') {
    return `You are IRIS, the AI campus assistant for ${ctx.institution}.
User: ${ctx.name} | Role: Gate Security | Date: ${date}

Gate-Level Context:
- Today's Visitor Logs: ${ctx.visitor_logs_today ?? 0} visitors
- RFID Scans Today: ${ctx.rfid_scans_today ?? 0} scans
- Active Campus Notices: ${noticesStr}

Scope: Gate-level data — today's visitor logs, RFID entry/exit scans, gate access alerts, security notices.
${rules}`;
  }

  // ── LIBRARIAN ────────────────────────────────────────────────────────────
  if (roleUpper === 'librarian') {
    return `You are IRIS, the AI campus assistant for ${ctx.institution}.
User: ${ctx.name} | Role: Librarian | Date: ${date}

Library-Level Context:
- Total Book Inventory: ${ctx.book_inventory ?? 'N/A'} books
- Pending Returns (overdue): ${ctx.pending_returns ?? 0}
- Library Hours: ${ctx.library_hours ?? '9 AM – 6 PM'}
- Active Notices: ${noticesStr}

Scope: Library data — book inventory, pending/overdue returns, member queries, library hours, new acquisitions.
${rules}`;
  }

  // ── PARENT ───────────────────────────────────────────────────────────────
  if (roleUpper === 'parent') {
    return `You are IRIS, the AI campus assistant for ${ctx.institution}.
User: ${ctx.name} | Role: Parent | Date: ${date}

Child Context:
- Child's Name: ${ctx.child_name ?? 'N/A'}
- Child's Attendance: ${ctx.child_attendance ?? 'N/A'}%
- Child's Pending Fees: ₹${ctx.child_fees ?? 'N/A'}
- Transport / Bus Status: ${ctx.transport_status ?? 'N/A'}
- Active Campus Notices: ${noticesStr}

Scope: Child-centric data — attendance, fee dues, transport tracking, exam schedule, hostel status.
${rules}`;
  }

  // ── DRIVER ───────────────────────────────────────────────────────────────
  if (roleUpper === 'driver') {
    return `You are IRIS, the AI campus assistant for ${ctx.institution}.
User: ${ctx.name} | Role: Bus Driver | Date: ${date}

Transit-Level Context:
- Today's Route: ${ctx.today_route ?? 'N/A'}
- Bus Schedule: ${ctx.bus_schedule ?? 'N/A'}
- Passenger Count (today): ${ctx.passenger_count ?? 0}
- Active Notices: ${noticesStr}

Scope: Transit data — assigned route, today's schedule, passenger manifest, route changes, fuel/maintenance notices.
${rules}`;
  }

  // ── VENDOR / CANTEEN ─────────────────────────────────────────────────────
  if (roleUpper === 'vendor' || roleUpper === 'canteenvendor') {
    const menuStr = ctx.menu_items?.length ? ctx.menu_items.join(', ') : 'No items listed';
    return `You are IRIS, the AI campus assistant for ${ctx.institution}.
User: ${ctx.name} | Role: Canteen Vendor | Date: ${date}

Canteen-Level Context:
- Orders Today: ${ctx.orders_today ?? 0}
- Today's Menu: ${menuStr}
- Current Queue Status: ${ctx.queue_status ?? 'Normal'}
- Active Campus Notices: ${noticesStr}

Scope: Canteen data — today's orders, menu items, queue status, wallet top-ups, inventory alerts.
${rules}`;
  }

  // ── STAFF (default / general) ────────────────────────────────────────────
  if (roleUpper === 'staff') {
    const announcementsStr = ctx.announcements?.length ? ctx.announcements.join(', ') : 'No announcements';
    const tasksStr = ctx.my_tasks?.length ? ctx.my_tasks.join(', ') : 'No tasks assigned';
    return `You are IRIS, the AI campus assistant for ${ctx.institution}.
User: ${ctx.name} | Role: Staff | Date: ${date}

Staff Context:
- Announcements: ${announcementsStr}
- My Tasks: ${tasksStr}
- Office Hours: ${ctx.office_hours ?? '9 AM – 5 PM'}
- Active Campus Notices: ${noticesStr}

Scope: General staff data — announcements, task assignments, office hours, department notices.
${rules}`;
  }

  // ── FALLBACK (unknown role) ───────────────────────────────────────────────
  const timetableStr = ctx.timetable?.length ? ctx.timetable.join(', ') : 'No classes scheduled today';
  return `You are IRIS, the AI campus OS assistant for ${ctx.institution}.
User: ${ctx.name} | Role: ${ctx.role} | Date: ${date}

Context:
- Attendance: ${ctx.attendance}%
- Pending Fees: ₹${ctx.pending_fees}
- Today's Schedule: ${timetableStr}
- Active Notices: ${noticesStr}
${rules}`;
}

/**
 * Connects to OpenAI Embeddings API to generate 1536-dim vectors
 */
export async function getEmbeddings(text: string): Promise<number[]> {
  const openAIKey = process.env.OPENAI_API_KEY;

  if (openAIKey && !isPlaceholderKey(openAIKey)) {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-ada-002'
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json() as any;
        return data.data[0].embedding;
      } else {
        const errText = await response.text();
        logger.error(`OpenAI Embeddings API error status ${response.status}: ${errText}`);
      }
    } catch (err) {
      logger.error('Failed to communicate with OpenAI Embeddings API:', err);
    }
  }

  // Sandbox fallback: Generate consistent mock embeddings based on text hashes
  return generateDeterministicMockEmbedding(text);
}

/**
 * Generates a stable deterministic 1536-dimensional mock vector for testing
 */
function generateDeterministicMockEmbedding(text: string): number[] {
  const vector: number[] = [];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  for (let j = 0; j < 1536; j++) {
    // Generate floats between -1 and 1
    const val = Math.sin(hash + j) * Math.cos(hash - j);
    vector.push(val);
  }

  // Normalize vector to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / magnitude);
}

/**
 * Role-aware Mock Responses generator (used when no LLM key is configured)
 */
function getMockClaudeResponse(message: string, ctx: MessageContext): string {
  const lower = message.toLowerCase();
  const isHindi = ctx.language === 'hi';
  const role = ctx.role?.toLowerCase();

  // ── SUPERADMIN ─────────────────────────────────────────────────────────
  if (role === 'superadmin') {
    if (lower.includes('student') || lower.includes('enroll')) {
      return isHindi
        ? `नमस्ते ${ctx.name}! सभी कैंपस मिलाकर कुल ${ctx.total_students ?? 'N/A'} छात्र enrolled हैं।`
        : `Hello ${ctx.name}! Institution-wide total enrolled students: **${ctx.total_students ?? 'N/A'}** across ${ctx.total_campuses ?? 'N/A'} campuses.`;
    }
    if (lower.includes('revenue') || lower.includes('fee') || lower.includes('income')) {
      return isHindi
        ? `इस वित्त वर्ष की कुल revenue ₹${ctx.total_revenue?.toLocaleString('en-IN') ?? 'N/A'} है।`
        : `Total institution revenue for this financial year: **₹${ctx.total_revenue?.toLocaleString('en-IN') ?? 'N/A'}**.`;
    }
    if (lower.includes('campus') || lower.includes('branch')) {
      return isHindi
        ? `संस्था में कुल ${ctx.total_campuses ?? 'N/A'} कैंपस/ब्रांच सक्रिय हैं।`
        : `There are **${ctx.total_campuses ?? 'N/A'}** active campuses/branches in the institution.`;
    }
    return isHindi
      ? `नमस्ते ${ctx.name}! मैं IRIS हूँ। आप institution-wide stats, revenue, campus count, और system health के बारे में पूछ सकते हैं।`
      : `Hello ${ctx.name}! I'm IRIS. As SuperAdmin you can ask me about institution-wide stats, total revenue, campus counts, and system health.`;
  }

  // ── ADMIN ──────────────────────────────────────────────────────────────
  if (role === 'admin') {
    if (lower.includes('student')) {
      return isHindi
        ? `इस कैंपस में कुल ${ctx.campus_students ?? 'N/A'} छात्र हैं।`
        : `This campus has **${ctx.campus_students ?? 'N/A'}** enrolled students.`;
    }
    if (lower.includes('attendance')) {
      return isHindi
        ? `कैंपस का overall attendance rate ${ctx.campus_attendance_rate ?? 'N/A'}% है।`
        : `Campus-wide attendance rate: **${ctx.campus_attendance_rate ?? 'N/A'}%**.`;
    }
    if (lower.includes('fee') || lower.includes('collection')) {
      return isHindi
        ? `इस महीने fee collection ₹${ctx.campus_fee_collection?.toLocaleString('en-IN') ?? 'N/A'} है।`
        : `Fee collection this month: **₹${ctx.campus_fee_collection?.toLocaleString('en-IN') ?? 'N/A'}**.`;
    }
    if (lower.includes('staff')) {
      return isHindi
        ? `कैंपस में कुल ${ctx.campus_staff ?? 'N/A'} staff members हैं।`
        : `Total staff on this campus: **${ctx.campus_staff ?? 'N/A'}**.`;
    }
    return isHindi
      ? `नमस्ते ${ctx.name}! मैं IRIS हूँ। आप campus students, staff, attendance rate, और fee collection के बारे में पूछ सकते हैं।`
      : `Hello ${ctx.name}! I'm IRIS. As Admin you can ask me about campus students, staff count, attendance rates, and fee collection.`;
  }

  // ── STUDENT ────────────────────────────────────────────────────────────
  if (role === 'student') {
    if (lower.includes('attendance') || lower.includes('present')) {
      return isHindi
        ? `नमस्ते ${ctx.name}! आपकी अटेंडेंस ${ctx.attendance}% है। इसे 75% से ऊपर रखें!`
        : `Hi ${ctx.name}! Your attendance is **${ctx.attendance}%**. Keep it above 75% to stay compliant!`;
    }
    if (lower.includes('fee') || lower.includes('due') || lower.includes('pay')) {
      return ctx.pending_fees > 0
        ? (isHindi
            ? `आपकी outstanding fees ₹${ctx.pending_fees.toLocaleString('en-IN')} है। /fees पर जाकर payment करें।`
            : `Hello ${ctx.name}! Pending fee balance: **₹${ctx.pending_fees.toLocaleString('en-IN')}**. Pay at: /fees`)
        : (isHindi
            ? `आपकी कोई pending fees नहीं है। लेज़र पूरी तरह clear है!`
            : `Hi ${ctx.name}! You have no pending fees. Your account is fully settled. ✅`);
    }
    if (lower.includes('timetable') || lower.includes('schedule') || lower.includes('class')) {
      const classes = ctx.timetable?.length ? ctx.timetable.join(', ') : 'No classes today';
      return isHindi
        ? `आज का टाइमटेबल: ${classes}। समय पर पहुंचें!`
        : `Today's classes: **${classes}**. Let me know if you need room details!`;
    }
    if (lower.includes('canteen') || lower.includes('menu') || lower.includes('food')) {
      return isHindi
        ? `आज कैंटीन में आलू समोसा, डोसा और मसाला चाय उपलब्ध हैं। ऑर्डर करें: /student/canteen`
        : `Today's canteen specials: Aloo Samosa, Masala Dosa, Cold Coffee. View full menu: /student/canteen`;
    }
    return isHindi
      ? `नमस्ते ${ctx.name}! मैं IRIS हूँ। आप attendance, fees, timetable, और library के बारे में पूछ सकते हैं।`
      : `Hi ${ctx.name}! I'm IRIS. Ask me about your attendance, fees, timetable, courses, or hostel.`;
  }

  // ── HOD ────────────────────────────────────────────────────────────────
  if (role === 'hod') {
    if (lower.includes('student')) {
      return isHindi
        ? `आपके department में ${ctx.dept_students ?? 'N/A'} छात्र enrolled हैं।`
        : `Your department has **${ctx.dept_students ?? 'N/A'}** enrolled students.`;
    }
    if (lower.includes('attendance')) {
      return isHindi
        ? `Department का attendance rate ${ctx.dept_attendance ?? 'N/A'}% है।`
        : `Department-wide attendance: **${ctx.dept_attendance ?? 'N/A'}%**.`;
    }
    if (lower.includes('faculty') || lower.includes('teacher') || lower.includes('staff')) {
      return isHindi
        ? `Department में ${ctx.dept_faculty ?? 'N/A'} faculty members हैं।`
        : `Department faculty count: **${ctx.dept_faculty ?? 'N/A'}**.`;
    }
    return isHindi
      ? `नमस्ते ${ctx.name}! मैं IRIS हूँ। आप department students, attendance, और faculty के बारे में पूछ सकते हैं।`
      : `Hello ${ctx.name}! Ask me about department students, attendance rates, or faculty details.`;
  }

  // ── TEACHER ────────────────────────────────────────────────────────────
  if (role === 'teacher') {
    if (lower.includes('class') || lower.includes('schedule') || lower.includes('timetable')) {
      const classes = ctx.my_classes?.length ? ctx.my_classes.join(', ') : 'No classes today';
      return isHindi
        ? `आज की classes: ${classes}।`
        : `Your classes today: **${classes}**.`;
    }
    if (lower.includes('student') || lower.includes('attendance')) {
      return isHindi
        ? `आपकी classes में कुल ${ctx.my_students_count ?? 'N/A'} students हैं।`
        : `You have **${ctx.my_students_count ?? 'N/A'}** students across your classes.`;
    }
    return isHindi
      ? `नमस्ते ${ctx.name}! मैं IRIS हूँ। आप अपनी classes, students, attendance, और schedule के बारे में पूछ सकते हैं।`
      : `Hello ${ctx.name}! Ask me about your classes, student attendance, or today's schedule.`;
  }

  // ── WARDEN ─────────────────────────────────────────────────────────────
  if (role === 'warden' || role === 'hostelwarden') {
    if (lower.includes('occupancy') || lower.includes('room')) {
      return isHindi
        ? `वर्तमान room occupancy: ${ctx.room_occupancy ?? 'N/A'}।`
        : `Current hostel room occupancy: **${ctx.room_occupancy ?? 'N/A'}**.`;
    }
    if (lower.includes('complaint')) {
      return isHindi
        ? `अभी ${ctx.pending_complaints ?? 0} complaints pending हैं। /hostel/complaints पर देखें।`
        : `There are **${ctx.pending_complaints ?? 0}** pending hostel complaints. View at: /hostel/complaints`;
    }
    if (lower.includes('mess')) {
      const mess = ctx.mess_notices?.length ? ctx.mess_notices.join(', ') : 'No mess notices today';
      return isHindi
        ? `Mess notices: ${mess}।`
        : `Mess notices: ${mess}.`;
    }
    return isHindi
      ? `नमस्ते ${ctx.name}! मैं IRIS हूँ। आप room occupancy, mess notices, और pending complaints के बारे में पूछ सकते हैं।`
      : `Hello ${ctx.name}! Ask me about room occupancy, mess notices, or pending hostel complaints.`;
  }

  // ── SECURITY ───────────────────────────────────────────────────────────
  if (role === 'security' || role === 'gatesecurity') {
    if (lower.includes('visitor') || lower.includes('log')) {
      return isHindi
        ? `आज ${ctx.visitor_logs_today ?? 0} visitors gate से गए हैं।`
        : `Today's visitor logs: **${ctx.visitor_logs_today ?? 0}** visitors recorded.`;
    }
    if (lower.includes('rfid') || lower.includes('scan')) {
      return isHindi
        ? `आज ${ctx.rfid_scans_today ?? 0} RFID scans हुए हैं।`
        : `RFID scans today: **${ctx.rfid_scans_today ?? 0}** entry/exit events logged.`;
    }
    return isHindi
      ? `नमस्ते ${ctx.name}! मैं IRIS हूँ। आप visitor logs, RFID scans, और gate alerts के बारे में पूछ सकते हैं।`
      : `Hello ${ctx.name}! Ask me about today's visitor logs, RFID scans, or gate security alerts.`;
  }

  // ── LIBRARIAN ──────────────────────────────────────────────────────────
  if (role === 'librarian') {
    if (lower.includes('inventory') || lower.includes('book')) {
      return isHindi
        ? `Library में कुल ${ctx.book_inventory ?? 'N/A'} books हैं।`
        : `Library book inventory: **${ctx.book_inventory ?? 'N/A'}** total titles.`;
    }
    if (lower.includes('return') || lower.includes('overdue') || lower.includes('pending')) {
      return isHindi
        ? `${ctx.pending_returns ?? 0} books अभी overdue हैं।`
        : `Overdue / pending returns: **${ctx.pending_returns ?? 0}** books.`;
    }
    if (lower.includes('hour') || lower.includes('time')) {
      return isHindi
        ? `Library hours: ${ctx.library_hours ?? '9 AM – 6 PM'}।`
        : `Library hours today: **${ctx.library_hours ?? '9 AM – 6 PM'}**.`;
    }
    return isHindi
      ? `नमस्ते ${ctx.name}! मैं IRIS हूँ। आप book inventory, pending returns, और library hours के बारे में पूछ सकते हैं।`
      : `Hello ${ctx.name}! Ask me about book inventory, overdue returns, or library hours.`;
  }

  // ── PARENT ─────────────────────────────────────────────────────────────
  if (role === 'parent') {
    if (lower.includes('attendance')) {
      return isHindi
        ? `${ctx.child_name ?? 'आपके बच्चे'} की attendance ${ctx.child_attendance ?? 'N/A'}% है।`
        : `${ctx.child_name ?? 'Your child'}'s attendance: **${ctx.child_attendance ?? 'N/A'}%**.`;
    }
    if (lower.includes('fee') || lower.includes('due')) {
      return isHindi
        ? `${ctx.child_name ?? 'आपके बच्चे'} की pending fees ₹${ctx.child_fees ?? 'N/A'} है।`
        : `${ctx.child_name ?? 'Your child'}'s pending fees: **₹${ctx.child_fees ?? 'N/A'}**.`;
    }
    if (lower.includes('bus') || lower.includes('transport') || lower.includes('route')) {
      return isHindi
        ? `Transport status: ${ctx.transport_status ?? 'N/A'}।`
        : `Transport / bus status: **${ctx.transport_status ?? 'N/A'}**.`;
    }
    return isHindi
      ? `नमस्ते ${ctx.name}! मैं IRIS हूँ। आप अपने बच्चे की attendance, fees, और transport status के बारे में पूछ सकते हैं।`
      : `Hello ${ctx.name}! Ask me about your child's attendance, fee dues, or transport status.`;
  }

  // ── DRIVER ─────────────────────────────────────────────────────────────
  if (role === 'driver') {
    if (lower.includes('route')) {
      return isHindi
        ? `आज की route: ${ctx.today_route ?? 'N/A'}।`
        : `Today's assigned route: **${ctx.today_route ?? 'N/A'}**.`;
    }
    if (lower.includes('schedule') || lower.includes('time')) {
      return isHindi
        ? `Bus schedule: ${ctx.bus_schedule ?? 'N/A'}।`
        : `Bus schedule: **${ctx.bus_schedule ?? 'N/A'}**.`;
    }
    if (lower.includes('passenger') || lower.includes('student') || lower.includes('count')) {
      return isHindi
        ? `आज ${ctx.passenger_count ?? 0} passengers board किए।`
        : `Today's passenger count: **${ctx.passenger_count ?? 0}**.`;
    }
    return isHindi
      ? `नमस्ते ${ctx.name}! मैं IRIS हूँ। आप route, bus schedule, और passenger count के बारे में पूछ सकते हैं।`
      : `Hello ${ctx.name}! Ask me about your route, bus schedule, or today's passenger count.`;
  }

  // ── VENDOR / CANTEEN ───────────────────────────────────────────────────
  if (role === 'vendor' || role === 'canteenvendor') {
    if (lower.includes('order')) {
      return isHindi
        ? `आज कुल ${ctx.orders_today ?? 0} orders आए हैं।`
        : `Orders received today: **${ctx.orders_today ?? 0}**.`;
    }
    if (lower.includes('menu')) {
      const menu = ctx.menu_items?.length ? ctx.menu_items.join(', ') : 'No items listed';
      return isHindi
        ? `आज का menu: ${menu}।`
        : `Today's menu: **${menu}**.`;
    }
    if (lower.includes('queue') || lower.includes('status')) {
      return isHindi
        ? `Queue status: ${ctx.queue_status ?? 'Normal'}।`
        : `Current queue status: **${ctx.queue_status ?? 'Normal'}**.`;
    }
    return isHindi
      ? `नमस्ते ${ctx.name}! मैं IRIS हूँ। आप orders, menu, और queue status के बारे में पूछ सकते हैं।`
      : `Hello ${ctx.name}! Ask me about today's orders, menu items, or queue status.`;
  }

  // ── STAFF ──────────────────────────────────────────────────────────────
  if (role === 'staff') {
    if (lower.includes('announcement') || lower.includes('notice')) {
      const ann = ctx.announcements?.length ? ctx.announcements.join(', ') : 'No announcements';
      return isHindi
        ? `Announcements: ${ann}।`
        : `Current announcements: **${ann}**.`;
    }
    if (lower.includes('task')) {
      const tasks = ctx.my_tasks?.length ? ctx.my_tasks.join(', ') : 'No tasks assigned';
      return isHindi
        ? `आपके tasks: ${tasks}।`
        : `Your assigned tasks: **${tasks}**.`;
    }
    if (lower.includes('hour') || lower.includes('office')) {
      return isHindi
        ? `Office hours: ${ctx.office_hours ?? '9 AM – 5 PM'}।`
        : `Office hours: **${ctx.office_hours ?? '9 AM – 5 PM'}**.`;
    }
    return isHindi
      ? `नमस्ते ${ctx.name}! मैं IRIS हूँ। आप announcements, tasks, और office hours के बारे में पूछ सकते हैं।`
      : `Hello ${ctx.name}! Ask me about announcements, your tasks, or office hours.`;
  }

  // ── FALLBACK ───────────────────────────────────────────────────────────
  if (isHindi) {
    return `नमस्ते! मैं IRIS हूँ, आपका AI कैंपस असिस्टेंट। मैं आपकी campus-related queries में मदद कर सकता हूँ। आप क्या जानना चाहते हैं?`;
  }
  return `Hi! I'm IRIS, your AI campus concierge. I can assist you with campus-related queries. How can I help you today?`;
}
