import logger from '../config/logger';

export interface MessageContext {
  institution: string;
  name: string;
  role: string;
  language: string;
  attendance: number;
  pending_fees: number;
  timetable: string[];
  notices: { title: string }[];
  hostel_room?: string;
  subscription_status?: any;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
      })
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
      })
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
      })
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
  // 1. Check custom institution keys
  if (keys) {
    if (keys.gemini_api_key && !keys.gemini_api_key.startsWith('your-')) {
      const res = await askGemini(userMessage, userContext, history, keys.gemini_api_key);
      if (res) return res;
    }
    if (keys.openai_api_key && !keys.openai_api_key.startsWith('your-')) {
      const res = await askOpenAI(userMessage, userContext, history, keys.openai_api_key);
      if (res) return res;
    }
    if (keys.claude_api_key && !keys.claude_api_key.startsWith('your-')) {
      const res = await askClaudeWithKey(userMessage, userContext, history, keys.claude_api_key);
      if (res) return res;
    }
  }

  // 2. Fallback to process.env keys
  const envGemini = process.env.GEMINI_API_KEY;
  if (envGemini && !envGemini.startsWith('your-')) {
    const res = await askGemini(userMessage, userContext, history, envGemini);
    if (res) return res;
  }

  const envOpenAI = process.env.OPENAI_API_KEY;
  if (envOpenAI && !envOpenAI.startsWith('your-')) {
    const res = await askOpenAI(userMessage, userContext, history, envOpenAI);
    if (res) return res;
  }

  const envClaude = process.env.ANTHROPIC_API_KEY;
  if (envClaude && !envClaude.startsWith('your-')) {
    const res = await askClaudeWithKey(userMessage, userContext, history, envClaude);
    if (res) return res;
  }

  // 3. Fallback to mock responses if no key is configured
  return getMockClaudeResponse(userMessage, userContext);
}


/**
 * Builds the system prompt for Claude based on user context
 */
export function buildSystemPrompt(ctx: MessageContext): string {
  const timetableStr = ctx.timetable && ctx.timetable.length > 0 
    ? ctx.timetable.join(', ') 
    : 'No classes scheduled today';
  const noticesStr = ctx.notices && ctx.notices.length > 0 
    ? ctx.notices.map(n => n.title).join(', ') 
    : 'No active notices';

  return `You are IRIS, the AI campus assistant for ${ctx.institution}.
User Name: ${ctx.name}
Role: ${ctx.role}
Date: ${new Date().toLocaleDateString('en-IN')}

Institutional Context Data:
- Attendance Rate: ${ctx.attendance}%
- Outstanding/Pending fees: ₹${ctx.pending_fees}
- Today's Classes Timetable: ${timetableStr}
- Active Campus Notices: ${noticesStr}
${ctx.hostel_room ? `- Hostel Room: ${ctx.hostel_room}` : ''}
${ctx.subscription_status ? `- Subscriptions: ${JSON.stringify(ctx.subscription_status)}` : ''}

Rules:
1. Answer only campus-related questions.
2. For personal metrics inquiries (fees, attendance, classes), rely strictly on the provided context data.
3. Keep responses concise (2-3 sentences max). Use bullet points if listing details.
4. If a query is complex or complaint-oriented, suggest raising a ticket or speaking to the campus administrator.
5. Respond in ${ctx.language === 'hi' ? 'Hindi (Simple conversational Hindi mixed with English for technical terms)' : 'English'}.
6. Use a friendly, helpful, and premium tone.
7. If asked about something unrelated to campus or education, politely redirect the conversation back to campus features.`;
}

/**
 * Connects to OpenAI Embeddings API to generate 1536-dim vectors
 */
export async function getEmbeddings(text: string): Promise<number[]> {
  const openAIKey = process.env.OPENAI_API_KEY;

  if (openAIKey && !openAIKey.startsWith('your-openai')) {
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
        })
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
 * Sandbox Mock Responses generator
 */
