import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const THEME_PALETTE = {
  emerald: {
    shellLight: '#34d399',
    shellDark: '#059669',
    led: '#34d399',
    ledGlow: '#6ee7b7',
    beacon: '#fbbf24',
    ear: '#0d9488',
    shadow: 'rgba(16, 185, 129, 0.28)',
    bubbleBorder: 'border-emerald-200',
  },
  slate: {
    shellLight: '#64748b',
    shellDark: '#1e293b',
    led: '#38bdf8',
    ledGlow: '#7dd3fc',
    beacon: '#818cf8',
    ear: '#334155',
    shadow: 'rgba(56, 189, 248, 0.25)',
    bubbleBorder: 'border-slate-200',
  },
  vibrant: {
    shellLight: '#e879f9',
    shellDark: '#7c3aed',
    led: '#f0abfc',
    ledGlow: '#f5d0fe',
    beacon: '#fbbf24',
    ear: '#9333ea',
    shadow: 'rgba(192, 38, 211, 0.28)',
    bubbleBorder: 'border-fuchsia-200',
  },
};

/**
 * Cute ICT / MIS-inspired animated mini-robot companion (pure lightweight SVG).
 * mood: 'welcome' | 'idle' | 'happy' | 'curious' | 'oops' | 'milestone' | 'complete'
 */
