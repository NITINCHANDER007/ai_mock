'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  TrendingUp,
  MessageSquareQuote,
  RotateCcw,
  Sparkles,
  Briefcase,
  Clock,
  Globe2,
  Share2,
  Check,
  Star,
  Target,
  ArrowRight,
} from 'lucide-react';
import { InterviewConfig, InterviewSummary } from '@/types/interview';

interface SummaryScreenProps {
  summary: InterviewSummary;
  config: InterviewConfig;
  totalQuestions: number;
  onRestart: () => void;
}

export default function SummaryScreen({
  summary,
  config,
  totalQuestions,
  onRestart,
}: SummaryScreenProps) {
  const [copied, setCopied] = useState(false);
  const score = Math.round(summary.score * 10) / 10;

  // Ensure speech synthesis is completely stopped when viewing the summary
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const getScoreTheme = (val: number) => {
    if (val >= 8.5) {
      return {
        badge: 'from-emerald-500 to-teal-400',
        ring: 'border-emerald-500/50 shadow-emerald-500/30',
        text: 'text-emerald-300',
        label: 'Strong Hire • Top Tier Candidate',
      };
    }
    if (val >= 7.0) {
      return {
        badge: 'from-violet-500 to-indigo-400',
        ring: 'border-violet-500/50 shadow-violet-500/30',
        text: 'text-violet-300',
        label: 'Recommended • Solid Performance',
      };
    }
    if (val >= 5.5) {
      return {
        badge: 'from-amber-500 to-orange-400',
        ring: 'border-amber-500/50 shadow-amber-500/30',
        text: 'text-amber-300',
        label: 'Promising Foundation • Needs Polish',
      };
    }
    return {
      badge: 'from-rose-500 to-red-400',
      ring: 'border-rose-500/50 shadow-rose-500/30',
      text: 'text-rose-300',
      label: 'Developing • Requires Additional Practice',
    };
  };

  const theme = getScoreTheme(score);

  const handleCopyReport = () => {
    const text = `InterviewAI Mock Interview Report
Role: ${config.role} (${config.experience})
Score: ${score}/10 — ${theme.label}

Key Strengths:
${summary.strengths.map((s) => `• ${s}`).join('\n')}

Areas for Improvement:
${summary.improvements.map((i) => `• ${i}`).join('\n')}

Feedback:
${summary.feedback}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 py-4 animate-in fade-in duration-500">
      {/* Top Hero Score Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl text-center relative overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-violet-600/20 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Interview Performance Evaluation</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Interview Assessment Completed
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
            Evaluation for <span className="font-semibold text-slate-200">{config.role}</span> ({config.experience})
          </p>

          {/* Large Radial Score Display */}
          <div className="my-8 relative flex items-center justify-center">
            {/* Outer glowing aura */}
            <div className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full blur-xl absolute bg-gradient-to-tr ${theme.badge} opacity-30 animate-pulse`} />

            {/* Score Ring Container */}
            <div
              className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full glass-panel border-2 ${theme.ring} flex flex-col items-center justify-center relative z-10 shadow-2xl backdrop-blur-2xl`}
            >
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                  {score}
                </span>
                <span className="text-lg sm:text-xl font-medium text-slate-400">
                  /10
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Overall Score
              </span>
            </div>
          </div>

          {/* Performance Tier Label */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border border-white/10 ${theme.text} text-xs sm:text-sm font-bold shadow-lg`}>
            <Star className="w-4 h-4 fill-current" />
            <span>{theme.label}</span>
          </div>

          {/* Meta Statistics Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8 pt-6 border-t border-white/5 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card border-white/5">
              <Briefcase className="w-3.5 h-3.5 text-violet-400" />
              {config.role} ({config.type})
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card border-white/5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {totalQuestions} questions explored
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card border-white/5">
              <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
              {config.language}
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Strengths & Growth Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Strengths */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/10">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Key Strengths</h2>
              <p className="text-[11px] text-slate-400">What set you apart in this session</p>
            </div>
          </div>

          <ul className="space-y-3.5">
            {summary.strengths.map((item, idx) => (
              <li
                key={idx}
                className="text-xs sm:text-sm text-slate-300 flex items-start gap-3 leading-relaxed p-3 rounded-2xl bg-slate-900/40 border border-white/5"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Growth Areas */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 shadow-xl relative overflow-hidden group hover:border-violet-500/30 transition-all">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-md shadow-violet-500/10">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Areas for Improvement</h2>
              <p className="text-[11px] text-slate-400">Targeted adjustments for your next interview</p>
            </div>
          </div>

          <ul className="space-y-3.5">
            {summary.improvements.map((item, idx) => (
              <li
                key={idx}
                className="text-xs sm:text-sm text-slate-300 flex items-start gap-3 leading-relaxed p-3 rounded-2xl bg-slate-900/40 border border-white/5"
              >
                <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-3 h-3" />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recruiter Executive Feedback Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-500/10">
            <MessageSquareQuote className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base">Recruiter Feedback Note</h2>
            <p className="text-[11px] text-slate-400">Comprehensive summary of your answers</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/5 text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
          &ldquo;{summary.feedback}&rdquo;
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 pb-8">
        <button
          type="button"
          onClick={onRestart}
          className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer glow-btn"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Practice Another Round</span>
        </button>

        <button
          type="button"
          onClick={handleCopyReport}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl glass-panel hover:bg-slate-800/80 border border-white/15 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Report Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-violet-400" />
              <span>Copy Full Report</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
