ADM ACTIVITY GENERATOR - SECURE GEMINI VERSION

IMPORTANT
The API key that was pasted into chat should be revoked/rotated. Do NOT put that key into the HTML.

SETUP
1. Install Node.js 20+.
2. Open a terminal in this folder.
3. Run: npm install
4. Copy .env.example to .env
5. Put your NEW Gemini API key in .env as GEMINI_API_KEY=...
6. Run: npm start
7. Open: http://localhost:3000

HOW IT WORKS
Teacher clicks Generate & Auto-Download.
The browser sends the selected subject, grade, term, week, language, lesson text and sections to /api/generate.
The server calls Gemini using the server-side API key.
The generated questions appear in the preview, then PPTX and DOCX are automatically downloaded.

FOR SCHOOL-WIDE USE
Deploy this Node.js app to a server/hosting provider. Store GEMINI_API_KEY in the hosting provider's environment variables/secrets. Teachers should access the hosted URL. Never distribute the API key inside the HTML.