const MascotBuddy = React.memo(function MascotBuddy({
  mood = 'idle',
  message = '',
  themeId = 'emerald',
}) {
  const colors = THEME_PALETTE[themeId] || THEME_PALETTE.emerald;
  const eyeColor = mood === 'oops' ? '#fb7185' : mood === 'curious' ? '#fbbf24' : colors.led;

  const botAnimate =
    mood === 'happy' || mood === 'complete'
      ? { y: [0, -8, 0, -4, 0], rotate: [0, -4, 4, 0] }
      : mood === 'oops'
        ? { x: [0, -5, 5, -3, 3, 0] }
        : mood === 'milestone'
          ? { y: [0, -6, 0], scale: [1, 1.05, 1] }
          : { y: [0, -4, 0] };

  const botTransition =
    mood === 'happy' || mood === 'oops'
      ? { duration: 0.45, ease: 'easeInOut' }
      : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' };

  return (
    <div className="flex items-end justify-center gap-3 mb-3 select-none">
      {/* Pure Vector Cute ICT / MIS Robot */}
      <motion.div
        key={mood}
        animate={botAnimate}
        transition={botTransition}
        className="relative w-16 h-16 shrink-0 will-change-transform"
        style={{ filter: `drop-shadow(0 8px 14px ${colors.shadow})` }}
      >
        <svg viewBox="0 0 84 84" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={`bot-shell-${themeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.shellLight} />
              <stop offset="100%" stopColor={colors.shellDark} />
            </linearGradient>
            <linearGradient id={`bot-visor-${themeId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          {/* Antenna Stem & Pulsing Signal Beacon */}
          <line
            x1="42"
            y1="18"
            x2="42"
            y2="9"
            stroke={colors.shellDark}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <motion.circle
            cx="42"
            cy="7"
            r="4.2"
            fill={colors.beacon}
            animate={{ opacity: [1, 0.45, 1], scale: [1, 1.18, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '42px', originY: '7px' }}
          />

          {/* Side Headset / Comms Ear Pods */}
          <rect x="6" y="31" width="8" height="18" rx="4" fill={colors.ear} />
          <rect x="70" y="31" width="8" height="18" rx="4" fill={colors.ear} />
          <circle cx="10" cy="40" r="2" fill="#ffffff" opacity="0.7" />
          <circle cx="74" cy="40" r="2" fill="#ffffff" opacity="0.7" />

          {/* Main Rounded Robot Head Shell */}
          <rect
            x="13"
            y="18"
            width="58"
            height="44"
            rx="18"
            fill={`url(#bot-shell-${themeId})`}
          />

          {/* Subtle Top Specular Gloss */}
          <path
            d="M25 22 H59"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.35"
          />

          {/* Dark OLED Visor Screen */}
          <rect
            x="20"
            y="26"
            width="44"
            height="28"
            rx="11"
            fill={`url(#bot-visor-${themeId})`}
            stroke="#ffffff"
            strokeOpacity="0.2"
            strokeWidth="1.2"
          />

          {/* LED Eyes */}
          {mood === 'happy' || mood === 'complete' || mood === 'milestone' ? (
            <>
              <path
                d="M27 39 Q32 33 37 39"
                fill="none"
                stroke={eyeColor}
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M47 39 Q52 33 57 39"
                fill="none"
                stroke={eyeColor}
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </>
          ) : mood === 'oops' ? (
            <>
              <circle cx="32" cy="38" r="4.2" fill="none" stroke={eyeColor} strokeWidth="2.6" />
              <circle cx="32" cy="38" r="1.4" fill={eyeColor} />
              <circle cx="52" cy="38" r="4.2" fill="none" stroke={eyeColor} strokeWidth="2.6" />
              <circle cx="52" cy="38" r="1.4" fill={eyeColor} />
            </>
          ) : mood === 'curious' ? (
            <>
              <rect x="28" y="35" width="7.5" height="6" rx="3" fill={eyeColor} />
              <circle cx="52" cy="38" r="4.3" fill={eyeColor} />
              <circle cx="50.5" cy="36.5" r="1.3" fill="#ffffff" />
            </>
          ) : (
            <motion.g
              animate={{ scaleY: [1, 1, 0.14, 1, 1] }}
              transition={{ duration: 4, repeat: Infinity, times: [0, 0.46, 0.5, 0.54, 1] }}
              style={{ originY: '38px' }}
            >
              <rect x="28" y="34" width="8" height="8" rx="4" fill={eyeColor} />
              <circle cx="30.5" cy="36.2" r="1.3" fill="#ffffff" />
              <rect x="48" y="34" width="8" height="8" rx="4" fill={eyeColor} />
              <circle cx="50.5" cy="36.2" r="1.3" fill="#ffffff" />
            </motion.g>
          )}

          {/* LED Digital Mouth */}
          {mood === 'happy' || mood === 'complete' || mood === 'milestone' ? (
            <path
              d="M36 45 Q42 50 48 45"
              fill="none"
              stroke={eyeColor}
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          ) : mood === 'oops' ? (
            <rect x="38" y="45" width="8" height="3" rx="1.5" fill={eyeColor} />
          ) : mood === 'curious' ? (
            <path
              d="M38 46.5 Q42 44.5 46 46.5"
              fill="none"
              stroke={eyeColor}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M37 45.5 Q42 48.8 47 45.5"
              fill="none"
              stroke={eyeColor}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          )}

          {/* Mini Hover-Bot Neck & Chest Base */}
          <rect x="36" y="62" width="12" height="4" rx="2" fill={colors.shellDark} />
          <path
            d="M27 66 H57 C57 73, 50 76, 42 76 C34 76, 27 73, 27 66 Z"
            fill={`url(#bot-shell-${themeId})`}
          />
          {/* Glowing MIS Core Dot */}
          <circle cx="42" cy="70.5" r="2.6" fill={colors.ledGlow} />
        </svg>

        {/* Animated Tech Spark on positive moods */}
        {(mood === 'happy' || mood === 'complete' || mood === 'milestone') && (
          <motion.svg
            viewBox="0 0 24 24"
            className="w-4 h-4 absolute -top-1 -right-1 pointer-events-none"
            initial={{ opacity: 0, scale: 0, rotate: -45 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.15, 0.7],
              rotate: [0, 90, 180],
              y: [2, -8],
            }}
            transition={{ duration: 1, repeat: mood === 'complete' ? Infinity : 0 }}
          >
            <path
              d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
              fill={colors.beacon}
            />
          </motion.svg>
        )}
      </motion.div>

      {/* Clean Speech Bubble */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, scale: 0.9, x: -6 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={`relative px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white border-2 ${colors.bubbleBorder} shadow-md text-xs sm:text-sm font-bold text-slate-700 max-w-[260px] sm:max-w-xs leading-snug mb-2`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default MascotBuddy;
