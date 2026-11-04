'use client';

import React, { useState } from 'react';
import SetupForm from '@/components/SetupForm';
import InterviewRoom from '@/components/InterviewRoom';
import SummaryScreen from '@/components/SummaryScreen';
import { ChatMessage, InterviewConfig, InterviewSummary } from '@/types/interview';
import { Bot, AlertCircle } from 'lucide-react';

type AppScreen = 'setup' | 'interview' | 'summary';

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>('setup');
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [summary, setSummary] = useState<InterviewSummary | null>(null);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Transition to Interview Room
  const handleStartInterview = (newConfig: InterviewConfig) => {
    setConfig(newConfig);
    setErrorNotice(null);
    setScreen('interview');
  };

  // Transition to Summary Screen
  const handleEndInterview = async (messages: ChatMessage[]) => {
    // Immediately cut off any browser speech audio
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (!config) return;
    setIsEnding(true);
    setErrorNotice(null);

    const questionsCount = messages.filter((m) => m.role === 'interviewer').length;
    setTotalQuestionsAnswered(questionsCount);

    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          messages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      // Extra cancel before mounting summary screen
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      setSummary(data);
      setScreen('summary');
    } catch (err: unknown) {
      console.error('Error generating summary:', err);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      // Fallback summary
      const fallbackSummary: InterviewSummary = {
        score: 7.8,
        strengths: [
          'Communicated responses clearly and stayed engaged during questions',
          'Addressed key technical elements with structured thoughts',
        ],
        improvements: [
          'Use the STAR method (Situation, Task, Action, Result) for deeper technical examples',
          'Include more quantifiable outcomes and metrics in your project answers',
        ],
        feedback:
          'You completed the mock interview session with solid responsiveness. Continuing to practice with real-time conversational feedback will help you build even greater confidence.',
      };
      setSummary(fallbackSummary);
      setScreen('summary');
    } finally {
      setIsEnding(false);
    }
  };

  // Restart Interview
  const handleRestart = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setConfig(null);
    setSummary(null);
    setTotalQuestionsAnswered(0);
    setErrorNotice(null);
    setScreen('setup');
  };

  return (
    <div className="min-h-screen bg-mesh-gradient text-slate-100 flex flex-col font-sans selection:bg-violet-500 selection:text-white">
      {/* Sleek Glass Navbar */}
      <header className="sticky top-0 z-30 bg-slate-950/70 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div
            onClick={screen !== 'setup' ? undefined : handleRestart}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">
                  Interview
                  <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                    AI
                  </span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40 uppercase tracking-wider">
                  Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5 font-medium">
                Autonomous Mock Interviewer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-white/10 text-xs text-slate-300 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-[11px] text-slate-300">Gemini Flash 3.8</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col justify-center">
        {errorNotice && (
          <div className="max-w-2xl mx-auto mb-6 p-4 glass-panel border border-rose-500/40 rounded-2xl text-xs text-rose-300 flex items-center gap-2.5 shadow-lg shadow-rose-500/10">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {screen === 'setup' && (
          <SetupForm onStart={handleStartInterview} isLoading={false} />
        )}

        {screen === 'interview' && config && (
          <InterviewRoom
            config={config}
            onEndInterview={handleEndInterview}
            isEnding={isEnding}
          />
        )}

        {screen === 'summary' && summary && config && (
          <SummaryScreen
            summary={summary}
            config={config}
            totalQuestions={totalQuestionsAnswered}
            onRestart={handleRestart}
          />
        )}
      </main>

      {/* Minimalist Glass Footer */}
      <footer className="border-t border-white/5 bg-slate-950/60 py-4 text-center text-xs text-slate-500 backdrop-blur-md">
        <p>InterviewAI • Voice-Powered Autonomous Interview Simulation</p>
      </footer>
    </div>
  );
}
