'use client';

import React, { useState, useId, useMemo, useRef, useEffect } from 'react';
import {
  Briefcase,
  Clock,
  Globe2,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  UserCheck,
  Layers,
  ArrowRight,
  Search,
  PenTool,
  X,
} from 'lucide-react';
import {
  ExperienceLevel,
  InterviewConfig,
  InterviewDuration,
  InterviewLanguage,
  InterviewType,
} from '@/types/interview';
import { PRESET_ROLE_CONFIGS, RoleCategory } from '@/lib/roles';

const CATEGORY_META: Record<RoleCategory, { icon: string; title: string }> = {
  Tech: { icon: '💻', title: 'Tech Roles' },
  HR: { icon: '🤝', title: 'HR & People Roles' },
  'Non-Tech': { icon: '💼', title: 'Non-Tech & Business Roles' },
  Other: { icon: '✨', title: 'Custom Role' },
};

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
  const [role, setRole] = useState('Software Engineer (general)');
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const comboboxContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        comboboxContainerRef.current &&
        !comboboxContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Autofocus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isDropdownOpen]);

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

  // Grouped search filtering
  const groupedRoles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const categories: RoleCategory[] = ['Tech', 'HR', 'Non-Tech'];
    return categories.map((cat) => ({
      category: cat,
      roles: PRESET_ROLE_CONFIGS.filter(
        (r) => r.category === cat && (!q || r.label.toLowerCase().includes(q))
      ),
    }));
  }, [searchQuery]);

  const totalFilteredPresets = useMemo(() => {
    return groupedRoles.reduce((sum, g) => sum + g.roles.length, 0);
  }, [groupedRoles]);

  // Flattened options for keyboard navigation
  const flattenedOptions = useMemo(() => {
    const list: Array<{ id: string; label: string; isOther?: boolean }> = [];
    for (const g of groupedRoles) {
      for (const r of g.roles) {
        list.push({ id: r.id, label: r.label });
      }
    }
    list.push({ id: 'other-custom-role', label: 'Other (type your role)', isOther: true });
    return list;
  }, [groupedRoles]);


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsDropdownOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsDropdownOpen(false);
    } else if (e.key === 'Tab') {
      setIsDropdownOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev + 1;
        return next >= flattenedOptions.length ? 0 : next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev - 1;
        return next < 0 ? flattenedOptions.length - 1 : next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < flattenedOptions.length) {
        const selected = flattenedOptions[highlightedIndex];
        if (selected.isOther) {
          setIsCustomRole(true);
          setRole('Other');
          setIsDropdownOpen(false);
        } else {
          setRole(selected.label);
          setIsCustomRole(false);
          setIsDropdownOpen(false);
        }
      } else if (searchQuery.trim() && totalFilteredPresets === 0) {
        setIsCustomRole(true);
        setCustomRoleInput(searchQuery.trim());
        setRole('Other');
        setIsDropdownOpen(false);
      }
    }
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch {}
    }
    const finalRole = isCustomRole
      ? (customRoleInput.trim() || 'Custom Professional Role')
      : role;
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
    <div className="w-full max-w-[640px] mx-auto space-y-6 py-4">
      {/* Title */}
      <div className="relative text-center space-y-2.5 pt-2">
        {/* Ambient atmospheric backlight */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 w-80 h-32 bg-gradient-to-r from-violet-600/20 via-indigo-500/15 to-cyan-500/20 blur-3xl rounded-full pointer-events-none -z-10" />

        {/* Creative Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight text-white leading-tight">
          Test yourself before{' '}
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
            they test you
          </span>
        </h1>

        {/* Subtitle - Motivational confidence booster */}
        <p className="text-sm sm:text-base text-slate-300/90 max-w-lg mx-auto leading-relaxed">
          Confidence comes from preparation. Practice out loud and walk in ready to own the room.
        </p>
      </div>

      {/* Centered Form Card */}
      <form
        onSubmit={handleSubmit}
        className="glass-panel rounded-2xl p-6 sm:p-7 border border-white/10 space-y-5"
      >
        {/* Target Job Role: Single Searchable Grouped Combobox */}
        <div className="space-y-2 relative" ref={comboboxContainerRef}>
          <label
            id="target-job-role-label"
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            <Briefcase className="w-4 h-4 text-violet-400" />
            Target Job Role
          </label>

              {/* Combobox Trigger Field (same dark glass style as other fields) */}
              <div
                role="combobox"
                aria-expanded={isDropdownOpen}
                aria-haspopup="listbox"
                aria-controls={roleListId}
                aria-labelledby="target-job-role-label"
                tabIndex={0}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-violet-500/40 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/50 text-sm text-slate-100 flex items-center justify-between cursor-pointer transition-all shadow-inner select-none outline-none group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-slate-100 block truncate">
                      {isCustomRole
                        ? (customRoleInput.trim() ? `Other: ${customRoleInput.trim()}` : 'Other (type custom role below)')
                        : role}
                    </span>
                    <span className="text-[10px] text-slate-400 block -mt-0.5">
                      {isCustomRole
                        ? 'Custom role specification'
                        : `${PRESET_ROLE_CONFIGS.find((r) => r.label === role)?.category || 'Tech'} Category`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {(isCustomRole || role !== 'Software Engineer (general)') && (
                    <button
                      type="button"
                      title="Reset role selection"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRole('Software Engineer (general)');
                        setIsCustomRole(false);
                        setCustomRoleInput('');
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="p-1 text-slate-400 group-hover:text-white transition-colors">
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180 text-violet-400' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Dropdown Popover Panel */}
              {isDropdownOpen && (
                <div
                  className="absolute left-0 right-0 top-full mt-2 z-50 bg-slate-900/98 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-2xl flex flex-col max-h-[320px] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                  style={{ filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.6))' }}
                >
                  {/* Pinned Search Input at Top */}
                  <div className="p-2.5 bg-slate-950/90 border-b border-white/10 flex items-center gap-2 shrink-0">
                    <Search className="w-4 h-4 text-violet-400 shrink-0 ml-1.5" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setHighlightedIndex(0);
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Search 30+ roles (e.g. Recruiter, Sales, Frontend)..."
                      className="w-full bg-transparent text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setHighlightedIndex(0);
                          searchInputRef.current?.focus();
                        }}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Scrollable List with Sticky Category Headings */}
                  <div
                    ref={listboxRef}
                    id={roleListId}
                    role="listbox"
                    aria-label="Roles list"
                    className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-slate-700"
                  >
                    {groupedRoles.map((group) => {
                      if (group.roles.length === 0) return null;
                      const meta = CATEGORY_META[group.category];
                      return (
                        <div key={group.category} role="group" aria-label={meta.title}>
                          {/* Sticky Group Header */}
                          <div className="sticky top-0 z-10 px-4 py-2 bg-slate-950/95 border-b border-white/5 backdrop-blur-md flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-violet-300">
                            <span className="flex items-center gap-1.5">
                              <span>{meta.icon}</span>
                              <span>{meta.title}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              {group.roles.length} roles
                            </span>
                          </div>

                          {/* Role Options */}
                          {group.roles.map((r) => {
                            const flatIndex = flattenedOptions.findIndex((item) => item.id === r.id);
                            const isSelected = !isCustomRole && role === r.label;
                            const isHighlighted = highlightedIndex === flatIndex;

                            return (
                              <div
                                key={r.id}
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setRole(r.label);
                                  setIsCustomRole(false);
                                  setIsDropdownOpen(false);
                                }}
                                onMouseEnter={() => setHighlightedIndex(flatIndex)}
                                className={`min-h-[44px] px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                                  isHighlighted
                                    ? 'bg-violet-600/25 text-violet-200'
                                    : isSelected
                                    ? 'bg-violet-600/15 text-violet-200 font-semibold'
                                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                                }`}
                              >
                                <span className="text-xs sm:text-sm">{r.label}</span>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}

                    {/* Sticky "Other" Group Heading */}
                    <div role="group" aria-label="Other / Custom Role">
                      <div className="sticky top-0 z-10 px-4 py-2 bg-slate-950/95 border-b border-white/5 backdrop-blur-md flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                        <span className="flex items-center gap-1.5">
                          <span>✨</span>
                          <span>Other / Custom Role</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">Dynamic AI</span>
                      </div>

                      {/* "Other (type your role)" option */}
                      {(() => {
                        const otherFlatIndex = flattenedOptions.findIndex((item) => item.isOther);
                        const isSelected = isCustomRole;
                        const isHighlighted = highlightedIndex === otherFlatIndex;

                        return (
                          <div
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setIsCustomRole(true);
                              setRole('Other');
                              setIsDropdownOpen(false);
                            }}
                            onMouseEnter={() => setHighlightedIndex(otherFlatIndex)}
                            className={`min-h-[44px] px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                              isHighlighted
                                ? 'bg-cyan-500/25 text-cyan-200'
                                : isSelected
                                ? 'bg-cyan-500/15 text-cyan-200 font-semibold'
                                : 'text-cyan-300 hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>✨</span>
                              <span className="text-xs sm:text-sm font-medium">Other (type your role)</span>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                          </div>
                        );
                      })()}

                      {/* Empty state prompt if search has 0 preset matches */}
                      {searchQuery.trim() && totalFilteredPresets === 0 && (
                        <div
                          onClick={() => {
                            setIsCustomRole(true);
                            setCustomRoleInput(searchQuery.trim());
                            setRole('Other');
                            setIsDropdownOpen(false);
                          }}
                          className="min-h-[44px] px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs flex items-center justify-between cursor-pointer border-t border-amber-500/20 transition-colors"
                        >
                          <span>No role found - click to use &quot;{searchQuery.trim()}&quot;</span>
                          <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Role Input when "Other" is chosen */}
              {isCustomRole && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-950/40 via-slate-900 to-cyan-950/40 border border-cyan-500/40 space-y-2 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-cyan-400" />
                      Specify Your Custom Job Role Title
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomRole(false);
                        setRole('Software Engineer (general)');
                        setCustomRoleInput('');
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                    >
                      Switch to presets
                    </button>
                  </div>
                  <input
                    type="text"
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                    placeholder="e.g. Chief of Staff, Bioinformatician, Developer Advocate, Flight Attendant"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-cyan-400/30 text-sm text-cyan-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                    required={isCustomRole}
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-400">
                    Gemini will dynamically generate role-specific competencies, scenarios, and scoring criteria for this title.
                  </p>
                </div>
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
          className="w-full py-3.5 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Starting Interview...</span>
            </>
          ) : (
            <>
              <span>Start Interview</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
