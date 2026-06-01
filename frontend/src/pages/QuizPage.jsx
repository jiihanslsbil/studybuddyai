import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  Brain, Loader2, CheckCircle, XCircle, RotateCcw,
  ChevronRight, ChevronLeft, FileText, ArrowLeft, Sparkles, Trophy
} from 'lucide-react';

const QUIZ_TYPES = [
  { value: 'mixed',           label: 'Campuran'      },
  { value: 'multiple_choice', label: 'Pilihan Ganda' },
  { value: 'true_false',      label: 'Benar / Salah' },
  { value: 'essay',           label: 'Essay'         },
  { value: 'flashcard',       label: 'Flashcard'     },
];

export default function QuizPage() {
  const location      = useLocation();
  const navigate      = useNavigate();
  const preloaded     = location.state?.preloadedQuiz;
  const preloadedType = location.state?.quizType;

  const [step, setStep]         = useState(preloaded ? (preloadedType === 'flashcard' ? 'flashcard' : 'quiz') : 'setup');
  const [form, setForm]         = useState({ text: '', quiz_type: 'mixed', num_questions: 5 });
  const [loading, setLoading]   = useState(false);
  const [quiz, setQuiz]         = useState(preloaded || null);
  const [answers, setAnswers]   = useState({});
  const [result, setResult]     = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [flipped, setFlipped]   = useState(false);

  useEffect(() => { if (preloaded) { setQuiz(preloaded); setAnswers({}); setCurrentQ(0); } }, []);

  const generateQuiz = async () => {
    if (!form.text.trim()) { toast.error('Masukkan materi terlebih dahulu'); return; }
    setLoading(true);
    try {
      const res = await api.post('/quiz/generate', form);
      setQuiz(res.data.data); setAnswers({}); setCurrentQ(0);
      setStep(form.quiz_type === 'flashcard' ? 'flashcard' : 'quiz');
      toast.success('Quiz siap! 🎯');
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal membuat quiz'); }
    finally { setLoading(false); }
  };

  const submitQuiz = () => {
    let correct = 0;

    // Normalisasi untuk perbandingan robust
    const norm = (str) => {
      if (!str) return '';
      return str.toLowerCase().trim()
        .replace(/^[a-d]\.\s*/i, '')
        .replace(/\s+/g, ' ').trim();
    };

    const checkAnswer = (ua, ca, options = [], type = '') => {
      if (!ua) return false;
      const uaN = norm(ua);
      const caN = norm(ca);

      // 1. Exact match
      if (uaN === caN) return true;

      // 2. correct_answer adalah huruf (A/B/C/D), user pilih teks opsi
      if (/^[a-d]$/i.test(ca.trim()) && options.length) {
        const idx = ca.trim().toUpperCase().charCodeAt(0) - 65;
        if (options[idx] && norm(options[idx]) === uaN) return true;
      }

      // 3. user jawab huruf, correct_answer adalah teks
      if (/^[a-d]$/i.test(ua.trim()) && options.length) {
        const idx = ua.trim().toUpperCase().charCodeAt(0) - 65;
        if (options[idx] && norm(options[idx]) === caN) return true;
      }

      // 4. Benar/Salah
      if (type === 'true_false') {
        const trueV  = ['benar', 'true', 'ya', 'betul'];
        const falseV = ['salah', 'false', 'tidak', 'bukan'];
        const uaT = trueV.some(v => uaN.includes(v));
        const uaF = falseV.some(v => uaN.includes(v));
        const caT = trueV.some(v => caN.includes(v));
        const caF = falseV.some(v => caN.includes(v));
        if (uaT && caT) return true;
        if (uaF && caF) return true;
      }

      // 5. Partial match (jawaban panjang)
      if (uaN.length > 3 && caN.length > 3) {
        if (caN.includes(uaN) || uaN.includes(caN)) return true;
      }

      return false;
    };

    const results = quiz.questions.map(q => {
      const ua = answers[q.id] || '';
      const ok = checkAnswer(ua, q.correct_answer || '', q.options || [], q.type);
      if (ok) correct++;
      return { ...q, user_answer: ua, is_correct: ok };
    });

    setResult({
      score: Math.round((correct / quiz.questions.length) * 100),
      correct,
      total: quiz.questions.length,
      results
    });
    setStep('result');
    if (quiz?.id) api.post(`/quiz/${quiz.id}/submit`, { answers }).catch(() => {});
  };

  const reset = () => {
    setStep('setup'); setQuiz(null); setAnswers({}); setResult(null); setCurrentQ(0); setFlipped(false);
    navigate('/quiz', { replace: true, state: {} });
  };

  // ---- SETUP ----
  if (step === 'setup') return (
    <div className="space-y-4 fade-in">
      <div className="card">
        <div className="flex items-center gap-2 mb-1">
          <Brain size={17} className="text-fuchsia-400" />
          <h2 className="text-lg font-bold text-white">Quiz & Flashcard Generator</h2>
        </div>
        <p className="text-sm text-pink-200/40 mb-5">AI membuat soal latihan otomatis dari materi yang kamu berikan.</p>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-pink-500/8 border border-pink-500/15 mb-5">
          <FileText size={15} className="text-pink-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-pink-200/80">Punya materi yang belum dirangkum?</p>
            <p className="text-xs text-pink-300/40">Rangkum dulu, lalu buat quiz langsung dari hasilnya.</p>
          </div>
          <button onClick={() => navigate('/summarizer')}
            className="flex items-center gap-1 text-xs font-semibold text-pink-400 hover:text-pink-300 whitespace-nowrap transition-colors">
            Ke Summarizer <ChevronRight size={12} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Materi / Teks</label>
            <textarea className="input-field resize-none" rows={8}
              placeholder="Paste materi kuliah atau ringkasan di sini..."
              value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Jenis Soal</label>
              <select className="input-field" value={form.quiz_type} onChange={e => setForm({ ...form, quiz_type: e.target.value })}>
                {QUIZ_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Jumlah Soal</label>
              <select className="input-field" value={form.num_questions} onChange={e => setForm({ ...form, num_questions: parseInt(e.target.value) })}>
                {[3, 5, 7, 10, 15].map(n => <option key={n} value={n}>{n} soal</option>)}
              </select>
            </div>
          </div>
          <button onClick={generateQuiz} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> AI sedang membuat soal...</> : <><Brain size={16} /> Generate Quiz</>}
          </button>
        </div>
      </div>
    </div>
  );

  // ---- FLASHCARD ----
  if (step === 'flashcard') {
    const card = quiz.questions[currentQ];
    return (
      <div className="space-y-5 fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">{quiz.title}</h2>
            {preloaded && <span className="badge bg-pink-500/15 text-pink-300 border border-pink-500/20 text-xs mt-1">Dari Summarizer</span>}
          </div>
          <span className="text-sm text-pink-300/40">{currentQ + 1} / {quiz.questions.length}</span>
        </div>

        <div className="w-full bg-pink-500/10 rounded-full h-1.5">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }} />
        </div>

        {/* 3D Flip Card */}
        <div className="flashcard-scene cursor-pointer select-none" onClick={() => setFlipped(!flipped)}>
          <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
            {/* Front — Pertanyaan */}
            <div className="flashcard-front bg-white/[0.04] border border-pink-500/15 hover:border-pink-500/30 transition-colors">
              <div className="text-center w-full">
                <span className="badge bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/20 mb-4 inline-flex">
                  Pertanyaan
                </span>
                <p className="text-xl font-semibold text-white mt-2 leading-relaxed">{card.question}</p>
                <p className="text-xs text-pink-300/30 mt-5 flex items-center justify-center gap-1.5">
                  <span className="inline-block w-4 h-4 rounded-full border border-pink-300/20 flex items-center justify-center text-[10px]">↻</span>
                  Klik untuk balik kartu
                </p>
              </div>
            </div>
            {/* Back — Jawaban */}
            <div className="flashcard-back bg-gradient-to-br from-pink-500/10 to-rose-500/5 border border-pink-500/25">
              <div className="text-center w-full">
                <span className="badge bg-pink-500/20 text-pink-300 border border-pink-500/30 mb-4 inline-flex">
                  Jawaban
                </span>
                <p className="text-xl font-semibold text-white mt-2 leading-relaxed">{card.correct_answer}</p>
                {card.explanation && (
                  <p className="text-sm text-pink-200/50 mt-3 leading-relaxed">{card.explanation}</p>
                )}
                <p className="text-xs text-pink-300/30 mt-5 flex items-center justify-center gap-1.5">
                  <span className="inline-block w-4 h-4 rounded-full border border-pink-300/20 flex items-center justify-center text-[10px]">↻</span>
                  Klik untuk balik kembali
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setCurrentQ(Math.max(0, currentQ - 1)); setFlipped(false); }}
            disabled={currentQ === 0} className="btn-secondary flex items-center gap-2 flex-1">
            <ChevronLeft size={14} /> Sebelumnya
          </button>
          {currentQ < quiz.questions.length - 1
            ? <button onClick={() => { setCurrentQ(currentQ + 1); setFlipped(false); }} className="btn-primary flex items-center gap-2 flex-1">
                Berikutnya <ChevronRight size={14} />
              </button>
            : <button onClick={reset} className="btn-primary flex items-center gap-2 flex-1">
                <RotateCcw size={14} /> Selesai
              </button>
          }
        </div>
      </div>
    );
  }

  // ---- QUIZ ----
  if (step === 'quiz') {
    const q = quiz.questions[currentQ];
    return (
      <div className="space-y-5 fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">{quiz.title}</h2>
            {preloaded && <span className="badge bg-pink-500/15 text-pink-300 border border-pink-500/20 text-xs mt-1">Dari Summarizer</span>}
          </div>
          <span className="text-sm text-pink-300/40">{currentQ + 1} / {quiz.questions.length}</span>
        </div>

        <div className="w-full bg-pink-500/10 rounded-full h-1.5">
          <div className="bg-gradient-to-r from-pink-500 to-fuchsia-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }} />
        </div>

        <div className="card">
          <span className="badge bg-pink-500/10 text-pink-300/60 border border-pink-500/15 mb-3 text-xs">
            {q.type === 'multiple_choice' ? 'Pilihan Ganda' : q.type === 'true_false' ? 'Benar / Salah' : 'Essay'}
          </span>
          <p className="font-semibold text-white text-base mb-4 leading-relaxed">{q.question}</p>

          {q.type === 'essay' ? (
            <textarea className="input-field resize-none" rows={4} placeholder="Tulis jawaban kamu..."
              value={answers[q.id] || ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} />
          ) : (
            <div className="space-y-2">
              {q.options?.map((opt, i) => {
                const selected = answers[q.id] === opt;
                return (
                  <button key={i} onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      selected
                        ? 'border-pink-500/50 bg-pink-500/15 text-white font-medium'
                        : 'border-pink-500/10 text-pink-100/60 hover:border-pink-500/25 hover:bg-pink-500/5'
                    }`}>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}
            className="btn-secondary px-4"><ChevronLeft size={14} /></button>
          {currentQ < quiz.questions.length - 1
            ? <button onClick={() => setCurrentQ(currentQ + 1)} className="btn-primary flex items-center gap-2 flex-1">
                Berikutnya <ChevronRight size={14} />
              </button>
            : <button onClick={submitQuiz} className="btn-primary flex items-center gap-2 flex-1">
                <CheckCircle size={14} /> Selesai & Lihat Nilai
              </button>
          }
        </div>
      </div>
    );
  }

  // ---- RESULT ----
  if (step === 'result') {
    const isGood = result.score >= 70;
    const isMid  = result.score >= 50;
    const scoreStyle = isGood ? 'text-pink-300' : isMid ? 'text-amber-300' : 'text-rose-400';
    const scoreBg    = isGood ? 'bg-pink-500/10 border-pink-500/20' : isMid ? 'bg-amber-500/10 border-amber-500/20' : 'bg-rose-500/10 border-rose-500/20';
    const msg        = isGood ? 'Luar biasa! 🎉' : isMid ? 'Lumayan bagus! 💪' : 'Ayo belajar lagi! 📚';

    return (
      <div className="space-y-4 fade-in">
        <div className={`card border text-center ${scoreBg}`}>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/20 flex items-center justify-center mx-auto mb-3">
            <Trophy size={28} className={scoreStyle} />
          </div>
          <p className={`text-5xl font-bold ${scoreStyle} mb-1`}>{result.score}%</p>
          <p className="font-semibold text-white text-lg">{msg}</p>
          <p className="text-pink-300/40 text-sm mt-1">{result.correct} dari {result.total} soal benar</p>
        </div>

        <div className="space-y-2">
          {result.results?.map((r, i) => (
            <div key={i} className={`card border ${r.is_correct ? 'border-pink-500/20 bg-pink-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
              <div className="flex items-start gap-3">
                {r.is_correct
                  ? <CheckCircle size={15} className="text-pink-400 flex-shrink-0 mt-0.5" />
                  : <XCircle    size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{r.question}</p>
                  <p className="text-xs text-pink-300/40 mt-1">Jawabanmu: <span className="text-pink-200/60">{r.user_answer || '(tidak dijawab)'}</span></p>
                  {!r.is_correct && <p className="text-xs text-pink-400 mt-0.5">Jawaban benar: <span className="font-medium">{r.correct_answer}</span></p>}
                  {r.explanation && <p className="text-xs text-pink-300/30 mt-1 italic">{r.explanation}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={reset} className="btn-primary w-full flex items-center justify-center gap-2">
          <RotateCcw size={14} /> Buat Quiz Baru
        </button>
        {preloaded && (
          <button onClick={() => navigate('/summarizer')} className="btn-secondary w-full flex items-center justify-center gap-2">
            <ArrowLeft size={14} /> Kembali ke Summarizer
          </button>
        )}
      </div>
    );
  }
}
