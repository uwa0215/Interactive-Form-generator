import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  QrCode,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Table2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Eye,
  Users,
  Activity,
  Cloud,
  Loader2,
  Trash2,
  PieChart as PieChartIcon,
  AlignLeft,
  Building2,
  TrendingUp,
  AlertCircle,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { api } from '../api';
import ShareQRModal from '../components/ShareQRModal';
import ResponseDrawer from '../components/ResponseDrawer';

const DISTINCT_CHART_PALETTE = [
  '#2563eb', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
];

const SCALE_COLORS = ['#f43f5e', '#f97316', '#eab308', '#0ea5e9', '#10b981'];

const RESPONDENT_INFO_PATTERN =
  /\b(full\s*name|your\s*name|email|e-mail|position|designation|division|office|department|contact|phone)\b/i;

function getAnswerColor(label, idx, stat) {
  const norm = String(label || '').trim().toLowerCase();

  if (stat?.type === 'linear_scale') {
    const min = Number(stat.min ?? 1);
    const max = Number(stat.max ?? 5);
    const num = Number(norm);
    if (!Number.isNaN(num) && max > min) {
      const ratio = (num - min) / (max - min);
      const bucket = Math.min(
        SCALE_COLORS.length - 1,
        Math.max(0, Math.round(ratio * (SCALE_COLORS.length - 1)))
      );
      return SCALE_COLORS[bucket];
    }
    return SCALE_COLORS[idx % SCALE_COLORS.length];
  }

  if (/^(yes|definitely yes|strongly agree|agree|acceptable for initial deployment, subject)\b/.test(norm))
    return '#10b981'; // Emerald Green
  if (/^(no|definitely not|probably not|strongly disagree|disagree|substantial modifications)\b/.test(norm))
    return '#f43f5e'; // Coral Rose Red
  if (/^(n\/a|na|not applicable|none)\b/.test(norm)) return '#64748b'; // Slate Gray
  if (/^(neutral|maybe|unsure|probably yes|acceptable for initial deployment after minor|further demonstration)\b/.test(norm))
    return '#f59e0b'; // Warm Amber

  return DISTINCT_CHART_PALETTE[idx % DISTINCT_CHART_PALETTE.length];
}

function isYesNoStat(stat) {
  if (!Array.isArray(stat?.breakdown) || stat.breakdown.length === 0) return false;
  const labels = stat.breakdown.map((b) => b.label.trim().toLowerCase());
  return labels.includes('yes') && labels.includes('no');
}

