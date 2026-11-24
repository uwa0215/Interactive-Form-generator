import React, { useEffect, useMemo, useState } from 'react';
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

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 70 : -70,
    opacity: 0,
    scale: 0.94,
    rotate: direction > 0 ? 1.5 : -1.5,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
  },
  exit: (direction) => ({
    x: direction > 0 ? -70 : 70,
    opacity: 0,
    scale: 0.94,
    rotate: direction > 0 ? -1.5 : 1.5,
  }),
};

/** Pure vector/geometric animated background (zero emojis) */
function AmbientBackground({ theme }) {
  const accentStroke = theme.chartColors?.[0] || '#10b981';
  const secondaryStroke = theme.chartColors?.[1] || '#14b8a6';

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Subtle geometric dot matrix */}
      <div
        className="absolute inset-0 opacity-[0.38]"
        style={{
          backgroundImage: 'radial-gradient(rgba(15, 23, 42, 0.11) 1.2px, transparent 1.2px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Soft Drifting Pastel Orbs */}
      <motion.div
        animate={{ x: [0, 45, -25, 0], y: [0, -35, 25, 0], scale: [1, 1.12, 0.94, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute -top-24 -left-24 w-80 h-80 sm:w-[480px] sm:h-[480px] rounded-full blur-3xl ${theme.orb1}`}
      />
      <motion.div
        animate={{ x: [0, -45, 25, 0], y: [0, 35, -25, 0], scale: [1, 0.92, 1.08, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute top-1/4 -right-28 w-80 h-80 sm:w-[460px] sm:h-[460px] rounded-full blur-3xl ${theme.orb2}`}
      />
      <motion.div
        animate={{ x: [0, 30, -30, 0], y: [0, -25, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute -bottom-28 left-1/3 w-72 h-72 sm:w-[420px] sm:h-[420px] rounded-full blur-3xl ${theme.orb3}`}
      />

      {/* Animated Flowing SVG Ribbon Wave (Bottom) */}
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 right-0 w-full h-44 sm:h-56 opacity-[0.16]"
      >
        <motion.path
          d="M0,192 C240,120 480,260 720,180 C960,100 1200,240 1440,160 L1440,320 L0,320 Z"
          fill={accentStroke}
          animate={{
            d: [
              'M0,192 C240,120 480,260 720,180 C960,100 1200,240 1440,160 L1440,320 L0,320 Z',
              'M0,160 C240,240 480,110 720,200 C960,260 1200,120 1440,192 L1440,320 L0,320 Z',
              'M0,192 C240,120 480,260 720,180 C960,100 1200,240 1440,160 L1440,320 L0,320 Z',
            ],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="M0,240 C300,180 600,290 900,210 C1150,150 1320,250 1440,220 L1440,320 L0,320 Z"
          fill={secondaryStroke}
          opacity="0.65"
          animate={{
            d: [
              'M0,240 C300,180 600,290 900,210 C1150,150 1320,250 1440,220 L1440,320 L0,320 Z',
              'M0,210 C300,280 600,170 900,240 C1150,280 1320,180 1440,235 L1440,320 L0,320 Z',
              'M0,240 C300,180 600,290 900,210 C1150,150 1320,250 1440,220 L1440,320 L0,320 Z',
            ],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>

      {/* Top-Left Animated Orbital Ring */}
      <motion.svg
        viewBox="0 0 160 160"
        className="hidden md:block absolute top-20 left-[7%] w-32 h-32 opacity-40"
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
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
        <circle cx="80" cy="22" r="5" fill={accentStroke} />
        <circle cx="138" cy="80" r="3.5" fill={secondaryStroke} opacity="0.7" />
      </motion.svg>

      {/* Top-Right Animated Geometric Vector Starburst */}
      <motion.svg
        viewBox="0 0 120 120"
        className="hidden md:block absolute top-24 right-[8%] w-24 h-24 opacity-35"
        animate={{ rotate: [0, 90, 180], scale: [1, 1.12, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path
          d="M60 12 L68 52 L108 60 L68 68 L60 108 L52 68 L12 60 L52 52 Z"
          fill="none"
          stroke={accentStroke}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="60" cy="60" r="7" fill={secondaryStroke} opacity="0.6" />
      </motion.svg>

      {/* Bottom-Left Floating Glass Rounded Diamond */}
      <motion.div
        animate={{ y: [0, -18, 0], rotate: [45, 60, 45] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden md:block absolute bottom-28 left-[11%] w-14 h-14 rounded-2xl bg-white/45 backdrop-blur-md border-2 border-white/80 shadow-lg"
      />

      {/* Bottom-Right Pulsing Concentric Vector Rings */}
      <motion.svg
        viewBox="0 0 140 140"
        className="hidden md:block absolute bottom-24 right-[10%] w-28 h-28 opacity-35"
        animate={{ scale: [0.95, 1.08, 0.95], rotate: [0, -180, -360] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle
          cx="70"
          cy="70"
          r="52"
          fill="none"
          stroke={secondaryStroke}
          strokeWidth="1.5"
          strokeDasharray="10 10"
        />
        <circle
          cx="70"
          cy="70"
          r="30"
          fill="none"
          stroke={accentStroke}
          strokeWidth="2"
        />
        <circle cx="70" cy="70" r="8" fill={accentStroke} opacity="0.5" />
      </motion.svg>
    </div>
  );
}

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

  // Auto-save answers to LocalStorage
  useEffect(() => {
    if (phase === 'playing' && Object.keys(answers).length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(answers));
      } catch {
        // ignore quota errors
      }
    }
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
        if (hasNoOption(questionObj) && isNoAnswer(value)) {
          triggerBuddyPulse('curious', 'Tell us a bit more so we can improve.');
        } else {
          triggerBuddyPulse('happy', 'Got it! Press Next or Enter to continue.');
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
    const errMsg = getValidationError();
    if (errMsg) {
      setValidationError(errMsg);
      setShakeCount((c) => c + 1);
      return;
    }
    setValidationError('');
    setBuddyPulse(null);

    if (stepIndex < steps.length - 1) {
      setDirection(1);
      setStepIndex((i) => i + 1);
      return;
    }

    // Final step -> Submit
    setSubmitting(true);
    try {
      const res = await api.submitPublicForm(slug, answers);
      setSubmitResult(res);
      setPhase('complete');
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    } catch (err) {
      setValidationError(err.message || 'Submission failed. Please try again.');
      setShakeCount((c) => c + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    setValidationError('');
    setBuddyPulse(null);
    if (stepIndex > 0) {
      setDirection(-1);
      setStepIndex((i) => i - 1);
    } else {
      setPhase('welcome');
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
    <div className={`min-h-screen relative flex flex-col overflow-x-hidden ${theme.pageBg}`}>
      <AmbientBackground theme={theme} />

      {/* Top Floating Capsule Progress HUD */}
      {phase === 'playing' && (
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-0 right-0 z-40 px-4"
        >
          <div className="max-w-xl mx-auto rounded-full bg-white/85 backdrop-blur-xl border-2 border-white shadow-lg shadow-slate-900/5 px-4 py-2.5 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-600 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full shrink-0">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              {answeredCount}
            </span>

            {/* Pill Progress Track */}
            <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/60">
              <motion.div
                className={`h-full rounded-full relative ${theme.progressBar}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(progressPct, 6)}%` }}
                transition={{ type: 'spring', stiffness: 140, damping: 20 }}
              >
                <motion.div
                  animate={{ x: ['-100%', '220%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                />
              </motion.div>
            </div>

            <span className="text-xs font-extrabold text-slate-600 tabular-nums shrink-0 min-w-[38px] text-right">
              {progressPct}%
            </span>
          </div>
        </motion.div>
      )}

      {/* Main Centered Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-12 sm:p-8 sm:pt-24">
        <div className="w-full max-w-xl">
          {/* Pure-SVG Animated Companion Mascot */}
          <MascotBuddy
            mood={buddyState.mood}
            message={buddyState.message}
            themeId={form.theme}
          />

          <AnimatePresence mode="wait" custom={direction}>
            {/* WELCOME SCREEN */}
            {phase === 'welcome' && (
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

                <div className="rounded-[32px] bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-900/10 border-2 border-white overflow-hidden">
                  {/* Hero Gradient Banner */}
                  <div
                    className={`relative px-7 pt-8 pb-7 sm:px-10 sm:pt-9 bg-gradient-to-br ${theme.heroGradient} text-white overflow-hidden`}
                  >
                    <motion.div
                      animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/15 blur-xl"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 backdrop-blur-md border border-white/30 mb-3.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Interactive Form
                    </motion.div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                      {form.title}
                    </h1>
                  </div>

                  <div className="p-7 sm:p-9 space-y-6">
                    {form.description && (
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        {form.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold text-slate-600">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 border border-slate-200/70">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        ~{estimatedMins} min
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 border border-slate-200/70">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        {totalQuestions} {totalQuestions === 1 ? 'question' : 'questions'}
                      </span>
                      {hasSavedDraft && (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl ${theme.badge}`}
                        >
                          <Heart className="w-3.5 h-3.5" />
                          Draft saved
                        </span>
                      )}
                    </div>

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
            )}

            {/* PLAYING: SECTION MILESTONE OR QUESTION */}
            {phase === 'playing' && currentStep && (
              <motion.div
                key={currentStep.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                className="relative"
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
                  transition={{ duration: 0.4 }}
                  className="rounded-[32px] bg-white/95 backdrop-blur-xl p-6 sm:p-9 shadow-2xl shadow-slate-900/10 border-2 border-white relative overflow-hidden"
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
                                  <motion.button
                                    key={option}
                                    type="button"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                      delay: Math.min(idx * 0.045, 0.25),
                                      type: 'spring',
                                      stiffness: 380,
                                      damping: 24,
                                    }}
                                    whileHover={{ y: -2, scale: 1.01 }}
                                    whileTap={{ scale: 0.985, y: 1 }}
                                    onClick={() => setAnswer(q.entryId, option, q)}
                                    className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 border-b-4 text-left transition-colors ${
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
                                    <AnimatePresence>
                                      {selected && (
                                        <motion.span
                                          initial={{ scale: 0, rotate: -35 }}
                                          animate={{ scale: 1, rotate: 0 }}
                                          exit={{ scale: 0 }}
                                          transition={{ type: 'spring', stiffness: 460, damping: 18 }}
                                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                            isSemanticNo
                                              ? 'bg-rose-500 text-white'
                                              : 'bg-emerald-500 text-white'
                                          }`}
                                        >
                                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        </motion.span>
                                      )}
                                    </AnimatePresence>
                                  </motion.button>
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
                                        className={`mt-2.5 w-full px-3.5 py-2.5 rounded-2xl border-2 text-sm text-slate-800 focus:outline-none focus:bg-white resize-none transition ${
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

                          {/* Footer Navigation with Tactile 3D Buttons */}
                          <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100">
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
    </div>
  );
}
