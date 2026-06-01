import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  Upload, FileText, Type, Loader2, ChevronDown, ChevronUp,
  Tag, Lightbulb, List, BookOpen, RotateCcw, Brain, Zap, ChevronRight, X
} from 'lucide-react';

const QUIZ_TYPES = [
  { value: 'mixed',           label: 'Campuran'      },
  { value: 'multiple_choice', label: 'Pilihan Ganda' },
  { value: 'true_false',      label: 'Benar / Salah' },
  { value: 'essay',           label: 'Essay'         },
  { value: 'flashcard',       label: 'Flashcard'     },
];

export default function SummarizerPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('file');
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expandedConcept, setExpandedConcept] = useState(null);
  const fileRef = useRef();

  const [showQuizPanel, setShowQuizPanel] = useState(false);
  const [quizType, setQuizType] = useState('mixed');
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizLoading, setQuizLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true); setResult(null); setShowQuizPanel(false);
    try {
      let res;
      if (mode === 'file') {
        if (!file) { toast.error('Pilih file terlebih dahulu'); setLoading(false); return; }
        const fd = new FormData(); fd.append('file', file);
        res = await api.post('/summarizer/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        if (!text.trim()) { toast.error('Masukkan teks materi'); setLoading(false); return; }
        res = await api.post('/summarizer/text', { text, title });
      }
      setResult(res.data.data);
      toast.success('Rangkuman berhasil dibuat! ✨');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal membuat rangkuman');
    } finally { setLoading(false); }
  };

  const handleQuickQuiz = async () => {
    setQuizLoading(true);
    try {
      const src = [result.summary, result.key_points?.join('\n')].filter(Boolean).join('\n\n');
      const res = await api.post('/quiz/generate', { text: src, summary_id: result.id, quiz_type: quizType, num_questions: numQuestions });
      toast.success('Quiz siap! 🎯');
      navigate('/quiz', { state: { preloadedQuiz: res.data.data, quizType } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal membuat quiz');
    } finally { setQuizLoading(false); }
  };

  const reset = () => { setResult(null); setFile(null); setText(''); setTitle(''); setShowQuizPanel(false); };

  if (!result) return (
    <div className="space-y-4 fade-in">
      <div className="card">
        <h2 className="text-lg font-bold text-white mb-1">Upload Materi Kuliah</h2>
        <p className="text-sm text-pink-200/40 mb-5">AI akan merangkum, mengambil poin penting, dan menjelaskan konsep sulit.</p>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-pink-500/5 border border-pink-500/10 rounded-xl mb-5 w-fit">
          {[{ key: 'file', icon: Upload, label: 'Upload File' }, { key: 'text', icon: Type, label: 'Input Teks' }].map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setMode(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === key
                  ? 'bg-gradient-to-r from-pink-500/30 to-rose-500/20 text-pink-200 border border-pink-500/30'
                  : 'text-pink-300/40 hover:text-pink-200/70 border border-transparent'
              }`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {mode === 'file' ? (
          <div onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              file
                ? 'border-pink-500/40 bg-pink-500/5'
                : 'border-pink-500/15 hover:border-pink-500/30 hover:bg-pink-500/3'
            }`}>
            <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden"
              onChange={e => { const f = e.target.files[0]; if (f) setFile(f); }} />
            {file ? (
              <div>
                <div className="w-12 h-12 rounded-xl bg-pink-500/15 flex items-center justify-center mx-auto mb-3">
                  <FileText size={22} className="text-pink-400" />
                </div>
                <p className="font-semibold text-white">{file.name}</p>
                <p className="text-sm text-pink-300/30 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                <button onClick={e => { e.stopPropagation(); setFile(null); }}
                  className="mt-2 text-xs text-pink-300/30 hover:text-rose-400 flex items-center gap-1 mx-auto transition-colors">
                  <X size={11} /> Hapus
                </button>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-xl bg-pink-500/8 flex items-center justify-center mx-auto mb-3">
                  <Upload size={22} className="text-pink-300/30" />
                </div>
                <p className="font-medium text-pink-200/60">Drag & drop atau klik untuk upload</p>
                <p className="text-sm text-pink-300/30 mt-1">PDF dan TXT — maks. 20MB</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <input type="text" className="input-field" placeholder="Judul materi (opsional)"
              value={title} onChange={e => setTitle(e.target.value)} />
            <textarea className="input-field resize-none" rows={9}
              placeholder="Paste atau ketik materi kuliah di sini..."
              value={text} onChange={e => setText(e.target.value)} />
            <p className="text-xs text-pink-300/20">{text.length.toLocaleString()} karakter</p>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          className="btn-primary w-full mt-5 flex items-center justify-center gap-2">
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> AI sedang menganalisis materi...</>
            : <><BookOpen size={16} /> Buat Rangkuman</>
          }
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">{result.title}</h2>
          <span className="badge bg-pink-500/15 text-pink-300 border border-pink-500/20 mt-1">{result.topic}</span>
        </div>
        <button onClick={reset} className="btn-secondary text-sm flex items-center gap-1.5 flex-shrink-0">
          <RotateCcw size={13} /> Baru
        </button>
      </div>

      {/* Quick Quiz Banner */}
      <div className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
        showQuizPanel ? 'border-pink-500/30 bg-pink-500/5' : 'border-pink-500/15 hover:border-pink-500/25'
      }`}>
        <button onClick={() => setShowQuizPanel(!showQuizPanel)}
          className="w-full flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-900/30">
              <Zap size={15} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white text-sm">Buat Quiz dari Materi Ini</p>
              <p className="text-xs text-pink-300/40">Generate soal latihan langsung dari rangkuman</p>
            </div>
          </div>
          <ChevronDown size={15} className={`text-pink-300/40 transition-transform duration-200 ${showQuizPanel ? 'rotate-180' : ''}`} />
        </button>

        {showQuizPanel && (
          <div className="px-5 pb-5 border-t border-pink-500/10">
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="label">Jenis Soal</label>
                <select className="input-field text-sm" value={quizType} onChange={e => setQuizType(e.target.value)}>
                  {QUIZ_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Jumlah Soal</label>
                <select className="input-field text-sm" value={numQuestions} onChange={e => setNumQuestions(parseInt(e.target.value))}>
                  {[3, 5, 7, 10, 15].map(n => <option key={n} value={n}>{n} soal</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleQuickQuiz} disabled={quizLoading}
              className="btn-primary w-full mt-3 flex items-center justify-center gap-2">
              {quizLoading
                ? <><Loader2 size={15} className="animate-spin" /> Membuat soal...</>
                : <><Brain size={15} /> Generate & Mulai Quiz <ChevronRight size={13} /></>
              }
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={15} className="text-pink-400" />
          <h3 className="font-semibold text-white">Ringkasan Materi</h3>
        </div>
        <p className="text-pink-100/70 leading-relaxed text-sm whitespace-pre-line">{result.summary}</p>
      </div>

      {/* Key points */}
      {result.key_points?.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <List size={15} className="text-fuchsia-400" />
            <h3 className="font-semibold text-white">Poin Penting</h3>
          </div>
          <ul className="space-y-2">
            {result.key_points.map((point, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-pink-100/70">
                <span className="w-5 h-5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Keywords */}
      {result.keywords?.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={15} className="text-rose-400" />
            <h3 className="font-semibold text-white">Keyword Utama</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.keywords.map((kw, i) => (
              <span key={i} className="badge bg-rose-500/15 text-rose-300 border border-rose-500/20">{kw}</span>
            ))}
          </div>
        </div>
      )}

      {/* Difficult concepts */}
      {result.difficult_concepts?.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={15} className="text-amber-400" />
            <h3 className="font-semibold text-white">Konsep Sulit</h3>
          </div>
          <div className="space-y-2">
            {result.difficult_concepts.map((item, i) => (
              <div key={i} className="rounded-xl border border-pink-500/10 overflow-hidden">
                <button onClick={() => setExpandedConcept(expandedConcept === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-pink-500/5 transition-colors">
                  <span className="font-medium text-white text-sm">{item.concept}</span>
                  {expandedConcept === i
                    ? <ChevronUp size={14} className="text-pink-300/30" />
                    : <ChevronDown size={14} className="text-pink-300/30" />}
                </button>
                {expandedConcept === i && (
                  <div className="px-4 pb-3 text-sm text-pink-100/60 bg-amber-500/5 border-t border-pink-500/10">
                    {item.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={reset} className="btn-secondary w-full">
        Rangkum Materi Lain
      </button>
    </div>
  );
}
