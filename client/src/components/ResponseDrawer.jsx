import React from 'react';
import {
  X,
  User,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Trash2,
} from 'lucide-react';

export default function ResponseDrawer({
  response,
  form,
  onClose,
  onRetrySync,
  retrying,
  onDelete,
  deleting,
}) {
  if (!response || !form) return null;

  const sections = form.schema?.sections || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Full Submission Details</h3>
            <p className="text-xs text-slate-500">Response #{response.id}</p>
          </div>
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                onClick={() => onDelete(response)}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Participant Meta */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Participant
              </p>
              <p className="text-sm font-semibold text-slate-800 truncate">
                {response.participant_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Office / Dept
              </p>
              <p className="text-sm font-semibold text-slate-800 truncate">
                {response.participant_office}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Submitted
              </p>
              <p className="text-xs font-medium text-slate-700">
                {new Date(response.submitted_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
                Google Sync
              </p>
              {response.google_sync_status === 'synced' ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Synced
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Failed
                  </span>
                  <button
                    onClick={() => onRetrySync(response.id)}
                    disabled={retrying}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded-lg"
                  >
                    <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} />
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Answers List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">
                {section.title}
              </h4>
              {section.questions.map((q) => {
                const val = response.answers?.[q.entryId];
                const commentKey = q.commentField?.entryId || `${q.entryId}__no_comment`;
                const commentVal = response.answers?.[commentKey] ?? null;
                const displayVal = Array.isArray(val)
                  ? val.length > 0
                    ? val
                    : null
                  : val !== undefined && val !== null && String(val).trim() !== ''
                    ? String(val)
                    : null;

                return (
                  <div
                    key={q.id}
                    className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-2"
                  >
                    <p className="text-xs font-semibold text-slate-500">{q.title}</p>
                    {Array.isArray(displayVal) ? (
                      <div className="flex flex-wrap gap-1.5">
                        {displayVal.map((chip) => (
                          <span
                            key={chip}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    ) : displayVal ? (
                      <p className="text-sm font-semibold text-slate-900 whitespace-pre-wrap">
                        {q.type === 'linear_scale'
                          ? `${displayVal} / ${q.max ?? 5}`
                          : displayVal}
                      </p>
                    ) : (
                      <p className="text-xs italic text-slate-400">No answer provided</p>
                    )}

                    {commentVal && String(commentVal).trim() !== '' && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-600 bg-amber-50/70 p-2.5 rounded-lg">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-amber-900 block mb-0.5">
                            Attached Comment
                          </span>
                          <p className="text-slate-700">{commentVal}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
