import db from './db.js';

export function seedDatabaseIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM forms').get().count;
  if (count > 0) return;

  const demoSchema = {
    sections: [
      {
        id: 'section-0',
        index: 0,
        title: 'Participant Profile',
        description: 'Quick details so we can route your feedback to the right team.',
        questions: [
          {
            id: 'q-1001',
            entryId: '1001',
            type: 'short_text',
            title: 'Your Name',
            description: 'Enter your full name or preferred nickname.',
            required: true,
          },
          {
            id: 'q-1002',
            entryId: '1002',
            type: 'dropdown',
            title: 'Office / Department',
            description: 'Select the office or unit you represent.',
            required: true,
            options: [
              'Information Technology',
              'Academic Affairs',
              'Student Services',
              'Human Resources',
              'Finance & Procurement',
              'Operations & Facilities',
            ],
          },
        ],
      },
      {
        id: 'section-1',
        index: 1,
        title: 'Service Experience',
        description: 'Rate your recent experience with the iGuide digital portal.',
        questions: [
          {
            id: 'q-1003',
            entryId: '1003',
            type: 'linear_scale',
            title: 'Overall, how satisfied are you with iGuide?',
            description: '1 = Very Dissatisfied, 5 = Very Satisfied',
            required: true,
            min: 1,
            max: 5,
            minLabel: 'Very Dissatisfied',
            maxLabel: 'Very Satisfied',
            commentField: {
              entryId: '1004',
              label: 'Optional: Tell us why you chose this rating',
              placeholder: 'What stood out or what frustrated you?',
              type: 'long_text',
            },
          },
          {
            id: 'q-1005',
            entryId: '1005',
            type: 'multiple_choice',
            title: 'How fast did you find the information you needed?',
            description: '',
            required: true,
            options: [
              'Instantly (under 30 seconds)',
              'Fairly quickly (1–2 minutes)',
              'Took some digging (3–5 minutes)',
              'Difficult / Could not find it',
            ],
            commentField: {
              entryId: '1006',
              label: 'Optional: Which page or feature were you looking for?',
              placeholder: 'e.g., Leave request form, room booking, directory...',
              type: 'short_text',
            },
          },
          {
            id: 'q-1007',
            entryId: '1007',
            type: 'checkboxes',
            title: 'Which features do you use most often?',
            description: 'Select all that apply.',
            required: true,
            options: [
              'Smart Search',
              'Service Request Forms',
              'Campus Directory',
              'Announcements & Calendar',
              'Document Downloads',
            ],
          },
        ],
      },
      {
        id: 'section-2',
        index: 2,
        title: 'Final Thoughts',
        description: 'One last question to shape our Q4 roadmap.',
        questions: [
          {
            id: 'q-1008',
            entryId: '1008',
            type: 'long_text',
            title: 'What is one improvement that would make your day easier?',
            description: 'Feel free to share ideas, pain points, or wish-list features.',
            required: false,
          },
        ],
      },
    ],
  };

  const insertForm = db.prepare(`
    INSERT INTO forms (slug, title, description, google_form_url, submit_url, total_pages, schema_json, theme, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const formInfo = insertForm.run(
    'iguide-eval',
    'iGuide Service Evaluation',
    'Help us evaluate the new iGuide digital portal experience. Takes less than 2 minutes!',
    'demo://iguide-eval',
    'demo://iguide-eval',
    3,
    JSON.stringify(demoSchema),
    'emerald',
    1
  );

  const formId = formInfo.lastInsertRowid;

  const now = Date.now();
  const sampleResponses = [
    {
      name: 'Elena Reyes',
      office: 'Information Technology',
      status: 'synced',
      offsetMins: 12,
      answers: {
        '1001': 'Elena Reyes',
        '1002': 'Information Technology',
        '1003': '5',
        '1004': 'Super clean search flow and mobile layout works great.',
        '1005': 'Instantly (under 30 seconds)',
        '1007': ['Smart Search', 'Service Request Forms', 'Campus Directory'],
        '1008': 'Add keyboard shortcuts for power users on desktop.',
      },
    },
    {
      name: 'Marcus Tan',
      office: 'Academic Affairs',
      status: 'synced',
      offsetMins: 48,
      answers: {
        '1001': 'Marcus Tan',
        '1002': 'Academic Affairs',
        '1003': '4',
        '1005': 'Fairly quickly (1–2 minutes)',
        '1007': ['Announcements & Calendar', 'Document Downloads'],
        '1008': 'Pin frequently downloaded PDF templates to the top.',
      },
    },
    {
      name: 'Priya Nair',
      office: 'Student Services',
      status: 'failed',
      offsetMins: 95,
      answers: {
        '1001': 'Priya Nair',
        '1002': 'Student Services',
        '1003': '2',
        '1004': 'The scholarship forms link was buried under two submenus.',
        '1005': 'Difficult / Could not find it',
        '1006': 'Scholarship renewal intake form',
        '1007': ['Service Request Forms', 'Document Downloads'],
        '1008': 'Make student forms searchable by keyword and tag.',
      },
    },
    {
      name: 'David Morales',
      office: 'Human Resources',
      status: 'synced',
      offsetMins: 180,
      answers: {
        '1001': 'David Morales',
        '1002': 'Human Resources',
        '1003': '5',
        '1005': 'Instantly (under 30 seconds)',
        '1007': ['Smart Search', 'Campus Directory'],
        '1008': 'Love the new dark-accent cards and fast load times.',
      },
    },
    {
      name: 'Hannah Lim',
      office: 'Finance & Procurement',
      status: 'synced',
      offsetMins: 1500, // yesterday
      answers: {
        '1001': 'Hannah Lim',
        '1002': 'Finance & Procurement',
        '1003': '4',
        '1005': 'Fairly quickly (1–2 minutes)',
        '1007': ['Service Request Forms', 'Document Downloads'],
        '1008': 'Exportable receipt checklist would save our team hours.',
      },
    },
  ];

  const insertResp = db.prepare(`
    INSERT INTO responses (form_id, participant_name, participant_office, answers_json, google_sync_status, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const r of sampleResponses) {
    const ts = new Date(now - r.offsetMins * 60 * 1000).toISOString();
    insertResp.run(
      formId,
      r.name,
      r.office,
      JSON.stringify(r.answers),
      r.status,
      ts
    );
  }
}
