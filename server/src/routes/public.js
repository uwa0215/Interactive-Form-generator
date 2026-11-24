import { Router } from 'express';
import db from '../db.js';
import { submitToGoogleForms } from '../googleFormsParser.js';

const router = Router();

const NAME_PATTERN = /\b(name|full\s*name|email|e-mail|respondent|participant)\b/i;
const OFFICE_PATTERN = /\b(office|department|dept|unit|division|team|organization|org|school|college|branch)\b/i;

function isNoAnswer(value) {
  const check = (v) => /^\s*no(?:\b|[\s,.;:!()-]|$)/i.test(String(v).trim());
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.some(check);
  return check(value);
}

function hasNoOption(question) {
  if (!Array.isArray(question?.options)) return false;
  return question.options.some((opt) => isNoAnswer(opt));
}

function extractParticipantMeta(schema, answers) {
  let participantName = '';
  let participantOffice = '';

  const sections = Array.isArray(schema?.sections) ? schema.sections : [];
  for (const sec of sections) {
    for (const q of sec.questions || []) {
      const val = answers[q.entryId];
      if (!val || Array.isArray(val)) continue;
      const strVal = String(val).trim();
      if (!strVal) continue;

      if (!participantName && NAME_PATTERN.test(q.title)) {
        participantName = strVal;
      } else if (!participantOffice && OFFICE_PATTERN.test(q.title)) {
        participantOffice = strVal;
      }
    }
  }

  return { participantName, participantOffice };
}

// GET /api/public/forms/:slug
router.get('/forms/:slug', (req, res) => {
  const { slug } = req.params;
  const form = db.prepare('SELECT * FROM forms WHERE slug = ?').get(slug);

  if (!form) {
    return res.status(404).json({ error: 'Form not found.' });
  }

  if (!form.is_active) {
    return res.status(403).json({
      error: 'Form Closed',
      closed: true,
      title: form.title,
      theme: form.theme,
    });
  }

  const schema = JSON.parse(form.schema_json);
  return res.json({
    form: {
      id: form.id,
      slug: form.slug,
      title: form.title,
      description: form.description,
      theme: form.theme,
      total_pages: form.total_pages,
      schema,
    },
  });
});

// POST /api/public/forms/:slug/submit
router.post('/forms/:slug/submit', async (req, res) => {
  const { slug } = req.params;
  const { answers } = req.body || {};

  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Answers payload is required.' });
  }

  const form = db.prepare('SELECT * FROM forms WHERE slug = ?').get(slug);
  if (!form) {
    return res.status(404).json({ error: 'Form not found.' });
  }

  if (!form.is_active) {
    return res.status(403).json({ error: 'Form Closed' });
  }

  const schema = JSON.parse(form.schema_json);

  // Enforce required comment whenever a participant selects "No"
  for (const sec of schema?.sections || []) {
    for (const q of sec.questions || []) {
      const val = answers[q.entryId];
      if (hasNoOption(q) && isNoAnswer(val)) {
        const commentKey = q.commentField?.entryId || `${q.entryId}__no_comment`;
        const commentVal = answers[commentKey];
        if (!commentVal || String(commentVal).trim() === '') {
          return res.status(400).json({
            error: `A comment is required when answering "No" to "${q.title}".`,
          });
        }
      }
    }
  }

  const { participantName, participantOffice } = extractParticipantMeta(schema, answers);

  const submittedAt = new Date().toISOString();
  const googleSyncStatus = await submitToGoogleForms(form, answers);

  const info = db
    .prepare(
      `
      INSERT INTO responses (form_id, participant_name, participant_office, answers_json, google_sync_status, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    )
    .run(
      form.id,
      participantName,
      participantOffice,
      JSON.stringify(answers),
      googleSyncStatus,
      submittedAt
    );

  return res.status(201).json({
    id: info.lastInsertRowid,
    google_sync_status: googleSyncStatus,
    submitted_at: submittedAt,
  });
});

export default router;
