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
  Cpu,
  Wifi,
  Sparkles,
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
          ? `"${form.title}" is now Online`
          : `"${form.title}" is now Closed`
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
      showToast(`Theme updated to ${THEMES[nextTheme]?.name || nextTheme}`);
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
    <div className="min-h-screen bg-[#f6f9fc] text-slate-900 relative overflow-x-hidden pb-16">
      {/* Subtle Light Architectural Blueprint Grid + Soft Pastel Top Wash */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(15, 23, 42, 0.032) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.032) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 14% 0%, rgba(16, 185, 129, 0.1) 0%, transparent 42%), radial-gradient(circle at 86% 6%, rgba(14, 165, 233, 0.09) 0%, transparent 40%)',
        }}
      />

      {/* Frosted Light Executive Header */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border border-slate-200 shadow-xs">
              <img
                src="/logo.png"
                alt="Department of Agriculture Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900">
                  MIS Form Studio
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] font-mono font-bold text-emerald-700">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                DA-RFO IV-CALABARZON · ICT Management Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/70 text-[11px] font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              System Online · {admin?.email}
            </span>
            <button
              onClick={logout}
              title="Sign Out"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold shadow-2xs transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-7 space-y-7">
        {/* Toast */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-5 right-5 z-50 rounded-2xl bg-slate-900 text-white px-4 py-3 text-xs font-semibold shadow-2xl border border-slate-700"
          >
            {toast}
          </motion.div>
        )}

        {/* Premium Light Hero Banner */}
        <section className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-[0_8px_30px_rgba(15,23,42,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          {/* Soft mesh accent in right corner */}
          <div
            className="absolute inset-y-0 right-0 w-1/2 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 85% 30%, rgba(16, 185, 129, 0.11) 0%, rgba(14, 165, 233, 0.06) 45%, transparent 72%)',
            }}
          />

          <div className="space-y-2.5 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 text-[11px] font-mono font-bold">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              LIVE TELEMETRY · GOOGLE FORMS SYNC ENGINE
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Interactive Form{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Control Center
              </span>
            </h2>
            <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
              Deploy mobile-first evaluation forms, distribute scannable QR codes, and
              analyze live participant feedback from a unified MIS workspace.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setImportOpen(true)}
            className="relative z-10 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Import Google Form</span>
          </motion.button>
        </section>

        {/* 4 Porcelain Premium Telemetry KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300/80 p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                01 · Total Forms
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2.5 tabular-nums">
              {summary.total_forms}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-emerald-600 font-bold">{summary.active_forms}</span>{' '}
              online · {summary.total_forms - summary.active_forms} closed
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-2xl bg-white border border-slate-200/80 hover:border-sky-300/80 p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                02 · Responses Today
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2.5 tabular-nums">
              {summary.responses_today}
            </p>
            <p className="text-xs text-sky-600 font-semibold mt-1 inline-flex items-center gap-1.5">
              <Wifi className="w-3 h-3" />
              Real-time sync active
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-2xl bg-white border border-slate-200/80 hover:border-violet-300/80 p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                03 · All Submissions
              </span>
              <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2.5 tabular-nums">
              {summary.total_responses}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Avg <span className="font-semibold text-slate-700">{avgResponsesPerForm}</span>{' '}
              per form
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300/80 p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                04 · Availability
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2.5 tabular-nums">
              {activeRate}%
            </p>
            <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${activeRate}%` }}
              />
            </div>
          </motion.div>
        </section>

        {/* Search & Filter Toolbar */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search forms by title or /play/slug…"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                {['all', 'open', 'closed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                      statusFilter === st
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <button
                onClick={fetchForms}
                title="Refresh list"
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-emerald-600 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500 gap-2 text-sm font-medium">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              <span>Loading forms…</span>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                {forms.length === 0 ? 'No forms deployed yet' : 'No matching forms'}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                {forms.length === 0
                  ? 'Import any public Google Form link to generate a mobile-first interactive form.'
                  : 'Try adjusting your search query or status filter.'}
              </p>
              {forms.length === 0 && (
                <button
                  onClick={() => setImportOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  Import Your First Form
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
                    className="group rounded-3xl bg-white border border-slate-200/85 hover:border-emerald-300/90 shadow-[0_4px_20px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition-all overflow-hidden flex flex-col"
                  >
                    {/* Crisp Top Theme Accent Bar */}
                    <div className={`h-1.5 w-full ${theme.progressBar}`} />

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-slate-100 border border-slate-200/70 text-slate-700">
                          /play/{form.slug}
                        </span>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleActive(form)}
                          title={form.is_active ? 'Click to Close Form' : 'Click to Open Form'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                            form.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {form.is_active ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Online
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                              Closed
                            </>
                          )}
                        </button>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 line-clamp-2 leading-snug min-h-[44px] mb-2">
                        {form.title}
                      </h3>

                      {form.description ? (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                          {form.description}
                        </p>
                      ) : (
                        <p className="text-xs italic text-slate-400 mb-4">
                          No description configured.
                        </p>
                      )}

                      {/* Porcelain Telemetry Tiles */}
                      <div className="grid grid-cols-2 gap-2.5 mb-4">
                        <div className="rounded-2xl bg-slate-50/90 border border-slate-200/60 px-3.5 py-2.5">
                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                            Responses
                          </p>
                          <p className="text-xl font-extrabold text-slate-900 leading-tight mt-0.5 tabular-nums">
                            {form.response_count}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50/90 border border-slate-200/60 px-3.5 py-2.5">
                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                            Structure
                          </p>
                          <p className="text-xs font-mono font-bold text-slate-700 mt-1.5 inline-flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-emerald-600" />
                            {form.question_count}Q · {form.total_pages}P
                          </p>
                        </div>
                      </div>

                      {form.last_response_at && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-4">
                          <Clock className="w-3 h-3" />
                          Last response: {new Date(form.last_response_at).toLocaleString()}
                        </p>
                      )}

                      {/* Primary Action Buttons */}
                      <div className="mt-auto space-y-2">
                        <Link
                          to={`/admin/forms/${form.id}`}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition"
                        >
                          <BarChart3 className="w-4 h-4 text-emerald-400" />
                          Monitor Answers & Analytics
                        </Link>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setQrForm(form)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition"
                          >
                            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                            Share / QR
                          </button>
                          <Link
                            to={`/play/${form.slug}`}
                            target="_blank"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition"
                          >
                            <Play className="w-3.5 h-3.5 text-sky-600" />
                            Preview Form
                          </Link>
                        </div>
                      </div>

                      {/* Footer: Theme Swatches + Utilities */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
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
                                  ? 'ring-2 ring-offset-2 ring-slate-900 scale-110'
                                  : 'opacity-45 hover:opacity-100'
                              }`}
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleResync(form)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition"
                          >
                            <RefreshCw className={`w-3 h-3 ${isBusy ? 'animate-spin' : ''}`} />
                            Re-sync
                          </button>
                          <button
                            onClick={() => handleDelete(form)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition"
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
          showToast(`Imported "${newForm.title}" at /play/${newForm.slug}`);
        }}
      />

      <ShareQRModal form={qrForm} onClose={() => setQrForm(null)} />
    </div>
  );
}
