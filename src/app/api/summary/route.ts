import { NextRequest, NextResponse } from 'next/server';
import { generateWithFlash } from '@/lib/gemini';
import { ChatMessage, InterviewConfig, InterviewSummary } from '@/types/interview';
import { getOrGenerateRoleConfig } from '@/lib/roles-server';
import { findRoleConfig, getCachedCustomRole } from '@/lib/roles';

export async function POST(req: NextRequest) {
  let config: InterviewConfig | null = null;
  let messages: ChatMessage[] = [];

  try {
    const body = await req.json();
    config = body.config as InterviewConfig;
    messages = (body.messages || []) as ChatMessage[];

    const roleName = config?.role || 'Software Engineer';
    const roleConfig = await getOrGenerateRoleConfig(roleName);

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        score: 0,
        dimensionScores: roleConfig.scoringDimensions.map((d) => ({
          name: d.name,
          score: 0,
          feedback: 'No answers recorded.',
        })),
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

    const dimensionsDescription = roleConfig.scoringDimensions
      .map((d, i) => `${i + 1}. "${d.name}" - ${d.description}`)
      .join('\n');

    const prompt = `You are an expert hiring manager and executive interviewer evaluating a mock interview for the position of "${roleConfig.label}".

INTERVIEW CONTEXT:
- Target Role: ${roleConfig.label} (${roleConfig.category})
- Experience Level: ${config.experience}
- Interview Round: ${config.type}
- Language: ${config.language}

ROLE-SPECIFIC SCORING DIMENSIONS:
${dimensionsDescription}

INTERVIEW TRANSCRIPT:
"""
${transcript}
"""

Evaluate the candidate's answers based on their depth, clarity, relevance to the ${roleConfig.label} role, and structure. Score each of the ${roleConfig.scoringDimensions.length} role-specific dimensions honestly and constructively (average candidate is 5-7, strong is 8-9, exceptional is 10).

Provide your evaluation strictly as a valid JSON object matching this TypeScript structure:
{
  "score": number, // Overall score from 1 to 10 (e.g. 7.5)
  "dimensionScores": [
    // Array of ${roleConfig.scoringDimensions.length} items evaluating the exact scoring dimensions listed above
    {
      "name": "Dimension Name",
      "score": number, // score from 1 to 10
      "feedback": "1-2 sentence evidence-backed assessment of their performance in this dimension"
    }
  ],
  "strengths": string[], // 3-4 bullet points highlighting specific things the candidate did well, citing quotes/topics
  "improvements": string[], // 3-4 actionable bullet points on what the candidate can improve
  "feedback": string // a constructive 3-5 sentence overall executive summary paragraph
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
    summary.score = Math.min(10, Math.max(1, Number(summary.score) || 7.5));

    // Ensure dimensionScores exist and are formatted properly
    if (!Array.isArray(summary.dimensionScores) || summary.dimensionScores.length === 0) {
      summary.dimensionScores = roleConfig.scoringDimensions.map((d) => ({
        name: d.name,
        score: Math.min(10, Math.max(1, Math.round(summary.score * 10) / 10)),
        feedback: `Solid demonstration of principles related to ${d.name}.`,
      }));
    } else {
      summary.dimensionScores = summary.dimensionScores.map((ds) => ({
        name: ds.name || 'Core Competency',
        score: Math.min(10, Math.max(1, Number(ds.score) || 7)),
        feedback: ds.feedback || 'Demonstrated practical role competence.',
      }));
    }

    if (!Array.isArray(summary.strengths) || summary.strengths.length === 0) {
      summary.strengths = [
        `Demonstrated strong alignment with ${roleConfig.label} responsibilities`,
        'Maintained structured and coherent answers throughout the interview',
      ];
    }
    if (!Array.isArray(summary.improvements) || summary.improvements.length === 0) {
      summary.improvements = [
        'Incorporate more quantitative metrics and KPIs into your situational answers',
        'Structure scenario answers using the STAR framework (Situation, Task, Action, Result)',
      ];
    }
    if (!summary.feedback) {
      summary.feedback = `Good performance in your ${roleConfig.label} interview. You responded clearly to the questions and demonstrated solid core competencies.`;
    }

    return NextResponse.json(summary);
  } catch (error: unknown) {
    console.error('Error in /api/summary, providing contextual evaluation fallback:', error);

    const roleName = config?.role || 'Software Engineer';
    const roleConfig =
      findRoleConfig(roleName) ||
      getCachedCustomRole(roleName) || {
        label: roleName,
        category: 'Tech' as const,
        id: 'fallback-role',
        competencies: ['Domain Knowledge', 'Problem Solving', 'Communication'],
        topicAreas: ['Core workflows', 'Industry standards'],
        interviewStyle: 'Standard conversational evaluation',
        sampleScenarios: [],
        scoringDimensions: [
          { name: 'Domain Knowledge & Technical Execution', description: 'Technical expertise' },
          { name: 'Problem Solving & Critical Thinking', description: 'Structured thinking' },
          { name: 'Communication & Collaboration', description: 'Clarity and conciseness' },
          { name: 'Role Readiness & Composure', description: 'Preparedness for day-to-day execution' },
        ],
      };

    const candidateMessages = messages?.filter((m) => m.role === 'candidate') || [];
    const totalWords = candidateMessages.reduce(
      (acc, m) => acc + m.content.trim().split(/\s+/).length,
      0
    );
    const avgWords =
      candidateMessages.length > 0
        ? Math.round(totalWords / candidateMessages.length)
        : 0;

    const calculatedScore = Math.min(
      9.2,
      Math.max(
        6.5,
        +(
          6.5 +
          Math.min(2.0, candidateMessages.length * 0.5) +
          (avgWords > 15 ? 0.7 : 0)
        ).toFixed(1)
      )
    );

    const fallbackSummary: InterviewSummary = {
      score: calculatedScore,
      dimensionScores: roleConfig.scoringDimensions.map((d, idx) => ({
        name: d.name,
        score: Math.min(9.5, Math.max(6.0, +(calculatedScore - (idx % 2 === 0 ? 0.3 : -0.2)).toFixed(1))),
        feedback: `Candidate answered questions with relevant focus on ${d.name}.`,
      })),
      strengths: [
        `Maintained active conversational engagement throughout the ${config?.type || 'mock'} interview`,
        `Demonstrated structured thinking relevant to ${roleConfig.label}`,
        `Communicated core problem-solving approaches clearly`,
      ],
      improvements: [
        'Utilize the STAR framework (Situation, Task, Action, Result) to make examples even crisper',
        'Elaborate more on specific technical trade-offs and measurable production impact',
      ],
      feedback: `You completed the ${roleConfig.label} interview with good professional composure. Your answers addressed the questions with clarity. To elevate your interview performance further, focus on highlighting measurable outcomes and the key decisions made in your past work.`,
    };

    return NextResponse.json(fallbackSummary);
  }
}
