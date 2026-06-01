import express from 'express';
import multer from 'multer';
import { createRequire } from 'module';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { callGroq, parseAIJson } from '../config/groqHelper.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const router = express.Router();

// Multer - memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain'];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are supported'));
    }
  }
});

async function extractText(file) {
  if (file.mimetype === 'application/pdf') {
    const data = await pdfParse(file.buffer);
    return data.text;
  }
  return file.buffer.toString('utf-8');
}

const SUMMARY_SYSTEM = 'Kamu adalah asisten akademik. Selalu balas HANYA dengan JSON valid, tanpa teks tambahan, tanpa markdown code block.';

function buildSummaryPrompt(text, titleHint) {
  return `Kamu adalah asisten akademik yang membantu mahasiswa memahami materi kuliah.

Analisis materi berikut dan berikan output dalam format JSON yang valid:

MATERI:
${text}

Berikan output JSON dengan struktur berikut (HANYA JSON, tanpa teks lain):
{
  "title": "${titleHint || 'judul materi yang terdeteksi'}",
  "summary": "ringkasan komprehensif dalam 3-5 paragraf menggunakan bahasa Indonesia yang mudah dipahami",
  "key_points": ["poin penting 1", "poin penting 2", "poin penting 3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "difficult_concepts": [
    { "concept": "nama konsep sulit", "explanation": "penjelasan sederhana" }
  ],
  "topic": "topik utama materi"
}`;
}

// POST /api/summarizer/upload
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const rawText = await extractText(req.file);
    if (!rawText || rawText.trim().length < 50) {
      return res.status(400).json({ error: 'Could not extract enough text from the file' });
    }

    const textToProcess = rawText.slice(0, 12000);
    const prompt = buildSummaryPrompt(textToProcess, '');

    const responseText = await callGroq([
      { role: 'system', content: SUMMARY_SYSTEM },
      { role: 'user', content: prompt }
    ]);
    console.log('[Summarizer upload] response:', responseText.slice(0, 300));

    const summaryData = parseAIJson(responseText, {
      title: req.file.originalname,
      summary: responseText,
      key_points: [],
      keywords: [],
      difficult_concepts: [],
      topic: 'General'
    });

    const { data: saved, error } = await supabaseAdmin
      .from('summaries')
      .insert([{
        user_id: req.user.id,
        file_name: req.file.originalname,
        title: summaryData.title || req.file.originalname,
        summary: summaryData.summary,
        key_points: summaryData.key_points || [],
        keywords: summaryData.keywords || [],
        difficult_concepts: summaryData.difficult_concepts || [],
        topic: summaryData.topic || 'General',
        raw_text: rawText.slice(0, 5000)
      }])
      .select()
      .single();

    if (error) console.error('[Summarizer] Supabase save error:', error.message);

    res.json({
      message: 'Summary generated successfully',
      data: { ...summaryData, id: saved?.id }
    });
  } catch (err) {
    console.error('[Summarizer upload] error:', err.message);
    res.status(500).json({ error: 'Failed to summarize', message: err.message });
  }
});

// POST /api/summarizer/text
router.post('/text', authenticateToken, async (req, res) => {
  try {
    const { text, title } = req.body;

    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: 'Text is too short' });
    }

    const textToProcess = text.slice(0, 12000);
    const prompt = buildSummaryPrompt(textToProcess, title || 'Materi Kuliah');

    const responseText = await callGroq([
      { role: 'system', content: SUMMARY_SYSTEM },
      { role: 'user', content: prompt }
    ]);
    console.log('[Summarizer text] response:', responseText.slice(0, 300));

    const summaryData = parseAIJson(responseText, {
      title: title || 'Materi Kuliah',
      summary: responseText,
      key_points: [],
      keywords: [],
      difficult_concepts: [],
      topic: 'General'
    });

    const { data: saved } = await supabaseAdmin
      .from('summaries')
      .insert([{
        user_id: req.user.id,
        file_name: null,
        title: summaryData.title || title || 'Materi Kuliah',
        summary: summaryData.summary,
        key_points: summaryData.key_points || [],
        keywords: summaryData.keywords || [],
        difficult_concepts: summaryData.difficult_concepts || [],
        topic: summaryData.topic || 'General',
        raw_text: text.slice(0, 5000)
      }])
      .select()
      .single();

    res.json({
      message: 'Summary generated successfully',
      data: { ...summaryData, id: saved?.id }
    });
  } catch (err) {
    console.error('[Summarizer text] error:', err.message);
    res.status(500).json({ error: 'Failed to summarize', message: err.message });
  }
});

// GET /api/summarizer/history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('summaries')
      .select('id, title, topic, file_name, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history', message: err.message });
  }
});

// GET /api/summarizer/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('summaries')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Summary not found' });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary', message: err.message });
  }
});

export default router;
