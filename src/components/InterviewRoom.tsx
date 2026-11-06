'use client';

import React, {
  useReducer,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Mic,
  MicOff,
  Send,
  RotateCcw,
  Clock,
  PhoneOff,
  Video,
  VideoOff,
  Subtitles,
  Keyboard,
  User,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Loader2,
  Headphones,
  ArrowRight,
  GripHorizontal,
} from 'lucide-react';
import { ChatMessage, InterviewConfig } from '@/types/interview';

interface InterviewRoomProps {
  config: InterviewConfig;
  onEndInterview: (messages: ChatMessage[]) => void;
  isEnding: boolean;
}

// Strict Types for Web Speech API
interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: {
    isFinal: boolean;
    [subIndex: number]: SpeechRecognitionResultItem;
  };
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface IWindow extends Window {
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  SpeechRecognition?: SpeechRecognitionConstructor;
}

// Turn-Taking State Machine
export type TurnState =
  | 'AI_THINKING'
  | 'AI_SPEAKING'
  | 'USER_LISTENING'
  | 'USER_SPEAKING'
  | 'PROCESSING';

type TurnAction =
  | { type: 'START_AI_THINKING' }
  | { type: 'START_AI_SPEAKING' }
  | { type: 'START_USER_LISTENING' }
  | { type: 'START_USER_SPEAKING' }
  | { type: 'START_PROCESSING' };

function turnReducer(state: TurnState, action: TurnAction): TurnState {
  switch (action.type) {
    case 'START_AI_THINKING':
      return 'AI_THINKING';
    case 'START_AI_SPEAKING':
      return 'AI_SPEAKING';
    case 'START_USER_LISTENING':
      return 'USER_LISTENING';
    case 'START_USER_SPEAKING':
      return 'USER_SPEAKING';
    case 'START_PROCESSING':
      return 'PROCESSING';
    default:
      return state;
  }
}

// Tuned parameters for fast, natural conversational turn-taking
const SILENCE_MS = 1400; // 1.4s silence triggers speech completion
const PROMPT_SILENCE_MS = 15000; // 15s silence triggers gentle reminder
const MIN_WORDS_TO_SUBMIT = 3; // Never send an answer shorter than 3 words
const ECHO_COOLDOWN_MS = 800; // 800ms cooldown after AI speech ends to ignore echo
const BARGE_IN_ENABLED_DEFAULT = false; // Default false when headphones are not confirmed

// Request configuration with 20s timeout and strict retry policy
const MAX_REQUEST_RETRIES = 2; // up to 2 retries (important for 429 and 503)
const RETRY_DELAY_MS = 2000; // 2s delay between retries
const REQUEST_TIMEOUT_MS = 20000; // 20s timeout using AbortController

/**
 * Compares user text against the AI's sentence.
 * If >50% of the recognized words appear in the AI's current sentence, treat as echo.
 */
