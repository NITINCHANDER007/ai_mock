import { generateWithFlash } from '@/lib/gemini';
import {
  RoleConfig,
  findRoleConfig,
  getCachedCustomRole,
  setCachedCustomRole,
} from '@/lib/roles';

export async function getOrGenerateRoleConfig(roleName: string): Promise<RoleConfig> {
  const cleanName = roleName.trim() || 'Software Engineer';
  const existing = findRoleConfig(cleanName);
  if (existing) return existing;

  const cached = getCachedCustomRole(cleanName);
  if (cached) return cached;

  // Ask Gemini once to generate competencies, topic areas, interview style, scoring dimensions, sample scenarios
  try {
    const prompt = `You are a specialist HR executive and technical recruiter. Create an interview configuration for a custom job role: "${cleanName}".

Respond ONLY with a valid JSON object matching this exact TypeScript structure:
{
  "id": "slug-name",
  "label": "${cleanName}",
  "category": "Other",
  "competencies": ["5 to 7 specific core skills or knowledge areas required for this role"],
  "topicAreas": ["5 to 6 practical day-to-day discussion topics, challenges or workflows"],
  "interviewStyle": "A short 1-2 sentence description of how the interviewer should conduct this interview (e.g., scenario-based, role-play, case study, technical probing)",
  "scoringDimensions": [
    { "name": "Dimension Name 1", "description": "What to look for" },
    { "name": "Dimension Name 2", "description": "What to look for" },
    { "name": "Dimension Name 3", "description": "What to look for" },
    { "name": "Dimension Name 4", "description": "What to look for" }
  ],
  "sampleScenarios": [
    "Realistic situational question or workplace challenge 1",
    "Realistic situational question or workplace challenge 2"
  ]
}

IMPORTANT: Output ONLY the JSON object. No markdown code blocks, no other text.`;

    const raw = await generateWithFlash(prompt);
    let jsonString = raw.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    }
    const parsed = JSON.parse(jsonString) as RoleConfig;
    if (parsed && Array.isArray(parsed.competencies) && Array.isArray(parsed.scoringDimensions)) {
      const customConfig: RoleConfig = {
        id: parsed.id || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        label: cleanName,
        category: 'Other',
        competencies: parsed.competencies,
        topicAreas: parsed.topicAreas || [],
        interviewStyle: parsed.interviewStyle || 'Practical situational scenarios and domain evaluation.',
        scoringDimensions: parsed.scoringDimensions.slice(0, 4),
        sampleScenarios: parsed.sampleScenarios || [],
      };
      setCachedCustomRole(cleanName, customConfig);
      return customConfig;
    }
  } catch (err) {
    console.warn(`[getOrGenerateRoleConfig] Gemini generation failed for "${cleanName}", using smart fallback:`, err);
  }

  // Fallback custom configuration
  const fallbackConfig: RoleConfig = {
    id: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    label: cleanName,
    category: 'Other',
    competencies: [
      `Core domain principles of ${cleanName}`,
      'Problem solving under operational constraints',
      'Execution methodology and tooling',
      'Stakeholder collaboration and communication',
      'Quality standards and error handling',
    ],
    topicAreas: [
      `Common day-to-day operational challenges in ${cleanName}`,
      'Prioritization and managing competing project deadlines',
      'Handling edge cases, unexpected failures, or conflicts',
      'Key performance metrics and deliverables for this position',
    ],
    interviewStyle: 'Practical scenario-based probing, operational walk-throughs, and role-appropriate problem solving.',
    scoringDimensions: [
      { name: 'Domain Knowledge & Technical Execution', description: `Mastery of foundational skills and tools for ${cleanName}` },
      { name: 'Problem Solving & Critical Thinking', description: 'Methodical decomposition of challenges and realistic solutions' },
      { name: 'Process & Quality Standards', description: 'Adherence to best practices, accuracy, and error mitigation' },
      { name: 'Communication & Stakeholder Management', description: 'Clarity, empathy, and professional collaboration' },
    ],
    sampleScenarios: [
      `Walk me through how you prioritize unexpected crises while managing ongoing deliverables in a ${cleanName} position.`,
      `Describe a time you identified a major inefficiency or flaw in your workflow as a ${cleanName}. How did you resolve it?`,
    ],
  };

  setCachedCustomRole(cleanName, fallbackConfig);
  return fallbackConfig;
}

