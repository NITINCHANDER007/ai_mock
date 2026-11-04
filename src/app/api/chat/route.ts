import { NextRequest, NextResponse } from 'next/server';
import { generateWithFlash, GEMINI_MODEL } from '@/lib/gemini';
import { ChatMessage, InterviewConfig } from '@/types/interview';

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

    const isFirstQuestion = messages.length === 0;
    const totalQuestionsTarget = Math.max(4, Math.round(config.duration / 2.5));
    const questionsAskedSoFar = messages.filter(
      (m) => m.role === 'interviewer'
    ).length;

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

    // System instruction
    const systemInstruction = `You are a professional, realistic mock interviewer conducting a ${config.type} interview for the position of "${config.role}". Model: ${GEMINI_MODEL}.
${languageInstruction}
${expGuideline}

INTERVIEW RULES:
1. Act strictly as the interviewer. Stay in character at all times.
2. Ask ONE question at a time. Never dump multiple questions together.
3. DO NOT provide answers, feedback, hints, or ratings during the live interview.
4. Keep questions concise (1 to 2 sentences) so it feels like a realistic spoken interview.
5. Interview target: ${config.duration} minutes (approximately ${totalQuestionsTarget} total questions). Questions asked so far: ${questionsAskedSoFar}.

${config.resumeText ? `CANDIDATE RESUME DETAILS:\n"""\n${config.resumeText}\n"""\nAsk questions based on their projects and experience.` : ''}

${config.jdText ? `TARGET JOB DESCRIPTION:\n"""\n${config.jdText}\n"""\nTest the required skills and competencies.` : ''}
`;

    let prompt = '';

    if (isFirstQuestion) {
      prompt = `Start the interview now. Give a brief 1-sentence warm professional welcome and ask the candidate to introduce themselves ("Tell me about yourself"). Remember to strictly follow the language rule (${config.language}) and keep it concise.`;
    } else {
      const transcript = messages
        .map(
          (m) =>
            `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`
        )
        .join('\n\n');

      const isNearEnd = questionsAskedSoFar >= totalQuestionsTarget;

      prompt = `Here is the interview transcript so far:

${transcript}

${
  isNearEnd
    ? `The scheduled interview duration is almost over (${questionsAskedSoFar} questions asked). Please ask one final wrap-up question or give a brief professional closing asking if the candidate has any questions before wrapping up.`
    : `Based on the candidate's last answer, respond like a real interviewer: briefly acknowledge it and ask your NEXT single interview question (or an insightful follow-up). Remember: ask ONE question only, and no feedback!`
}`;
    }

    const question = await generateWithFlash(prompt, systemInstruction);

    // Validate generated question: treat empty or missing text as an error
    if (!question || !question.trim()) {
      throw new Error('Gemini returned an empty or invalid question');
    }

    return NextResponse.json({ question: question.trim() });
  } catch (error: any) {
    const rawStatus = error?.status || error?.code;
    const httpStatus =
      typeof rawStatus === 'number' && rawStatus >= 400 && rawStatus < 600
        ? rawStatus
        : 500;
    const message = error?.message || 'Failed to generate interview question';

    // Log full error to terminal as requested
    console.error('[API /api/chat Error]:', {
      status: httpStatus,
      message,
      error,
      stack: error?.stack,
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
