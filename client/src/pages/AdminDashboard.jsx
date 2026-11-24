import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  QrCode,
  Play,
  BarChart3,
  LogOut,
  FileText,
  Activity,
  RefreshCw,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  Layers,
  Clock,
  TrendingUp,
  Terminal,
  Cpu,
  Wifi,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { getTheme, THEMES } from '../utils/themes';
import ImportFormModal from '../components/ImportFormModal';
import ShareQRModal from '../components/ShareQRModal';

export default function AdminDashboard() {
  const { admin, logout } = useAuth();
  const [forms, setForms] = useState([]);
  const [summary, setSummary] = useState({
    total_forms: 0,
    active_forms: 0,
    total_responses: 0,
    responses_today: 0,
  });
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [qrForm, setQrForm] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'open' | 'closed'

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchForms = async () => {
    try {
      const data = await api.getForms();
      setForms(data.forms || []);
      setSummary(data.summary || summary);
    } catch (err) {
      showToast(err.message || 'Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const filteredForms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return forms.filter((f) => {
      if (statusFilter === 'open' && !f.is_active) return false;
      if (statusFilter === 'closed' && f.is_active) return false;
      if (!q) return true;
      return (
        f.title.toLowerCase().includes(q) ||
        f.slug.toLowerCase().includes(q) ||
        (f.description || '').toLowerCase().includes(q)
      );
    });
  }, [forms, search, statusFilter]);

  const activeRate =
    summary.total_forms > 0
      ? Math.round((summary.active_forms / summary.total_forms) * 100)
      : 0;

  const avgResponsesPerForm =
    summary.total_forms > 0
      ? (summary.total_responses / summary.total_forms).toFixed(1)
      : '0';

  const handleToggleActive = async (form) => {
    setBusyId(form.id);
    try {
      const res = await api.updateForm(form.id, { is_active: !form.is_active });
      setForms((prev) =>
        prev.map((f) => (f.id === form.id ? { ...f, is_active: res.form.is_active } : f))
      );
      setSummary((prev) => ({
        ...prev,
        active_forms: res.form.is_active
          ? prev.active_forms + 1
          : Math.max(0, prev.active_forms - 1),
      }));
      showToast(
        res.form.is_active
          ? `"${form.title}" is now ONLINE`
          : `"${form.title}" is now CLOSED`
      );
    } catch (err) {
      showToast(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleChangeTheme = async (form, nextTheme) => {
    if (form.theme === nextTheme) return;
    setBusyId(form.id);
    try {
      await api.updateForm(form.id, { theme: nextTheme });
      setForms((prev) =>
        prev.map((f) => (f.id === form.id ? { ...f, theme: nextTheme } : f))
      );
      showToast(`Theme switched to ${THEMES[nextTheme]?.name || nextTheme}`);
    } catch (err) {
      showToast(err.message || 'Theme update failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleResync = async (form) => {
    setBusyId(form.id);
    try {
      await api.updateForm(form.id, { resync: true });
      await fetchForms();
      showToast(`Re-synced schema for "${form.title}"`);
    } catch (err) {
      showToast(err.message || 'Re-sync failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (form) => {
    if (!window.confirm(`Delete "${form.title}" and all its recorded responses?`)) return;
    setBusyId(form.id);
    try {
      await api.deleteForm(form.id);
      await fetchForms();
      showToast(`Deleted "${form.title}"`);
    } catch (err) {
      showToast(err.message || 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 relative overflow-x-hidden pb-16">
      {/* Cyber Blueprint Grid + Ambient Radial Glows */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.14]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(16, 185, 129, 0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.22) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 18% 0%, rgba(16, 185, 129, 0.16) 0%, transparent 45%), radial-gradient(circle at 85% 12%, rgba(6, 182, 212, 0.14) 0%, transparent 42%)',
        }}
      />

      {/* Sticky Glassmorphic Tech Header */}
      <header className="sticky top-0 z-30 bg-[#060b14]/85 backdrop-blur-xl border-b border-emerald-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/20">
              <img
                src="/logo.png"
                alt="Department of Agriculture Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                  MIS Form Studio
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-mono font-bold text-emerald-300">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                DA-RFO4A // ICT COMMAND CENTER
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SYS: ONLINE · {admin?.email}
            </span>
            <button
              onClick={logout}
              title="Sign Out"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-7">
        {/* Toast */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 text-emerald-300 px-4 py-3 text-xs font-mono font-bold shadow-2xl border border-emerald-500/40"
          >
            &gt; {toast}
          </motion.div>
        )}

        {/* Hero Command Strip */}
        <section className="rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#0b1526]/90 to-emerald-950/70 border border-emerald-500/20 p-6 sm:p-8 shadow-2xl shadow-black/40 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 text-[11px] font-mono font-bold">
              <Cpu className="w-3.5 h-3.5" />
              LIVE TELEMETRY · GOOGLE FORMS SYNC ENGINE
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Interactive Form{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Control Matrix
              </span>
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Deploy mobile-first evaluation forms, generate instant QR endpoints, and
              monitor live analytics from a single MIS dashboard.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setImportOpen(true)}
            className="relative z-10 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 text-sm font-extrabold shadow-lg shadow-emerald-500/25 transition shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.8]" />
            <span>Import Google Form</span>
          </motion.button>
        </section>

        {/* 4 Futuristic Telemetry KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 p-5 shadow-lg transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                01 // TOTAL FORMS
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-2.5 tabular-nums">
              {summary.total_forms}
            </p>
            <p className="text-xs font-mono text-slate-400 mt-1">
              <span className="text-emerald-400 font-bold">{summary.active_forms}</span>{' '}
              online · {summary.total_forms - summary.active_forms} closed
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 p-5 shadow-lg transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                02 // TODAY STREAM
              </span>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-2.5 tabular-nums">
              {summary.responses_today}
            </p>
            <p className="text-xs font-mono text-cyan-400 mt-1 inline-flex items-center gap-1.5">
              <Wifi className="w-3 h-3" />
              Real-time ingestion
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 p-5 shadow-lg transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                03 // SUBMISSIONS
              </span>
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/25 text-violet-400 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-2.5 tabular-nums">
              {summary.total_responses}
            </p>
            <p className="text-xs font-mono text-slate-400 mt-1">
              AVG {avgResponsesPerForm} / form
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 p-5 shadow-lg transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                04 // AVAILABILITY
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-2.5 tabular-nums">
              {activeRate}%
            </p>
            <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
                style={{ width: `${activeRate}%` }}
              />
            </div>
          </motion.div>
        </section>

        {/* Search & Filter Command Bar */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-emerald-400/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Query forms by title or /play/slug…"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-700/80 bg-slate-950/80 text-sm text-slate-100 placeholder:text-slate-500 font-mono focus:outline-none focus:border-emerald-400 transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {['all', 'open', 'closed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition ${
                      statusFilter === st
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <button
                onClick={fetchForms}
                title="Refresh telemetry"
                className="p-2.5 rounded-xl border border-slate-700/80 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-emerald-400 gap-2 font-mono text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>LOADING_FORM_MODULES…</span>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <Terminal className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-white">
                {forms.length === 0 ? 'No form modules deployed' : 'No matching forms'}
              </h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1 mb-6">
                {forms.length === 0
                  ? 'Import any public Google Form link to generate an interactive form endpoint.'
                  : 'Try adjusting your search query or status filter.'}
              </p>
              {forms.length === 0 && (
                <button
                  onClick={() => setImportOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 text-sm font-extrabold transition"
                >
                  <Plus className="w-4 h-4" />
                  Import First Form
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredForms.map((form, idx) => {
                const theme = getTheme(form.theme);
                const isBusy = busyId === form.id;
                return (
                  <motion.div
                    key={form.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    whileHover={{ y: -3 }}
                    className="group rounded-3xl bg-slate-900/85 border border-slate-800 hover:border-emerald-500/45 shadow-xl shadow-black/30 transition-all overflow-hidden flex flex-col"
                  >
                    {/* Neon Theme Accent Strip */}
                    <div className={`h-1.5 w-full ${theme.progressBar}`} />

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-slate-950 border border-slate-700/80 text-cyan-300">
                          /play/{form.slug}
                        </span>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleActive(form)}
                          title={form.is_active ? 'Click to Close Form' : 'Click to Open Form'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border transition ${
                            form.is_active
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {form.is_active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Online
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              Closed
                            </>
                          )}
                        </button>
                      </div>

                      <h3 className="text-base font-extrabold text-white line-clamp-2 leading-snug min-h-[44px] mb-2">
                        {form.title}
                      </h3>

                      {form.description ? (
                        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                          {form.description}
                        </p>
                      ) : (
                        <p className="text-xs italic text-slate-500 mb-4">
                          No description configured.
                        </p>
                      )}

                      {/* Dark Telemetry Tiles */}
                      <div className="grid grid-cols-2 gap-2.5 mb-4">
                        <div className="rounded-xl bg-slate-950/90 border border-slate-800 px-3 py-2.5">
                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                            Responses
                          </p>
                          <p className="text-xl font-extrabold text-emerald-400 leading-tight mt-0.5 tabular-nums">
                            {form.response_count}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-950/90 border border-slate-800 px-3 py-2.5">
                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                            Schema
                          </p>
                          <p className="text-xs font-mono font-bold text-slate-200 mt-1.5 inline-flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-cyan-400" />
                            {form.question_count}Q · {form.total_pages}P
                          </p>
                        </div>
                      </div>

                      {form.last_response_at && (
                        <p className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 mb-4">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Last sync: {new Date(form.last_response_at).toLocaleString()}
                        </p>
                      )}

                      {/* Primary Action Buttons */}
                      <div className="mt-auto space-y-2">
                        <Link
                          to={`/admin/forms/${form.id}`}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold shadow-md shadow-emerald-500/20 transition"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Monitor Answers & Analytics
                        </Link>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setQrForm(form)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold transition"
                          >
                            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                            Share / QR
                          </button>
                          <Link
                            to={`/play/${form.slug}`}
                            target="_blank"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold transition"
                          >
                            <Play className="w-3.5 h-3.5 text-emerald-400" />
                            Preview Form
                          </Link>
                        </div>
                      </div>

                      {/* Footer: Theme Swatches + Utilities */}
                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2" title="Switch Form Theme">
                          {Object.values(THEMES).map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleChangeTheme(form, t.id)}
                              title={`Theme: ${t.name}`}
                              className={`w-4 h-4 rounded-full ${t.swatch} transition ${
                                form.theme === t.id
                                  ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-emerald-400 scale-110'
                                  : 'opacity-45 hover:opacity-100'
                              }`}
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleResync(form)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-slate-400 hover:text-cyan-300 transition"
                          >
                            <RefreshCw className={`w-3 h-3 ${isBusy ? 'animate-spin' : ''}`} />
                            Re-sync
                          </button>
                          <button
                            onClick={() => handleDelete(form)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <ImportFormModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(newForm) => {
          fetchForms();
          showToast(`DEPLOYED "${newForm.title}" -> /play/${newForm.slug}`);
        }}
      />

      <ShareQRModal form={qrForm} onClose={() => setQrForm(null)} />
    </div>
  );
}
