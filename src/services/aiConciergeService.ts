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
  canteen_wallet?: number;
  // SuperAdmin
  total_students?: number;
  total_revenue?: number;
  total_campuses?: number;
  // Admin
  campus_students?: number;
  campus_staff?: number;
  campus_attendance_rate?: number;
  campus_fee_collection?: number;
  pending_leaves?: number;
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
      signal: AbortSignal.timeout(30000)
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
      signal: AbortSignal.timeout(30000)
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
        messages: sanitizeClaudeMessages(history, userMessage)
      }),
      signal: AbortSignal.timeout(30000)
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

  logger.warn('No active API key configured or API calls failed. Falling back to smart mock response.');
  return generateSmartMockResponse(userMessage, userContext);
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
- Pending Leaves: ${ctx.pending_leaves ?? 'N/A'}
- Active Notices: ${noticesStr}

Scope: You manage a single campus. Respond with campus-level student stats, staff summaries, fee collection figures, and attendance reports.
${rules}`;
  }

  // ── PRINCIPAL ────────────────────────────────────────────────────────────
  if (roleUpper === 'principal') {
    return `You are IRIS, the AI campus assistant for ${ctx.institution}.
User: ${ctx.name} | Role: Principal | Date: ${date}

Campus-Level Context:
- Total Students: ${ctx.campus_students ?? 'N/A'}
- Total Staff: ${ctx.campus_staff ?? 'N/A'}
- Overall Attendance Rate: ${ctx.campus_attendance_rate ?? 'N/A'}%
- Fee Collection: ₹${ctx.campus_fee_collection?.toLocaleString('en-IN') ?? 'N/A'}
- Pending Leaves: ${ctx.pending_leaves ?? 'N/A'}
- Active Notices: ${noticesStr}

Scope: You oversee the entire campus. Respond with campus-wide insights, student/staff stats, academic performance, and administrative summaries.
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

/**
 * Sanitizes and formats history messages for Anthropic Claude.
 * Merges consecutive messages with the same role and ensures the list starts with a user message.
 */
function sanitizeClaudeMessages(history: ChatMessage[], userMessage: string): { role: string; content: string }[] {
  const rawMessages: { role: string; content: string }[] = [];
  
  history.forEach(msg => {
    const role = msg.role === 'assistant' ? 'assistant' : 'user';
    if (msg.content && msg.content.trim()) {
      rawMessages.push({ role, content: msg.content.trim() });
    }
  });

  rawMessages.push({ role: 'user', content: userMessage.trim() });

  const mergedMessages: { role: string; content: string }[] = [];
  for (const current of rawMessages) {
    if (mergedMessages.length > 0 && mergedMessages[mergedMessages.length - 1].role === current.role) {
      mergedMessages[mergedMessages.length - 1].content += "\n" + current.content;
    } else {
      mergedMessages.push(current);
    }
  }

  while (mergedMessages.length > 0 && mergedMessages[0].role !== 'user') {
    mergedMessages.shift();
  }

  return mergedMessages;
}

/**
 * Dynamically generates a mock response using details from the user context depending on role.
 */
