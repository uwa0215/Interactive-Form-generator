/**
 * Google Forms HTML fetcher, FB_PUBLIC_LOAD_DATA_ parser, and submission forwarder.
 */

const COMMENT_KEYWORDS =
  /\b(comment|comments|explain|elaborate|specify|remark|remarks|reason|why|feedback|detail|details|suggestion|suggestions|note|notes|other)\b/i;

const ATTACHABLE_TYPES = new Set([
  'multiple_choice',
  'dropdown',
  'checkboxes',
  'linear_scale',
]);

/**
 * Extracts the JSON array assigned to FB_PUBLIC_LOAD_DATA_ using balanced bracket scanning.
 */
function extractPublicLoadData(html) {
  const marker = 'FB_PUBLIC_LOAD_DATA_';
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) {
    throw new Error(
      'Could not find FB_PUBLIC_LOAD_DATA_. Ensure the Google Form is public and does not require sign-in.'
    );
  }

  const startIdx = html.indexOf('[', markerIdx);
  if (startIdx === -1) {
    throw new Error('Malformed Google Form data payload.');
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  let endIdx = -1;

  for (let i = startIdx; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === '[') {
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  if (endIdx === -1) {
    throw new Error('Unable to parse complete FB_PUBLIC_LOAD_DATA_ structure.');
  }

  const rawJson = html.slice(startIdx, endIdx + 1);
  return JSON.parse(rawJson);
}

/**
 * Derive the Google Form /formResponse submission URL from a final resolved viewform URL.
 */
function deriveSubmitUrl(resolvedUrl) {
  try {
    const u = new URL(resolvedUrl);
    u.search = '';
    u.hash = '';
    if (u.pathname.includes('/viewform')) {
      u.pathname = u.pathname.replace(/\/viewform.*$/, '/formResponse');
    } else if (!u.pathname.endsWith('/formResponse')) {
      u.pathname = u.pathname.replace(/\/$/, '') + '/formResponse';
    }
    return u.toString();
  } catch {
    return resolvedUrl.replace(/\/viewform.*$/, '/formResponse');
  }
}

/**
 * Parse raw FB_PUBLIC_LOAD_DATA_ array into normalized sections & questions.
 */
export function parseGoogleFormData(data) {
  const formMeta = data?.[1];
  if (!Array.isArray(formMeta)) {
    throw new Error('Unexpected Google Form schema structure.');
  }

  const description = typeof formMeta[0] === 'string' ? formMeta[0] : '';
  const rawItems = Array.isArray(formMeta[1]) ? formMeta[1] : [];
  const title =
    (typeof formMeta[8] === 'string' && formMeta[8].trim()) ||
    (typeof data?.[3] === 'string' && data[3].trim()) ||
    'Untitled Google Form';

  const sections = [
    {
      id: 'section-0',
      index: 0,
      title: 'General',
      description: '',
      questions: [],
    },
  ];

  let currentSection = sections[0];
  let pageCount = 1;
  let pendingNotice = null;

  for (const item of rawItems) {
    if (!Array.isArray(item)) continue;

    const itemId = item[0];
    const itemTitle = (item[1] || '').toString().trim();
    const itemDesc = (item[2] || '').toString().trim();
    const itemType = item[3];
    const fieldGroup = Array.isArray(item[4]) ? item[4] : [];

    // Type 8: Section header / Page break
    if (itemType === 8) {
      pageCount++;
      pendingNotice = null;
      currentSection = {
        id: `section-${pageCount - 1}`,
        index: pageCount - 1,
        title: itemTitle || `Section ${pageCount}`,
        description: itemDesc,
        questions: [],
      };
      sections.push(currentSection);
      continue;
    }

    // Type 6: Title & Description block (e.g., Data Privacy Notice) -> attach to the next question
    if (itemType === 6 && (itemTitle || itemDesc)) {
      if (pendingNotice) {
        pendingNotice = {
          title: pendingNotice.title || itemTitle,
          text: [pendingNotice.text, itemTitle && pendingNotice.title ? itemTitle : '', itemDesc]
            .filter(Boolean)
            .join('\n\n'),
        };
      } else {
        pendingNotice = {
          title: itemTitle,
          text: itemDesc,
        };
      }
      continue;
    }

    // Ignore purely decorative media items (image = 11, video = 12)
    if (!fieldGroup.length || !Array.isArray(fieldGroup[0])) continue;

    const primaryField = fieldGroup[0];
    const entryId = String(primaryField[0]);
    const rawOptions = Array.isArray(primaryField[1]) ? primaryField[1] : [];
    const required = Boolean(primaryField[2]);

    let question = null;

    if (itemType === 0) {
      question = {
        id: `q-${entryId}`,
        entryId,
        type: 'short_text',
        title: itemTitle || 'Short Answer',
        description: itemDesc,
        required,
      };
    } else if (itemType === 1) {
      question = {
        id: `q-${entryId}`,
        entryId,
        type: 'long_text',
        title: itemTitle || 'Paragraph',
        description: itemDesc,
        required,
      };
    } else if (itemType === 2) {
      const options = rawOptions
        .map((opt) => (Array.isArray(opt) ? opt[0] : null))
        .filter((v) => typeof v === 'string' && v.length > 0);
      question = {
        id: `q-${entryId}`,
        entryId,
        type: 'multiple_choice',
        title: itemTitle || 'Choose one',
        description: itemDesc,
        required,
        options,
      };
    } else if (itemType === 3) {
      const options = rawOptions
        .map((opt) => (Array.isArray(opt) ? opt[0] : null))
        .filter((v) => typeof v === 'string' && v.length > 0);
      question = {
        id: `q-${entryId}`,
        entryId,
        type: 'dropdown',
        title: itemTitle || 'Select an option',
        description: itemDesc,
        required,
        options,
      };
    } else if (itemType === 4) {
      const options = rawOptions
        .map((opt) => (Array.isArray(opt) ? opt[0] : null))
        .filter((v) => typeof v === 'string' && v.length > 0);
      question = {
        id: `q-${entryId}`,
        entryId,
        type: 'checkboxes',
        title: itemTitle || 'Select all that apply',
        description: itemDesc,
        required,
        options,
      };
    } else if (itemType === 5) {
      const scaleValues = rawOptions
        .map((opt) => Number(Array.isArray(opt) ? opt[0] : NaN))
        .filter((n) => !Number.isNaN(n));
      const min = scaleValues.length ? Math.min(...scaleValues) : 1;
      const max = scaleValues.length ? Math.max(...scaleValues) : 5;
      const labels = Array.isArray(primaryField[3]) ? primaryField[3] : [];
      question = {
        id: `q-${entryId}`,
        entryId,
        type: 'linear_scale',
        title: itemTitle || 'Rate on a scale',
        description: itemDesc,
        required,
        min,
        max,
        minLabel: labels[0] || '',
        maxLabel: labels[1] || '',
      };
    } else if (itemType === 9) {
      question = {
        id: `q-${entryId}`,
        entryId,
        type: 'date',
        title: itemTitle || 'Date',
        description: itemDesc,
        required,
      };
    } else if (itemType === 10) {
      question = {
        id: `q-${entryId}`,
        entryId,
        type: 'time',
        title: itemTitle || 'Time',
        description: itemDesc,
        required,
      };
    } else {
      // Fallback for grids or other types: treat as short text
      question = {
        id: `q-${entryId}`,
        entryId,
        type: 'short_text',
        title: itemTitle || 'Response',
        description: itemDesc,
        required,
      };
    }

    // Attach any preceding Title & Description notice block (e.g. Data Privacy Notice)
    if (pendingNotice) {
      question.notice = pendingNotice;
      pendingNotice = null;
    }

    // Auto-attach optional comment/explanation text fields to their preceding choice/scale question
    const prevQuestions = currentSection.questions;
    const prevQ = prevQuestions.length > 0 ? prevQuestions[prevQuestions.length - 1] : null;
    if (
      prevQ &&
      !prevQ.commentField &&
      ATTACHABLE_TYPES.has(prevQ.type) &&
      (question.type === 'short_text' || question.type === 'long_text') &&
      !question.required &&
      COMMENT_KEYWORDS.test(question.title)
    ) {
      prevQ.commentField = {
        entryId: question.entryId,
        label: question.title,
        placeholder: question.description || 'Share any additional details or context...',
        type: question.type,
      };
      continue;
    }

    currentSection.questions.push(question);
  }

  // Remove empty initial section if the form starts immediately with a section header
  const nonEmptySections = sections.filter((s) => s.questions.length > 0);
  const finalSections = nonEmptySections.length > 0 ? nonEmptySections : sections;

  return {
    title,
    description,
    total_pages: Math.max(1, pageCount),
    schema: {
      sections: finalSections,
    },
  };
}

/**
 * Fetch a public Google Form URL and parse its schema.
 */
export async function fetchAndParseGoogleForm(url) {
  // Built-in demo template URL for offline / instant testing
  if (url.startsWith('demo://')) {
    return buildDemoTemplate(url);
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Please enter a valid Google Form URL.');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Only HTTP/HTTPS Google Form URLs are supported.');
  }

  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Google Form (HTTP ${response.status}). Make sure the form is publicly accessible.`
    );
  }

  const html = await response.text();
  const data = extractPublicLoadData(html);
  const parsed = parseGoogleFormData(data);
  const submit_url = deriveSubmitUrl(response.url || url);

  return {
    ...parsed,
    google_form_url: response.url || url,
    submit_url,
  };
}

/**
 * Forward participant answers to Google Forms /formResponse endpoint.
 */
export async function submitToGoogleForms(form, answers) {
  if (!form.submit_url || form.submit_url.startsWith('demo://')) {
    return 'synced';
  }

  try {
    const params = new URLSearchParams();
    const totalPages = Math.max(1, Number(form.total_pages) || 1);
    const pageHistory = Array.from({ length: totalPages }, (_, i) => i).join(',');
    params.append('pageHistory', pageHistory);

    for (const [entryId, value] of Object.entries(answers || {})) {
      if (value === undefined || value === null || value === '') continue;
      // Skip synthetic local-only comment keys (e.g., 12345__no_comment) when posting to Google Forms
      if (entryId.includes('__')) continue;
      const key = entryId.startsWith('entry.') ? entryId : `entry.${entryId}`;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item !== undefined && item !== null && item !== '') {
            params.append(key, String(item));
          }
        }
      } else {
        params.append(key, String(value));
      }
    }

    const res = await fetch(form.submit_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      redirect: 'follow',
    });

    // Google Forms returns 200 on accepted formResponse
    return res.ok ? 'synced' : 'failed';
  } catch (err) {
    console.error('Google Forms sync error:', err.message);
    return 'failed';
  }
}

/**
 * Demo template generator when importing demo:// URLs for instant testing.
 */
function buildDemoTemplate(url) {
  const key = url.replace('demo://', '').trim() || 'workshop-pulse';
  return {
    title:
      key === 'workshop-pulse'
        ? 'Workshop & Training Pulse Check'
        : `Demo Form: ${key.replace(/-/g, ' ')}`,
    description:
      'Quick 2-minute interactive pulse check to capture participant takeaways and session ratings.',
    google_form_url: url,
    submit_url: url,
    total_pages: 2,
    schema: {
      sections: [
        {
          id: 'section-0',
          index: 0,
          title: 'Participant Info',
          description: 'Tell us who is checking in.',
          questions: [
            {
              id: 'q-9001',
              entryId: '9001',
              type: 'short_text',
              title: 'Full Name',
              description: '',
              required: true,
            },
            {
              id: 'q-9002',
              entryId: '9002',
              type: 'dropdown',
              title: 'Department / Office',
              description: '',
              required: true,
              options: [
                'Engineering & IT',
                'Operations',
                'Student Affairs',
                'Marketing & Comms',
                'Administration',
              ],
            },
          ],
        },
        {
          id: 'section-1',
          index: 1,
          title: 'Session Feedback',
          description: 'Help us make the next session even better.',
          questions: [
            {
              id: 'q-9003',
              entryId: '9003',
              type: 'linear_scale',
              title: 'How valuable was today’s session?',
              description: '1 = Not valuable at all, 5 = Extremely valuable',
              required: true,
              min: 1,
              max: 5,
              minLabel: 'Not valuable',
              maxLabel: 'Extremely valuable',
              commentField: {
                entryId: '9004',
                label: 'Optional comment: What could we improve?',
                placeholder: 'Share what worked well or what we should adjust...',
                type: 'long_text',
              },
            },
            {
              id: 'q-9005',
              entryId: '9005',
              type: 'multiple_choice',
              title: 'Would you recommend this workshop to a colleague?',
              description: '',
              required: true,
              options: ['Definitely Yes', 'Probably Yes', 'Neutral', 'Probably Not'],
            },
            {
              id: 'q-9006',
              entryId: '9006',
              type: 'checkboxes',
              title: 'Which topics should we cover next?',
              description: 'Select all that interest you.',
              required: false,
              options: [
                'AI Productivity Tools',
                'Data Visualization',
                'Process Automation',
                'UX & Design Thinking',
              ],
            },
          ],
        },
      ],
    },
  };
}
