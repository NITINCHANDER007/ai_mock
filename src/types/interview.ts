export type JobRole =
  | 'Software Engineer'
  | 'Data Analyst'
  | 'HR'
  | 'Marketing'
  | 'Sales'
  | 'Product Manager'
  | 'Designer'
  | 'Customer Support'
  | 'Other';

export type ExperienceLevel = 'Fresher' | '1-3 yrs' | '3+ yrs';

export type InterviewType =
  | 'HR'
  | 'Technical'
  | 'Behavioral'
  | 'Case study'
  | 'Mixed';

export type InterviewDuration = 15 | 30 | 45;

export type InterviewLanguage = 'English' | 'Hindi' | 'Hinglish';

export interface InterviewConfig {
  role: string;
  experience: ExperienceLevel;
  type: InterviewType;
  duration: InterviewDuration;
  language: InterviewLanguage;
  resumeText?: string;
  jdText?: string;
}

export interface ChatMessage {
  id: string;
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: string;
}

export interface InterviewSummary {
  score: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
}

