import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  Sparkles,
  MessageSquarePlus,
  ChevronDown,
  Lock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RotateCcw,
  Flag,
  Flame,
  Award,
  Layers,
  Heart,
  Star,
  Target,
  ClipboardList,
} from 'lucide-react';
import { api } from '../api';
import { getTheme } from '../utils/themes';
import MascotBuddy from '../components/MascotBuddy';

const NEGATIVE_CHOICE_PATTERN =
  /\b(difficult|could not|poor|bad|dissatisfied|unhappy|never|rarely|probably not|definitely not|no|slow|frustrat|terrible|worst|disagree)\b/i;

const ENCOURAGEMENTS = [
  'You are doing great!',
  'Take your time on this one.',
  'Keep the momentum going!',
  'Every answer helps us improve.',
  'Smooth progress so far!',
];

function isNoAnswer(value) {
  const check = (v) => /^\s*no(?:\b|[\s,.;:!()-]|$)/i.test(String(v).trim());
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.some(check);
  return check(value);
}

function isYesAnswer(value) {
  const check = (v) => /^\s*yes(?:\b|[\s,.;:!()-]|$)/i.test(String(v).trim());
  if (value === undefined || value === null || value === '') return false;
  return check(value);
}

function hasNoOption(question) {
  if (!Array.isArray(question?.options)) return false;
  return question.options.some((opt) => isNoAnswer(opt));
}

function getEffectiveCommentField(question) {
  if (!question) return null;
  if (question.commentField) return question.commentField;
  if (hasNoOption(question)) {
    return {
      entryId: `${question.entryId}__no_comment`,
      label: 'Please explain your "No" answer',
      placeholder: 'Please share your reason or recommendation…',
      type: 'long_text',
      synthetic: true,
    };
  }
  return null;
}

function isNegativeAnswer(question, value) {
  if (value === undefined || value === null || value === '') return false;
  if (question.type === 'linear_scale') {
    const num = Number(value);
    const min = Number(question.min ?? 1);
    const max = Number(question.max ?? 5);
    const midpoint = min + (max - min) / 2;
    return !Number.isNaN(num) && num < midpoint;
  }
  if (typeof value === 'string') {
    return NEGATIVE_CHOICE_PATTERN.test(value);
  }
  if (Array.isArray(value)) {
    return value.some((v) => NEGATIVE_CHOICE_PATTERN.test(String(v)));
  }
  return false;
}

function getScaleLabel(num, min, max) {
  const ratio = max > min ? (num - min) / (max - min) : 0.5;
  const stars = Math.max(1, Math.min(5, Math.round(ratio * 4) + 1));
  if (ratio <= 0.15) return { stars, text: 'Needs work' };
  if (ratio <= 0.35) return { stars, text: 'Could be better' };
  if (ratio <= 0.65) return { stars, text: 'Pretty good' };
  if (ratio <= 0.85) return { stars, text: 'Really great' };
  return { stars, text: 'Outstanding' };
}

/**
 * Smartly parses long Google Form descriptions (e.g. Agency | Event + Purpose: ... + Instructions: ...)
 * into structured, scannable blocks instead of a single wall of text.
 */
function parseWelcomeDescription(raw) {
  if (!raw || !raw.trim()) return null;
  const text = raw.replace(/\r\n/g, '\n').trim();

  const purposeMatch = text.match(/\bPurpose\s*:\s*/i);
  const instructionsMatch = text.match(/\bInstructions?\s*:\s*/i);

  if (!purposeMatch && !instructionsMatch) {
    return { plain: text };
  }

  const pIdx = purposeMatch ? purposeMatch.index : -1;
  const iIdx = instructionsMatch ? instructionsMatch.index : -1;

  const firstMarker =
    pIdx !== -1 && iIdx !== -1 ? Math.min(pIdx, iIdx) : Math.max(pIdx, iIdx);

  const intro = text.slice(0, firstMarker).trim();

  let purpose = '';
  if (pIdx !== -1) {
    const start = pIdx + purposeMatch[0].length;
    const end = iIdx > pIdx ? iIdx : text.length;
    purpose = text.slice(start, end).trim();
  }

  let instructions = '';
  if (iIdx !== -1) {
    const start = iIdx + instructionsMatch[0].length;
    const end = pIdx > iIdx ? pIdx : text.length;
    instructions = text.slice(start, end).trim();
  }

  // Split intro lines/pipes into neat metadata tags if present
  const introParts = intro
    .split(/\n+|\s*\|\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Split instructions into bullet points by sentence
  const instructionBullets = instructions
    ? instructions
        .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return { introParts, purpose, instructionBullets };
}

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 32 : -32,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -32 : 32,
    opacity: 0,
  }),
};