export function generateSmartMockResponse(message: string, context: MessageContext): string {
  const msg = message.toLowerCase();
  const role = (context.role || 'Student').toLowerCase();

  if (msg.includes('attendance') || msg.includes('present') || msg.includes('absent')) {
    if (role === 'superadmin') {
      return context.campus_attendance_rate
        ? `The overall system-wide average attendance rate is **${context.campus_attendance_rate}%** across all campuses.`
        : `I don't have campus-wide attendance data available right now. Please check the attendance dashboard for real-time numbers.`;
    }
    if (role === 'admin' || role === 'principal') {
      return context.campus_attendance_rate
        ? `The campus-wide average attendance rate is **${context.campus_attendance_rate}%** today.`
        : `I don't have attendance data for your campus yet. Please check the attendance dashboard.`;
    }
    if (role === 'hod') {
      return context.dept_attendance
        ? `Your department's average attendance rate is **${context.dept_attendance}%** today.`
        : `I don't have department attendance data yet. Please check the department dashboard.`;
    }
    if (role === 'teacher') {
      return `I don't have class-level attendance data available. Please check your class roster in the Teacher portal.`;
    }
    if (role === 'parent') {
      if (context.child_attendance !== undefined && context.child_attendance !== null) {
        const status = context.child_attendance >= 75 ? '✅ Above the 75% threshold.' : '⚠️ Below the 75% threshold — action needed.';
        return `Your child **${context.child_name || 'your child'}** has an attendance rate of **${context.child_attendance}%**.\n${status}\nYou can view detailed daily records in the Attendance section.`;
      }
      return `I don't have attendance data for your child yet. Please ensure your child is linked to your account, or check the parent portal for updates.`;
    }
    return context.attendance
      ? `Your current overall attendance is **${context.attendance}%**. You need to maintain at least 75% to be eligible for final examinations.`
      : `I don't have your attendance data yet. Please check the student portal for your attendance record.`;
  }

  if (msg.includes('fee') || msg.includes('revenue') || msg.includes('income') || msg.includes('payment') || msg.includes('dues')) {
    if (role === 'superadmin') {
      return context.total_revenue
        ? `Total platform revenue collected this financial year is **₹${context.total_revenue.toLocaleString('en-IN')}** across all campuses.`
        : `I don't have revenue data available. Please check the financial dashboard.`;
    }
    if (role === 'admin' || role === 'principal') {
      return context.campus_fee_collection
        ? `Total fee collection for this campus is **₹${context.campus_fee_collection.toLocaleString('en-IN')}**.`
        : `I don't have fee collection data for your campus yet. Please check the finance dashboard.`;
    }
    if (role === 'hod') {
      return `Fee collection tracking is managed at the campus level. Please contact the accounts section for department-wise recovery.`;
    }
    if (role === 'parent') {
      if (context.child_fees !== undefined && context.child_fees !== null) {
        if (context.child_fees > 0) {
          return `Your child **${context.child_name || 'your child'}** has an outstanding fee balance of **₹${context.child_fees.toLocaleString('en-IN')}**. Please clear it via the Fee Status section.`;
        }
        return `Great news! Your child **${context.child_name || 'your child'}** has no outstanding fees. All dues are cleared.`;
      }
      return `I don't have fee information for your child yet. Please check the parent portal Fee Status section.`;
    }
    if (context.pending_fees !== undefined && context.pending_fees !== null) {
      if (context.pending_fees > 0) {
        return `Your outstanding fee balance is **₹${context.pending_fees.toLocaleString('en-IN')}**. Please clear it under the Fee Ledger section.`;
      }
      return `Your hostel and academic fees are fully cleared. No outstanding dues found.`;
    }
    return `I don't have your fee data available. Please check the student portal for fee details.`;
  }

  if (msg.includes('timetable') || msg.includes('schedule') || msg.includes('class') || msg.includes('time table')) {
    if (role === 'teacher') {
      return context.my_classes?.length
        ? `Your schedule today: **${context.my_classes.join(', ')}**.`
        : `I don't have your timetable data yet. Please check the teacher portal.`;
    }
    if (role === 'student') {
      return context.timetable?.length
        ? `Your timetable for today:\n${context.timetable.map((t: string) => `- ${t}`).join('\n')}`
        : `I don't have your timetable data yet. Please check the student portal.`;
    }
    if (role === 'parent') {
      return `You can view your child's class timetable in the **Timetable** section of the parent portal. It shows daily schedules with subjects, rooms, and instructors.`;
    }
    if (role === 'superadmin' || role === 'admin' || role === 'principal' || role === 'hod') {
      return `Please view the academic timetable dashboard to see schedules.`;
    }
    return `I don't have timetable data available. Please check the relevant portal.`;
  }

  if (msg.includes('campus') || msg.includes('branch') || msg.includes('institutions')) {
    if (role === 'superadmin') {
      return context.total_campuses
        ? `There are currently **${context.total_campuses}** active campuses under management.`
        : `I don't have campus count data available. Please check the super admin dashboard.`;
    }
  }

  if (msg.includes('hostel') || msg.includes('room') || msg.includes('accommodation')) {
    if (role === 'warden' || role === 'hostelwarden') {
      return context.room_occupancy
        ? `Current room occupancy: **${context.room_occupancy}**.`
        : `I don't have hostel occupancy data yet. Please check the warden dashboard.`;
    }
    if (role === 'student') {
      return context.hostel_room
        ? `Your assigned hostel room is **${context.hostel_room}**.`
        : `I don't have hostel allocation data for you. Please check the student portal.`;
    }
  }

  if (msg.includes('notice') || msg.includes('announcement') || msg.includes('update')) {
    const notices = context.notices?.length
      ? context.notices.map((n) => `- ${n.title}`).join('\n')
      : null;
    return notices
      ? `Here are the latest notices:\n${notices}`
      : `I don't have any active notices at the moment.`;
  }

  if (msg.includes('wallet') || msg.includes('canteen') || msg.includes('food') || msg.includes('mess')) {
    if (role === 'student') {
      return context.canteen_wallet !== undefined
        ? `Your canteen wallet balance is **₹${context.canteen_wallet}**.`
        : `I don't have your canteen wallet data. Please check the student portal.`;
    }
    if (role === 'warden' || role === 'hostelwarden') {
      return `Please check the mess dashboard for today's menu and meal timings.`;
    }
  }

  if (msg.includes('bus') || msg.includes('transport') || msg.includes('transit') || msg.includes('location')) {
    if (role === 'student') {
      return `Please check the transport dashboard for bus routes and schedules.`;
    }
    if (role === 'driver') {
      return context.today_route
        ? `Your route today: **${context.today_route}**.`
        : `I don't have route data for you. Please check with the transport admin.`;
    }
    if (role === 'parent') {
      if (context.transport_status) {
        return `**Bus Status:** ${context.transport_status}\n\nYou can track your child's bus in real-time from the **Transit GPS** section.`;
      }
      return `You can track your child's school bus in real-time from the **Transit GPS** section in the parent portal.`;
    }
    return `Please check the transport dashboard for bus routes and schedules.`;
  }

  if (msg.includes('ptm') || msg.includes('parent teacher') || msg.includes('meeting')) {
    if (role === 'parent') {
      return `You can view and book Parent-Teacher Meeting slots from the **PTM Schedule** section in the parent portal.`;
    }
    return `PTM scheduling is available in the parent portal under PTM Schedule.`;
  }

  if (msg.includes('exam') || msg.includes('result') || msg.includes('marks')) {
    if (role === 'parent') {
      return `You can check your child's exam results and academic performance in the **Exam Results** section of the parent portal.`;
    }
    if (role === 'student') {
      return `You can view your exam results in the Student Results section.`;
    }
    return `Please check the exam section for results and schedules.`;
  }

  if (msg.includes('leave') || msg.includes('absence') || msg.includes('sick')) {
    if (role === 'parent') {
      return `You can apply for leave on behalf of your child from the **Leave Application** section. Select dates, choose a reason, and submit — the school will review it.`;
    }
    return `Please check the leave application section in your portal.`;
  }

  if (msg.includes('wallet') || msg.includes('canteen') || msg.includes('food') || msg.includes('mess')) {
    if (role === 'student') {
      return context.canteen_wallet !== undefined
        ? `Your canteen wallet balance is **₹${context.canteen_wallet}**.`
        : `I don't have your canteen wallet data. Please check the student portal.`;
    }
    if (role === 'warden' || role === 'hostelwarden') {
      return `Please check the mess dashboard for today's menu and meal timings.`;
    }
  }

  if (msg.includes('library') || msg.includes('book')) {
    if (role === 'librarian') {
      return context.book_inventory
        ? `Total books in inventory: **${context.book_inventory}**. Pending returns: **${context.pending_returns || 0}**.`
        : `I don't have library data yet. Please check the librarian dashboard.`;
    }
    return `Please check the library portal for book availability and issues.`;
  }

  if (msg.includes('visitor') || msg.includes('gate') || msg.includes('security')) {
    if (role === 'security' || role === 'gatesecurity') {
      return `Visitor logs today: **${context.visitor_logs_today || 'N/A'}**. RFID scans: **${context.rfid_scans_today || 'N/A'}**.`;
    }
  }

  const notices = context.notices?.length
    ? context.notices.map((n) => `- ${n.title}`).join('\n')
    : null;

  return `Hello ${context.name || 'User'}! I am IRIS, your AI concierge.
I am running in local fallback mode (no API key configured). Here is what I know about your role (**${context.role || 'Guest'}**):
${role === 'superadmin' ? `- Total Campuses: ${context.total_campuses || 'N/A'}\n- System Revenue: ₹${context.total_revenue?.toLocaleString('en-IN') || 'N/A'}` : ''}
${role === 'admin' || role === 'principal' ? `- Campus Students: ${context.campus_students || 'N/A'}\n- Attendance Rate: ${context.campus_attendance_rate || 'N/A'}%` : ''}
${role === 'hod' ? `- Department Students: ${context.dept_students || 'N/A'}\n- Department Attendance: ${context.dept_attendance || 'N/A'}%` : ''}
${role === 'student' ? `- Outstanding Fees: ₹${context.pending_fees || 'N/A'}\n- Attendance: ${context.attendance || 'N/A'}%` : ''}
${role === 'parent' ? `- Child: ${context.child_name || 'N/A'}\n- Child Attendance: ${context.child_attendance || 'N/A'}%` : ''}
${notices ? `\n**Active Notices:**\n${notices}` : ''}
How else can I assist you?`;
}
