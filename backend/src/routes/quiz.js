import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { callGroq, parseAIJson } from '../config/groqHelper.js';

const router = express.Router();

// ─── Helper: normalisasi teks untuk perbandingan ───────────────────────────
function norm(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/^[a-d]\.\s*/i, '')   // hapus prefix "A. " "B. " dll
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Helper: cek apakah jawaban user cocok dengan correct_answer ───────────
function isAnswerCorrect(userAnswer, correctAnswer, options = [], type = '') {
  if (!userAnswer) return false;

  const uaNorm = norm(userAnswer);
  const caNorm = norm(correctAnswer);

  // 1. Exact match setelah normalisasi
  if (uaNorm === caNorm) return true;

  // 2. User menjawab teks opsi lengkap, correct_answer hanya huruf (A/B/C/D)
  //    Cari opsi yang hurufnya cocok dengan correct_answer
  if (/^[a-d]$/i.test(correctAnswer.trim()) && options.length) {
    const idx = correctAnswer.trim().toUpperCase().charCodeAt(0) - 65; // A=0, B=1, dst
    const correctOpt = options[idx];
    if (correctOpt && norm(userAnswer) === norm(correctOpt)) return true;
  }

  // 3. correct_answer adalah teks opsi lengkap, user menjawab huruf (A/B/C/D)
  if (/^[a-d]$/i.test(userAnswer.trim()) && options.length) {
    const idx = userAnswer.trim().toUpperCase().charCodeAt(0) - 65;
    const selectedOpt = options[idx];
    if (selectedOpt && norm(selectedOpt) === caNorm) return true;
  }

  // 4. Benar/Salah — cocokkan semua variasi bahasa
  if (type === 'true_false') {
    const trueV  = ['benar', 'true', 'ya', 'iya', 'betul', 'correct'];
    const falseV = ['salah', 'false', 'tidak', 'bukan', 'wrong', 'incorrect'];
    const uaTrue  = trueV.some(v => uaNorm.includes(v));
    const uaFalse = falseV.some(v => uaNorm.includes(v));
    const caTrue  = trueV.some(v => caNorm.includes(v));
    const caFalse = falseV.some(v => caNorm.includes(v));
    if (uaTrue && caTrue)   return true;
    if (uaFalse && caFalse) return true;
  }

  // 5. Partial match — jawaban user terkandung dalam correct_answer atau sebaliknya
  //    (untuk kasus AI menulis jawaban panjang tapi user pilih versi pendek)
  if (uaNorm.length > 3 && caNorm.length > 3) {
    if (caNorm.includes(uaNorm) || uaNorm.includes(caNorm)) return true;
  }

  return false;
}

// ─── Helper: acak posisi jawaban benar di opsi ─────────────────────────────
function shuffleOptions(questions) {
  return questions.map(q => {
    if (q.type !== 'multiple_choice' || !q.options || q.options.length < 2) return q;

    // Temukan teks jawaban benar
    const correctText = q.correct_answer || '';
    const correctIdx  = /^[a-d]$/i.test(correctText.trim())
      ? correctText.trim().toUpperCase().charCodeAt(0) - 65
      : q.options.findIndex(o => norm(o) === norm(correctText));

    const correctOpt = correctIdx >= 0 ? q.options[correctIdx] : null;
    if (!correctOpt) return q; // tidak bisa identifikasi, biarkan

    // Acak urutan opsi
    const shuffled = [...q.options].sort(() => Math.random() - 0.5);

    // Tentukan huruf baru untuk jawaban benar
    const newIdx    = shuffled.findIndex(o => norm(o) === norm(correctOpt));
    const newLetter = String.fromCharCode(65 + newIdx); // A, B, C, D

    // Update label huruf di teks opsi
    const relabeled = shuffled.map((opt, i) => {
      const letter = String.fromCharCode(65 + i);
      // Ganti prefix huruf lama dengan yang baru
      return opt.replace(/^[A-D]\.\s*/i, `${letter}. `);
    });

    return {
      ...q,
      options: relabeled,
      correct_answer: newLetter, // simpan sebagai huruf baru
    };
  });
}