/** Lightweight, GPU-friendly vector background (memoized, zero heavy mobile blur repaints) */
const AmbientBackground = React.memo(function AmbientBackground({ theme }) {
  const accentStroke = theme.chartColors?.[0] || '#10b981';
  const secondaryStroke = theme.chartColors?.[1] || '#14b8a6';

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Soft static radial pastel washes (zero GPU blur cost on mobile) */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 12% 10%, ${accentStroke}24 0%, transparent 45%), radial-gradient(circle at 88% 25%, ${secondaryStroke}20 0%, transparent 42%), radial-gradient(circle at 50% 95%, ${accentStroke}1c 0%, transparent 50%)`,
        }}
      />

      {/* Subtle dot matrix */}
      <div
        className="absolute inset-0 opacity-[0.32]"
        style={{
          backgroundImage: 'radial-gradient(rgba(15, 23, 42, 0.11) 1.1px, transparent 1.1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Clean Static SVG Wave Ribbon (Bottom - zero 60fps path morphing) */}
      <svg
        viewBox="0 0 1440 240"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 right-0 w-full h-32 sm:h-44 opacity-[0.14]"
      >
        <path
          d="M0,140 C260,70 520,200 780,125 C1020,55 1240,175 1440,110 L1440,240 L0,240 Z"
          fill={accentStroke}
        />
        <path
          d="M0,180 C320,125 620,220 940,155 C1180,105 1330,190 1440,165 L1440,240 L0,240 Z"
          fill={secondaryStroke}
          opacity="0.65"
        />
      </svg>

      {/* Subtle Desktop-Only Orbital Ring */}
      <motion.svg
        viewBox="0 0 160 160"
        className="hidden lg:block absolute top-20 left-[7%] w-28 h-28 opacity-30 will-change-transform"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        <circle
          cx="80"
          cy="80"
          r="58"
          fill="none"
          stroke={accentStroke}
          strokeWidth="1.5"
          strokeDasharray="6 8"
        />
        <circle cx="80" cy="22" r="4.5" fill={accentStroke} />
      </motion.svg>

      <motion.svg
        viewBox="0 0 120 120"
        className="hidden lg:block absolute top-24 right-[8%] w-20 h-20 opacity-25 will-change-transform"
        animate={{ rotate: 360 }}
        transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
      >
        <path
          d="M60 14 L67 53 L106 60 L67 67 L60 106 L53 67 L14 60 L53 53 Z"
          fill="none"
          stroke={accentStroke}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </motion.svg>
    </div>
  );
});

/** Celebratory confetti burst on completion */
function ConfettiBurst({ colors }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => {
        const angle = (i / 34) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
        const distance = 95 + Math.random() * 155;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 50,
          rotate: (Math.random() - 0.5) * 600,
          size: 7 + Math.random() * 7,
          color: colors[i % colors.length],
          isCircle: i % 3 === 0,
          delay: Math.random() * 0.14,
        };
      }),
    [colors]
  );

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{
            x: p.x,
            y: [0, p.y, p.y + 100],
            opacity: [1, 1, 0],
            scale: [0, 1.2, 0.85],
            rotate: p.rotate,
          }}
          transition={{
            duration: 1.5,
            delay: p.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            width: p.size,
            height: p.isCircle ? p.size : p.size * 0.55,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? '9999px' : '3px',
          }}
          className="absolute"
        />
      ))}
    </div>
  );
}

export default function QuizPlayer() {
  const { slug } = useParams();
  const storageKey = `formstudio_draft_${slug}`;

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closedInfo, setClosedInfo] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [phase, setPhase] = useState('welcome'); // 'welcome' | 'playing' | 'complete' | 'finished'
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [validationError, setValidationError] = useState('');
  const [shakeCount, setShakeCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [buddyPulse, setBuddyPulse] = useState(null);
  const autoAdvanceTimerRef = useRef(null);
  const touchStartRef = useRef(null);

  const vibrate = (pattern) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {
      // ignore unsupported devices
    }
  };

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

  // Load form schema
  useEffect(() => {
    setLoading(true);
    api
      .getPublicForm(slug)
      .then((res) => {
        setForm(res.form);
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
              setAnswers(parsed);
              setHasSavedDraft(true);
            }
          }
        } catch {
          // ignore storage errors
        }
      })
      .catch((err) => {
        if (err.status === 403 || err.data?.closed) {
          setClosedInfo(err.data || { title: 'Form Closed' });
        } else {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));
  }, [slug, storageKey]);

  // Debounced auto-save answers to LocalStorage (avoids blocking main thread on every keystroke)
  useEffect(() => {
    if (phase !== 'playing' || Object.keys(answers).length === 0) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(answers));
      } catch {
        // ignore quota errors
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [answers, phase, storageKey]);

  // Build linear step list (with Section Milestone cards when 2+ sections)
  const { steps, totalQuestions } = useMemo(() => {
    const sections = form?.schema?.sections || [];
    const list = [];
    let qCounter = 0;

    sections.forEach((sec, sIdx) => {
      if (sections.length > 1) {
        list.push({
          kind: 'milestone',
          id: `milestone-${sec.id}`,
          sectionNumber: sIdx + 1,
          totalSections: sections.length,
          questionCount: (sec.questions || []).length,
          title: sec.title,
          description: sec.description,
        });
      }
      (sec.questions || []).forEach((q) => {
        qCounter++;
        list.push({
          kind: 'question',
          id: q.id,
          questionNumber: qCounter,
          sectionTitle: sec.title,
          question: q,
        });
      });
    });

    return { steps: list, totalQuestions: qCounter };
  }, [form]);

  const currentStep = steps[stepIndex];
  const theme = getTheme(form?.theme || closedInfo?.theme);
  const estimatedMins = Math.max(1, Math.ceil(totalQuestions * 0.35));

  const answeredCount = useMemo(() => {
    const sections = form?.schema?.sections || [];
    let count = 0;
    for (const s of sections) {
      for (const q of s.questions || []) {
        const v = answers[q.entryId];
        if (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== '') {
          count++;
        }
      }
    }
    return count;
  }, [form, answers]);

  const progressPct = useMemo(() => {
    if (phase === 'complete' || phase === 'finished') return 100;
    if (phase === 'welcome' || steps.length === 0) return 0;
    return Math.round(((stepIndex + 1) / steps.length) * 100);
  }, [phase, stepIndex, steps.length]);

  const triggerBuddyPulse = (mood, message) => {
    setBuddyPulse({ mood, message });
  };

  // Compute Mascot Buddy's current mood & speech bubble (zero emojis)
  const buddyState = useMemo(() => {
    if (phase === 'welcome') {
      return {
        mood: 'welcome',
        message: hasSavedDraft
          ? 'Welcome back! Ready to pick up where you left off?'
          : 'Hi there! This will only take a quick moment.',
      };
    }
    if (phase === 'complete' || phase === 'finished') {
      return {
        mood: 'complete',
        message:
          phase === 'finished'
            ? 'Thank you! You may safely close this page now.'
            : 'All done! Thank you so much for your feedback.',
      };
    }
    if (validationError) {
      return {
        mood: 'oops',
        message: 'Hold on! We just need a quick answer here.',
      };
    }
    if (currentStep?.kind === 'milestone') {
      return {
        mood: 'milestone',
        message: `Checkpoint unlocked! Part ${currentStep.sectionNumber} is up next.`,
      };
    }
    if (currentStep?.kind === 'question') {
      const q = currentStep.question;
      const val = answers[q.entryId];
      const commentField = getEffectiveCommentField(q);
      if (commentField && isNoAnswer(val)) {
        const commentVal = answers[commentField.entryId];
        if (!commentVal || !String(commentVal).trim()) {
          return {
            mood: 'curious',
            message: 'Tell us a bit more so we can improve.',
          };
        }
        return {
          mood: 'happy',
          message: 'Thanks for sharing the extra detail!',
        };
      }
    }
    if (buddyPulse) return buddyPulse;

    if (progressPct >= 85) {
      return { mood: 'happy', message: 'Almost at the finish line!' };
    }
    if (progressPct >= 48 && progressPct <= 56) {
      return { mood: 'happy', message: 'Halfway there — great pace!' };
    }
    return {
      mood: 'idle',
      message: ENCOURAGEMENTS[stepIndex % ENCOURAGEMENTS.length],
    };
  }, [phase, hasSavedDraft, validationError, currentStep, answers, buddyPulse, progressPct, stepIndex]);

  const setAnswer = (entryId, value, questionObj = null) => {
    setValidationError('');
    const commentField = getEffectiveCommentField(questionObj);
    setAnswers((prev) => {
      const next = { ...prev, [entryId]: value };
      if (
        commentField &&
        hasNoOption(questionObj) &&
        !isNoAnswer(value)
      ) {
        delete next[commentField.entryId];
      }
      return next;
    });

    if (questionObj) {
      if (commentField) {
        if (hasNoOption(questionObj)) {
          setOpenComments((prev) => ({
            ...prev,
            [questionObj.id]: isNoAnswer(value),
          }));
        } else if (isNegativeAnswer(questionObj, value)) {
          setOpenComments((prev) => ({ ...prev, [questionObj.id]: true }));
        }
      }

      if (['multiple_choice', 'dropdown', 'linear_scale'].includes(questionObj.type)) {
        vibrate(12);
        const needsComment = hasNoOption(questionObj) && isNoAnswer(value);
        if (needsComment) {
          if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
          triggerBuddyPulse('curious', 'Tell us a bit more so we can improve.');
        } else {
          triggerBuddyPulse('happy', 'Nice! Moving right along…');
          // Smooth auto-advance on single-choice selection when not on final step and no required comment
          if (
            !isNegativeAnswer(questionObj, value) &&
            stepIndex < steps.length - 1
          ) {
            if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
            autoAdvanceTimerRef.current = setTimeout(() => {
              setDirection(1);
              setBuddyPulse(null);
              setStepIndex((i) => (i < steps.length - 1 ? i + 1 : i));
            }, 200);
          }
        }
      }
    }
  };

  const toggleCheckbox = (question, option) => {
    const prev = Array.isArray(answers[question.entryId]) ? answers[question.entryId] : [];
    const next = prev.includes(option)
      ? prev.filter((item) => item !== option)
      : [...prev, option];
    setAnswer(question.entryId, next, question);
    if (next.length > 0) {
      triggerBuddyPulse('happy', `${next.length} selected — pick as many as apply.`);
    }
  };

  const getValidationError = () => {
    if (!currentStep || currentStep.kind !== 'question') return '';
    const q = currentStep.question;
    const val = answers[q.entryId];

    if (q.required) {
      const missing = Array.isArray(val)
        ? val.length === 0
        : val === undefined || val === null || String(val).trim() === '';
      if (missing) {
        return 'Please answer this required question to continue.';
      }
    }

    const commentField = getEffectiveCommentField(q);
    if (commentField && isNoAnswer(val)) {
      const commentVal = answers[commentField.entryId];
      if (!commentVal || String(commentVal).trim() === '') {
        return 'Please add a comment explaining your "No" answer to continue.';
      }
    }

    return '';
  };

  const handleNext = async () => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    const errMsg = getValidationError();
    if (errMsg) {
      vibrate([20, 35, 20]);
      setValidationError(errMsg);
      setShakeCount((c) => c + 1);
      return;
    }
    setValidationError('');
    setBuddyPulse(null);

    if (stepIndex < steps.length - 1) {
      vibrate(10);
      setDirection(1);
      setStepIndex((i) => i + 1);
      return;
    }

    // Final step -> Submit
    setSubmitting(true);
    try {
      const res = await api.submitPublicForm(slug, answers);
      vibrate([15, 40, 25]);
      setSubmitResult(res);
      setPhase('complete');
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    } catch (err) {
      vibrate([20, 35, 20]);
      setValidationError(err.message || 'Submission failed. Please try again.');
      setShakeCount((c) => c + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    vibrate(8);
    setValidationError('');
    setBuddyPulse(null);
    if (stepIndex > 0) {
      setDirection(-1);
      setStepIndex((i) => i - 1);
    } else {
      setPhase('welcome');
    }
  };

  // Touch swipe navigation on mobile (swipe left = Next, swipe right = Back)
  const handleTouchStart = (e) => {
    if (phase !== 'playing') return;
    const t = e.touches?.[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e) => {
    if (phase !== 'playing' || !touchStartRef.current) return;
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Ignore vertical scrolls
    if (Math.abs(dy) > 45 || Math.abs(dx) < 75) return;
    if (dx < -75) {
      handleNext();
    } else if (dx > 75) {
      handleBack();
    }
  };

  // Desktop keyboard shortcuts (A-Z / 1-9 + Enter)
  useEffect(() => {
    if (phase !== 'playing' || !currentStep) return;

    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea';

      if (e.key === 'Enter') {
        if (tag === 'textarea') return;
        e.preventDefault();
        handleNext();
        return;
      }

      if (isTyping || currentStep.kind !== 'question') return;

      const q = currentStep.question;
      if (q.type === 'linear_scale') {
        const min = Number(q.min ?? 1);
        const max = Number(q.max ?? 5);
        const num = Number(e.key);
        if (!Number.isNaN(num) && num >= min && num <= max) {
          e.preventDefault();
          setAnswer(q.entryId, String(num), q);
        }
      } else if (['multiple_choice', 'dropdown', 'checkboxes'].includes(q.type)) {
        const opts = q.options || [];
        let idx = -1;
        if (/^[1-9]$/.test(e.key)) {
          idx = Number(e.key) - 1;
        } else if (/^[a-z]$/i.test(e.key)) {
          idx = e.key.toUpperCase().charCodeAt(0) - 65;
        }
        if (idx >= 0 && idx < opts.length) {
          e.preventDefault();
          if (q.type === 'checkboxes') {
            toggleCheckbox(q, opts[idx]);
          } else {
            setAnswer(q.entryId, opts[idx], q);
          }
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-7 h-7 text-emerald-600" />
        </motion.div>
      </div>
    );
  }

  if (closedInfo) {
    return (
      <div className={`min-h-screen relative flex items-center justify-center p-5 ${theme.pageBg}`}>
        <AmbientBackground theme={theme} />
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md rounded-[32px] bg-white/90 backdrop-blur-xl p-8 shadow-2xl border-2 border-white text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">
            {closedInfo.title || 'Form Closed'}
          </h1>
          <p className="text-sm text-slate-500">
            This form is no longer accepting responses. Please contact the organizer if you
            believe this is a mistake.
          </p>
        </motion.div>
      </div>
    );
  }

  if (notFound || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5 bg-slate-50">
        <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-xl border border-slate-200 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h1 className="text-xl font-extrabold text-slate-900 mb-1">Form Not Found</h1>
          <p className="text-sm text-slate-500">
            Double-check the link or QR code you scanned.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`min-h-[100dvh] relative flex flex-col overflow-x-hidden touch-manipulation ${theme.pageBg}`}
    >
      <AmbientBackground theme={theme} />

      {/* Top Floating Capsule Progress HUD */}
      {phase === 'playing' && (
        <div className="fixed top-3 left-0 right-0 z-40 px-3.5 sm:px-4">
          <div className="max-w-xl mx-auto rounded-full bg-white/95 border-2 border-white shadow-md shadow-slate-900/5 px-4 py-2 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-600 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full shrink-0">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              {answeredCount}
            </span>

            {/* Pill Progress Track */}
            <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/60">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${theme.progressBar}`}
                style={{ width: `${Math.max(progressPct, 6)}%` }}
              />
            </div>

            <span className="text-xs font-extrabold text-slate-600 tabular-nums shrink-0 min-w-[38px] text-right">
              {progressPct}%
            </span>
          </div>
        </div>
      )}

      {/* Main Centered Container (extra bottom padding on mobile for sticky action bar) */}
      <main
        className={`relative z-10 flex-1 flex flex-col items-center px-3.5 sm:px-8 ${
          phase === 'welcome'
            ? 'justify-start sm:justify-center pt-6 sm:pt-12 pb-10'
            : phase === 'playing'
              ? 'justify-center pt-16 sm:pt-24 pb-28 sm:pb-12'
              : 'justify-center pt-16 sm:pt-24 pb-10 sm:pb-12'
        }`}
      >
        <div className="w-full max-w-xl">
          {/* Pure-SVG Animated Companion Mascot */}
          <MascotBuddy
            mood={buddyState.mood}
            message={buddyState.message}
            themeId={form.theme}
          />

          <AnimatePresence mode="wait" custom={direction}>
            {/* WELCOME SCREEN */}
            {phase === 'welcome' && (() => {
              const parsedDesc = parseWelcomeDescription(form.description);
              const sectionCount = (form.schema?.sections || []).length;
              return (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 28, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -24, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                  className="relative"
                >
                  {/* Stacked deck depth cards */}
                  <div className="absolute inset-x-4 -bottom-3 h-10 rounded-[28px] bg-white/60 border border-white shadow-md -z-10" />
                  <div className="absolute inset-x-8 -bottom-6 h-10 rounded-[28px] bg-white/35 border border-white/80 -z-20" />

                  <div className="rounded-[28px] sm:rounded-[32px] bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-900/10 border-2 border-white overflow-hidden">
                    {/* Executive Hero Gradient Banner */}
                    <div
                      className={`relative px-6 pt-7 pb-6 sm:px-9 sm:pt-8 sm:pb-7 bg-gradient-to-br ${theme.heroGradient} text-white overflow-hidden`}
                    >
                      <motion.div
                        animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/15 blur-2xl"
                      />
                      <div className="relative z-10 flex items-center gap-3.5 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-lg shrink-0 flex items-center justify-center ring-2 ring-white/30">
                          <img
                            src="/logo.png"
                            alt="Department of Agriculture Logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/25 mb-1">
                            <Sparkles className="w-3 h-3" />
                            Interactive Form
                          </span>
                          {parsedDesc?.introParts?.[0] && (
                            <p className="text-[11px] font-bold text-white/90 leading-tight line-clamp-2">
                              {parsedDesc.introParts.slice(0, 2).join(' · ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <h1 className="relative z-10 text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
                        {form.title}
                      </h1>

                      {parsedDesc?.introParts && parsedDesc.introParts.length > 2 && (
                        <div className="relative z-10 mt-3 flex flex-wrap gap-1.5">
                          {parsedDesc.introParts.slice(2).map((part, i) => (
                            <span
                              key={i}
                              className="inline-block px-2.5 py-1 rounded-lg bg-black/15 backdrop-blur-xs text-[11px] font-semibold text-white/95 leading-tight"
                            >
                              {part}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-5 sm:p-8 space-y-4">
                      {/* Structured Description Cards */}
                      {parsedDesc?.plain && (
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                          {parsedDesc.plain}
                        </p>
                      )}

                      {parsedDesc?.purpose && (
                        <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/70 p-4 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                            <Target className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Purpose</span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                            {parsedDesc.purpose}
                          </p>
                        </div>
                      )}

                      {parsedDesc?.instructionBullets?.length > 0 && (
                        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                            <ClipboardList className="w-4 h-4 text-slate-500 shrink-0" />
                            <span>Quick Instructions</span>
                          </div>
                          <ul className="space-y-1.5">
                            {parsedDesc.instructionBullets.map((item, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-xs sm:text-sm text-slate-600 leading-snug"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Compact Metric Strip */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="rounded-2xl bg-slate-50 border border-slate-200/70 px-3 py-2.5 text-center">
                          <Clock className="w-4 h-4 text-slate-400 mx-auto mb-0.5" />
                          <p className="text-xs font-extrabold text-slate-800">
                            ~{estimatedMins} min
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400">Est. Time</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-200/70 px-3 py-2.5 text-center">
                          <Layers className="w-4 h-4 text-slate-400 mx-auto mb-0.5" />
                          <p className="text-xs font-extrabold text-slate-800">
                            {totalQuestions}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400">
                            {totalQuestions === 1 ? 'Question' : 'Questions'}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-200/70 px-3 py-2.5 text-center">
                          <Flag className="w-4 h-4 text-slate-400 mx-auto mb-0.5" />
                          <p className="text-xs font-extrabold text-slate-800">
                            {sectionCount}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400">
                            {sectionCount === 1 ? 'Section' : 'Sections'}
                          </p>
                        </div>
                      </div>

                      {hasSavedDraft && (
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold ${theme.badge}`}
                          >
                            <Heart className="w-3.5 h-3.5" />
                            Your previous progress was restored
                          </span>
                        </div>
                      )}

                      {/* 3D Tactile Button */}
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98, y: 2 }}
                        onClick={() => {
                          setDirection(1);
                          setPhase('playing');
                        }}
                        className={`w-full inline-flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl text-white font-extrabold text-base shadow-xl border-b-4 border-black/20 active:border-b-0 transition ${theme.accentBg}`}
                      >
                        <span>{hasSavedDraft ? 'Continue Form' : 'Let’s Begin'}</span>
                        <motion.span
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <ArrowRight className="w-5 h-5" />
                        </motion.span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* PLAYING: SECTION MILESTONE OR QUESTION */}
            {phase === 'playing' && currentStep && (
              <motion.div
                key={currentStep.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="relative will-change-transform"
              >
                {/* Stacked Card Deck Illusion */}
                <div className="absolute inset-x-4 -bottom-3 h-10 rounded-[28px] bg-white/65 border border-white shadow-md -z-10" />
                <div className="absolute inset-x-8 -bottom-6 h-10 rounded-[28px] bg-white/35 border border-white/80 -z-20" />

                {/* Shake wrapper for validation feedback */}
                <motion.div
                  key={`shake-${shakeCount}`}
                  animate={
                    shakeCount > 0 && validationError
                      ? { x: [0, -10, 10, -7, 7, -3, 0] }
                      : { x: 0 }
                  }
                  transition={{ duration: 0.35 }}
                  className="rounded-[28px] sm:rounded-[32px] bg-white p-5 sm:p-9 shadow-xl shadow-slate-900/8 border-2 border-white relative overflow-hidden"
                >
                  {/* Top animated gradient ribbon */}
                  <div className={`absolute top-0 left-0 right-0 h-2 ${theme.progressBar}`} />

                  {currentStep.kind === 'milestone' ? (
                    <div className="py-5 text-center space-y-5">
                      <motion.div
                        initial={{ scale: 0, rotate: -18 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                        className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl bg-gradient-to-br ${theme.heroGradient}`}
                      >
                        <Flag className="w-8 h-8" />
                      </motion.div>

                      {/* Section Progress Dots */}
                      <div className="flex items-center justify-center gap-2">
                        {Array.from({ length: currentStep.totalSections }, (_, i) => {
                          const isCurrent = i + 1 === currentStep.sectionNumber;
                          const isPast = i + 1 < currentStep.sectionNumber;
                          return (
                            <motion.span
                              key={i}
                              layout
                              className={`h-2.5 rounded-full transition-all ${
                                isCurrent
                                  ? `w-9 ${theme.progressBar}`
                                  : isPast
                                    ? 'w-2.5 bg-emerald-400'
                                    : 'w-2.5 bg-slate-200'
                              }`}
                            />
                          );
                        })}
                      </div>

                      <div>
                        <span
                          className={`inline-block px-3.5 py-1 rounded-full text-xs font-extrabold mb-3 ${theme.badge}`}
                        >
                          Part {currentStep.sectionNumber} of {currentStep.totalSections} ·{' '}
                          {currentStep.questionCount}{' '}
                          {currentStep.questionCount === 1 ? 'question' : 'questions'}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                          {currentStep.title}
                        </h2>
                        {currentStep.description && (
                          <p className="mt-2.5 text-sm sm:text-base text-slate-500 max-w-md mx-auto leading-relaxed">
                            {currentStep.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 flex items-center justify-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={handleBack}
                          className="px-5 py-3 rounded-2xl border-2 border-slate-200 border-b-4 hover:bg-slate-50 text-slate-600 text-sm font-bold transition"
                        >
                          Back
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03, y: -1 }}
                          whileTap={{ scale: 0.97, y: 1 }}
                          type="button"
                          onClick={handleNext}
                          className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-lg border-b-4 border-black/20 active:border-b-0 transition ${theme.accentBg}`}
                        >
                          Continue
                          <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    (() => {
                      const q = currentStep.question;
                      const val = answers[q.entryId];
                      const commentField = getEffectiveCommentField(q);
                      const commentVal = commentField
                        ? answers[commentField.entryId] || ''
                        : '';
                      const isYesNoQuestion = hasNoOption(q);
                      const isCommentRequired = Boolean(commentField && isNoAnswer(val));
                      const showCommentSection = Boolean(
                        commentField && (!isYesNoQuestion || isCommentRequired)
                      );
                      const isCommentOpen = Boolean(
                        isCommentRequired || openComments[q.id] || commentVal
                      );
                      const isLastStep = stepIndex === steps.length - 1;
                      const hasTextValue =
                        typeof val === 'string' && val.trim().length > 0;

                      return (
                        <div className="space-y-5 pt-1">
                          {/* Question Counter & Section Pill */}
                          <div className="flex items-center justify-between gap-2 text-xs font-bold">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${theme.badge}`}
                            >
                              Question {currentStep.questionNumber}
                              <span className="opacity-60">of {totalQuestions}</span>
                            </span>
                            <span className="truncate max-w-[55%] text-right text-slate-400 uppercase tracking-wider text-[11px] font-extrabold">
                              {currentStep.sectionTitle}
                            </span>
                          </div>

                          {/* Question Title */}
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.04 }}
                          >
                            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                              {q.title}
                              {q.required && <span className="text-rose-500 ml-1">*</span>}
                            </h2>
                            {q.description && (
                              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                                {q.description}
                              </p>
                            )}
                          </motion.div>

                          {/* Input Controls by Question Type */}
                          {q.type === 'short_text' && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.08 }}
                              className="relative"
                            >
                              <input
                                type="text"
                                autoFocus
                                value={val || ''}
                                onChange={(e) => setAnswer(q.entryId, e.target.value, q)}
                                placeholder="Type your answer here…"
                                className={`w-full pl-4 pr-12 py-4 rounded-2xl border-2 border-b-4 border-slate-200 bg-slate-50/70 focus:bg-white text-base font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 transition ${theme.ring}`}
                              />
                              <AnimatePresence>
                                {hasTextValue && (
                                  <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none">
                                    <motion.span
                                      initial={{ scale: 0, rotate: -20 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      exit={{ scale: 0 }}
                                      className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm"
                                    >
                                      <Check className="w-4 h-4 stroke-[3]" />
                                    </motion.span>
                                  </div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          )}

                          {q.type === 'long_text' && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.08 }}
                            >
                              <textarea
                                rows={4}
                                autoFocus
                                value={val || ''}
                                onChange={(e) => setAnswer(q.entryId, e.target.value, q)}
                                placeholder="Share your thoughts…"
                                className="w-full px-4 py-3.5 rounded-2xl border-2 border-b-4 border-slate-200 bg-slate-50/70 focus:bg-white text-base font-medium text-slate-900 focus:outline-none focus:border-emerald-500 transition resize-none"
                              />
                            </motion.div>
                          )}

                          {q.type === 'date' && (
                            <input
                              type="date"
                              value={val || ''}
                              onChange={(e) => setAnswer(q.entryId, e.target.value, q)}
                              className="w-full px-4 py-3.5 rounded-2xl border-2 border-b-4 border-slate-200 bg-slate-50/70 focus:bg-white text-base font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                            />
                          )}

                          {q.type === 'time' && (
                            <input
                              type="time"
                              value={val || ''}
                              onChange={(e) => setAnswer(q.entryId, e.target.value, q)}
                              className="w-full px-4 py-3.5 rounded-2xl border-2 border-b-4 border-slate-200 bg-slate-50/70 focus:bg-white text-base font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                            />
                          )}

                          {(q.type === 'multiple_choice' || q.type === 'dropdown') && (
                            <div className="space-y-2.5">
                              {(q.options || []).map((option, idx) => {
                                const selected = val === option;
                                const letter = String.fromCharCode(65 + idx);
                                const isSemanticNo = isYesNoQuestion && isNoAnswer(option);
                                const isSemanticYes = isYesNoQuestion && isYesAnswer(option);

                                const selectedStyle = isSemanticNo
                                  ? 'border-rose-500 border-b-rose-600 bg-gradient-to-r from-rose-50 to-orange-50/70 ring-2 ring-rose-500/20 shadow-md shadow-rose-500/10'
                                  : isSemanticYes
                                    ? 'border-emerald-500 border-b-emerald-600 bg-gradient-to-r from-emerald-50 to-teal-50/80 ring-2 ring-emerald-500/25 shadow-md shadow-emerald-500/10'
                                    : theme.selectedCard;

                                const badgeActiveStyle = isSemanticNo
                                  ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/30'
                                  : isSemanticYes
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30'
                                    : theme.pillActive;

                                return (
                                  <button
                                    key={option}
                                    type="button"
                                    onClick={() => setAnswer(q.entryId, option, q)}
                                    className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 border-b-4 text-left transition-all duration-150 active:scale-[0.985] active:translate-y-0.5 ${
                                      selected
                                        ? selectedStyle
                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                                    }`}
                                  >
                                    <span
                                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 border transition-all ${
                                        selected
                                          ? badgeActiveStyle
                                          : 'bg-slate-100 text-slate-600 border-slate-200'
                                      }`}
                                    >
                                      {letter}
                                    </span>
                                    <span className="flex-1 text-sm sm:text-base font-bold text-slate-800">
                                      {option}
                                    </span>
                                    {selected && (
                                      <span
                                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                          isSemanticNo
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-emerald-500 text-white'
                                        }`}
                                      >
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {q.type === 'checkboxes' && (
                            <div className="flex flex-wrap gap-2.5">
                              {(q.options || []).map((option, idx) => {
                                const selected = Array.isArray(val) && val.includes(option);
                                const letter = String.fromCharCode(65 + idx);
                                return (
                                  <motion.button
                                    key={option}
                                    type="button"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                      delay: Math.min(idx * 0.04, 0.25),
                                      type: 'spring',
                                      stiffness: 380,
                                      damping: 22,
                                    }}
                                    whileHover={{ y: -2, scale: 1.03 }}
                                    whileTap={{ scale: 0.96, y: 1 }}
                                    onClick={() => toggleCheckbox(q, option)}
                                    className={`inline-flex items-center gap-2.5 px-4 py-3 rounded-2xl border-2 border-b-4 text-sm font-bold transition-colors ${
                                      selected
                                        ? theme.selectedCard
                                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                    }`}
                                  >
                                    <span
                                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold border transition-all ${
                                        selected
                                          ? theme.pillActive
                                          : 'bg-slate-100 text-slate-500 border-slate-200'
                                      }`}
                                    >
                                      {selected ? (
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      ) : (
                                        letter
                                      )}
                                    </span>
                                    <span>{option}</span>
                                  </motion.button>
                                );
                              })}
                            </div>
                          )}

                          {q.type === 'linear_scale' && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                                {Array.from(
                                  { length: (q.max ?? 5) - (q.min ?? 1) + 1 },
                                  (_, i) => (q.min ?? 1) + i
                                ).map((num, idx) => {
                                  const selected = String(val) === String(num);
                                  return (
                                    <motion.button
                                      key={num}
                                      type="button"
                                      initial={{ opacity: 0, y: 12 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{
                                        delay: idx * 0.04,
                                        type: 'spring',
                                        stiffness: 360,
                                        damping: 22,
                                      }}
                                      whileHover={{ y: -3, scale: 1.06 }}
                                      whileTap={{ scale: 0.93, y: 1 }}
                                      onClick={() => setAnswer(q.entryId, String(num), q)}
                                      className={`h-14 sm:h-16 rounded-2xl border-2 border-b-4 text-lg font-extrabold transition-colors ${
                                        selected
                                          ? theme.pillActive
                                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                                      }`}
                                    >
                                      {num}
                                    </motion.button>
                                  );
                                })}
                              </div>
                              {(q.minLabel || q.maxLabel) && (
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
                                  <span>{q.minLabel}</span>
                                  <span>{q.maxLabel}</span>
                                </div>
                              )}
                              <AnimatePresence mode="wait">
                                {val && !Number.isNaN(Number(val)) && (
                                  <motion.div
                                    key={val}
                                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex items-center justify-center pt-1"
                                  >
                                    {(() => {
                                      const rating = getScaleLabel(
                                        Number(val),
                                        Number(q.min ?? 1),
                                        Number(q.max ?? 5)
                                      );
                                      return (
                                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/70 text-xs font-extrabold text-slate-700">
                                          <span className="inline-flex items-center gap-0.5">
                                            {Array.from({ length: 5 }, (_, i) => (
                                              <motion.span
                                                key={i}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{
                                                  delay: i * 0.04,
                                                  type: 'spring',
                                                  stiffness: 420,
                                                }}
                                              >
                                                <Star
                                                  className={`w-3.5 h-3.5 ${
                                                    i < rating.stars
                                                      ? 'fill-amber-400 text-amber-400'
                                                      : 'text-slate-300'
                                                  }`}
                                                />
                                              </motion.span>
                                            ))}
                                          </span>
                                          <span>{rating.text}</span>
                                        </span>
                                      );
                                    })()}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {/* Smart Collapsible Optional / Required Comment Drawer */}
                          <AnimatePresence initial={false}>
                            {showCommentSection && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.24, ease: 'easeOut' }}
                                className="pt-1 overflow-hidden"
                              >
                                {isCommentRequired ? (
                                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-rose-700">
                                    <span className="inline-flex items-center gap-1.5">
                                      <MessageSquarePlus className="w-4 h-4 text-rose-600" />
                                      <span>
                                        {commentField.label || 'Additional comment'}
                                        <span className="text-rose-500 ml-1">*</span>
                                      </span>
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-extrabold">
                                      Required for "No"
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenComments((prev) => ({
                                        ...prev,
                                        [q.id]: !isCommentOpen,
                                      }))
                                    }
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                                  >
                                    <MessageSquarePlus className="w-4 h-4" />
                                    <span>
                                      {isCommentOpen
                                        ? commentField.label
                                        : '+ Add optional comment'}
                                    </span>
                                    <ChevronDown
                                      className={`w-3.5 h-3.5 transition-transform ${
                                        isCommentOpen ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </button>
                                )}

                                <AnimatePresence initial={false}>
                                  {isCommentOpen && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.22 }}
                                      className="overflow-hidden"
                                    >
                                      <textarea
                                        rows={3}
                                        value={commentVal}
                                        onChange={(e) =>
                                          setAnswer(commentField.entryId, e.target.value)
                                        }
                                        placeholder={
                                          isCommentRequired
                                            ? 'Please explain why you answered "No"…'
                                            : commentField.placeholder
                                        }
                                        className={`mt-2.5 w-full px-3.5 py-2.5 rounded-2xl border-2 text-base sm:text-sm text-slate-800 focus:outline-none focus:bg-white resize-none transition ${
                                          isCommentRequired && !commentVal.trim()
                                            ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500'
                                            : 'border-slate-200 bg-slate-50/70 focus:border-slate-400'
                                        }`}
                                      />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <AnimatePresence>
                            {validationError && (
                              <motion.p
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-2xl flex items-center gap-2"
                              >
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {validationError}
                              </motion.p>
                            )}
                          </AnimatePresence>

                          {/* Desktop Inline Footer Navigation (hidden on mobile where sticky bar is used) */}
                          <div className="hidden sm:flex pt-4 items-center justify-between gap-3 border-t border-slate-100">
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.96, y: 1 }}
                              type="button"
                              onClick={handleBack}
                              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl border-2 border-slate-200 border-b-4 hover:bg-slate-50 text-slate-600 text-sm font-bold transition"
                            >
                              <ArrowLeft className="w-4 h-4" />
                              Back
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.03, y: -1 }}
                              whileTap={{ scale: 0.96, y: 2 }}
                              type="button"
                              disabled={submitting}
                              onClick={handleNext}
                              className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-extrabold text-sm shadow-lg border-b-4 border-black/20 active:border-b-0 transition disabled:opacity-60 ${theme.accentBg}`}
                            >
                              {submitting ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Submitting…
                                </>
                              ) : isLastStep ? (
                                <>
                                  Submit Answers
                                  <Check className="w-4 h-4" />
                                </>
                              ) : (
                                <>
                                  Next
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </motion.button>
                          </div>

                          <p className="sm:hidden text-[11px] text-center text-slate-400 font-medium pt-1">
                            Swipe left or right to move between questions
                          </p>

                          <p className="hidden sm:block text-[11px] text-center text-slate-400 font-medium">
                            Tip: Press{' '}
                            <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono text-slate-600">
                              Enter
                            </kbd>{' '}
                            to advance
                            {['multiple_choice', 'dropdown', 'checkboxes'].includes(q.type) &&
                              ' · Keys A–Z to select'}
                            {q.type === 'linear_scale' && ' · Number keys to rate'}
                          </p>
                        </div>
                      );
                    })()
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* COMPLETION SCREEN */}
            {phase === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.88, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.45, type: 'spring', stiffness: 220, damping: 20 }}
                className="relative rounded-[32px] bg-white/95 backdrop-blur-xl p-8 sm:p-10 shadow-2xl border-2 border-white text-center space-y-5 overflow-visible"
              >
                <ConfettiBurst colors={theme.confettiColors} />

                <motion.div
                  initial={{ scale: 0, rotate: -25 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 16 }}
                  className={`relative z-10 w-20 h-20 rounded-3xl bg-gradient-to-br ${theme.heroGradient} text-white flex items-center justify-center mx-auto shadow-xl`}
                >
                  <Award className="w-10 h-10" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative z-10"
                >
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    Awesome! All Done
                  </h2>
                  <p className="mt-2 text-sm sm:text-base text-slate-500">
                    Your response to{' '}
                    <span className="font-bold text-slate-800">{form.title}</span> has
                    been recorded.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                  className="relative z-10 flex flex-wrap items-center justify-center gap-2"
                >
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {answeredCount} {answeredCount === 1 ? 'question' : 'questions'} answered
                  </span>

                  {submitResult && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          submitResult.google_sync_status === 'synced'
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      {submitResult.google_sync_status === 'synced'
                        ? 'Synced with Live Monitor & Google Forms'
                        : 'Saved locally (Google Forms sync queued)'}
                    </span>
                  )}
                </motion.div>

                <div className="relative z-10 pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97, y: 1 }}
                    type="button"
                    onClick={() => {
                      setPhase('finished');
                      try {
                        window.close();
                      } catch {
                        // Browser may block closing non-script-opened tabs; finished screen handles it gracefully
                      }
                    }}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl text-white text-sm font-extrabold shadow-lg border-b-4 border-black/20 active:border-b-0 transition ${theme.accentBg}`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    Finish
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => {
                      setAnswers({});
                      setOpenComments({});
                      setStepIndex(0);
                      setHasSavedDraft(false);
                      setBuddyPulse(null);
                      setPhase('welcome');
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border-2 border-slate-200 border-b-4 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Submit Another Response
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* FINISHED / SAFE TO CLOSE SCREEN */}
            {phase === 'finished' && (
              <motion.div
                key="finished"
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.35, type: 'spring' }}
                className="relative rounded-[32px] bg-white/95 backdrop-blur-xl p-8 sm:p-10 shadow-2xl border-2 border-white text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Response Saved
                </h2>
                <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Thank you for completing{' '}
                  <span className="font-bold text-slate-800">{form.title}</span>. You may
                  now safely close this window or browser tab.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Thumb-Friendly Sticky Bottom Action Bar */}
      {phase === 'playing' && currentStep && (
        <div
          className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200/80 px-4 pt-3 shadow-[0_-6px_20px_rgba(15,23,42,0.06)]"
          style={{ paddingBottom: 'max(0.85rem, env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleBack}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl border-2 border-slate-200 border-b-4 bg-white text-slate-700 text-sm font-bold shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97, y: 1 }}
              type="button"
              disabled={submitting}
              onClick={handleNext}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl text-white font-extrabold text-sm shadow-lg border-b-4 border-black/20 active:border-b-0 disabled:opacity-60 ${theme.accentBg}`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : stepIndex === steps.length - 1 ? (
                <>
                  Submit Answers
                  <Check className="w-4 h-4 stroke-[3]" />
                </>
              ) : currentStep.kind === 'milestone' ? (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