function QuestionAnalyticsCard({ stat }) {
  const isChoice = ['multiple_choice', 'dropdown', 'checkboxes'].includes(stat.type);
  const isScale = stat.type === 'linear_scale';
  const defaultChartMode =
    (stat.type === 'multiple_choice' || stat.type === 'dropdown') &&
    stat.breakdown.length > 0 &&
    stat.breakdown.length <= 5
      ? 'donut'
      : 'bar';

  const [chartMode, setChartMode] = useState(defaultChartMode); // 'donut' | 'bar' | 'bars'
  const [commentsOpen, setCommentsOpen] = useState(
    stat.type === 'short_text' ||
      stat.type === 'long_text' ||
      (stat.comments && stat.comments.length > 0 && stat.comments.length <= 3)
  );

  // Compute top choice & Yes/No rate if applicable
  const sortedBreakdown = useMemo(
    () => [...(stat.breakdown || [])].sort((a, b) => b.count - a.count),
    [stat.breakdown]
  );
  const topAnswer = sortedBreakdown[0]?.count > 0 ? sortedBreakdown[0] : null;
  const yesNo = isYesNoStat(stat);
  const yesItem = yesNo
    ? stat.breakdown.find((b) => b.label.trim().toLowerCase() === 'yes')
    : null;
  const noItem = yesNo
    ? stat.breakdown.find((b) => b.label.trim().toLowerCase() === 'no')
    : null;

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition p-5 flex flex-col">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
              {stat.sectionTitle}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {stat.type.replace('_', ' ')}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            {stat.title}
          </h3>
        </div>

        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
            {stat.totalAnswered} {stat.totalAnswered === 1 ? 'resp' : 'resps'}
          </span>
          {isScale && stat.average !== null && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-extrabold">
              Avg {stat.average} / {stat.max}
            </span>
          )}
          {yesNo && stat.totalAnswered > 0 && (
            <div className="flex items-center gap-1">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-extrabold">
                {yesItem?.percentage || 0}% Yes
              </span>
              {(noItem?.count || 0) > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-extrabold">
                  {noItem.count} No
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chart Mode Switcher for Choice/Scale */}
      {(isChoice || isScale) && stat.totalAnswered > 0 && (
        <div className="flex items-center justify-between gap-2 mb-3">
          {topAnswer ? (
            <p className="text-[11px] text-slate-500 truncate">
              Top:{' '}
              <span className="font-bold text-slate-800">{topAnswer.label}</span> (
              {topAnswer.percentage}%)
            </p>
          ) : (
            <span />
          )}

          <div className="inline-flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setChartMode('donut')}
              title="Donut Chart"
              className={`p-1.5 rounded-md transition ${
                chartMode === 'donut'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartMode('bar')}
              title="Bar Chart"
              className={`p-1.5 rounded-md transition ${
                chartMode === 'bar'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartMode('bars')}
              title="Breakdown Bars"
              className={`p-1.5 rounded-md transition ${
                chartMode === 'bars'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Choice / Scale Visualizations */}
      {(isChoice || isScale) && (
        <div className="mb-3">
          {stat.totalAnswered === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No responses yet for this question
            </div>
          ) : chartMode === 'donut' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stat.breakdown}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={74}
                      paddingAngle={3}
                    >
                      {stat.breakdown.map((entry, idx) => (
                        <Cell
                          key={entry.label}
                          fill={getAnswerColor(entry.label, idx, stat)}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} responses`, name]}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5">
                {stat.breakdown.map((item, idx) => {
                  const color = getAnswerColor(item.label, idx, stat);
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-slate-700 font-medium truncate" title={item.label}>
                            {item.label}
                          </span>
                        </div>
                        <span className="font-extrabold text-slate-900 shrink-0 tabular-nums">
                          {item.count}{' '}
                          <span className="font-semibold text-slate-400">
                            ({item.percentage}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : chartMode === 'bar' ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stat.breakdown}
                  layout={isScale ? 'horizontal' : 'vertical'}
                  margin={{ top: 5, right: 20, left: isScale ? 0 : 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  {isScale ? (
                    <>
                      <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#475569' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
                    </>
                  ) : (
                    <>
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#475569' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={130}
                        tick={{ fontSize: 11, fill: '#334155' }}
                      />
                    </>
                  )}
                  <Tooltip
                    formatter={(val, _n, item) => [
                      `${val} (${item.payload.percentage}%)`,
                      'Responses',
                    ]}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 6, 6]} maxBarSize={34}>
                    {stat.breakdown.map((entry, idx) => (
                      <Cell
                        key={entry.label}
                        fill={getAnswerColor(entry.label, idx, stat)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            /* Detailed Progress Breakdown View */
            <div className="space-y-3 py-1">
              {stat.breakdown.map((item, idx) => {
                const color = getAnswerColor(item.label, idx, stat);
                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-slate-700 leading-snug">
                        {item.label}
                      </span>
                      <span className="font-extrabold text-slate-900 shrink-0 tabular-nums">
                        {item.count} · {item.percentage}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Open-ended answers or attached comments */}
      {stat.comments && stat.comments.length > 0 && (
        <div className="mt-auto pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setCommentsOpen((o) => !o)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 py-1"
          >
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              {stat.commentFieldLabel
                ? `Comments & Explanations (${stat.comments.length})`
                : `Text Responses (${stat.comments.length})`}
            </span>
            {commentsOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {commentsOpen && (
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-1">
              {stat.comments.map((c, idx) => {
                const isNo =
                  typeof c.ratingOrChoice === 'string' &&
                  /^\s*no\b/i.test(c.ratingOrChoice);
                return (
                  <div
                    key={`${c.responseId}-${idx}`}
                    className={`rounded-xl border p-3 text-xs ${
                      isNo
                        ? 'bg-rose-50/70 border-rose-200/80'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-slate-800">
                        {c.participantName}
                        {c.participantOffice && c.participantOffice !== '—' && (
                          <span className="font-normal text-slate-400">
                            {' '}
                            · {c.participantOffice}
                          </span>
                        )}
                      </span>
                      {c.ratingOrChoice && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            isNo
                              ? 'bg-rose-500 text-white'
                              : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          {Array.isArray(c.ratingOrChoice)
                            ? c.ratingOrChoice.join(', ')
                            : c.ratingOrChoice}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {c.text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LiveMonitor() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');
  const [search, setSearch] = useState('');
  const [syncFilter, setSyncFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [hideIdentityFields, setHideIdentityFields] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [retryingId, setRetryingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        const res = await api.getFormResponses(id);
        setData(res);
        setLastUpdated(new Date());
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load monitor data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => {
      loadData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRetrySync = async (responseId) => {
    setRetryingId(responseId);
    try {
      const res = await api.retrySync(responseId);
      setData((prev) => {
        if (!prev) return prev;
        const nextResponses = prev.responses.map((r) =>
          r.id === responseId ? { ...r, google_sync_status: res.google_sync_status } : r
        );
        const syncedCount = nextResponses.filter(
          (r) => r.google_sync_status === 'synced'
        ).length;
        const totalResponses = nextResponses.length;
        return {
          ...prev,
          responses: nextResponses,
          summary: {
            ...prev.summary,
            syncedCount,
            failedCount: totalResponses - syncedCount,
            syncRate:
              totalResponses > 0 ? Math.round((syncedCount / totalResponses) * 100) : 100,
          },
        };
      });
      setSelectedResponse((prev) =>
        prev && prev.id === responseId
          ? { ...prev, google_sync_status: res.google_sync_status }
          : prev
      );
    } catch {
      // handled silently
    } finally {
      setRetryingId(null);
    }
  };

  const handleDeleteResponse = async (response) => {
    if (
      !window.confirm(
        `Delete the response from "${response.participant_name}"? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeletingId(response.id);
    try {
      await api.deleteResponse(response.id);
      if (selectedResponse?.id === response.id) {
        setSelectedResponse(null);
      }
      await loadData(true);
    } catch (err) {
      alert(err.message || 'Failed to delete response.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAllResponses = async () => {
    if (
      !window.confirm(
        `Delete ALL ${data?.responses?.length || 0} responses for "${data?.form?.title}"? This cannot be undone.`
      )
    ) {
      return;
    }
    setClearingAll(true);
    try {
      await api.clearFormResponses(id);
      setSelectedResponse(null);
      await loadData(true);
    } catch (err) {
      alert(err.message || 'Failed to clear responses.');
    } finally {
      setClearingAll(false);
    }
  };

  const filteredResponses = useMemo(() => {
    if (!data?.responses) return [];
    const q = search.trim().toLowerCase();
    return data.responses.filter((r) => {
      if (syncFilter !== 'all' && r.google_sync_status !== syncFilter) return false;
      if (!q) return true;
      const haystack = [
        r.participant_name,
        r.participant_office,
        JSON.stringify(r.answers),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data, search, syncFilter]);

  // Executive Insights derived from responses + questionStats
  const insights = useMemo(() => {
    const stats = data?.questionStats || [];
    const responses = data?.responses || [];

    // 1. Overall Yes / No / N/A sentiment across all Yes/No questions
    let yesTotal = 0;
    let noTotal = 0;
    let naTotal = 0;
    const attentionItems = [];

    for (const st of stats) {
      if (isYesNoStat(st)) {
        const y = st.breakdown.find((b) => b.label.trim().toLowerCase() === 'yes')?.count || 0;
        const n = st.breakdown.find((b) => b.label.trim().toLowerCase() === 'no')?.count || 0;
        const na = st.breakdown.find((b) => /^(n\/a|na)$/i.test(b.label.trim()))?.count || 0;
        yesTotal += y;
        noTotal += n;
        naTotal += na;
        if (n > 0) {
          attentionItems.push({
            id: st.id,
            title: st.title,
            noCount: n,
            total: st.totalAnswered,
            noPct: st.totalAnswered > 0 ? Math.round((n / st.totalAnswered) * 100) : 0,
            commentsCount: st.comments?.length || 0,
          });
        }
      }
    }
    attentionItems.sort((a, b) => b.noCount - a.noCount);

    const yesNoBase = yesTotal + noTotal;
    const positiveRate = yesNoBase > 0 ? Math.round((yesTotal / yesNoBase) * 100) : null;

    // 2. Responses by Office / Dept
    const officeMap = new Map();
    for (const r of responses) {
      const office =
        r.participant_office && r.participant_office !== '—'
          ? r.participant_office.trim()
          : 'Unspecified';
      officeMap.set(office, (officeMap.get(office) || 0) + 1);
    }
    const officeBreakdown = Array.from(officeMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        pct: responses.length > 0 ? Math.round((count / responses.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 3. Submission Timeline (grouped by hour if same day, or by date if multi-day)
    const timeMap = new Map();
    const sortedResp = [...responses].sort(
      (a, b) => new Date(a.submitted_at) - new Date(b.submitted_at)
    );
    const uniqueDays = new Set(
      sortedResp.map((r) => new Date(r.submitted_at).toLocaleDateString())
    );
    const groupByHour = uniqueDays.size <= 1;

    for (const r of sortedResp) {
      const d = new Date(r.submitted_at);
      const bucket = groupByHour
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      timeMap.set(bucket, (timeMap.get(bucket) || 0) + 1);
    }
    const timeline = Array.from(timeMap.entries()).map(([time, count]) => ({
      time,
      count,
    }));

    // 4. Unique sections for filter bar
    const sections = Array.from(new Set(stats.map((s) => s.sectionTitle).filter(Boolean)));

    return {
      yesTotal,
      noTotal,
      naTotal,
      positiveRate,
      attentionItems: attentionItems.slice(0, 4),
      officeBreakdown,
      timeline,
      sections,
    };
  }, [data]);

  const filteredQuestionStats = useMemo(() => {
    const stats = data?.questionStats || [];
    return stats.filter((st) => {
      if (sectionFilter !== 'all' && st.sectionTitle !== sectionFilter) return false;
      if (
        hideIdentityFields &&
        st.type === 'short_text' &&
        RESPONDENT_INFO_PATTERN.test(st.title)
      ) {
        return false;
      }
      return true;
    });
  }, [data, sectionFilter, hideIdentityFields]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span className="text-sm font-medium">Loading live monitor…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <p className="text-rose-600 font-semibold mb-4">{error || 'Form not found'}</p>
        <Link
          to="/admin"
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { form, summary } = data;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/admin"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                  {form.title}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auto-refreshes every 10s
                {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString()}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(false)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setQrOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              <QrCode className="w-3.5 h-3.5" />
              QR
            </button>
            <Link
              to={`/play/${form.slug}`}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Form
            </Link>
            <a
              href={api.getExportUrl(form.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 4 Summary KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Responses
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                {summary.totalResponses}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {insights.officeBreakdown.length} offices represented
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Completed Today
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                {summary.responsesToday}
              </p>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                Live incoming feed
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Overall Approval Rate
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                {insights.positiveRate !== null ? `${insights.positiveRate}%` : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {insights.yesTotal} Yes · {insights.noTotal} No · {insights.naTotal} N/A
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Google Forms Sync
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                {summary.syncRate}%
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {summary.syncedCount} synced · {summary.failedCount} failed
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition ${
              activeTab === 'analytics'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics & Insights
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition ${
              activeTab === 'table'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table2 className="w-4 h-4" />
            Participant Responses ({data.responses.length})
          </button>
        </div>

        {/* Tab 1: Executive Insights + Per-Question Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Executive Overview Row (only shown when responses > 0) */}
            {summary.totalResponses > 0 && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Participation by Office */}
                <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Participation by Office
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Top responding units & departments
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {insights.officeBreakdown.map((off, idx) => (
                      <div key={off.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 truncate pr-2">
                            {off.name}
                          </span>
                          <span className="font-extrabold text-slate-900 shrink-0">
                            {off.count} ({off.pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${off.pct}%`,
                              backgroundColor:
                                DISTINCT_CHART_PALETTE[idx % DISTINCT_CHART_PALETTE.length],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submission Activity Timeline */}
                <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Submission Timeline
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Response volume over time
                      </p>
                    </div>
                  </div>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={insights.timeline}
                        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 10, fill: '#64748b' }}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 10, fill: '#64748b' }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fill="url(#timelineFill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Items Needing Attention ("No" Flags) */}
                <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Items Flagged "No"
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Questions with negative feedback to review
                      </p>
                    </div>
                  </div>

                  {insights.attentionItems.length === 0 ? (
                    <div className="h-36 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col items-center justify-center text-center p-4">
                      <CheckCircle2 className="w-7 h-7 text-emerald-500 mb-1.5" />
                      <p className="text-xs font-bold text-emerald-800">
                        No negative flags yet
                      </p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">
                        All Yes/No items currently have 0 "No" responses.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {insights.attentionItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl bg-rose-50/60 border border-rose-200/70 p-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                              {item.title}
                            </p>
                            <span className="shrink-0 px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-extrabold">
                              {item.noCount} No ({item.noPct}%)
                            </span>
                          </div>
                          {item.commentsCount > 0 && (
                            <p className="text-[10px] font-semibold text-rose-700 mt-1">
                              {item.commentsCount} explanation{' '}
                              {item.commentsCount === 1 ? 'comment' : 'comments'} attached
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Section Filter & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 mr-1">
                  <Filter className="w-3.5 h-3.5" />
                  Section:
                </span>
                <button
                  type="button"
                  onClick={() => setSectionFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    sectionFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({data.questionStats.length})
                </button>
                {insights.sections.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSectionFilter(sec)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition max-w-[220px] truncate ${
                      sectionFilter === sec
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hideIdentityFields}
                  onChange={(e) => setHideIdentityFields(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Hide Name / Email / Office text cards
              </label>
            </div>

            {/* Per-Question Analytics Cards */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredQuestionStats.map((stat) => (
                <QuestionAnalyticsCard key={stat.id} stat={stat} />
              ))}
            </section>
          </div>
        )}

        {/* Tab 2: Participant Responses Table */}
        {activeTab === 'table' && (
          <section className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by participant name, office, or answer…"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {['all', 'synced', 'failed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setSyncFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                        syncFilter === status
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                {data.responses.length > 0 && (
                  <button
                    onClick={handleClearAllResponses}
                    disabled={clearingAll}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {clearingAll ? 'Clearing…' : 'Clear All'}
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Card View for Responses */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filteredResponses.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No matching responses found.
                </div>
              ) : (
                filteredResponses.map((r) => (
                  <div key={r.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">
                          {r.participant_name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {r.participant_office}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(r.submitted_at).toLocaleString()}
                        </p>
                      </div>
                      {r.google_sync_status === 'synced' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          Synced
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRetrySync(r.id)}
                          disabled={retryingId === r.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 shrink-0"
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${retryingId === r.id ? 'animate-spin' : ''}`}
                          />
                          Retry Sync
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedResponse(r)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Full Answers
                      </button>
                      <button
                        onClick={() => handleDeleteResponse(r)}
                        disabled={deletingId === r.id}
                        title="Delete response"
                        className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Participant Name</th>
                    <th className="py-3 px-4">Office / Dept</th>
                    <th className="py-3 px-4">Google Sync</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredResponses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                        No matching responses found.
                      </td>
                    </tr>
                  ) : (
                    filteredResponses.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(r.submitted_at).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {r.participant_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {r.participant_office}
                        </td>
                        <td className="py-3.5 px-4">
                          {r.google_sync_status === 'synced' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Synced
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Failed
                              </span>
                              <button
                                onClick={() => handleRetrySync(r.id)}
                                disabled={retryingId === r.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                              >
                                <RefreshCw
                                  className={`w-3 h-3 ${
                                    retryingId === r.id ? 'animate-spin' : ''
                                  }`}
                                />
                                Retry
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setSelectedResponse(r)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Full Answers
                            </button>
                            <button
                              onClick={() => handleDeleteResponse(r)}
                              disabled={deletingId === r.id}
                              title="Delete response"
                              className="inline-flex items-center justify-center p-1.5 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      <ShareQRModal form={qrOpen ? form : null} onClose={() => setQrOpen(false)} />

      <ResponseDrawer
        response={selectedResponse}
        form={form}
        onClose={() => setSelectedResponse(null)}
        onRetrySync={handleRetrySync}
        retrying={retryingId === selectedResponse?.id}
        onDelete={handleDeleteResponse}
        deleting={deletingId === selectedResponse?.id}
      />
    </div>
  );
}
