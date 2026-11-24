import React, { useState } from 'react';
import { X, Link2, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { api } from '../api';
import { THEMES } from '../utils/themes';

export default function ImportFormModal({ open, onClose, onImported }) {
  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [theme, setTheme] = useState('emerald');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.importForm({ url: url.trim(), slug: slug.trim(), theme });
      setUrl('');
      setSlug('');
      setTheme('emerald');
      onImported(res.form);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to import form.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoTemplate = () => {
    const suffix = Math.random().toString(36).slice(2, 6);
    setUrl('demo://workshop-pulse');
    setSlug(`workshop-${suffix}`);
    setTheme('vibrant');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Import Google Form</h2>
              <p className="text-xs text-slate-500">
                Paste any public Google Form link to turn it into an interactive form
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Public Google Form URL
              </label>
              <button
                type="button"
                onClick={fillDemoTemplate}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Use Demo Template
              </button>
            </div>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.google.com/forms/d/e/.../viewform"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Supports <code className="text-slate-600">/viewform</code> and{' '}
              <code className="text-slate-600">forms.gle</code> links (must not require sign-in).
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Custom Short Slug
            </label>
            <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
              <span className="px-3 py-2.5 bg-slate-50 text-slate-500 text-sm border-r border-slate-200 select-none">
                /play/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
                }
                placeholder="e.g. iguide-2026"
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Leave blank to auto-generate from the form title.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Form Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              {Object.values(THEMES).map((t) => {
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`flex flex-col items-start gap-2 p-3 rounded-xl border-2 text-left transition ${
                      active
                        ? 'border-slate-900 bg-slate-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full ${t.swatch}`} />
                    <span className="text-xs font-semibold text-slate-800">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing…
                </>
              ) : (
                'Import & Generate Form'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
