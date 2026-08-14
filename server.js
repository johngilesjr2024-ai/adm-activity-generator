const express = require('express');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

if (!process.env.GEMINI_API_KEY) {
  console.warn('WARNING: GEMINI_API_KEY is not set. Add it to your .env file or hosting secret.');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/generate', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
    }

    const data = req.body || {};
    const sections = Array.isArray(data.sections) ? data.sections : [];

    if (!data.subject || !data.grade || !data.term || !data.week || !sections.length) {
      return res.status(400).json({ error: 'Subject, Grade, Term, Week, and at least one test section are required.' });
    }

    const sectionInstructions = sections.map((section, index) =>
      `${index + 1}. ${section.type}: exactly ${Number(section.count) || 1} question(s)`
    ).join('\n');

    const source = (data.sourceText || '').slice(0, 120000) ||
      'No lesson plan text was extracted. Use the subject, grade, term, and week to create appropriate content.';

    const prompt = `
You are an expert Philippine basic education assessment writer.
Create an ADM Activity for the following settings.

SUBJECT: ${data.subject}
GRADE LEVEL: ${data.grade}
TERM: ${data.term}
WEEK: ${data.week}
LANGUAGE: ${data.language || 'English'}

TEST SECTIONS:
${sectionInstructions}

SOURCE MATERIAL:
${source}

IMPORTANT REQUIREMENTS:
1. Generate EXACTLY the requested number of questions for every section.
2. Base the questions on the source material when source material is available.
3. If source material is unavailable, use the selected subject, grade, term and week.
4. Use age-appropriate language for ${data.grade}.
5. Make the assessment appropriate for Philippine learners and the ADM setting.
6. Do not use placeholders.
7. For Multiple Choice Questions, give exactly four choices labeled A, B, C, and D.
8. Include the correct answer for every item.
9. Do not include the phrase "(HOT-BLO)" anywhere.
10. Do not include English in the preview metadata; the preview only shows ADM Activity, Grade, Term, and Week.
11. Return ONLY valid JSON matching the requested structure.
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              question: { type: 'string' },
              choices: { type: 'array', items: { type: 'string' } },
              answer: { type: 'string' }
            },
            required: ['section', 'question', 'choices', 'answer']
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      return res.status(502).json({ error: 'Gemini returned an empty response.' });
    }

    let questions;
    try {
      questions = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: 'Gemini returned invalid JSON. Please try again.' });
    }

    if (!Array.isArray(questions) || !questions.length) {
      return res.status(502).json({ error: 'Gemini did not return any questions.' });
    }

    res.json({ questions });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error?.message || 'Unable to generate the assessment.'
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ADM Activity Generator running at http://localhost:${PORT}`);
});
