import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { callGroq, parseAIJson } from '../config/groqHelper.js';

const router = express.Router();

// Generate study plan
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const {
      exam_date,
      start_date,
      subjects,
      daily_hours,
      notes
    } = req.body;

    if (!exam_date || !subjects || subjects.length === 0 || !daily_hours) {
      return res.status(400).json({ error: 'exam_date, subjects, and daily_hours are required' });
    }

    const today     = new Date();
    const startDay  = start_date ? new Date(start_date) : today;
    const examDay   = new Date(exam_date);
    const daysLeft  = Math.ceil((examDay - startDay) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      return res.status(400).json({ error: 'Tanggal ujian harus setelah tanggal mulai belajar' });
    }

    // Tanggal mulai untuk jadwal harian
    const startDate = startDay.toISOString().split('T')[0];

    const subjectList = subjects.map((s, i) =>
      `${i + 1}. ${s.name} - Tingkat kesulitan: ${s.difficulty || 'sedang'} - Estimasi jam belajar: ${s.hours || 'tidak ditentukan'}`
    ).join('\n');

    const prompt = `Kamu adalah konsultan akademik yang ahli dalam membuat jadwal belajar efektif.

DATA MAHASISWA:
- Tanggal mulai belajar: ${startDate}
- Tanggal ujian: ${exam_date}
- Hari tersisa: ${daysLeft} hari
- Waktu belajar per hari: ${daily_hours} jam
- Mata kuliah/materi yang perlu dipelajari:
${subjectList}
${notes ? `- Catatan tambahan: ${notes}` : ''}

Buat jadwal belajar yang optimal dan realistis. Berikan output HANYA dalam format JSON valid:
{
  "title": "Jadwal Belajar Ujian",
  "exam_date": "${exam_date}",
  "days_left": ${daysLeft},
  "total_study_hours": ${daysLeft * daily_hours},
  "daily_schedule": [
    {
      "day": 1,
      "date": "${startDate}",
      "sessions": [
        {
          "subject": "nama mata kuliah",
          "duration_hours": 1.5,
          "topics": ["topik yang dipelajari"],
          "priority": "high/medium/low",
          "tips": "tips belajar untuk sesi ini"
        }
      ],
      "total_hours": 3,
      "daily_goal": "target yang harus dicapai hari ini"
    }
  ],
  "subject_priorities": [
    {
      "subject": "nama mata kuliah",
      "priority": "high",
      "reason": "alasan prioritas",
      "total_hours_allocated": 10
    }
  ],
  "study_tips": ["tips belajar umum 1", "tips belajar umum 2"],
  "weekly_summary": "ringkasan strategi belajar keseluruhan"
}

Buat jadwal untuk ${Math.min(daysLeft, 14)} hari ke depan saja (maksimal 14 hari).`;

    const responseText = await callGroq([
      {
        role: 'system',
        content: 'Kamu adalah konsultan akademik. Selalu balas HANYA dengan JSON valid, tanpa teks tambahan apapun.'
      },
      { role: 'user', content: prompt }
    ], 4000);

    const planData = parseAIJson(responseText);
    if (!planData || !planData.daily_schedule) {
      console.error('[Planner] Failed to parse plan. Raw:', responseText.slice(0, 300));
      return res.status(500).json({ error: 'AI tidak mengembalikan format jadwal yang valid. Coba lagi.' });
    }

    // Save to Supabase
    const { data: saved, error } = await supabaseAdmin
      .from('study_plans')
      .insert([{
        user_id: req.user.id,
        title: planData.title || 'Study Plan',
        exam_date,
        days_left: daysLeft,
        daily_hours,
        subjects,
        plan_data: { ...planData, start_date: startDate }
      }])
      .select()
      .single();

    if (error) console.error('Planner save error:', error);

    res.json({
      message: 'Study plan generated successfully',
      data: { ...planData, start_date: startDate, id: saved?.id }
    });
  } catch (err) {
    console.error('Planner error:', err);
    res.status(500).json({ error: 'Failed to generate study plan', message: err.message });
  }
});

// Get planner history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('study_plans')
      .select('id, title, exam_date, days_left, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch planner history', message: err.message });
  }
});

// Get single plan
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('study_plans')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Study plan not found' });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch study plan', message: err.message });
  }
});

// Update task completion
router.patch('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { completed_sessions } = req.body;

    const { data, error } = await supabaseAdmin
      .from('study_plans')
      .update({ completed_sessions })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Progress updated', data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update progress', message: err.message });
  }
});

export default router;
