import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const THEME_PALETTE = {
  emerald: {
    body: '#10b981',
    bodyLight: '#34d399',
    belly: '#d1fae5',
    cheek: '#fb7185',
    spark: '#f59e0b',
    glow: 'rgba(16, 185, 129, 0.28)',
    bubbleBorder: 'border-emerald-200',
  },
  slate: {
    body: '#475569',
    bodyLight: '#64748b',
    belly: '#e2e8f0',
    cheek: '#f472b6',
    spark: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.25)',
    bubbleBorder: 'border-slate-200',
  },
  vibrant: {
    body: '#a855f7',
    bodyLight: '#e879f9',
    belly: '#fae8ff',
    cheek: '#fb7185',
    spark: '#f59e0b',
    glow: 'rgba(192, 38, 211, 0.28)',
    bubbleBorder: 'border-fuchsia-200',
  },
};

/**
 * Pure-SVG animated companion mascot ("Pip") with zero emojis.
 * mood: 'welcome' | 'idle' | 'happy' | 'curious' | 'oops' | 'milestone' | 'complete'
 */
const MascotBuddy = React.memo(function MascotBuddy({
  mood = 'idle',
  message = '',
  themeId = 'emerald',
}) {
  const colors = THEME_PALETTE[themeId] || THEME_PALETTE.emerald;

  const bodyAnimate =
    mood === 'happy' || mood === 'complete'
      ? { y: [0, -10, 0, -5, 0], rotate: [0, -5, 5, 0] }
      : mood === 'oops'
        ? { x: [0, -5, 5, -3, 3, 0], rotate: [0, -6, 6, 0] }
        : mood === 'milestone'
          ? { y: [0, -8, 0], scale: [1, 1.06, 1] }
          : { y: [0, -4, 0], rotate: [0, 1.5, -1.5, 0] };

  const bodyTransition =
    mood === 'happy' || mood === 'oops'
      ? { duration: 0.55, ease: 'easeInOut' }
      : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' };

  return (
    <div className="flex items-end justify-center gap-3 mb-3 select-none">
      {/* Pure Vector SVG Buddy */}
      <motion.div
        key={mood}
        animate={bodyAnimate}
        transition={bodyTransition}
        className="relative w-16 h-16 shrink-0"
        style={{ filter: `drop-shadow(0 8px 14px ${colors.glow})` }}
      >
        <svg viewBox="0 0 80 80" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={`pip-grad-${themeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.bodyLight} />
              <stop offset="100%" stopColor={colors.body} />
            </linearGradient>
          </defs>

          {/* Animated Antenna / Sprout */}
          <motion.path
            d="M40 16 C40 9, 46 6, 50 9"
            fill="none"
            stroke={colors.body}
            strokeWidth="3.5"
            strokeLinecap="round"
            animate={{ rotate: [-6, 6, -6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '40px', originY: '16px' }}
          />
          <circle cx="51" cy="9" r="4" fill="#fbbf24" />

          {/* Main Squishy Rounded Body */}
          <rect
            x="14"
            y="16"
            width="52"
            height="50"
            rx="24"
            fill={`url(#pip-grad-${themeId})`}
          />

          {/* Soft Belly Highlight */}
          <ellipse cx="40" cy="54" rx="16" ry="9" fill={colors.belly} opacity="0.55" />

          {/* Rosy Cheeks */}
          <ellipse cx="24" cy="43" rx="4.5" ry="2.8" fill={colors.cheek} opacity="0.65" />
          <ellipse cx="56" cy="43" rx="4.5" ry="2.8" fill={colors.cheek} opacity="0.65" />

          {/* Eyes */}
          {mood === 'happy' || mood === 'complete' || mood === 'milestone' ? (
            <>
              <path
                d="M26 37 Q30 31 34 37"
                fill="none"
                stroke="#0f172a"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M46 37 Q50 31 54 37"
                fill="none"
                stroke="#0f172a"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </>
          ) : mood === 'oops' ? (
            <>
              <circle cx="30" cy="36" r="4.8" fill="#ffffff" />
              <circle cx="30" cy="36" r="2.3" fill="#0f172a" />
              <circle cx="50" cy="36" r="4.8" fill="#ffffff" />
              <circle cx="50" cy="36" r="2.3" fill="#0f172a" />
            </>
          ) : (
            <motion.g
              animate={{ scaleY: [1, 1, 0.12, 1, 1] }}
              transition={{ duration: 4.2, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
              style={{ originY: '36px' }}
            >
              <circle cx="30" cy="36" r="4.2" fill="#0f172a" />
              <circle cx="28.6" cy="34.5" r="1.4" fill="#ffffff" />
              <circle cx="50" cy="36" r="4.2" fill="#0f172a" />
              <circle cx="48.6" cy="34.5" r="1.4" fill="#ffffff" />
            </motion.g>
          )}

          {/* Mouth */}
          {mood === 'happy' || mood === 'complete' || mood === 'milestone' ? (
            <path
              d="M34 44 Q40 51 46 44"
              fill="none"
              stroke="#0f172a"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ) : mood === 'oops' ? (
            <circle cx="40" cy="46" r="3.2" fill="#0f172a" />
          ) : mood === 'curious' ? (
            <path
              d="M36 45 Q40 43 44 45"
              fill="none"
              stroke="#0f172a"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M35 44 Q40 48 45 44"
              fill="none"
              stroke="#0f172a"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          )}

          {/* Animated Side Hands */}
          <motion.circle
            cx="11"
            cy="44"
            r="5"
            fill={colors.bodyLight}
            animate={
              mood === 'welcome' || mood === 'complete'
                ? { y: [0, -7, 0, -5, 0] }
                : { y: [0, -2, 0] }
            }
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="69"
            cy="44"
            r="5"
            fill={colors.body}
            animate={
              mood === 'complete'
                ? { y: [0, -7, 0, -5, 0] }
                : { y: [0, 2, 0] }
            }
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>

        {/* Animated SVG 4-Point Vector Star Spark (replaces emoji) */}
        {(mood === 'happy' || mood === 'complete' || mood === 'milestone') && (
          <motion.svg
            viewBox="0 0 24 24"
            className="w-5 h-5 absolute -top-2 -right-2 pointer-events-none"
            initial={{ opacity: 0, scale: 0, rotate: -45 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.4, 1.2, 0.6],
              rotate: [0, 90, 180],
              y: [4, -10],
            }}
            transition={{ duration: 1.1, repeat: mood === 'complete' ? Infinity : 0 }}
          >
            <path
              d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
              fill={colors.spark}
            />
          </motion.svg>
        )}
      </motion.div>

      {/* Clean Speech Bubble */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, scale: 0.85, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.88, x: 6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            className={`relative px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white/95 backdrop-blur-md border-2 ${colors.bubbleBorder} shadow-md text-xs sm:text-sm font-bold text-slate-700 max-w-[260px] sm:max-w-xs leading-snug mb-2`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default MascotBuddy;