function getMockClaudeResponse(message: string, ctx: MessageContext): string {
  const lower = message.toLowerCase();
  const isHindi = ctx.language === 'hi';

  if (lower.includes('attendance') || lower.includes('present')) {
    if (isHindi) {
      return `नमस्ते ${ctx.name}! आपकी अटेंडेंस ${ctx.attendance}% है। इसे 75% से ऊपर रखने के लिए आपको नियमित रूप से क्लासेस अटेंड करनी चाहिए।`;
    }
    return `Hi ${ctx.name}! Your current institutional attendance rate stands at ${ctx.attendance}%. Make sure to keep it above 75% to stay compliant!`;
  }

  if (lower.includes('fee') || lower.includes('due') || lower.includes('pay')) {
    if (ctx.pending_fees > 0) {
      if (isHindi) {
        return `नमस्ते ${ctx.name}! आपकी outstanding fees ₹${ctx.pending_fees.toLocaleString('en-IN')} है। आप इसे clear करने के लिए /fees पेमेंट लिंक पर जा सकते हैं।`;
      }
      return `Hello ${ctx.name}! You have a pending fee balance of ₹${ctx.pending_fees.toLocaleString('en-IN')}. Please click here to make a payment: /fees`;
    } else {
      if (isHindi) {
        return `नमस्ते ${ctx.name}! आपकी कोई pending fees नहीं है। आपका लेज़र पूरी तरह क्लियर है!`;
      }
      return `Hi ${ctx.name}! You have no pending fees at this time. Your account ledger is fully settled.`;
    }
  }

  if (lower.includes('timetable') || lower.includes('schedule') || lower.includes('class')) {
    const classes = ctx.timetable && ctx.timetable.length > 0 
      ? ctx.timetable.join(', ') 
      : 'No classes today';
    if (isHindi) {
      return `आपका आज का टाइमटेबल: ${classes}। समय पर क्लास पहुंचें!`;
    }
    return `Your scheduled classes for today: ${classes}. Let me know if you need room locations!`;
  }

  if (lower.includes('canteen') || lower.includes('menu') || lower.includes('food')) {
    if (isHindi) {
      return `आज कैंटीन में आलू समोसा, डोसा और मसाला चाय उपलब्ध हैं। आपका वॉलेट बैलेंस ₹350 है। ऑर्डर करें: /student/canteen`;
    }
    return `Today's canteen specials include Aloo Samosa, Masala Dosa, and Cold Coffee. Your canteen wallet balance is ₹350. View menu here: /student/canteen`;
  }

  if (lower.includes('digest')) {
    if (isHindi) {
      return `आपका साप्ताहिक डाइजेस्ट तैयार है! आप इसे /ai/digest पेज पर जाकर देख सकते हैं।`;
    }
    return `Your weekly campus digest dossier is compiled! Go to /ai/digest to see details.`;
  }

  if (lower.includes('admin') || lower.includes('talk') || lower.includes('human') || lower.includes('escalate')) {
    if (isHindi) {
      return `ठीक है, मैं आपको हमारे कैंपस एडमिनिस्ट्रेटर से कनेक्ट कर रहा हूँ। कृपया प्रतीक्षा करें, प्रतिक्रिया का समय 2-4 घंटे है।`;
    }
    return `Understood. I am raising an escalation ticket to connect you with our helpdesk team. Response time is typical 2-4 hours.`;
  }

  if (isHindi) {
    return `नमस्ते! मैं IRIS हूँ, आपका AI कैंपस असिस्टेंट। मैं आपकी अटेंडेंस, फीस, लाइब्रेरी, कैंटीन और टाइमटेबल की जानकारी दे सकता हूँ। आप क्या जानना चाहते हैं?`;
  }
  return `Hi! I am IRIS, your AI campus concierge. I can assist you with attendance records, fee statements, canteen wallets, timetables, and library status. How can I help you today?`;
}