// ─── POST /api/quiz/generate ───────────────────────────────────────────────
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { text, summary_id, quiz_type = 'mixed', num_questions = 5 } = req.body;

    let sourceText = text;
    if (summary_id && !text) {
      const { data: summary } = await supabaseAdmin
        .from('summaries')
        .select('raw_text, summary, title')
        .eq('id', summary_id)
        .eq('user_id', req.user.id)
        .single();
      if (!summary) return res.status(404).json({ error: 'Summary not found' });
      sourceText = summary.raw_text || summary.summary;
    }

    if (!sourceText || sourceText.trim().length < 10) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    const count       = Math.min(Math.max(parseInt(num_questions) || 5, 1), 15);
    const textToProcess = sourceText.slice(0, 6000);

    // ── Prompt per tipe ──────────────────────────────────────────────────
    let typeInstruction = '';
    let formatNote      = '';

    if (quiz_type === 'multiple_choice') {
      typeInstruction = `Buat tepat ${count} soal pilihan ganda. Setiap soal punya 4 pilihan (A, B, C, D).`;
      formatNote = `PENTING untuk pilihan ganda:
- Variasikan posisi jawaban benar — jangan selalu di A. Sebar secara acak di A, B, C, atau D.
- correct_answer diisi HURUF saja: "A" atau "B" atau "C" atau "D"
- Teks opsi diawali huruf: "A. teks", "B. teks", dst
- Contoh: {"id":1,"type":"multiple_choice","question":"Apa itu fotosintesis?","options":["A. Respirasi sel","B. Pembuatan makanan oleh tumbuhan","C. Pembelahan sel","D. Pencernaan makanan"],"correct_answer":"B","explanation":"Fotosintesis adalah proses pembuatan makanan oleh tumbuhan menggunakan cahaya matahari."}`;
    } else if (quiz_type === 'true_false') {
      typeInstruction = `Buat tepat ${count} soal benar/salah.`;
      formatNote = `PENTING untuk benar/salah:
- options harus ["Benar","Salah"]
- correct_answer diisi "Benar" atau "Salah" (persis sama dengan salah satu opsi)
- Contoh: {"id":1,"type":"true_false","question":"Matahari adalah bintang.","options":["Benar","Salah"],"correct_answer":"Benar","explanation":"Matahari adalah bintang tipe G."}`;
    } else if (quiz_type === 'essay') {
      typeInstruction = `Buat tepat ${count} soal essay singkat.`;
      formatNote = `PENTING untuk essay:
- options diisi array kosong []
- correct_answer diisi jawaban model/kunci
- Contoh: {"id":1,"type":"essay","question":"Jelaskan proses fotosintesis!","options":[],"correct_answer":"Fotosintesis adalah proses pembuatan makanan oleh tumbuhan menggunakan cahaya matahari, air, dan CO2.","explanation":"Poin penting: cahaya, klorofil, glukosa."}`;
    } else if (quiz_type === 'flashcard') {
      typeInstruction = `Buat tepat ${count} flashcard hafalan.`;
      formatNote = `PENTING untuk flashcard:
- options diisi array kosong []
- question singkat, correct_answer singkat dan jelas
- Contoh: {"id":1,"type":"flashcard","question":"Apa rumus kimia air?","options":[],"correct_answer":"H2O","explanation":""}`;
    } else {
      // mixed
      typeInstruction = `Buat tepat ${count} soal campuran: gabungan pilihan ganda, benar/salah, dan essay.`;
      formatNote = `PENTING:
- Untuk pilihan ganda: variasikan posisi jawaban benar (jangan selalu A), correct_answer diisi HURUF ("A"/"B"/"C"/"D")
- Untuk benar/salah: options ["Benar","Salah"], correct_answer "Benar" atau "Salah"
- Untuk essay: options [], correct_answer berisi jawaban kunci
- Contoh pilihan ganda: {"id":1,"type":"multiple_choice","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correct_answer":"C","explanation":"..."}`;
    }

    const prompt = `Kamu adalah pembuat soal ujian profesional. ${typeInstruction}

MATERI:
${textToProcess}

${formatNote}

Balas HANYA dengan JSON valid, tanpa teks lain:
{"title":"Judul Quiz berdasarkan materi","questions":[...array soal...]}

Buat ${count} soal berkualitas dari materi di atas.`;

    console.log(`[Quiz] Generating ${count} ${quiz_type} questions...`);

    const responseText = await callGroq([
      {
        role: 'system',
        content: 'Kamu adalah pembuat soal ujian profesional. Balas HANYA dengan JSON valid, tanpa markdown, tanpa teks tambahan.'
      },
      { role: 'user', content: prompt }
    ], 3500);

    console.log('[Quiz] Raw response (300 chars):', responseText.slice(0, 300));

    const quizData = parseAIJson(responseText);

    if (!quizData || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      console.error('[Quiz] Parse failed. Response:', responseText.slice(0, 500));
      return res.status(500).json({ error: 'AI tidak menghasilkan soal yang valid. Coba lagi.' });
    }

    // Acak posisi jawaban benar untuk pilihan ganda
    const processedQuestions = shuffleOptions(quizData.questions);

    console.log(`[Quiz] Generated ${processedQuestions.length} questions`);

    // Simpan ke Supabase
    let savedId = null;
    try {
      const { data: saved, error: saveError } = await supabaseAdmin
        .from('quizzes')
        .insert([{
          user_id:       req.user.id,
          summary_id:    summary_id || null,
          title:         quizData.title || 'Quiz',
          quiz_type,
          questions:     processedQuestions,
          num_questions: processedQuestions.length
        }])
        .select('id')
        .single();

      if (saveError) console.error('[Quiz] Save error (non-fatal):', saveError.message);
      else savedId = saved?.id;
    } catch (e) {
      console.error('[Quiz] Save exception (non-fatal):', e.message);
    }

    res.json({
      message: 'Quiz generated successfully',
      data: { ...quizData, questions: processedQuestions, id: savedId }
    });

  } catch (err) {
    console.error('[Quiz] Error:', err.message);
    res.status(500).json({ error: 'Failed to generate quiz', message: err.message });
  }
});

