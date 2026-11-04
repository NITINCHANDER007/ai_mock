'use client';

import React, { useState, useId } from 'react';
import {
  Briefcase,
  Clock,
  Globe2,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  UserCheck,
  Zap,
  Mic,
  BrainCircuit,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  ExperienceLevel,
  InterviewConfig,
  InterviewDuration,
  InterviewLanguage,
  InterviewType,
} from '@/types/interview';

const PRESET_ROLES = [
  'Software Engineer',
  'Data Analyst',
  'Product Manager',
  'Designer',
  'HR',
  'Marketing',
  'Sales',
  'Customer Support',
  'Other',
];

const EXPERIENCE_OPTIONS: { label: string; desc: string; value: ExperienceLevel }[] = [
  { label: 'Fresher', desc: '0-1 yr exp', value: 'Fresher' },
  { label: '1 - 3 yrs', desc: 'Mid level', value: '1-3 yrs' },
  { label: '3+ yrs', desc: 'Senior / Lead', value: '3+ yrs' },
];

const INTERVIEW_TYPES: { label: string; icon: string; value: InterviewType }[] = [
  { label: 'Technical', icon: '💻', value: 'Technical' },
  { label: 'HR', icon: '🤝', value: 'HR' },
  { label: 'Behavioral', icon: '🧠', value: 'Behavioral' },
  { label: 'Case study', icon: '📊', value: 'Case study' },
  { label: 'Mixed', icon: '⚡', value: 'Mixed' },
];

const DURATIONS: { label: string; value: InterviewDuration }[] = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
];

const LANGUAGES: { label: string; script: string; value: InterviewLanguage }[] = [
  { label: 'English', script: 'Global Standard', value: 'English' },
  { label: 'Hindi', script: 'देवनागरी लिपि', value: 'Hindi' },
  { label: 'Hinglish', script: 'Conversational Mix', value: 'Hinglish' },
];

interface SetupFormProps {
  onStart: (config: InterviewConfig) => void;
  isLoading: boolean;
}

