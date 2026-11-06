import { NextRequest, NextResponse } from 'next/server';
import { generateWithFlash, GEMINI_MODEL, GeminiContentTurn } from '@/lib/gemini';
import { ChatMessage, InterviewConfig } from '@/types/interview';
import { getOrGenerateRoleConfig } from '@/lib/roles-server';

function convertToGeminiContents(
  messages: ChatMessage[],
  config: InterviewConfig
): GeminiContentTurn[] {
  // 1. Map messages to Gemini roles and filter empty text
  const cleanedTurns = messages
    .map((m) => {
      const rawRole = (m.role || '').toLowerCase();
      const role: 'user' | 'model' =
        rawRole === 'interviewer' || rawRole === 'assistant' || rawRole === 'ai'
          ? 'model'
          : 'user';
      const text = (m.content || '').trim();
      return { role, text };
    })
    .filter((item) => item.text.length > 0);

  // If no previous messages, candidate initiates the session
  if (cleanedTurns.length === 0) {
    return [
      {
        role: 'user',
        parts: [
          {
            text: `Start the interview now. Give a brief 1-sentence warm professional welcome and ask me to introduce myself ("Tell me about yourself"). Language: ${config.language}.`,
          },
        ],
      },
    ];
  }

  // 2. Strict alternation: merge consecutive messages with identical roles
  const alternatedTurns: Array<{ role: 'user' | 'model'; text: string }> = [];
  for (const item of cleanedTurns) {
    if (alternatedTurns.length === 0) {
      alternatedTurns.push({ ...item });
    } else {
      const prev = alternatedTurns[alternatedTurns.length - 1];
      if (prev.role === item.role) {
        prev.text = `${prev.text}\n\n${item.text}`.trim();
      } else {
        alternatedTurns.push({ ...item });
      }
    }
  }

  // 3. Ensure the first content item is always role "user"
  // If the conversation began with the AI greeting (role: "model"), prepend a user trigger turn
  if (alternatedTurns[0].role === 'model') {
    alternatedTurns.unshift({
      role: 'user',
      text: 'Start the interview.',
    });
  }

  // 4. Ensure the last content item is role "user" (the candidate's latest answer)
  // If the last item was somehow model, request the next question from model
  if (alternatedTurns[alternatedTurns.length - 1].role === 'model') {
    alternatedTurns.push({
      role: 'user',
      text: 'Please continue and ask your next question.',
    });
  }

  // 5. Convert to Gemini Content format: { role, parts: [{ text }] }
  return alternatedTurns.map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text.trim() }],
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const config = body.config as InterviewConfig;
    const messages = (body.messages || []) as ChatMessage[];

    if (!config) {
      return NextResponse.json(
        { error: 'Interview configuration is required', status: 400 },
        { status: 400 }
      );
    }

    const totalQuestionsTarget = Math.max(4, Math.round(config.duration / 2.5));
    const questionsAskedSoFar = messages.filter(
      (m) => m.role === 'interviewer'
    ).length;
    const isNearEnd = questionsAskedSoFar >= totalQuestionsTarget;

    // Retrieve role-specific configuration and competencies
    const roleConfig = await getOrGenerateRoleConfig(config.role);
    const competenciesList = roleConfig.competencies.map((c) => `- ${c}`).join('\n');
    const topicsList = roleConfig.topicAreas.map((t) => `- ${t}`).join('\n');
    const scenariosList = roleConfig.sampleScenarios.map((s) => `• ${s}`).join('\n');

    // Role-play injection for roles that benefit from interactive simulation
    let rolePlayGuideline = '';
    const lowerRole = config.role.toLowerCase();
    if (lowerRole.includes('sales') || lowerRole.includes('business development')) {
      rolePlayGuideline = `\nROLE-PLAY SIMULATION INSTRUCTION:
For sales scenarios, act as a realistic, hesitant, or skeptical prospect/customer. Challenge the candidate with common commercial objections (e.g. "Your price is 40% higher than your competitor", "We are freezing software spend this quarter"). Evaluate their ability to uncover pain, ask discovery questions, and close without being overly pushy.`;
    } else if (lowerRole.includes('support') || lowerRole.includes('customer success')) {
      rolePlayGuideline = `\nROLE-PLAY SIMULATION INSTRUCTION:
For customer support scenarios, act as a frustrated, confused, or impatient customer experiencing a critical issue (e.g., account locked, payment charged twice, broken workflow). Test their empathy, patience, de-escalation, step-by-step troubleshooting, and clear communication.`;
    } else if (lowerRole.includes('talent acquisition') || lowerRole.includes('recruiter') || lowerRole.includes('hr')) {
      rolePlayGuideline = `\nROLE-PLAY & SITUATIONAL SIMULATION:
Simulate realistic day-to-day HR/TA challenges: act as a demanding hiring manager with unrealistic salary expectations or tight deadlines, test their negotiation tactics when a star candidate has a higher competing offer, and probe their sourcing strategies and recruitment metrics (time-to-hire, offer drop-off, sourcing funnels).`;
    } else if (lowerRole.includes('consulting')) {
      rolePlayGuideline = `\nCASE INTERVIEW INSTRUCTION:
Run an interactive, structured case study. Present a concrete business problem (e.g., declining profitability, market sizing, market entry), push the candidate to state their assumptions, construct a MECE issue tree, and solve quantitative mental math steps.`;
    } else if (roleConfig.category === 'Tech') {
      rolePlayGuideline = `\nPRACTICAL ENGINEERING INSTRUCTION:
Focus strictly on practical real-world engineering situations (debugging edge cases, production outages, architectural trade-offs, performance optimization, concurrency, testing, and security). DO NOT ask textbook definition questions. Ask "How would you solve X when Y breaks?"`;
    }

    // Language guidelines
    let languageInstruction = '';
    if (config.language === 'Hindi') {
      languageInstruction = `STRICT LANGUAGE REQUIREMENT: You must speak entirely in Hindi using the Devanagari script (हिंदी लिपि). Keep the vocabulary professional yet natural.`;
    } else if (config.language === 'Hinglish') {
      languageInstruction = `STRICT LANGUAGE REQUIREMENT: Speak in Hinglish (a natural, conversational blend of Hindi and English, written ENTIRELY in Latin/English letters). Example: "Great, toh aapne is project me performance bottleneck kaise diagnose kiya?"`;
    } else {
      languageInstruction = `STRICT LANGUAGE REQUIREMENT: Speak in fluent, professional, clear English.`;
    }

    // Experience difficulty depth ladder
    let expGuideline = '';
    if (config.experience === 'Fresher') {
      expGuideline = `CANDIDATE EXPERIENCE DEPTH (Fresher / Entry-Level):
- Focus on fundamental principles, college/internship projects, problem-solving curiosity, foundational concepts of ${roleConfig.label}, and willingness to learn.
- Be supportive yet rigorous about baseline conceptual clarity.`;
    } else if (config.experience === '1-3 yrs') {
      expGuideline = `CANDIDATE EXPERIENCE DEPTH (1-3 years / Mid-level):
- Focus on practical day-to-day execution, real production challenges they personally handled, debugging and edge-case resolution, working with cross-functional partners, and domain tooling/metrics.
- Verify what part THEY specifically owned versus what their team did.`;
    } else {
      expGuideline = `CANDIDATE EXPERIENCE DEPTH (3+ years / Senior & Lead):
- Focus on strategic decisions, system architecture trade-offs, scaling bottlenecks, organizational influence, failure recovery, mentorship, and business impact.
- Probe why alternative approaches were rejected and how they handled ambiguity.`;
    }

    // System instruction passed via config.systemInstruction, NOT as a history message
    const systemInstruction = `You are a professional, realistic mock interviewer conducting a ${config.type} interview for the position of "${roleConfig.label}". Model: ${GEMINI_MODEL}.
${languageInstruction}
${expGuideline}

ROLE PROFILE & COMPETENCIES:
Role Title: ${roleConfig.label} (${roleConfig.category} Category)
Interview Style: ${roleConfig.interviewStyle}

Key Competencies to Assess:
${competenciesList}

Core Day-to-Day Topics & Workflows:
${topicsList}

Realistic Workplace Scenarios to Draw From:
${scenariosList}
${rolePlayGuideline}

INTERVIEW RULES:
1. Act strictly as the interviewer. Stay in character at all times.
2. Ask ONE question at a time. Never dump multiple questions together.
3. DO NOT provide answers, feedback, hints, or ratings during the live interview.
4. Keep questions concise (1 to 2 sentences) so it feels like a realistic spoken interview.
5. Briefly acknowledge the candidate's last answer in a natural conversational way, then ask your single question.
6. Target interview duration: ${config.duration} minutes (~${totalQuestionsTarget} main questions). Questions asked so far: ${questionsAskedSoFar}.
${
  isNearEnd
    ? '7. The scheduled interview duration is almost over. Please ask one final wrap-up question or conclude professionally.'
    : ''
}

STRUCTURED OUTPUT FORMAT:
You MUST respond strictly with a valid JSON object in this exact schema:
{
  "text": "Your spoken acknowledgment and single question here",
  "type": "new_question" | "follow_up" | "closing"
}

Rules for "type":
- "new_question": Use this when moving to a brand new main question or interview topic, or for the opening greeting question.
- "follow_up": Use this when probing deeper, clarifying, or digging into what the candidate just answered on the same topic.
- "closing": Use this when concluding the interview or asking if the candidate has final questions.

IMPORTANT: Output ONLY the JSON object. Do not wrap in markdown fences or add explanatory text.

${config.resumeText ? `CANDIDATE RESUME DETAILS:\n"""\n${config.resumeText}\n"""\nAsk questions based on their projects and experience.` : ''}

${config.jdText ? `TARGET JOB DESCRIPTION:\n"""\n${config.jdText}\n"""\nTest the required skills and competencies.` : ''}
`;

    // Multi-turn contents array conforming to Gemini API specification
    const contents = convertToGeminiContents(messages, config);

    const raw = await generateWithFlash(contents, systemInstruction);

    // Validate generated text: treat empty or missing text as an error
    if (!raw || !raw.trim()) {
      throw new Error('Gemini returned an empty or invalid response');
    }

    // Parse structured JSON response
    let questionText = '';
    let questionType: 'new_question' | 'follow_up' | 'closing' =
      messages.length === 0 ? 'new_question' : isNearEnd ? 'closing' : 'follow_up';

    let jsonString = raw.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    }

    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.text && typeof parsed.text === 'string') {
        questionText = parsed.text.trim();
      }
      if (
        parsed.type === 'new_question' ||
        parsed.type === 'follow_up' ||
        parsed.type === 'closing'
      ) {
        questionType = parsed.type;
      }
    } catch {
      // Fallback regex extraction if model enclosed JSON in other text
      const match = jsonString.match(/\{[\s\S]*"text"[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (parsed.text) questionText = parsed.text.trim();
          if (parsed.type) questionType = parsed.type;
        } catch {
          questionText = raw.trim();
        }
      } else {
        questionText = raw.trim();
      }
    }

    if (!questionText) {
      questionText = raw.trim();
    }

    return NextResponse.json({
      question: questionText,
      text: questionText,
      type: questionType,
    });
  } catch (error: unknown) {
    const errObj = error as { status?: number; code?: number; message?: string; stack?: string };
    const rawStatus = errObj?.status || errObj?.code;
    const httpStatus =
      typeof rawStatus === 'number' && rawStatus >= 400 && rawStatus < 600
        ? rawStatus
        : 500;
    const message = errObj?.message || 'Failed to generate interview question';

    // Log full error to terminal as requested
    console.error('[API /api/chat Error]:', {
      status: httpStatus,
      message,
      error,
      stack: errObj?.stack,
    });

    return NextResponse.json(
      {
        error: message,
        status: httpStatus,
      },
      { status: httpStatus }
    );
  }
}
