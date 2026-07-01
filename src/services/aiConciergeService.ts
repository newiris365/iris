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
    let keyOpenAI = keys.openai_api_key;
    let keyGemini = keys.gemini_api_key;
    const keyClaude = keys.claude_api_key;

    // Self-healing: if OpenAI key starts with AIzaSy (Google key format) and Gemini is not set, re-route
    if (keyOpenAI && keyOpenAI.startsWith('AIzaSy') && !keyGemini) {
      keyGemini = keyOpenAI;
      keyOpenAI = undefined;
    }

    if (keyOpenAI && !isPlaceholderKey(keyOpenAI)) {
      const res = await askOpenAI(userMessage, userContext, history, keyOpenAI);
      if (res) return res;
    }
    if (keyGemini && !isPlaceholderKey(keyGemini)) {
      const res = await askGemini(userMessage, userContext, history, keyGemini);
      if (res) return res;
    }
    if (keyClaude && !isPlaceholderKey(keyClaude)) {
      const res = await askClaudeWithKey(userMessage, userContext, history, keyClaude);
      if (res) return res;
    }
  }

  // 2. Fallback to process.env keys (OpenAI first)
  let envOpenAI = process.env.OPENAI_API_KEY;
  let envGemini = process.env.GEMINI_API_KEY;
  const envClaude = process.env.ANTHROPIC_API_KEY;

  // Self-healing: if env OpenAI key starts with AIzaSy (Google key format) and Gemini is not set, re-route
  if (envOpenAI && envOpenAI.startsWith('AIzaSy') && !envGemini) {
    logger.warn('Detected Google Gemini API key inside OPENAI_API_KEY environment variable. Re-routing to Gemini API.');
    envGemini = envOpenAI;
    envOpenAI = undefined;
  }

  if (envOpenAI && !isPlaceholderKey(envOpenAI)) {
    const res = await askOpenAI(userMessage, userContext, history, envOpenAI);
    if (res) return res;
  }

  if (envGemini && !isPlaceholderKey(envGemini)) {
    const res = await askGemini(userMessage, userContext, history, envGemini);
    if (res) return res;
  }

  if (envClaude && !isPlaceholderKey(envClaude)) {
    const res = await askClaudeWithKey(userMessage, userContext, history, envClaude);
    if (res) return res;
  }

  logger.warn('No active API key configured or API calls failed. Returning empty response.');
  return 'Sorry, I am having trouble connecting to my brain right now. Please verify that the AI API keys are properly configured.';
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

  const roleUpper = ctx.role?.trim().toLowerCase();

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
  return `You are IRIS, the AI campus OS assistant for ${ctx.institution}.
User: ${ctx.name} | Role: ${ctx.role || 'Guest'} | Date: ${date}

Context:
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

  return [];
}
