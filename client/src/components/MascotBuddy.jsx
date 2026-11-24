import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const THEME_PALETTE = {
  emerald: {
    shellTop: '#ecfdf5',
    shellBottom: '#a7f3d0',
    shellStroke: '#10b981',
    accent: '#059669',
    led: '#34d399',
    cheek: '#fb7185',
    leafDark: '#15803d',
    leafLight: '#4ade80',
    grain: '#f59e0b',
    grainLight: '#fde047',
    shadow: 'rgba(16, 185, 129, 0.28)',
    bubbleBorder: 'border-emerald-200',
  },
  slate: {
    shellTop: '#f8fafc',
    shellBottom: '#cbd5e1',
    shellStroke: '#475569',
    accent: '#334155',
    led: '#38bdf8',
    cheek: '#fb923c',
    leafDark: '#15803d',
    leafLight: '#4ade80',
    grain: '#f59e0b',
    grainLight: '#fde047',
    shadow: 'rgba(56, 189, 248, 0.25)',
    bubbleBorder: 'border-slate-200',
  },
  ocean: {
    shellTop: '#eff6ff',
    shellBottom: '#bfdbfe',
    shellStroke: '#2563eb',
    accent: '#1d4ed8',
    led: '#38bdf8',
    cheek: '#fb923c',
    leafDark: '#15803d',
    leafLight: '#4ade80',
    grain: '#f59e0b',
    grainLight: '#fde047',
    shadow: 'rgba(37, 99, 235, 0.25)',
    bubbleBorder: 'border-blue-200',
  },
  indigo: {
    shellTop: '#eef2ff',
    shellBottom: '#c7d2fe',
    shellStroke: '#4f46e5',
    accent: '#4338ca',
    led: '#818cf8',
    cheek: '#fb923c',
    leafDark: '#15803d',
    leafLight: '#4ade80',
    grain: '#f59e0b',
    grainLight: '#fde047',
    shadow: 'rgba(79, 70, 229, 0.25)',
    bubbleBorder: 'border-indigo-200',
  },
  teal: {
    shellTop: '#ecfeff',
    shellBottom: '#a5f3fc',
    shellStroke: '#0891b2',
    accent: '#0e7490',
    led: '#22d3ee',
    cheek: '#fb923c',
    leafDark: '#15803d',
    leafLight: '#4ade80',
    grain: '#f59e0b',
    grainLight: '#fde047',
    shadow: 'rgba(8, 145, 178, 0.25)',
    bubbleBorder: 'border-cyan-200',
  },
  amber: {
    shellTop: '#fffbeb',
    shellBottom: '#fde68a',
    shellStroke: '#d97706',
    accent: '#b45309',
    led: '#fbbf24',
    cheek: '#fb7185',
    leafDark: '#15803d',
    leafLight: '#4ade80',
    grain: '#f59e0b',
    grainLight: '#fde047',
    shadow: 'rgba(217, 119, 6, 0.25)',
    bubbleBorder: 'border-amber-200',
  },
};

/**
 * Cute animated Agri-Tech MIS Mini-Robot companion (Department of Agriculture + ICT).
 * Lightweight pure SVG with swaying rice-sprout antenna, waving arms, blinking LED eyes & hovering motion.
 * mood: 'welcome' | 'idle' | 'happy' | 'curious' | 'oops' | 'milestone' | 'complete'
 */
