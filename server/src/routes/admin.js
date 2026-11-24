import { Router } from 'express';
import db from '../db.js';
import { requireAdmin } from '../auth.js';
import {
  fetchAndParseGoogleForm,
  submitToGoogleForms,
} from '../googleFormsParser.js';

const router = Router();
router.use(requireAdmin);

const VALID_THEMES = new Set(['emerald', 'ocean', 'indigo', 'teal', 'amber', 'slate']);

function slugify(input) {
  return (input || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function getAllQuestions(schema) {
  const sections = Array.isArray(schema?.sections) ? schema.sections : [];
  const list = [];
  for (const section of sections) {
    for (const q of section.questions || []) {
      list.push({ ...q, sectionTitle: section.title });
    }
  }
  return list;
}

function isSameUtcDay(isoStr) {
  if (!isoStr) return false;
  const d = new Date(isoStr);
  const now = new Date();
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  );
}

function escapeCsvCell(val) {
  const s = val === null || val === undefined ? '' : String(val);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// POST /api/admin/forms/import
router.post('/forms/import', async (req, res) => {
  try {
    const { url, slug: rawSlug, theme: rawTheme } = req.body || {};

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'A public Google Form URL is required.' });
    }

    const theme = VALID_THEMES.has(rawTheme) ? rawTheme : 'emerald';
    const parsed = await fetchAndParseGoogleForm(url.trim());

    let slug = slugify(rawSlug || parsed.title || 'form');
    if (!slug) {
      slug = `form-${Date.now().toString(36)}`;
    }

    const existing = await db.get('SELECT id FROM forms WHERE slug = ?', [slug]);
    if (existing) {
      return res.status(409).json({
        error: `Slug "${slug}" is already in use. Please choose a different short URL slug.`,
      });
    }

    const result = await db.run(
      `
      INSERT INTO forms (slug, title, description, google_form_url, submit_url, total_pages, schema_json, theme, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `,
      [
        slug,
        parsed.title,
        parsed.description || '',
        parsed.google_form_url,
        parsed.submit_url,
        parsed.total_pages,
        JSON.stringify(parsed.schema),
        theme,
      ]
    );

    const created = await db.get('SELECT * FROM forms WHERE id = ?', [
      result.lastInsertRowid,
    ]);
    return res.status(201).json({
      form: {
        ...created,
        is_active: Boolean(created.is_active),
        schema: JSON.parse(created.schema_json),
        response_count: 0,
      },
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to import Google Form.' });
  }
});

// GET /api/admin/forms
router.get('/forms', async (_req, res, next) => {
  try {
    const rows = await db.all(`
      SELECT
        f.*,
        COUNT(r.id) AS response_count,
        MAX(r.submitted_at) AS last_response_at
      FROM forms f
      LEFT JOIN responses r ON r.form_id = f.id
      GROUP BY f.id
      ORDER BY f.created_at DESC, f.id DESC
    `);

    const allResponses = await db.all('SELECT submitted_at FROM responses');
    const responsesToday = allResponses.filter((r) => isSameUtcDay(r.submitted_at)).length;

    const forms = rows.map((row) => {
      const schema = JSON.parse(row.schema_json);
      const questionCount = getAllQuestions(schema).length;
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        google_form_url: row.google_form_url,
        submit_url: row.submit_url,
        total_pages: row.total_pages,
        theme: row.theme,
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
        response_count: Number(row.response_count || 0),
        last_response_at: row.last_response_at,
        question_count: questionCount,
      };
    });

    return res.json({
      forms,
      summary: {
        total_forms: forms.length,
        active_forms: forms.filter((f) => f.is_active).length,
        total_responses: allResponses.length,
        responses_today: responsesToday,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/forms/:id
router.patch('/forms/:id', async (req, res) => {
  const id = Number(req.params.id);
  const form = await db.get('SELECT * FROM forms WHERE id = ?', [id]);
  if (!form) {
    return res.status(404).json({ error: 'Form not found.' });
  }

  try {
    const { is_active, theme, title, resync } = req.body || {};

    let nextIsActive = form.is_active;
    if (typeof is_active === 'boolean') {
      nextIsActive = is_active ? 1 : 0;
    }

    let nextTheme = form.theme;
    if (theme && VALID_THEMES.has(theme)) {
      nextTheme = theme;
    }

    let nextTitle = typeof title === 'string' && title.trim() ? title.trim() : form.title;
    let nextDesc = form.description;
    let nextSchemaJson = form.schema_json;
    let nextSubmitUrl = form.submit_url;
    let nextTotalPages = form.total_pages;

    if (resync) {
      const parsed = await fetchAndParseGoogleForm(form.google_form_url);
      nextTitle = parsed.title;
      nextDesc = parsed.description || '';
      nextSchemaJson = JSON.stringify(parsed.schema);
      nextSubmitUrl = parsed.submit_url;
      nextTotalPages = parsed.total_pages;
    }

    await db.run(
      `
      UPDATE forms
      SET is_active = ?, theme = ?, title = ?, description = ?, schema_json = ?, submit_url = ?, total_pages = ?
      WHERE id = ?
    `,
      [
        nextIsActive,
        nextTheme,
        nextTitle,
        nextDesc,
        nextSchemaJson,
        nextSubmitUrl,
        nextTotalPages,
        id,
      ]
    );

    const updated = await db.get('SELECT * FROM forms WHERE id = ?', [id]);
    return res.json({
      form: {
        ...updated,
        is_active: Boolean(updated.is_active),
        schema: JSON.parse(updated.schema_json),
      },
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to update form.' });
  }
});

// DELETE /api/admin/forms/:id
router.delete('/forms/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const info = await db.run('DELETE FROM forms WHERE id = ?', [id]);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Form not found.' });
    }
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/forms/:id/responses
router.get('/forms/:id/responses', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const form = await db.get('SELECT * FROM forms WHERE id = ?', [id]);
    if (!form) {
      return res.status(404).json({ error: 'Form not found.' });
    }

    const schema = JSON.parse(form.schema_json);
    const questions = getAllQuestions(schema);

    const rawResponses = await db.all(
      'SELECT * FROM responses WHERE form_id = ? ORDER BY submitted_at DESC, id DESC',
      [id]
    );

    const responses = rawResponses.map((r) => ({
      id: r.id,
      form_id: r.form_id,
      participant_name: r.participant_name || 'Anonymous',
      participant_office: r.participant_office || '—',
      answers: JSON.parse(r.answers_json || '{}'),
      google_sync_status: r.google_sync_status,
      submitted_at: r.submitted_at,
    }));

    const totalResponses = responses.length;
    const responsesToday = responses.filter((r) => isSameUtcDay(r.submitted_at)).length;
    const syncedCount = responses.filter((r) => r.google_sync_status === 'synced').length;
    const failedCount = totalResponses - syncedCount;
    const syncRate = totalResponses > 0 ? Math.round((syncedCount / totalResponses) * 100) : 100;

    // Build per-question statistics
    const questionStats = questions.map((q) => {
      const stat = {
        id: q.id,
        entryId: q.entryId,
        title: q.title,
        type: q.type,
        sectionTitle: q.sectionTitle,
        totalAnswered: 0,
        breakdown: [],
        average: null,
        comments: [],
      };

      if (['multiple_choice', 'dropdown', 'checkboxes'].includes(q.type)) {
        const counts = new Map();
        for (const opt of q.options || []) {
          counts.set(opt, 0);
        }

        for (const r of responses) {
          const val = r.answers[q.entryId];
          if (val === undefined || val === null || val === '') continue;
          if (Array.isArray(val)) {
            if (val.length > 0) stat.totalAnswered++;
            for (const item of val) {
              counts.set(item, (counts.get(item) || 0) + 1);
            }
          } else {
            stat.totalAnswered++;
            counts.set(String(val), (counts.get(String(val)) || 0) + 1);
          }
        }

        const denom = stat.totalAnswered || 1;
        stat.breakdown = Array.from(counts.entries()).map(([label, count]) => ({
          label,
          count,
          percentage: stat.totalAnswered > 0 ? Math.round((count / denom) * 100) : 0,
        }));
      } else if (q.type === 'linear_scale') {
        const min = Number(q.min ?? 1);
        const max = Number(q.max ?? 5);
        const counts = new Map();
        for (let i = min; i <= max; i++) {
          counts.set(String(i), 0);
        }

        let sum = 0;
        for (const r of responses) {
          const val = r.answers[q.entryId];
          if (val === undefined || val === null || val === '') continue;
          const num = Number(val);
          if (!Number.isNaN(num)) {
            stat.totalAnswered++;
            sum += num;
            counts.set(String(num), (counts.get(String(num)) || 0) + 1);
          }
        }

        stat.average =
          stat.totalAnswered > 0 ? Number((sum / stat.totalAnswered).toFixed(2)) : null;
        stat.min = min;
        stat.max = max;
        stat.minLabel = q.minLabel || '';
        stat.maxLabel = q.maxLabel || '';
        const denom = stat.totalAnswered || 1;
        stat.breakdown = Array.from(counts.entries()).map(([label, count]) => ({
          label,
          count,
          percentage: stat.totalAnswered > 0 ? Math.round((count / denom) * 100) : 0,
        }));
      } else {
        for (const r of responses) {
          const val = r.answers[q.entryId];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            stat.totalAnswered++;
            stat.comments.push({
              responseId: r.id,
              participantName: r.participant_name,
              participantOffice: r.participant_office,
              text: String(val).trim(),
              submittedAt: r.submitted_at,
            });
          }
        }
      }

      const commentEntryId = q.commentField?.entryId || `${q.entryId}__no_comment`;
      const hasSyntheticComments =
        !q.commentField &&
        responses.some(
          (r) =>
            r.answers[commentEntryId] !== undefined &&
            r.answers[commentEntryId] !== null &&
            String(r.answers[commentEntryId]).trim() !== ''
        );

      if (q.commentField || hasSyntheticComments) {
        stat.commentFieldLabel = q.commentField?.label || 'Comment for "No" response';
        for (const r of responses) {
          const cVal = r.answers[commentEntryId];
          if (cVal !== undefined && cVal !== null && String(cVal).trim() !== '') {
            stat.comments.push({
              responseId: r.id,
              participantName: r.participant_name,
              participantOffice: r.participant_office,
              ratingOrChoice: r.answers[q.entryId],
              text: String(cVal).trim(),
              submittedAt: r.submitted_at,
            });
          }
        }
      }

      return stat;
    });

    return res.json({
      form: {
        id: form.id,
        slug: form.slug,
        title: form.title,
        description: form.description,
        google_form_url: form.google_form_url,
        theme: form.theme,
        is_active: Boolean(form.is_active),
        total_pages: form.total_pages,
        schema,
        created_at: form.created_at,
      },
      summary: {
        totalResponses,
        responsesToday,
        syncedCount,
        failedCount,
        syncRate,
      },
      questionStats,
      responses,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/responses/:id
router.delete('/responses/:id', async (req, res, next) => {
  try {
    const responseId = Number(req.params.id);
    const info = await db.run('DELETE FROM responses WHERE id = ?', [responseId]);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Response not found.' });
    }
    return res.json({ ok: true, id: responseId });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/forms/:id/responses (clear all responses for a form)
router.delete('/forms/:id/responses', async (req, res, next) => {
  try {
    const formId = Number(req.params.id);
    const form = await db.get('SELECT id FROM forms WHERE id = ?', [formId]);
    if (!form) {
      return res.status(404).json({ error: 'Form not found.' });
    }
    const info = await db.run('DELETE FROM responses WHERE form_id = ?', [formId]);
    return res.json({ ok: true, deleted: info.changes });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/responses/:id/retry-sync
router.post('/responses/:id/retry-sync', async (req, res, next) => {
  try {
    const responseId = Number(req.params.id);
    const resp = await db.get('SELECT * FROM responses WHERE id = ?', [responseId]);
    if (!resp) {
      return res.status(404).json({ error: 'Response not found.' });
    }

    const form = await db.get('SELECT * FROM forms WHERE id = ?', [resp.form_id]);
    if (!form) {
      return res.status(404).json({ error: 'Parent form not found.' });
    }

    const answers = JSON.parse(resp.answers_json || '{}');
    const nextStatus = await submitToGoogleForms(form, answers);

    await db.run('UPDATE responses SET google_sync_status = ? WHERE id = ?', [
      nextStatus,
      responseId,
    ]);

    return res.json({
      id: responseId,
      google_sync_status: nextStatus,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/forms/:id/export
router.get('/forms/:id/export', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const form = await db.get('SELECT * FROM forms WHERE id = ?', [id]);
    if (!form) {
      return res.status(404).json({ error: 'Form not found.' });
    }

    const schema = JSON.parse(form.schema_json);
    const questions = getAllQuestions(schema);
    const rawResponses = await db.all(
      'SELECT * FROM responses WHERE form_id = ? ORDER BY submitted_at DESC, id DESC',
      [id]
    );

    const columns = [
      { key: '__submitted_at', label: 'Submitted At (UTC)' },
      { key: '__participant_name', label: 'Participant Name' },
      { key: '__participant_office', label: 'Office / Department' },
      { key: '__google_sync_status', label: 'Google Sync Status' },
    ];

    for (const q of questions) {
      columns.push({ key: q.entryId, label: q.title });
      const hasNoOpt =
        Array.isArray(q.options) &&
        q.options.some((opt) => /^\s*no(?:\b|[\s,.;:!()-]|$)/i.test(String(opt).trim()));
      if (q.commentField) {
        columns.push({
          key: q.commentField.entryId,
          label: `${q.title} — Comment`,
        });
      } else if (hasNoOpt) {
        columns.push({
          key: `${q.entryId}__no_comment`,
          label: `${q.title} — Comment`,
        });
      }
    }

    const headerRow = columns.map((c) => escapeCsvCell(c.label)).join(',');
    const dataRows = rawResponses.map((r) => {
      const answers = JSON.parse(r.answers_json || '{}');
      return columns
        .map((col) => {
          if (col.key === '__submitted_at') return escapeCsvCell(r.submitted_at);
          if (col.key === '__participant_name') return escapeCsvCell(r.participant_name);
          if (col.key === '__participant_office') return escapeCsvCell(r.participant_office);
          if (col.key === '__google_sync_status') return escapeCsvCell(r.google_sync_status);
          const val = answers[col.key];
          if (Array.isArray(val)) return escapeCsvCell(val.join('; '));
          return escapeCsvCell(val ?? '');
        })
        .join(',');
    });

    const csv = [headerRow, ...dataRows].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${form.slug}-responses.csv"`
    );
    return res.send(csv);
  } catch (err) {
    next(err);
  }
});

export default router;