// ─── POST /api/quiz/:id/submit ─────────────────────────────────────────────
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { answers } = req.body;

    const { data: quiz, error } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !quiz) return res.status(404).json({ error: 'Quiz not found' });

    let correct = 0;
    const results = quiz.questions.map(q => {
      const userAnswer = answers[q.id] || '';
      const ok = isAnswerCorrect(userAnswer, q.correct_answer, q.options || [], q.type);
      if (ok) correct++;
      return {
        id:             q.id,
        question:       q.question,
        user_answer:    userAnswer,
        correct_answer: q.correct_answer,
        is_correct:     ok,
        explanation:    q.explanation
      };
    });

    const score = Math.round((correct / quiz.questions.length) * 100);

    supabaseAdmin.from('quiz_attempts').insert([{
      user_id: req.user.id,
      quiz_id: quiz.id,
      score, answers, results
    }]).then(() => {}).catch(e => console.error('Attempt save error:', e.message));

    res.json({ score, correct, total: quiz.questions.length, results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit quiz', message: err.message });
  }
});

// ─── GET /api/quiz/history ─────────────────────────────────────────────────
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .select('id, title, quiz_type, num_questions, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quiz history', message: err.message });
  }
});

// ─── GET /api/quiz/:id ─────────────────────────────────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quiz', message: err.message });
  }
});

export default router;