const MascotBuddy = React.memo(function MascotBuddy({
  mood = 'idle',
  message = '',
  themeId = 'emerald',
}) {
  const colors = THEME_PALETTE[themeId] || THEME_PALETTE.emerald;
  const eyeColor = mood === 'oops' ? '#fb7185' : mood === 'curious' ? '#fbbf24' : colors.led;

  const isExcited = mood === 'happy' || mood === 'complete' || mood === 'milestone';

  const botAnimate = isExcited
    ? { y: [0, -9, 0, -5, 0], rotate: [0, -6, 6, -2, 0] }
    : mood === 'oops'
      ? { x: [0, -5, 5, -3, 3, 0], rotate: [0, -5, 5, 0] }
      : { y: [0, -5, 0], rotate: [-2, 2, -2] };

  const botTransition =
    mood === 'happy' || mood === 'oops'
      ? { duration: 0.55, ease: 'easeInOut' }
      : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' };

  return (
    <div className="flex items-end justify-center gap-3 mb-3 select-none">
      {/* Cute Animated Agri-Tech MIS Robot */}
      <div className="relative w-20 h-20 shrink-0 flex flex-col items-center justify-end">
        <motion.div
          key={mood}
          animate={botAnimate}
          transition={botTransition}
          className="relative w-20 h-20 will-change-transform"
          style={{ filter: `drop-shadow(0 6px 12px ${colors.shadow})` }}
        >
          <svg viewBox="0 0 96 96" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id={`agri-shell-${themeId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={colors.shellTop} />
                <stop offset="100%" stopColor={colors.shellBottom} />
              </linearGradient>
              <linearGradient id={`agri-visor-${themeId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id={`agri-grain-${themeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.grainLight} />
                <stop offset="100%" stopColor={colors.grain} />
              </linearGradient>
            </defs>

            {/* Swaying Agriculture Sprout + Golden Rice Grain Antenna */}
            <motion.g
              animate={{ rotate: [-9, 9, -9] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ originX: '48px', originY: '26px' }}
            >
              {/* Stem */}
              <path
                d="M48 26 Q48 18 48 13"
                stroke={colors.leafDark}
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              {/* Left Leaf */}
              <path
                d="M48 20 C41 19, 36 14, 38 11 C42 11, 46 15, 48 20 Z"
                fill={colors.leafLight}
                stroke={colors.leafDark}
                strokeWidth="1.2"
              />
              {/* Right Leaf */}
              <path
                d="M48 20 C55 19, 60 14, 58 11 C54 11, 50 15, 48 20 Z"
                fill={colors.leafLight}
                stroke={colors.leafDark}
                strokeWidth="1.2"
              />
              {/* Golden Rice Grain Tip (glowing agri-beacon) */}
              <ellipse
                cx="48"
                cy="9.5"
                rx="3.8"
                ry="5.5"
                fill={`url(#agri-grain-${themeId})`}
                stroke="#d97706"
                strokeWidth="1"
              />
            </motion.g>

            {/* Side Tech Headset Ear Pods */}
            <rect
              x="12"
              y="39"
              width="8"
              height="16"
              rx="4"
              fill={colors.accent}
            />
            <rect
              x="76"
              y="39"
              width="8"
              height="16"
              rx="4"
              fill={colors.accent}
            />
            <circle cx="16" cy="47" r="2.2" fill={colors.grainLight} />
            <circle cx="80" cy="47" r="2.2" fill={colors.grainLight} />

            {/* Rounded Chubby Robot Head */}
            <rect
              x="18"
              y="25"
              width="60"
              height="44"
              rx="20"
              fill={`url(#agri-shell-${themeId})`}
              stroke={colors.shellStroke}
              strokeWidth="2.2"
            />

            {/* Top Glossy Reflection */}
            <path
              d="M32 29.5 H64"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.85"
            />

            {/* Dark OLED Face Visor */}
            <rect
              x="25"
              y="33"
              width="46"
              height="28"
              rx="12"
              fill={`url(#agri-visor-${themeId})`}
            />

            {/* Cute Glowing Rosy Digital Cheeks */}
            <ellipse cx="32" cy="52" rx="3.8" ry="2.2" fill={colors.cheek} opacity="0.7" />
            <ellipse cx="64" cy="52" rx="3.8" ry="2.2" fill={colors.cheek} opacity="0.7" />

            {/* Expressive LED Eyes */}
            {isExcited ? (
              <>
                <path
                  d="M33 45 Q38 39 43 45"
                  fill="none"
                  stroke={eyeColor}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                <path
                  d="M53 45 Q58 39 63 45"
                  fill="none"
                  stroke={eyeColor}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </>
            ) : mood === 'oops' ? (
              <>
                <circle cx="38" cy="44" r="4.3" fill="none" stroke={eyeColor} strokeWidth="2.6" />
                <circle cx="38" cy="44" r="1.4" fill={eyeColor} />
                <circle cx="58" cy="44" r="4.3" fill="none" stroke={eyeColor} strokeWidth="2.6" />
                <circle cx="58" cy="44" r="1.4" fill={eyeColor} />
              </>
            ) : mood === 'curious' ? (
              <>
                <rect x="34" y="42" width="8" height="5.5" rx="2.75" fill={eyeColor} />
                <circle cx="58" cy="44" r="4.5" fill={eyeColor} />
                <circle cx="56.5" cy="42.4" r="1.4" fill="#ffffff" />
              </>
            ) : (
              <motion.g
                animate={{ scaleY: [1, 1, 0.12, 1, 1] }}
                transition={{ duration: 3.6, repeat: Infinity, times: [0, 0.46, 0.5, 0.54, 1] }}
                style={{ originY: '44px' }}
              >
                <circle cx="38" cy="44" r="4.6" fill={eyeColor} />
                <circle cx="36.4" cy="42.2" r="1.5" fill="#ffffff" />
                <circle cx="58" cy="44" r="4.6" fill={eyeColor} />
                <circle cx="56.4" cy="42.2" r="1.5" fill="#ffffff" />
              </motion.g>
            )}

            {/* Cute LED Smile */}
            {isExcited ? (
              <path
                d="M42 51 Q48 56.5 54 51"
                fill="none"
                stroke={eyeColor}
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            ) : mood === 'oops' ? (
              <circle cx="48" cy="52.5" r="2.6" fill={eyeColor} />
            ) : mood === 'curious' ? (
              <path
                d="M44 53 Q48 51 52 53"
                fill="none"
                stroke={eyeColor}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M43 51.5 Q48 55 53 51.5"
                fill="none"
                stroke={eyeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Waving Left Mini-Arm */}
            <motion.path
              d="M28 74 Q20 71 17 65"
              fill="none"
              stroke={colors.accent}
              strokeWidth="5"
              strokeLinecap="round"
              animate={
                mood === 'welcome' || isExcited
                  ? { rotate: [-18, 22, -18] }
                  : { rotate: [-6, 10, -6] }
              }
              transition={{
                duration: mood === 'welcome' || isExcited ? 0.9 : 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ originX: '28px', originY: '74px' }}
            />

            {/* Waving Right Mini-Arm */}
            <motion.path
              d="M68 74 Q76 71 79 65"
              fill="none"
              stroke={colors.accent}
              strokeWidth="5"
              strokeLinecap="round"
              animate={
                isExcited
                  ? { rotate: [18, -22, 18] }
                  : { rotate: [6, -10, 6] }
              }
              transition={{
                duration: isExcited ? 0.9 : 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ originX: '68px', originY: '74px' }}
            />

            {/* Cute Rounded Hover-Bot Body with Leaf Emblem */}
            <path
              d="M31 69 H65 C65 80, 58 84, 48 84 C38 84, 31 80, 31 69 Z"
              fill={`url(#agri-shell-${themeId})`}
              stroke={colors.shellStroke}
              strokeWidth="2"
            />
            {/* Tiny Golden Core Emblem on Chest */}
            <circle cx="48" cy="76" r="3.4" fill={colors.grain} />
            <circle cx="48" cy="76" r="1.5" fill="#ffffff" opacity="0.85" />
          </svg>

          {/* Animated Golden Sparkle on Positive Moods */}
          {isExcited && (
            <motion.svg
              viewBox="0 0 24 24"
              className="w-4 h-4 absolute top-0 right-0 pointer-events-none"
              initial={{ opacity: 0, scale: 0, rotate: -45 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.2, 0.7],
                rotate: [0, 90, 180],
                y: [2, -8],
              }}
              transition={{ duration: 1.1, repeat: Infinity }}
            >
              <path
                d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
                fill={colors.grain}
              />
            </motion.svg>
          )}
        </motion.div>

        {/* Synced Hover Ground Shadow */}
        <motion.div
          animate={{ scaleX: [1, 0.78, 1], opacity: [0.28, 0.14, 0.28] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-10 h-1.5 rounded-full bg-emerald-900/30 -mt-1"
        />
      </div>

      {/* Clean Speech Bubble */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, scale: 0.9, x: -6 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={`relative px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white border-2 ${colors.bubbleBorder} shadow-md text-xs sm:text-sm font-bold text-slate-700 max-w-[260px] sm:max-w-xs leading-snug mb-3`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default MascotBuddy;
