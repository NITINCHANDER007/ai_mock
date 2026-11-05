import { NextRequest, NextResponse } from 'next/server';
import { generateWithFlash, GEMINI_MODEL, GeminiContentTurn } from '@/lib/gemini';
import { ChatMessage, InterviewConfig } from '@/types/interview';

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

    // Language guidelines
    let languageInstruction = '';
    if (config.language === 'Hindi') {
      languageInstruction = `STRICT LANGUAGE REQUIREMENT: You must speak entirely in Hindi using the Devanagari script (हिंदी लिपि). Keep the vocabulary professional yet natural.`;
    } else if (config.language === 'Hinglish') {
      languageInstruction = `STRICT LANGUAGE REQUIREMENT: Speak in Hinglish (a natural, conversational blend of Hindi and English, written ENTIRELY in Latin/English letters). Example: "Great, toh aapne is project me performance bottleneck kaise diagnose kiya?"`;
    } else {
      languageInstruction = `STRICT LANGUAGE REQUIREMENT: Speak in fluent, professional, clear English.`;
    }

    // Experience difficulty guidelines
    let expGuideline = '';
    if (config.experience === 'Fresher') {
      expGuideline = `Target level: Fresher / Entry-Level. Focus on fundamental concepts, college projects, academic coursework, problem-solving mindset, and willingness to learn.`;
    } else if (config.experience === '1-3 yrs') {
      expGuideline = `Target level: 1-3 years experience (Mid-junior). Focus on practical engineering, real production challenges faced, code organization, debugging, teamwork, and domain tools.`;
    } else {
      expGuideline = `Target level: 3+ years experience (Senior / Lead). Focus on architectural decisions, trade-offs, system scalability, handling edge cases, cross-team collaboration, and leadership.`;
    }

    // System instruction passed via config.systemInstruction, NOT as a history message
    const systemInstruction = `You are a professional, realistic mock interviewer conducting a ${config.type} interview for the position of "${config.role}". Model: ${GEMINI_MODEL}.
${languageInstruction}
${expGuideline}

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