export default function SetupForm({ onStart, isLoading }: SetupFormProps) {
  const roleListId = useId();
  const [role, setRole] = useState('Software Engineer');
  const [roleSearch, setRoleSearch] = useState('Software Engineer');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [experience, setExperience] = useState<ExperienceLevel>('1-3 yrs');
  const [interviewType, setInterviewType] = useState<InterviewType>('Technical');
  const [duration, setDuration] = useState<InterviewDuration>(15);
  const [language, setLanguage] = useState<InterviewLanguage>('English');

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [isExtractingResume, setIsExtractingResume] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  // JD state
  const [jdTab, setJdTab] = useState<'paste' | 'upload'>('paste');
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [isExtractingJd, setIsExtractingJd] = useState(false);
  const [jdError, setJdError] = useState<string | null>(null);

  // File upload handler
  const handleFileUpload = async (
    file: File,
    type: 'resume' | 'jd'
  ) => {
    const isResume = type === 'resume';
    if (isResume) {
      setResumeFile(file);
      setIsExtractingResume(true);
      setResumeError(null);
    } else {
      setJdFile(file);
      setIsExtractingJd(true);
      setJdError(null);
    }

    try {
      const MAX_SIZE = 5 * 1024 * 1024; // 5 MB limit
      if (file.size > MAX_SIZE) {
        throw new Error('File exceeds the 5 MB limit.');
      }
      if (file.size === 0) {
        throw new Error('The uploaded file is empty.');
      }
      const isPdfOrTxt =
        file.name.toLowerCase().endsWith('.pdf') ||
        file.name.toLowerCase().endsWith('.txt') ||
        file.type === 'application/pdf' ||
        file.type === 'text/plain';
      if (!isPdfOrTxt) {
        throw new Error('Only PDF and TXT files are accepted.');
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract text from document');
      }

      if (isResume) {
        setResumeText(data.text);
      } else {
        setJdText(data.text);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error extracting text';
      if (isResume) {
        setResumeError(msg);
      } else {
        setJdError(msg);
      }
    } finally {
      if (isResume) {
        setIsExtractingResume(false);
      } else {
        setIsExtractingJd(false);
      }
    }
  };

  const filteredRoles = PRESET_ROLES.filter((r) =>
    r.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = roleSearch.trim() || role;
    onStart({
      role: finalRole,
      experience,
      type: interviewType,
      duration,
      language,
      resumeText: resumeText.trim() || undefined,
      jdText: jdText.trim() || undefined,
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 py-2">
      {/* Hero Badge & Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-medium backdrop-blur-md shadow-inner shadow-violet-500/20">
          <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Next-Gen Voice Mock Interviews</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
          <span className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider">Live</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Master Your Next Interview with{' '}
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            InterviewAI
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-normal">
          Real-time spoken mock interviews with an intelligent AI recruiter. Speak naturally, receive smart follow-ups, and get detailed instant feedback.
        </p>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Live Preview & Feature Badges */}
        <div className="lg:col-span-5 space-y-5">
          {/* Live Session Blueprint Card */}
          <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Ambient background glow inside card */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-violet-600/40">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">Session Blueprint</h3>
                  <p className="text-[10px] text-slate-400">Configured in real-time</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Ready
              </span>
            </div>

            {/* Simulated AI Interviewer Visual */}
            <div className="my-6 p-5 rounded-2xl bg-slate-950/60 border border-white/5 flex flex-col items-center justify-center text-center relative">
              <div className="relative mb-3 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600/40 to-cyan-500/30 blur-md absolute animate-pulse" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 via-indigo-600 to-slate-900 border-2 border-violet-400/60 flex items-center justify-center text-white relative z-10 shadow-xl shadow-violet-600/40">
                  <Sparkles className="w-7 h-7 text-cyan-200" />
                </div>
              </div>
              <h4 className="text-sm font-bold text-white">{roleSearch || role}</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {interviewType} Round • {experience}
              </p>

              {/* Mini voice wave simulation */}
              <div className="flex items-center gap-1 mt-4 h-6">
                {[0.4, 0.8, 0.5, 1.0, 0.7, 0.9, 0.4].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-gradient-to-t from-violet-500 to-cyan-400 rounded-full animate-pulse"
                    style={{
                      height: `${h * 20}px`,
                      animationDuration: `${0.4 + (i % 3) * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Real-time configuration summary pill grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Duration</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{duration} Minutes</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Language</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{language}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Resume</span>
                <span className={`font-semibold mt-0.5 block ${resumeText ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {resumeText ? 'Attached ✓' : 'Not Provided'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Target JD</span>
                <span className={`font-semibold mt-0.5 block ${jdText ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {jdText ? 'Custom Context ✓' : 'Role Standard'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick value badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl glass-card flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/15 text-violet-400 shrink-0">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Zero Click</p>
                <p className="text-[10px] text-slate-400">Natural voice flow</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl glass-card flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Flash Speed</p>
                <p className="text-[10px] text-slate-400">Sub-second turns</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl glass-card flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Scored Feedback</p>
                <p className="text-[10px] text-slate-400">STAR analysis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Setup Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6"
          >
            {/* Job Role: Searchable Combobox with quick chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <Briefcase className="w-4 h-4 text-violet-400" />
                  Target Job Role
                </label>
                <span className="text-[11px] text-slate-400">Search or type custom</span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={roleSearch}
                  onChange={(e) => {
                    setRoleSearch(e.target.value);
                    setRole(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="e.g. Senior Backend Engineer, Product Manager"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900/80 border border-white/10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/70 focus:border-transparent transition-all pr-10 shadow-inner"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Quick Select Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_ROLES.slice(0, 5).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setRoleSearch(r);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                      roleSearch.toLowerCase() === r.toLowerCase()
                        ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/40'
                        : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-white/5'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <ul
                    id={roleListId}
                    className="absolute z-30 mt-1.5 w-full bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl max-h-56 overflow-y-auto py-1 text-sm backdrop-blur-xl"
                  >
                    {filteredRoles.length > 0 ? (
                      filteredRoles.map((item) => (
                        <li
                          key={item}
                          onClick={() => {
                            setRole(item);
                            setRoleSearch(item);
                            setIsDropdownOpen(false);
                          }}
                          className="px-4 py-2.5 hover:bg-violet-600/20 hover:text-violet-200 cursor-pointer flex items-center justify-between text-slate-300 transition-colors"
                        >
                          <span>{item}</span>
                          {roleSearch === item && (
                            <CheckCircle2 className="w-4 h-4 text-violet-400" />
                          )}
                        </li>
                      ))
                    ) : (
                      <li
                        onClick={() => setIsDropdownOpen(false)}
                        className="px-4 py-2.5 text-slate-400 italic cursor-pointer hover:bg-slate-800"
                      >
                        Keep custom title: &quot;{roleSearch}&quot;
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>

            {/* Experience Level: 3 Glass Cards */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <UserCheck className="w-4 h-4 text-violet-400" />
                Experience Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {EXPERIENCE_OPTIONS.map((exp) => {
                  const isSelected = experience === exp.value;
                  return (
                    <button
                      key={exp.value}
                      type="button"
                      onClick={() => setExperience(exp.value)}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-violet-600/25 border-violet-500 text-white shadow-lg shadow-violet-600/20'
                          : 'bg-slate-900/60 hover:bg-slate-800/60 border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-violet-400" />
                      )}
                      <p className="text-xs font-bold text-slate-100">{exp.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{exp.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interview Type: Grid with Emojis */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Layers className="w-4 h-4 text-violet-400" />
                Interview Format
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {INTERVIEW_TYPES.map((t) => {
                  const isSelected = interviewType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setInterviewType(t.value)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-b from-violet-600/30 to-indigo-600/30 border-violet-500 text-violet-200 shadow-md shadow-violet-600/25'
                          : 'bg-slate-900/60 hover:bg-slate-800/60 border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-base">{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration & Language: Dual column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Duration */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <Clock className="w-4 h-4 text-violet-400" />
                  Target Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map((dur) => (
                    <button
                      key={dur.value}
                      type="button"
                      onClick={() => setDuration(dur.value)}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                        duration === dur.value
                          ? 'bg-violet-600/25 border-violet-500 text-white shadow-sm shadow-violet-600/30'
                          : 'bg-slate-900/60 hover:bg-slate-800/60 border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <Globe2 className="w-4 h-4 text-violet-400" />
                  Spoken Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => setLanguage(lang.value)}
                      className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                        language === lang.value
                          ? 'bg-violet-600/25 border-violet-500 text-white shadow-sm shadow-violet-600/30'
                          : 'bg-slate-900/60 hover:bg-slate-800/60 border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{lang.label}</span>
                      <span className="text-[9px] text-slate-400 font-normal mt-0.5 truncate max-w-full">
                        {lang.value === 'Hindi' ? 'हिंदी' : lang.value === 'Hinglish' ? 'Mix' : 'Global'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional Resume Upload Dropzone */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <FileText className="w-4 h-4 text-violet-400" />
                  Candidate Resume <span className="text-slate-500 lowercase font-normal">(optional)</span>
                </label>
                {resumeText && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Extracted
                  </span>
                )}
              </div>

              <div className="relative border-2 border-dashed border-white/10 hover:border-violet-500/50 rounded-2xl p-4 text-center transition-all bg-slate-900/40 hover:bg-slate-900/70 group">
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'resume');
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                  {isExtractingResume ? (
                    <div className="flex items-center gap-2 text-violet-400 text-xs py-1">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Parsing and indexing resume...
                    </div>
                  ) : resumeFile ? (
                    <div className="flex items-center gap-2 text-xs text-slate-200 font-medium">
                      <FileText className="w-4 h-4 text-violet-400" />
                      <span className="truncate max-w-[200px]">{resumeFile.name}</span>
                      <span className="text-[10px] text-slate-400">({(resumeFile.size / 1024).toFixed(0)} KB)</span>
                      <span className="text-violet-400 text-[11px] underline ml-1">Change</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 group-hover:text-violet-300 transition-colors">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-slate-300">
                        <span className="font-semibold text-violet-400">Upload PDF or TXT</span> resume
                      </p>
                      <p className="text-[10px] text-slate-500">AI will ask questions targeting your past projects &amp; skills</p>
                    </>
                  )}
                </div>
              </div>
              {resumeError && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {resumeError}
                </p>
              )}
            </div>

            {/* Optional Job Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <FileText className="w-4 h-4 text-violet-400" />
                  Target Job Description <span className="text-slate-500 lowercase font-normal">(optional)</span>
                </label>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setJdTab('paste')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      jdTab === 'paste'
                        ? 'bg-violet-600/30 text-violet-200 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Paste Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setJdTab('upload')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      jdTab === 'upload'
                        ? 'bg-violet-600/30 text-violet-200 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Upload File
                  </button>
                </div>
              </div>

              {jdTab === 'paste' ? (
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste job requirements or key skills you want to be tested on..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/80 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/70 resize-y"
                />
              ) : (
                <div className="relative border-2 border-dashed border-white/10 hover:border-violet-500/50 rounded-2xl p-4 text-center transition-all bg-slate-900/40">
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'jd');
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-1 pointer-events-none">
                    {isExtractingJd ? (
                      <div className="flex items-center gap-2 text-violet-400 text-xs py-1">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Extracting requirements...
                      </div>
                    ) : jdFile ? (
                      <div className="flex items-center gap-2 text-xs text-slate-200">
                        <FileText className="w-4 h-4 text-violet-400" />
                        <span>{jdFile.name}</span>
                        <span className="text-violet-400 text-[11px] underline ml-1">Change</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-5 h-5 text-slate-400" />
                        <p className="text-xs text-slate-300">
                          <span className="font-semibold text-violet-400">Upload JD file</span> (PDF or TXT)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
              {jdError && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {jdError}
                </p>
              )}
            </div>

            {/* Launch Button */}
            <button
              type="submit"
              disabled={isLoading || isExtractingResume || isExtractingJd}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-400 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-xl shadow-violet-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer glow-btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Launching Studio...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-cyan-200" />
                  <span>Start Mock Interview</span>
                  <ArrowRight className="w-5 h-5 text-cyan-200" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
