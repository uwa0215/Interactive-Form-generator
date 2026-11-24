import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  QrCode,
  Play,
  BarChart3,
  LogOut,
  Sparkles,
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
  Radio,
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
          ? `"${form.title}" is now Open for responses`
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
      showToast(`Updated theme to ${THEMES[nextTheme]?.name || nextTheme}`);
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
    <div className="min-h-screen bg-slate-50/90 pb-16">
      {/* Top Hero Banner with Animated Subtle Vectors */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white overflow-hidden">
        {/* Decorative background grid & glow */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

        {/* Navigation Row */}
        <header className="relative z-10 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <img
                  src="/logo.png"
                  alt="Department of Agriculture Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight leading-tight">
                  Form Studio
                </h1>
                <p className="text-[11px] text-emerald-300/80 font-medium">
                  Admin Command Center
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-slate-200 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {admin?.email}
              </span>
              <button
                onClick={logout}
                title="Sign Out"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 text-xs font-semibold transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Hero Copy + Primary Action */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 text-xs font-bold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Real-Time Form Analytics & QR Distribution
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Manage Your Interactive Forms
            </h2>
            <p className="text-sm text-slate-300 max-w-xl">
              Import any public Google Form, distribute scannable QR codes, and analyze
              participant responses with live charts and instant CSV exports.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-sm font-extrabold shadow-xl shadow-emerald-500/25 transition shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Import Google Form</span>
          </motion.button>
        </div>
      </div>

      {/* Main Content Overlapping Hero */}
      <main className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 space-y-8">
        {/* Toast */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-5 right-5 z-50 rounded-2xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold shadow-2xl border border-slate-700"
          >
            {toast}
          </motion.div>
        )}

        {/* 4-Column Elevated KPI Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-lg shadow-slate-900/5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Forms
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              {summary.total_forms}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-emerald-600">{summary.active_forms}</span>{' '}
              open · {summary.total_forms - summary.active_forms} closed
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-lg shadow-slate-900/5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Responses Today
              </span>
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              {summary.responses_today}
            </p>
            <p className="text-xs text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live SQLite persistence
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-lg shadow-slate-900/5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                All-Time Submissions
              </span>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              {summary.total_responses}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Avg {avgResponsesPerForm} per form
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-lg shadow-slate-900/5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Availability
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{activeRate}%</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${activeRate}%` }}
              />
            </div>
          </motion.div>
        </section>

        {/* Forms Filter Bar & Grid */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search forms by title or slug…"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
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
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              <span className="text-sm font-medium">Loading forms…</span>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                {forms.length === 0 ? 'No forms yet' : 'No matching forms'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredForms.map((form, idx) => {
                const theme = getTheme(form.theme);
                const isBusy = busyId === form.id;
                return (
                  <motion.div
                    key={form.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -3 }}
                    className="group rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all overflow-hidden flex flex-col"
                  >
                    {/* Rich Gradient Card Header */}
                    <div
                      className={`relative px-5 pt-5 pb-4 bg-gradient-to-br ${theme.heroGradient} text-white`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md border border-white/20">
                          /play/{form.slug}
                        </span>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleActive(form)}
                          title={form.is_active ? 'Click to Close Form' : 'Click to Open Form'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                            form.is_active
                              ? 'bg-white text-emerald-700 border-white shadow-xs hover:bg-emerald-50'
                              : 'bg-slate-900/40 text-slate-200 border-white/20 hover:bg-slate-900/60'
                          }`}
                        >
                          {form.is_active ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Open
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-slate-300" />
                              Closed
                            </>
                          )}
                        </button>
                      </div>

                      <h3 className="text-base font-extrabold line-clamp-2 leading-snug min-h-[44px]">
                        {form.title}
                      </h3>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      {form.description ? (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                          {form.description}
                        </p>
                      ) : (
                        <p className="text-xs italic text-slate-400 mb-4">
                          No description provided.
                        </p>
                      )}

                      {/* Stats Pills */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Responses
                          </p>
                          <p className="text-lg font-extrabold text-slate-900 leading-tight mt-0.5">
                            {form.response_count}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Structure
                          </p>
                          <p className="text-xs font-bold text-slate-700 mt-1 inline-flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            {form.question_count} Qs · {form.total_pages}p
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
                          <BarChart3 className="w-4 h-4" />
                          Monitor Answers & Analytics
                        </Link>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setQrForm(form)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            Share / QR
                          </button>
                          <Link
                            to={`/play/${form.slug}`}
                            target="_blank"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Preview Form
                          </Link>
                        </div>
                      </div>

                      {/* Footer: Theme Swatches + Utilities */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5" title="Switch Form Theme">
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