function isEchoOfAi(userText: string, aiText: string): boolean {
  if (!userText.trim() || !aiText.trim()) return false;

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .split(/\s+/)
      .filter((w) => w.length > 1);

  const userWords = normalize(userText);
  const aiWords = new Set(normalize(aiText));

  if (userWords.length === 0 || aiWords.size === 0) return false;

  let matchCount = 0;
  for (const word of userWords) {
    if (aiWords.has(word)) {
      matchCount++;
    }
  }

  return matchCount / userWords.length > 0.5;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getSmartFallback(
  config: InterviewConfig,
  isFirst: boolean
): { text: string; type: 'new_question' | 'follow_up' | 'closing' } {
  const lang = config.language;
  const roleTitle = config.role || 'this position';

  if (isFirst) {
    if (lang === 'Hindi') {
      return {
        text: `नमस्ते! ${roleTitle} पद के साक्षात्कार में आपका स्वागत है। बातचीत शुरू करने के लिए, कृपया अपने और अपने अनुभव के बारे में संक्षेप में बताइए।`,
        type: 'new_question',
      };
    }
    if (lang === 'Hinglish') {
      return {
        text: `Hello, welcome to your mock interview for ${roleTitle}! To get started, please apne background aur experience ke baare me thoda batayein.`,
        type: 'new_question',
      };
    }
    return {
      text: `Welcome to the interview for ${roleTitle}! It's a pleasure to connect with you today. To get started, could you please introduce yourself and walk me through your relevant background?`,
      type: 'new_question',
    };
  }

  if (lang === 'Hindi') {
    return {
      text: `धन्यवाद। क्या आप ${roleTitle} के रूप में अपने हालिया काम में आई किसी मुख्य चुनौती और उसे हल करने के अपने दृष्टिकोण के बारे में बता सकते हैं?`,
      type: 'new_question',
    };
  }
  if (lang === 'Hinglish') {
    return {
      text: `Understood. Aap apne ${roleTitle} role me jo complex challenge solve kiya, uske baare me thoda detail me explain karenge?`,
      type: 'new_question',
    };
  }
  return {
    text: `Thank you for sharing that. Could you describe a challenging scenario you encountered recently in your work as a ${roleTitle}, and how you approached resolving it?`,
    type: 'new_question',
  };
}

export default function InterviewRoom({
  config,
  onEndInterview,
  isEnding,
}: InterviewRoomProps) {
  // State Machine
  const [turnState, dispatch] = useReducer(turnReducer, 'AI_THINKING');
  const turnStateRef = useRef<TurnState>('AI_THINKING');

  useEffect(() => {
    turnStateRef.current = turnState;
  }, [turnState]);

  // Guaranteed termination & abort guards
  const isInterviewEndedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Connection error & retry state
  const [connectionError, setConnectionError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastUserAnswerRef = useRef<string>('');

  // Conversation transcript state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const [currentAiQuestion, setCurrentAiQuestion] = useState<string>('');
  const currentAiQuestionRef = useRef<string>('');
  useEffect(() => {
    currentAiQuestionRef.current = currentAiQuestion;
  }, [currentAiQuestion]);

  // Invocation & barge-in guards
  const hasStartedRef = useRef(false);
  const isRequestInFlightRef = useRef(false);
  const hasPromptedSilenceRef = useRef(false);
  const isInterruptedRef = useRef(false);
  const isTtsActiveRef = useRef(false);
  const ttsEndedAtRef = useRef<number>(0);
  const activeTurnIdRef = useRef<string>('');

  // Structured main question counter
  const [mainQuestionIndex, setMainQuestionIndex] = useState(1);

  // Headphones mode (allows interrupting AI only when confirmed)
  const [useHeadphones, setUseHeadphones] = useState(BARGE_IN_ENABLED_DEFAULT);
  const useHeadphonesRef = useRef(BARGE_IN_ENABLED_DEFAULT);
  useEffect(() => {
    useHeadphonesRef.current = useHeadphones;
  }, [useHeadphones]);

  // AI Voice Mute state
  const [isAiMuted, setIsAiMuted] = useState(false);
  const isAiMutedRef = useRef(false);
  useEffect(() => {
    isAiMutedRef.current = isAiMuted;
  }, [isAiMuted]);

  // Draggable Camera PIP state
  const [cameraPos, setCameraPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingCameraRef = useRef(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Timer
  const [timeLeft, setTimeLeft] = useState(config.duration * 60);
  const onEndInterviewRef = useRef(onEndInterview);
  useEffect(() => {
    onEndInterviewRef.current = onEndInterview;
  }, [onEndInterview]);

  // Captions state
  const [captionText, setCaptionText] = useState<string>('');
  const [captionSpeaker, setCaptionSpeaker] = useState<'AI' | 'You' | ''>('');
  const [showCaptions, setShowCaptions] = useState(true);
  const captionFadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Speech Recognition (STT) state
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(() => {
    if (typeof window === 'undefined') return true;
    const win = window as unknown as IWindow;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  });
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Buffers
  const finalTranscriptRef = useRef<string>('');
  const currentSpokenTextRef = useRef<string>('');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const promptSilenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechWatchdogRef = useRef<NodeJS.Timeout | null>(null);

  // "Type instead" drawer state
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');

  // Camera preview & Audio Enhancement
  const [cameraActive, setCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Female Voice & SpeechSynthesis state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const selectedVoiceNameRef = useRef<string>('');
  useEffect(() => {
    voicesRef.current = voices;
  }, [voices]);
  useEffect(() => {
    selectedVoiceNameRef.current = selectedVoiceName;
  }, [selectedVoiceName]);

  // Calculate total main questions based on chosen duration (~1 question per 2.5 min)
  const totalQuestionsTarget = Math.max(3, Math.round(config.duration / 2.5));

  // -------------------------------------------------------------
  // 1. Terminate Session & Kill All In-Flight Speech / Requests
  // -------------------------------------------------------------
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const terminateInterviewSession = useCallback(() => {
    isInterviewEndedRef.current = true;

    // Abort pending fetch requests immediately
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear all pending timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (promptSilenceTimerRef.current) {
      clearTimeout(promptSilenceTimerRef.current);
      promptSilenceTimerRef.current = null;
    }
    if (captionFadeTimeoutRef.current) {
      clearTimeout(captionFadeTimeoutRef.current);
      captionFadeTimeoutRef.current = null;
    }
    if (speechWatchdogRef.current) {
      clearTimeout(speechWatchdogRef.current);
      speechWatchdogRef.current = null;
    }

    // Cancel speech synthesis immediately
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    // Abort speech recognition immediately
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    stopCamera();
  }, [stopCamera]);

  // -------------------------------------------------------------
  // 2. Female Voice Selection
  // -------------------------------------------------------------
  const selectDefaultFemaleVoice = useCallback(
    (availableVoices: SpeechSynthesisVoice[]) => {
      if (!availableVoices.length) return null;
      const lang = config.language;
      let matchedVoice: SpeechSynthesisVoice | undefined;

      if (lang === 'Hindi') {
        matchedVoice =
          availableVoices.find(
            (v) =>
              (v.lang.startsWith('hi') || v.lang.includes('IN')) &&
              (v.name.toLowerCase().includes('female') ||
                v.name.includes('हिन्दी') ||
                v.name.includes('Kalpana') ||
                v.name.includes('Swara'))
          ) ||
          availableVoices.find((v) => v.lang.startsWith('hi')) ||
          availableVoices.find((v) => v.lang.includes('IN'));
      } else if (lang === 'Hinglish') {
        matchedVoice =
          availableVoices.find(
            (v) =>
              (v.lang === 'en-IN' || v.lang.startsWith('hi')) &&
              (v.name.toLowerCase().includes('female') ||
                v.name.includes('Neerja') ||
                v.name.includes('Heera') ||
                v.name.includes('Sangeeta'))
          ) ||
          availableVoices.find((v) => v.lang === 'en-IN') ||
          availableVoices.find((v) => v.lang.startsWith('hi'));
      } else {
        matchedVoice =
          availableVoices.find((v) =>
            v.name.includes('Google UK English Female')
          ) ||
          availableVoices.find((v) =>
            v.name.toLowerCase().includes('zira')
          ) ||
          availableVoices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.toLowerCase().includes('female') ||
                v.name.toLowerCase().includes('natural') ||
                v.name.toLowerCase().includes('samantha') ||
                v.name.toLowerCase().includes('jenny') ||
                v.name.toLowerCase().includes('sonia') ||
                v.name.toLowerCase().includes('victoria'))
          ) ||
          availableVoices.find((v) => v.lang.startsWith('en'));
      }

      return matchedVoice || availableVoices[0];
    },
    [config.language]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        setVoices(allVoices);
        const bestFemaleVoice = selectDefaultFemaleVoice(allVoices);
        if (bestFemaleVoice) {
          setSelectedVoiceName(bestFemaleVoice.name);
        }
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [selectDefaultFemaleVoice]);

  // -------------------------------------------------------------
  // 3. Camera Setup with Echo Cancellation & Safe Cleanup
  // -------------------------------------------------------------
  const startCamera = useCallback(async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError(true);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 480 },
          height: { ideal: 360 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (isInterviewEndedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setCameraError(false);
    } catch {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (isInterviewEndedRef.current) {
          videoStream.getTracks().forEach((t) => t.stop());
          return;
        }
        mediaStreamRef.current = videoStream;
        if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
        }
        setCameraActive(true);
        setCameraError(false);
      } catch {
        setCameraError(true);
        setCameraActive(false);
      }
    }
  }, []);

  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  useEffect(() => {
    let isCancelled = false;

    async function initCamera() {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          if (!isCancelled) setCameraError(true);
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 480 },
            height: { ideal: 360 },
            facingMode: 'user',
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (isCancelled || isInterviewEndedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        if (!isCancelled) {
          setCameraActive(true);
          setCameraError(false);
        }
      } catch {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          if (isCancelled || isInterviewEndedRef.current) {
            videoStream.getTracks().forEach((t) => t.stop());
            return;
          }
          mediaStreamRef.current = videoStream;
          if (videoRef.current) {
            videoRef.current.srcObject = videoStream;
          }
          if (!isCancelled) {
            setCameraActive(true);
            setCameraError(false);
          }
        } catch {
          if (!isCancelled) {
            setCameraError(true);
            setCameraActive(false);
          }
        }
      }
    }

    initCamera();

    return () => {
      isCancelled = true;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  // -------------------------------------------------------------
  // 4. Centralized `speak()` Engine (Guaranteed Non-Blocking)
  // -------------------------------------------------------------
  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (isInterviewEndedRef.current) return;

      // Reset interrupted flag on new speech turn
      isInterruptedRef.current = false;

      // IMMEDIATELY transition to AI_SPEAKING and update captions so UI never hangs
      turnStateRef.current = 'AI_SPEAKING';
      dispatch({ type: 'START_AI_SPEAKING' });
      setCaptionSpeaker('AI');
      setCaptionText(text);

      if (captionFadeTimeoutRef.current) {
        clearTimeout(captionFadeTimeoutRef.current);
        captionFadeTimeoutRef.current = null;
      }

      if (speechWatchdogRef.current) {
        clearTimeout(speechWatchdogRef.current);
        speechWatchdogRef.current = null;
      }

      // If AI Voice is muted: show captions, pause briefly for reading, and advance to user turn
      if (isAiMutedRef.current) {
        isTtsActiveRef.current = false;
        ttsEndedAtRef.current = Date.now();
        const wordsCount = text.trim().split(/\s+/).length;
        const readingMs = Math.min(6000, Math.max(2200, wordsCount * 170));
        speechWatchdogRef.current = setTimeout(() => {
          if (isInterviewEndedRef.current) return;
          finalTranscriptRef.current = '';
          currentSpokenTextRef.current = '';
          if (onEnd) onEnd();
          else dispatch({ type: 'START_USER_LISTENING' });
        }, readingMs);
        return;
      }

      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (onEnd) onEnd();
        else dispatch({ type: 'START_USER_LISTENING' });
        return;
      }

      // Resume speech engine in case Chromium engine entered paused state
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      } catch {}

      const utterance = new SpeechSynthesisUtterance(text);

      const chosenVoice = voicesRef.current.find(
        (v) => v.name === selectedVoiceNameRef.current
      );
      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang;
      } else {
        utterance.lang = config.language === 'Hindi' ? 'hi-IN' : 'en-US';
      }

      utterance.rate = 1.05;
      utterance.pitch = 1.05;

      isTtsActiveRef.current = true;

      // Safety watchdog: if Chrome hangs or fails to fire onend, auto-advance
      let hasCompleted = false;
      const wordsCount = text.trim().split(/\s+/).length;
      const estimatedMs = Math.min(16000, Math.max(3500, wordsCount * 450));

      const finalizeSpeechTurn = () => {
        if (hasCompleted || isInterviewEndedRef.current) return;
        hasCompleted = true;
        isTtsActiveRef.current = false;
        ttsEndedAtRef.current = Date.now();

        if (speechWatchdogRef.current) {
          clearTimeout(speechWatchdogRef.current);
          speechWatchdogRef.current = null;
        }

        // Clear recognition buffers immediately so any lingering echoed sound is discarded
        finalTranscriptRef.current = '';
        currentSpokenTextRef.current = '';

        // If candidate barged in, do NOT overwrite their speaking state!
        if (isInterruptedRef.current) return;

        // Echo guard: delay transitioning to USER_LISTENING until after the 800ms cooldown
        setTimeout(() => {
          if (isInterviewEndedRef.current) return;
          // Clear again after cooldown to be 100% sure no echo leaked into buffers
          finalTranscriptRef.current = '';
          currentSpokenTextRef.current = '';

          if (!isInterruptedRef.current) {
            turnStateRef.current = 'USER_LISTENING';
            if (onEnd) {
              onEnd();
            } else {
              dispatch({ type: 'START_USER_LISTENING' });
            }
          }
        }, ECHO_COOLDOWN_MS);
      };

      speechWatchdogRef.current = setTimeout(() => {
        finalizeSpeechTurn();
      }, estimatedMs);

      utterance.onend = () => {
        finalizeSpeechTurn();
      };

      utterance.onerror = () => {
        finalizeSpeechTurn();
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        finalizeSpeechTurn();
      }
    },
    [config.language]
  );

  // -------------------------------------------------------------
  // 5. Robust Question Fetch Engine with Smart Retry Policy
  // -------------------------------------------------------------
  const executeQuestionRequest = useCallback(
    async (
      messagesPayload: ChatMessage[],
      isInitialGreeting: boolean
    ): Promise<boolean> => {
      let attempt = 0;
      let lastErrorMessage = '';
      let isRetryable = false;

      // Single turn ID guard to prevent double triggers
      const turnId = `turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      activeTurnIdRef.current = turnId;

      while (attempt <= MAX_REQUEST_RETRIES) {
        if (isInterviewEndedRef.current) return false;
        attempt++;

        // Fast timeout with AbortController so user never waits forever
        const controller = new AbortController();
        abortControllerRef.current = controller;

        let timeoutId: NodeJS.Timeout | null = null;
        let isTimedOut = false;

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            isTimedOut = true;
            try {
              controller.abort();
            } catch {}
            reject(new Error('Request timed out after 20 seconds'));
          }, REQUEST_TIMEOUT_MS);
        });

        try {
          const fetchPromise = fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              config,
              messages: messagesPayload,
            }),
            signal: controller.signal,
          });

          const res = await Promise.race([fetchPromise, timeoutPromise]);
          if (timeoutId) clearTimeout(timeoutId);

          if (isInterviewEndedRef.current) return false;

          const data = (await res.json().catch(() => null)) as {
            question?: string;
            text?: string;
            type?: 'new_question' | 'follow_up' | 'closing';
            error?: string;
            status?: number;
          } | null;

          const nextQ = (data?.text || data?.question || '').trim();

          // Check for API errors or empty question response
          if (!res.ok || !nextQ) {
            const statusCode = res.status;
            const serverMsg =
              data?.error || `Error ${statusCode}: Failed to generate question`;

            lastErrorMessage = serverMsg.startsWith('Error ')
              ? serverMsg
              : `Error ${statusCode}: ${serverMsg}`;

            // Retry ONLY on 429, 503, 502, 504 and network/timeouts
            // Do NOT retry 400 or other 4xx errors!
            isRetryable =
              statusCode === 429 ||
              statusCode === 503 ||
              statusCode === 502 ||
              statusCode === 504;

            console.error(
              `[InterviewRoom] API error (status ${statusCode}):`,
              serverMsg
            );

            if (!isRetryable) {
              // 400 or other client error: stop retrying immediately!
              break;
            }

            throw new Error(lastErrorMessage);
          }

          // Double trigger guard: if superseded by a newer turn, drop this stale response
          if (activeTurnIdRef.current !== turnId) {
            return false;
          }

          const qType =
            data?.type || (isInitialGreeting ? 'new_question' : 'follow_up');

          // Increment mainQuestionIndex ONLY when the AI introduces a new main topic
          if (!isInitialGreeting && qType === 'new_question') {
            setMainQuestionIndex((prev) => Math.min(prev + 1, totalQuestionsTarget));
          } else if (isInitialGreeting) {
            setMainQuestionIndex(1);
          }

          setConnectionError(false);
          setErrorMessage(null);

          const interviewerMessage: ChatMessage = {
            id: `interviewer-${Date.now()}`,
            role: 'interviewer',
            content: nextQ,
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };

          messagesRef.current = isInitialGreeting
            ? [interviewerMessage]
            : [...messagesRef.current, interviewerMessage];
          setMessages(messagesRef.current);
          setCurrentAiQuestion(nextQ);

          speak(nextQ, () => {
            if (!isInterviewEndedRef.current) {
              dispatch({ type: 'START_USER_LISTENING' });
            }
          });

          return true; // Successfully received and initiated question!
        } catch (err: unknown) {
          if (timeoutId) clearTimeout(timeoutId);
          if (isInterviewEndedRef.current) return false;

          const errorInstance = err as Error;

          // If aborted by user-initiated action (not our timeout), stop retrying
          if (errorInstance?.name === 'AbortError' && !isTimedOut) {
            return false;
          }

          if (isTimedOut) {
            lastErrorMessage = 'Error: Request timed out after 20 seconds';
            isRetryable = true; // timeout is retryable
          } else if (!lastErrorMessage) {
            lastErrorMessage = errorInstance?.message || 'Network error occurred';
            isRetryable = true; // network error is retryable
          }

          console.warn(
            `[InterviewRoom] Attempt ${attempt}/${MAX_REQUEST_RETRIES + 1} failed: ${lastErrorMessage}`
          );

          // If non-retryable or max retries exceeded, exit retry loop
          if (!isRetryable || attempt > MAX_REQUEST_RETRIES) {
            break;
          }

          // Delay before next attempt
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }

      // If all attempts failed or permanent error occurred:
      if (!isInterviewEndedRef.current) {
        console.error('[InterviewRoom] Request failed permanently:', lastErrorMessage);
        setErrorMessage(lastErrorMessage || 'Connection problem');

        // If this is the initial greeting, immediately start the interview with the contextual greeting!
        if (isInitialGreeting) {
          const fallback = getSmartFallback(config, true);
          setMainQuestionIndex(1);
          const initialMsg: ChatMessage = {
            id: `interviewer-${Date.now()}`,
            role: 'interviewer',
            content: fallback.text,
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
          messagesRef.current = [initialMsg];
          messagesRef.current = [initialMsg];
        setMessages([initialMsg]);
          setCurrentAiQuestion(fallback.text);
          speak(fallback.text, () => {
            if (!isInterviewEndedRef.current) {
              dispatch({ type: 'START_USER_LISTENING' });
            }
          });
          return true;
        }

        // For follow-up questions, leave thinking state and show retry button
        dispatch({ type: 'START_USER_LISTENING' });
        setConnectionError(true);
      }

      return false;
    },
    [config, speak, totalQuestionsTarget]
  );

  // -------------------------------------------------------------
  // 6. Send Answer to Gemini with Guaranteed try/catch/finally
  // -------------------------------------------------------------
  const sendAnswerToGemini = useCallback(
    async (finalAnswer: string) => {
      if (isInterviewEndedRef.current || isRequestInFlightRef.current) return;

      const trimmedAnswer = finalAnswer.trim();
      const wordCount = countWords(trimmedAnswer);

      // Guard: Never send an answer shorter than 3 words
      if (wordCount < MIN_WORDS_TO_SUBMIT) {
        console.warn(
          '[sendAnswerToGemini] Answer ignored: shorter than 3 words (',
          wordCount,
          ')'
        );
        finalTranscriptRef.current = '';
        currentSpokenTextRef.current = '';
        dispatch({ type: 'START_USER_LISTENING' });
        return;
      }

      // Guard: Never send text that is mostly the same as the AI's current/last question (echo prevention)
      if (isEchoOfAi(trimmedAnswer, currentAiQuestionRef.current)) {
        console.warn(
          '[sendAnswerToGemini] Answer ignored: echo detected (>50% match with AI question)'
        );
        finalTranscriptRef.current = '';
        currentSpokenTextRef.current = '';
        dispatch({ type: 'START_USER_LISTENING' });
        return;
      }

      isRequestInFlightRef.current = true;
      setConnectionError(false);

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (promptSilenceTimerRef.current) {
        clearTimeout(promptSilenceTimerRef.current);
        promptSilenceTimerRef.current = null;
      }

      finalTranscriptRef.current = '';
      currentSpokenTextRef.current = '';
      hasPromptedSilenceRef.current = false;
      lastUserAnswerRef.current = trimmedAnswer;

      dispatch({ type: 'START_PROCESSING' });
      setCaptionSpeaker('You');
      setCaptionText(trimmedAnswer);

      const candidateMessage: ChatMessage = {
        id: `candidate-${Date.now()}`,
        role: 'candidate',
        content: trimmedAnswer,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      const newHistory = [...messagesRef.current, candidateMessage];
      setMessages(newHistory);

      try {
        await executeQuestionRequest(newHistory, false);
      } catch (err) {
        console.error('[sendAnswerToGemini] Unhandled error:', err);
        dispatch({ type: 'START_USER_LISTENING' });
        setConnectionError(true);
      } finally {
        // ALWAYS reset isRequestInFlight to false in finally, even on error!
        isRequestInFlightRef.current = false;
        abortControllerRef.current = null;
      }
    },
    [executeQuestionRequest]
  );

  const ensureRecognitionStarted = useCallback(() => {
    if (isInterviewEndedRef.current || !recognitionRef.current || isMutedRef.current) return;
    try {
      recognitionRef.current.start();
    } catch {}
  }, []);

  // -------------------------------------------------------------
  // 7. Speech Recognition Setup with Strict Echo Guard & Barge-in
  // -------------------------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang =
      config.language === 'Hindi'
        ? 'hi-IN'
        : config.language === 'Hinglish'
        ? 'en-IN'
        : 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (isInterviewEndedRef.current) return;

      const isTtsSpeaking = isTtsActiveRef.current;
      const isWithinEchoCooldown =
        Date.now() - ttsEndedAtRef.current < ECHO_COOLDOWN_MS;

      // 1. Echo guard: While AI is speaking and for 800ms after it ends, IGNORE all speech recognition
      if (isTtsSpeaking || isWithinEchoCooldown) {
        // If headphones are NOT enabled, barge-in is disabled completely!
        if (!useHeadphonesRef.current) {
          finalTranscriptRef.current = '';
          currentSpokenTextRef.current = '';
          return;
        }

        // If headphones are enabled, allow interrupting ONLY while actively speaking (not during post-speech cooldown)
        if (!isTtsSpeaking) {
          finalTranscriptRef.current = '';
          currentSpokenTextRef.current = '';
          return;
        }
      }

      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current +=
            (finalTranscriptRef.current ? ' ' : '') + chunk.trim();
        } else {
          interim += ' ' + chunk;
        }
      }

      const combinedText = (finalTranscriptRef.current + interim).trim();
      const wordsSpoken = countWords(combinedText);

      // 2. Strict Barge-In Interruption (only when AI is speaking and headphones mode is active)
      if (turnStateRef.current === 'AI_SPEAKING' || isTtsSpeaking) {
        if (!useHeadphonesRef.current) {
          finalTranscriptRef.current = '';
          currentSpokenTextRef.current = '';
          return;
        }

        // Only allow interrupting if user speaks 4+ words AND text is NOT similar to AI's current sentence
        const isEcho = isEchoOfAi(combinedText, currentAiQuestionRef.current);
        if (wordsSpoken >= 4 && !isEcho) {
          isInterruptedRef.current = true;
          isTtsActiveRef.current = false;
          ttsEndedAtRef.current = 0;

          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            try {
              window.speechSynthesis.cancel();
            } catch {}
          }

          if (speechWatchdogRef.current) {
            clearTimeout(speechWatchdogRef.current);
            speechWatchdogRef.current = null;
          }

          setMessages((prev) => {
            if (!prev.length) return prev;
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (
              lastMsg &&
              lastMsg.role === 'interviewer' &&
              !lastMsg.content.includes('(interrupted)')
            ) {
              updated[updated.length - 1] = {
                ...lastMsg,
                content: `${lastMsg.content} (interrupted)`,
              };
            }
            return updated;
          });

          dispatch({ type: 'START_USER_SPEAKING' });
        } else {
          // Either too few words or resembles AI's sentence (echo): ignore!
          return;
        }
      }

      // If user is listening and speaks:
      if (turnStateRef.current === 'USER_LISTENING' && wordsSpoken >= 1) {
        // If it looks like an echo of the AI question, discard!
        if (isEchoOfAi(combinedText, currentAiQuestionRef.current)) {
          finalTranscriptRef.current = '';
          currentSpokenTextRef.current = '';
          return;
        }

        dispatch({ type: 'START_USER_SPEAKING' });
        if (promptSilenceTimerRef.current) {
          clearTimeout(promptSilenceTimerRef.current);
          promptSilenceTimerRef.current = null;
        }
      }

      if (
        turnStateRef.current === 'USER_SPEAKING' ||
        turnStateRef.current === 'USER_LISTENING'
      ) {
        currentSpokenTextRef.current = combinedText;

        if (combinedText) {
          setCaptionSpeaker('You');
          setCaptionText(combinedText);
          setTypedAnswer(combinedText);

          if (captionFadeTimeoutRef.current) {
            clearTimeout(captionFadeTimeoutRef.current);
            captionFadeTimeoutRef.current = null;
          }
        }

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        silenceTimerRef.current = setTimeout(() => {
          if (isInterviewEndedRef.current || isRequestInFlightRef.current) return;
          const finalSpoken = currentSpokenTextRef.current.trim();
          const words = countWords(finalSpoken);

          // Never send an answer shorter than 3 words, and never send text that is mostly the same as the AI's question
          if (
            words >= MIN_WORDS_TO_SUBMIT &&
            turnStateRef.current === 'USER_SPEAKING' &&
            !isEchoOfAi(finalSpoken, currentAiQuestionRef.current)
          ) {
            sendAnswerToGemini(finalSpoken);
          } else if (isEchoOfAi(finalSpoken, currentAiQuestionRef.current)) {
            finalTranscriptRef.current = '';
            currentSpokenTextRef.current = '';
            dispatch({ type: 'START_USER_LISTENING' });
          }
        }, SILENCE_MS);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        setIsSpeechSupported(false);
      }
    };

    recognition.onend = () => {
      if (isInterviewEndedRef.current) return;
      const current = turnStateRef.current;
      if (
        !isMutedRef.current &&
        (current === 'USER_LISTENING' || current === 'USER_SPEAKING' || current === 'AI_SPEAKING')
      ) {
        // Safe debounced restart to avoid Chromium already-started throw
        setTimeout(() => {
          if (!isInterviewEndedRef.current && !isMutedRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch {}
          }
        }, 150);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {}

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (promptSilenceTimerRef.current) {
        clearTimeout(promptSilenceTimerRef.current);
        promptSilenceTimerRef.current = null;
      }
      if (speechWatchdogRef.current) {
        clearTimeout(speechWatchdogRef.current);
        speechWatchdogRef.current = null;
      }
      recognition.abort();
    };
  }, [config.language, sendAnswerToGemini]);

  // -------------------------------------------------------------
  // 8. Turn State Transitions & Gentle Silence Prompt
  // -------------------------------------------------------------
  useEffect(() => {
    if (isInterviewEndedRef.current) return;

    if (turnState === 'USER_LISTENING') {
      ensureRecognitionStarted();

      if (promptSilenceTimerRef.current) {
        clearTimeout(promptSilenceTimerRef.current);
        promptSilenceTimerRef.current = null;
      }

      promptSilenceTimerRef.current = setTimeout(() => {
        if (
          !isInterviewEndedRef.current &&
          turnStateRef.current === 'USER_LISTENING' &&
          !hasPromptedSilenceRef.current &&
          !isRequestInFlightRef.current &&
          !connectionError
        ) {
          hasPromptedSilenceRef.current = true;
          const hint =
            config.language === 'Hindi'
              ? 'आराम से सोचिए, क्या आप चाहते हैं कि मैं सवाल दोहराऊं?'
              : 'Take your time, would you like me to repeat the question?';

          speak(hint, () => {
            if (!isInterviewEndedRef.current) {
              dispatch({ type: 'START_USER_LISTENING' });
            }
          });
        }
      }, PROMPT_SILENCE_MS);
    }

    if (turnState === 'AI_SPEAKING') {
      ensureRecognitionStarted();
    }
  }, [turnState, config.language, ensureRecognitionStarted, speak, connectionError]);

  // -------------------------------------------------------------
  // 9. Initial Start with Strict Mode Guard
  // -------------------------------------------------------------
  useEffect(() => {
    if (hasStartedRef.current || isInterviewEndedRef.current) return;
    hasStartedRef.current = true;

    async function initialStart() {
      isRequestInFlightRef.current = true;
      setConnectionError(false);
      dispatch({ type: 'START_AI_THINKING' });

      try {
        await executeQuestionRequest([], true);
      } catch (err) {
        console.error('[initialStart] Error:', err);
        // Instant start fallback so candidate never waits
        const fallback = getSmartFallback(config, true);
        setMainQuestionIndex(1);
        const initialMsg: ChatMessage = {
          id: `interviewer-${Date.now()}`,
          role: 'interviewer',
          content: fallback.text,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        messagesRef.current = [initialMsg];
        setMessages([initialMsg]);
        setCurrentAiQuestion(fallback.text);
        speak(fallback.text, () => {
          if (!isInterviewEndedRef.current) {
            dispatch({ type: 'START_USER_LISTENING' });
          }
        });
      } finally {
        // ALWAYS reset isRequestInFlight to false in finally
        isRequestInFlightRef.current = false;
        abortControllerRef.current = null;

        // Guaranteed safety check: if no message was loaded, immediately speak smart contextual greeting
        if (messagesRef.current.length === 0 && !isInterviewEndedRef.current) {
          const fallback = getSmartFallback(config, true);
          setMainQuestionIndex(1);
          const initialMsg: ChatMessage = {
            id: `interviewer-${Date.now()}`,
            role: 'interviewer',
            content: fallback.text,
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
          messagesRef.current = [initialMsg];
          messagesRef.current = [initialMsg];
        setMessages([initialMsg]);
          setCurrentAiQuestion(fallback.text);
          speak(fallback.text, () => {
            if (!isInterviewEndedRef.current) {
              dispatch({ type: 'START_USER_LISTENING' });
            }
          });
        }
      }
    }

    initialStart();

    return () => {
      // Clean up speech and timers on unmount
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [config, executeQuestionRequest, speak]);

  // -------------------------------------------------------------
  // 10. Manual Controls, Retry & "Tap to proceed" Handling
  // -------------------------------------------------------------
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      isMutedRef.current = false;
      ensureRecognitionStarted();
    } else {
      setIsMuted(true);
      isMutedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    }
  };

  const handleRepeatQuestion = () => {
    if (
      isInterviewEndedRef.current ||
      !currentAiQuestion ||
      turnState === 'AI_THINKING' ||
      turnState === 'PROCESSING'
    )
      return;
    speak(currentAiQuestion, () => {
      if (!isInterviewEndedRef.current) {
        dispatch({ type: 'START_USER_LISTENING' });
      }
    });
  };

  // Connection problem: retry resending the last user answer or initial question
  const handleRetry = useCallback(async () => {
    if (isInterviewEndedRef.current || isRequestInFlightRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    isRequestInFlightRef.current = true;
    setConnectionError(false);
    setErrorMessage(null);

    const isInitial = messagesRef.current.length === 0;

    if (isInitial) {
      dispatch({ type: 'START_AI_THINKING' });
    } else {
      dispatch({ type: 'START_PROCESSING' });
    }

    try {
      await executeQuestionRequest(messagesRef.current, isInitial);
    } catch (err) {
      console.error('[handleRetry] Retry failed:', err);
      dispatch({ type: 'START_USER_LISTENING' });
      setConnectionError(true);
    } finally {
      // ALWAYS reset isRequestInFlight to false in finally
      isRequestInFlightRef.current = false;
      abortControllerRef.current = null;
    }
  }, [executeQuestionRequest]);

  // "Tap to proceed" link: cancels stuck request, resets flags, and asks next question
  const handleForceAdvance = () => {
    if (isInterviewEndedRef.current) return;

    // 1. Cancel the stuck request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Reset all flags
    isRequestInFlightRef.current = false;
    setConnectionError(false);
    setErrorMessage(null);

    // 3. Immediately ask next question / greeting via smart context fallback
    const isInitial = messagesRef.current.length === 0;
    const fallback = getSmartFallback(config, isInitial);

    if (!isInitial) {
      setMainQuestionIndex((prev) => Math.min(prev + 1, totalQuestionsTarget));
    } else {
      setMainQuestionIndex(1);
    }

    const newMsg: ChatMessage = {
      id: `manual-interviewer-${Date.now()}`,
      role: 'interviewer',
      content: fallback.text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    messagesRef.current = isInitial ? [newMsg] : [...messagesRef.current, newMsg];
    setMessages(messagesRef.current);
    setCurrentAiQuestion(fallback.text);

    speak(fallback.text, () => {
      if (!isInterviewEndedRef.current) {
        dispatch({ type: 'START_USER_LISTENING' });
      }
    });
  };

  // Toggle AI Voice Mute
  const toggleAiMute = () => {
    if (isAiMuted) {
      setIsAiMuted(false);
    } else {
      setIsAiMuted(true);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      isTtsActiveRef.current = false;
      ttsEndedAtRef.current = Date.now();
      if (turnStateRef.current === 'AI_SPEAKING') {
        dispatch({ type: 'START_USER_LISTENING' });
      }
    }
  };

  // Draggable camera pointer handlers
  const handleCameraPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    isDraggingCameraRef.current = true;
    target.setPointerCapture(e.pointerId);
  };

  const handleCameraPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingCameraRef.current) return;
    const containerWidth = 210;
    const containerHeight = 160;
    const padding = 12;

    const maxX = window.innerWidth - containerWidth - padding;
    const maxY = window.innerHeight - containerHeight - padding;

    const nextX = Math.max(padding, Math.min(maxX, e.clientX - dragOffsetRef.current.x));
    const nextY = Math.max(padding, Math.min(maxY, e.clientY - dragOffsetRef.current.y));

    setCameraPos({ x: nextX, y: nextY });
  };

  const handleCameraPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingCameraRef.current) {
      isDraggingCameraRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleManualSendTyped = () => {
    const text = typedAnswer.trim();
    if (!text || turnState === 'PROCESSING' || turnState === 'AI_THINKING') return;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setShowTypeInput(false);
    sendAnswerToGemini(text);
  };

  // -------------------------------------------------------------
  // 11. Timer with Safe Asynchronous Termination
  // -------------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            terminateInterviewSession();
            onEndInterviewRef.current(messagesRef.current);
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [terminateInterviewSession]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimerCritical = timeLeft < 120;

  const filteredVoices = voices.filter((v) => {
    if (config.language === 'Hindi') {
      return v.lang.startsWith('hi') || v.lang.includes('IN');
    }
    return v.lang.startsWith('en') || v.lang.startsWith('hi');
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#070A12] text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-violet-600/15 via-indigo-600/10 to-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-[450px] h-[450px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ------------------------------------------------------------- */}
      {/* TOP BAR: HUD                                                  */}
      {/* ------------------------------------------------------------- */}
      <header className="relative z-20 px-4 sm:px-6 py-4 flex items-center justify-between bg-gradient-to-b from-[#070A12]/95 via-[#070A12]/80 to-transparent">
        {/* Top Left: Timer & Headphones Toggle */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium border backdrop-blur-xl transition-all shadow-lg ${
              isTimerCritical
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-500/20 animate-pulse'
                : 'glass-panel text-slate-200 border-white/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            type="button"
            onClick={() => setUseHeadphones(!useHeadphones)}
            title={
              useHeadphones
                ? 'Headphones ON: You can interrupt the AI'
                : 'Headphones OFF: Echo protection active (mic listens after AI finishes)'
            }
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border backdrop-blur-xl transition-all cursor-pointer shadow-md ${
              useHeadphones
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 shadow-cyan-500/20'
                : 'glass-panel text-slate-400 hover:text-slate-200 border-white/10'
            }`}
          >
            <Headphones
              className={`w-3.5 h-3.5 ${
                useHeadphones ? 'text-cyan-400 animate-pulse' : 'text-slate-400'
              }`}
            />
            <span className="hidden sm:inline">
              {useHeadphones
                ? 'Headphones ON (interrupt allowed)'
                : "I'm using headphones (allow interrupting)"}
            </span>
            <span className="sm:hidden">
              {useHeadphones ? 'Headphones ON' : 'Headphones'}
            </span>
          </button>
        </div>

        {/* Top Center: Question Counter */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-panel border border-white/10 text-xs font-semibold text-slate-200 shadow-2xl backdrop-blur-xl">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>
            Question {Math.min(mainQuestionIndex, totalQuestionsTarget)} of ~{totalQuestionsTarget}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-violet-300 font-normal">{config.role}</span>
        </div>

        {/* Top Right: Voice Selector & AI Mute */}
        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={toggleAiMute}
            title={isAiMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
            className={`p-2 rounded-full border transition-all cursor-pointer shadow-lg ${
              isAiMuted
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                : 'glass-panel hover:bg-slate-800/80 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {isAiMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-violet-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowVoiceMenu(!showVoiceMenu)}
            title="Interviewer Voice"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel hover:bg-slate-800/80 border-white/10 text-xs text-slate-200 transition-all cursor-pointer shadow-lg"
          >
            <span className="hidden sm:inline max-w-[120px] truncate font-medium">
              {voices.find((v) => v.name === selectedVoiceName)?.name.split(' ')[0] || 'AI Voice'}
            </span>
          </button>

          {/* Voice Dropdown */}
          {showVoiceMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowVoiceMenu(false)}
              />
              <div className="absolute right-0 top-11 z-40 w-72 glass-panel border border-white/15 rounded-2xl shadow-2xl p-2.5 text-xs backdrop-blur-2xl">
                <div className="px-3 py-2 font-semibold text-slate-200 border-b border-white/10 mb-1 flex items-center justify-between">
                  <span>Interviewer Voice</span>
                  <span className="text-[10px] text-violet-400 font-normal">Female Preferred</span>
                </div>
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {(filteredVoices.length ? filteredVoices : voices).map((v) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => {
                        setSelectedVoiceName(v.name);
                        selectedVoiceNameRef.current = v.name;
                        setShowVoiceMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                        selectedVoiceName === v.name
                          ? 'bg-violet-600/30 text-violet-200 border border-violet-500/50'
                          : 'hover:bg-slate-800/70 text-slate-300'
                      }`}
                    >
                      <span className="truncate pr-2 font-medium">{v.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{v.lang}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* USER CAMERA PREVIEW (DRAGGABLE PIP)                           */}
      {/* ------------------------------------------------------------- */}
      <div
        onPointerDown={handleCameraPointerDown}
        onPointerMove={handleCameraPointerMove}
        onPointerUp={handleCameraPointerUp}
        onPointerCancel={handleCameraPointerUp}
        style={
          cameraPos
            ? {
                left: `${cameraPos.x}px`,
                top: `${cameraPos.y}px`,
                right: 'auto',
                bottom: 'auto',
              }
            : undefined
        }
        className={`fixed z-30 select-none touch-none ${
          cameraPos ? '' : 'top-18 right-4 sm:right-6'
        }`}
      >
        <div className="relative group w-[130px] h-[160px] sm:w-[210px] sm:h-[160px] rounded-3xl overflow-hidden glass-panel border border-white/15 hover:border-violet-400/40 shadow-2xl backdrop-blur-2xl flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors">
          {/* Drag Handle Indicator */}
          <div className="absolute top-2 right-2.5 z-10 opacity-60 group-hover:opacity-100 transition-opacity">
            <GripHorizontal className="w-3.5 h-3.5 text-slate-300 drop-shadow" />
          </div>

          {cameraActive && !cameraError ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-500 p-2 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-300">
                <User className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium text-slate-400">Camera Off</span>
            </div>
          )}

          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={toggleCamera}
              title={cameraActive ? 'Turn off camera' : 'Turn on camera'}
              className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-200 border border-white/15 shadow-lg backdrop-blur-md cursor-pointer transition-transform active:scale-95"
            >
              {cameraActive ? (
                <Video className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <VideoOff className="w-3.5 h-3.5 text-rose-400" />
              )}
            </button>
          </div>

          <div className="absolute top-2 left-2.5 text-[10px] font-semibold text-slate-200 bg-slate-950/70 border border-white/10 px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>You</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CENTER: 3D HOLOGRAPHIC AI AVATAR                              */}
      {/* ------------------------------------------------------------- */}
      <main className="relative flex-1 flex flex-col items-center justify-center p-4">
        {/* Dynamic Turn-Taking State Pill with Click-to-Advance & Retry */}
        <div className="mb-8 flex items-center justify-center">
          {connectionError ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleRetry}
                title="Connection problem. Tap to retry"
                className="flex items-center gap-2.5 px-5 py-2 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 text-xs font-semibold shadow-xl shadow-rose-500/20 backdrop-blur-xl transition-all cursor-pointer group animate-pulse"
              >
                <RotateCcw className="w-4 h-4 text-rose-400 group-hover:rotate-180 transition-transform duration-500" />
                <span>Connection problem. Tap to retry</span>
              </button>
              {errorMessage && (
                <span className="text-[11px] text-rose-300/90 font-mono tracking-tight text-center max-w-sm sm:max-w-md truncate px-3 py-1 rounded-lg bg-rose-950/60 border border-rose-500/30 shadow-md">
                  {errorMessage}
                </span>
              )}
            </div>
          ) : turnState === 'USER_LISTENING' ? (
            <div className="flex items-center gap-2.5 px-5 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-xl shadow-emerald-500/15 backdrop-blur-xl animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Listening to you • Speak naturally</span>
            </div>
          ) : turnState === 'USER_SPEAKING' ? (
            <div className="flex items-center gap-2.5 px-5 py-2 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 text-xs font-semibold shadow-xl shadow-cyan-500/20 backdrop-blur-xl">
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-4 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                <span className="w-1 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
              </div>
              <span>Hearing you...</span>
            </div>
          ) : turnState === 'PROCESSING' || turnState === 'AI_THINKING' ? (
            <button
              type="button"
              onClick={handleForceAdvance}
              title="Click to proceed if taking too long"
              className="flex items-center gap-2.5 px-5 py-2 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-xl shadow-amber-500/15 backdrop-blur-xl transition-all cursor-pointer group"
            >
              <Loader2 className="w-4 h-4 animate-spin text-amber-400 group-hover:hidden" />
              <ArrowRight className="w-4 h-4 text-amber-400 hidden group-hover:inline" />
              <span>
                {turnState === 'PROCESSING'
                  ? 'Analyzing your answer...'
                  : 'Formulating next question...'}
              </span>
              <span className="text-[10px] text-amber-400/80 font-normal underline ml-1 hidden sm:inline">
                Tap to proceed
              </span>
            </button>
          ) : turnState === 'AI_SPEAKING' ? (
            <div className="flex items-center gap-2.5 px-5 py-2 rounded-full bg-violet-500/15 border border-violet-400/40 text-violet-200 text-xs font-semibold shadow-xl shadow-violet-500/25 backdrop-blur-xl">
              <Volume2 className="w-4 h-4 text-violet-300 animate-pulse" />
              <span>Interviewer speaking • Speak to interrupt</span>
            </div>
          ) : null}
        </div>

        {/* Holographic Glowing AI Sphere */}
        <div className="relative flex items-center justify-center">
          <div
            className={`absolute rounded-full transition-all duration-700 pointer-events-none ${
              turnState === 'AI_SPEAKING'
                ? 'w-72 h-72 sm:w-80 sm:h-80 border-2 border-violet-400/30 animate-ping'
                : turnState === 'USER_SPEAKING'
                ? 'w-64 h-64 sm:w-72 sm:h-72 border border-cyan-400/30 animate-pulse'
                : turnState === 'USER_LISTENING'
                ? 'w-60 h-60 border border-emerald-400/25 animate-pulse'
                : 'w-48 h-48 border border-white/5'
            }`}
          />

          <div
            className={`absolute rounded-full transition-all duration-500 pointer-events-none ${
              turnState === 'AI_SPEAKING'
                ? 'w-56 h-56 sm:w-64 sm:h-64 bg-gradient-to-r from-violet-600/20 via-indigo-600/20 to-cyan-500/20 blur-2xl animate-pulse'
                : turnState === 'USER_SPEAKING'
                ? 'w-52 h-52 sm:w-60 sm:h-60 bg-cyan-500/15 blur-xl'
                : 'w-44 h-44 bg-transparent'
            }`}
          />

          <div
            className={`relative z-10 w-40 h-40 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-500 border-2 ${
              connectionError
                ? 'bg-slate-900 border-rose-500/60 shadow-rose-500/20'
                : turnState === 'AI_SPEAKING'
                ? 'bg-gradient-to-tr from-violet-900 via-indigo-950 to-slate-900 border-violet-400 shadow-violet-500/40 scale-105'
                : turnState === 'USER_SPEAKING'
                ? 'bg-gradient-to-tr from-cyan-950 via-slate-900 to-indigo-950 border-cyan-400 shadow-cyan-500/30'
                : turnState === 'USER_LISTENING'
                ? 'bg-gradient-to-tr from-slate-900 via-emerald-950 to-slate-900 border-emerald-500/60 shadow-emerald-500/20'
                : 'bg-slate-900 border-white/10 shadow-slate-950/50'
            }`}
          >
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center transition-all ${
                connectionError
                  ? 'bg-rose-500/20 text-rose-200'
                  : turnState === 'AI_SPEAKING'
                  ? 'bg-violet-500/20 text-violet-200'
                  : turnState === 'USER_SPEAKING'
                  ? 'bg-cyan-500/20 text-cyan-200'
                  : turnState === 'USER_LISTENING'
                  ? 'bg-emerald-500/20 text-emerald-200'
                  : 'bg-slate-800/80 text-slate-400'
              }`}
            >
              <Sparkles
                className={`w-9 h-9 ${
                  turnState === 'AI_SPEAKING'
                    ? 'animate-spin text-cyan-300'
                    : turnState === 'AI_THINKING' || turnState === 'PROCESSING'
                    ? 'animate-pulse text-amber-300'
                    : connectionError
                    ? 'text-rose-400'
                    : 'text-violet-400'
                }`}
                style={{ animationDuration: '4s' }}
              />
            </div>

            <div className="mt-2 text-xs font-bold tracking-wide text-white">
              {config.role}
            </div>
            <div className="text-[10px] text-slate-400">
              AI Recruiter
            </div>
          </div>
        </div>

        {/* 11-Channel Equalizer Soundwave Bars */}
        <div className="mt-8 flex items-center justify-center gap-1.5 h-12">
          {connectionError ? (
            <div className="flex items-center gap-2 text-xs text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              <span>{errorMessage || 'Connection problem'} • Click retry button above</span>
            </div>
          ) : turnState === 'AI_SPEAKING' ? (
            [0.3, 0.7, 0.5, 0.95, 0.65, 1.0, 0.75, 0.9, 0.55, 0.8, 0.35].map((h, i) => (
              <span
                key={i}
                className="w-1.5 bg-gradient-to-t from-violet-600 via-indigo-400 to-cyan-300 rounded-full animate-pulse shadow-sm shadow-violet-500/50"
                style={{
                  height: `${h * 42}px`,
                  animationDuration: `${0.3 + (i % 4) * 0.12}s`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))
          ) : turnState === 'USER_SPEAKING' ? (
            [0.3, 0.65, 1.0, 0.6, 0.85, 0.5, 0.9, 0.4].map((h, i) => (
              <span
                key={i}
                className="w-1.5 bg-gradient-to-t from-cyan-600 to-cyan-300 rounded-full animate-pulse shadow-sm shadow-cyan-500/50"
                style={{
                  height: `${h * 36}px`,
                  animationDuration: `${0.28 + (i % 3) * 0.09}s`,
                  animationDelay: `${i * 0.06}s`,
                }}
              />
            ))
          ) : turnState === 'USER_LISTENING' ? (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Mic live • Speak whenever you are ready</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-300/80 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM: LIVE CAPTIONS                                         */}
      {/* ------------------------------------------------------------- */}
      {showCaptions && captionText && (
        <div className="relative z-20 px-4 mb-4 flex justify-center">
          <div className="max-w-2xl w-full glass-panel border border-white/15 rounded-2xl px-6 py-3.5 shadow-2xl backdrop-blur-2xl transition-all duration-300 animate-in fade-in">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  captionSpeaker === 'AI'
                    ? 'bg-violet-500/25 text-violet-300 border border-violet-500/40'
                    : 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                }`}
              >
                {captionSpeaker || 'Interviewer'}
              </span>
              <span className="text-[10px] text-slate-400">Live Captions</span>
            </div>
            <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed tracking-wide line-clamp-2">
              &quot;{captionText}&quot;
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TYPE INSTEAD DRAWER                                           */}
      {/* ------------------------------------------------------------- */}
      {showTypeInput && (
        <div className="relative z-30 px-4 mb-4 flex justify-center">
          <div className="max-w-2xl w-full glass-panel border border-white/20 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-violet-400" />
                Type or Edit Your Response
              </span>
              <button
                type="button"
                onClick={() => setShowTypeInput(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={typedAnswer}
              onChange={(e) => {
                setTypedAnswer(e.target.value);
                currentSpokenTextRef.current = e.target.value;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleManualSendTyped();
                }
              }}
              placeholder="Type your answer here, then press Enter or Send..."
              rows={3}
              className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none mb-3"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Press Enter to submit immediately
              </span>
              <button
                type="button"
                onClick={handleManualSendTyped}
                disabled={!typedAnswer.trim() || turnState === 'PROCESSING' || turnState === 'AI_THINKING'}
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-violet-600/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Answer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FLOATING CONTROL DOCK                                         */}
      {/* ------------------------------------------------------------- */}
      <footer className="relative z-20 px-4 py-5 bg-gradient-to-t from-[#070A12]/95 via-[#070A12]/80 to-transparent flex items-center justify-center">
        <div className="flex items-center gap-3 sm:gap-4 glass-panel border border-white/15 px-4 sm:px-6 py-2.5 rounded-full shadow-2xl backdrop-blur-2xl">
          {/* Main Mic Button */}
          {isSpeechSupported ? (
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              className={`w-13 h-13 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-xl active:scale-95 ${
                isMuted
                  ? 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/40'
                  : turnState === 'USER_SPEAKING'
                  ? 'bg-gradient-to-tr from-cyan-600 to-cyan-400 text-white shadow-cyan-500/40 ring-4 ring-cyan-500/30'
                  : turnState === 'USER_LISTENING'
                  ? 'bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-emerald-500/40 ring-4 ring-emerald-500/30 animate-pulse'
                  : 'bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-600/40'
              }`}
            >
              {isMuted ? (
                <MicOff className="w-5 h-5 text-rose-400" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          ) : (
            <div className="text-xs text-amber-400 px-2">Mic unavailable</div>
          )}

          {/* Type Instead Button */}
          <button
            type="button"
            onClick={() => setShowTypeInput(!showTypeInput)}
            title="Type or edit response"
            className={`p-3 rounded-full border transition-all cursor-pointer ${
              showTypeInput
                ? 'bg-violet-600/30 border-violet-500 text-violet-200'
                : 'glass-panel hover:bg-slate-800/80 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Repeat Question Button */}
          <button
            type="button"
            onClick={handleRepeatQuestion}
            disabled={turnState === 'AI_THINKING' || turnState === 'PROCESSING' || !currentAiQuestion}
            title="Repeat interviewer question"
            className="p-3 rounded-full glass-panel hover:bg-slate-800/80 border-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-40 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* CC Toggle Button */}
          <button
            type="button"
            onClick={() => setShowCaptions(!showCaptions)}
            title={showCaptions ? 'Hide Captions' : 'Show Captions'}
            className={`p-3 rounded-full border transition-all cursor-pointer ${
              showCaptions
                ? 'bg-violet-600/30 border-violet-500 text-violet-200'
                : 'glass-panel hover:bg-slate-800/80 border-white/10 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Subtitles className="w-4 h-4" />
          </button>

          {/* Mute/Unmute AI Voice Button */}
          <button
            type="button"
            onClick={toggleAiMute}
            title={isAiMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
            className={`p-3 rounded-full border transition-all cursor-pointer ${
              isAiMuted
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-rose-500/20'
                : 'glass-panel hover:bg-slate-800/80 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {isAiMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-violet-400" />
            )}
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-white/10 mx-1" />

          {/* End Call Button with Immediate Audio Cutoff */}
          <button
            type="button"
            onClick={() => {
              terminateInterviewSession();
              onEndInterview(messagesRef.current);
            }}
            disabled={isEnding || messages.length === 0}
            title="End Interview and View Feedback"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-95 text-white font-semibold text-xs shadow-xl shadow-rose-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isEnding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PhoneOff className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">End Call</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
