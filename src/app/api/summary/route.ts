import { NextRequest, NextResponse } from 'next/server';
import { generateWithFlash } from '@/lib/gemini';
import { ChatMessage, InterviewConfig, InterviewSummary } from '@/types/interview';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { config, messages } = body as {
      config: InterviewConfig;
      messages: ChatMessage[];
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        score: 0,
        strengths: ['Interview ended early before any answers were recorded.'],
        improvements: ['Complete at least a few interview questions to receive detailed feedback.'],
        feedback: 'No interview conversation was recorded.',
      });
    }

    const transcript = messages
      .map(
        (m) =>
          `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`
      )
      .join('\n\n');

    const prompt = `You are an expert hiring manager and interview coach evaluating a mock interview.

INTERVIEW CONTEXT:
- Role: ${config.role}
- Experience Level: ${config.experience}
- Interview Type: ${config.type}
- Language: ${config.language}

INTERVIEW TRANSCRIPT:
"""
${transcript}
"""

Evaluate the candidate's answers based on their depth, clarity, relevance to the ${config.role} role, and structure.

Provide your evaluation strictly as a valid JSON object matching this TypeScript structure:
{
  "score": number, // an integer or float from 1 to 10
  "strengths": string[], // 3-4 bullet points highlighting specific things the candidate did well
  "improvements": string[], // 3-4 actionable bullet points on what the candidate can improve
  "feedback": string // a constructive 3-5 sentence overall summary paragraph
}

IMPORTANT: Respond ONLY with the JSON object. Do not wrap in extra prose.`;

    const raw = await generateWithFlash(prompt);

    // Extract JSON from response (handling potential markdown code fences)
    let jsonString = raw.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    }

    let summary: InterviewSummary;
    try {
      summary = JSON.parse(jsonString) as InterviewSummary;
    } catch {
      // Fallback regex extraction if model included surrounding text
      const match = jsonString.match(/\{[\s\S]*\}/);
      if (match) {
        summary = JSON.parse(match[0]) as InterviewSummary;
      } else {
        throw new Error('Unable to parse JSON feedback from Gemini response.');
      }
    }

    // Ensure score is clamped between 1 and 10
    summary.score = Math.min(10, Math.max(1, Number(summary.score) || 7));
    if (!Array.isArray(summary.strengths)) summary.strengths = [];
    if (!Array.isArray(summary.improvements)) summary.improvements = [];
    if (!summary.feedback) summary.feedback = 'Good effort on completing your mock interview!';

    return NextResponse.json(summary);
  } catch (error: unknown) {
    console.error('Error in /api/summary:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate interview summary';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

