export const THEMES = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Studio',
    swatch: 'bg-emerald-500',
    pageBg: 'bg-gradient-to-br from-emerald-50 via-teal-50/40 to-cyan-50',
    orb1: 'bg-emerald-300/35',
    orb2: 'bg-teal-300/30',
    orb3: 'bg-cyan-200/35',
    heroGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    accentBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
    accentText: 'text-emerald-700',
    accentSoftBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-500',
    ring: 'focus:ring-emerald-500',
    progressBar: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500',
    selectedCard:
      'border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50/80 ring-2 ring-emerald-500/25 shadow-md shadow-emerald-500/10',
    badge: 'bg-emerald-100 text-emerald-800',
    pillActive:
      'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/30',
    chartColors: ['#059669', '#0d9488', '#10b981', '#34d399', '#6ee7b7', '#047857'],
    confettiColors: ['#10b981', '#14b8a6', '#06b6d4', '#fbbf24', '#34d399', '#f472b6'],
  },
  slate: {
    id: 'slate',
    name: 'Executive Slate',
    swatch: 'bg-slate-800',
    pageBg: 'bg-gradient-to-br from-slate-100 via-indigo-50/30 to-zinc-100',
    orb1: 'bg-slate-300/40',
    orb2: 'bg-indigo-200/35',
    orb3: 'bg-sky-200/30',
    heroGradient: 'from-slate-900 via-slate-800 to-indigo-900',
    accentBg: 'bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700',
    accentText: 'text-slate-800',
    accentSoftBg: 'bg-slate-100',
    accentBorder: 'border-slate-800',
    ring: 'focus:ring-slate-700',
    progressBar: 'bg-gradient-to-r from-slate-700 via-indigo-600 to-slate-900',
    selectedCard:
      'border-slate-900 bg-gradient-to-r from-slate-100 to-indigo-50/70 ring-2 ring-slate-900/15 shadow-md shadow-slate-900/10',
    badge: 'bg-slate-200 text-slate-800',
    pillActive:
      'bg-gradient-to-br from-slate-800 to-slate-950 text-white border-slate-900 shadow-lg shadow-slate-900/30',
    chartColors: ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#1e293b'],
    confettiColors: ['#334155', '#6366f1', '#0ea5e9', '#fbbf24', '#10b981', '#94a3b8'],
  },
  vibrant: {
    id: 'vibrant',
    name: 'Vibrant Pulse',
    swatch: 'bg-fuchsia-600',
    pageBg: 'bg-gradient-to-br from-violet-50 via-fuchsia-50/50 to-amber-50/40',
    orb1: 'bg-violet-300/35',
    orb2: 'bg-fuchsia-300/30',
    orb3: 'bg-amber-200/35',
    heroGradient: 'from-violet-600 via-fuchsia-600 to-pink-500',
    accentBg:
      'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-600',
    accentText: 'text-violet-700',
    accentSoftBg: 'bg-violet-50',
    accentBorder: 'border-violet-600',
    ring: 'focus:ring-violet-500',
    progressBar: 'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500',
    selectedCard:
      'border-violet-500 bg-gradient-to-r from-violet-50 to-fuchsia-50/80 ring-2 ring-violet-500/25 shadow-md shadow-violet-500/10',
    badge: 'bg-violet-100 text-violet-800',
    pillActive:
      'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white border-violet-600 shadow-lg shadow-violet-600/30',
    chartColors: ['#7c3aed', '#c026d3', '#db2777', '#6366f1', '#a855f7', '#ec4899'],
    confettiColors: ['#7c3aed', '#d946ef', '#ec4899', '#f59e0b', '#06b6d4', '#10b981'],
  },
};

export function getTheme(themeId) {
  return THEMES[themeId] || THEMES.emerald;
}
