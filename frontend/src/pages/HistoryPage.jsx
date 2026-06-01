import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  FileText, Brain, Calendar, Clock, ChevronRight, X,
  BookOpen, Tag, List, Lightbulb, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Target, Loader2
} from 'lucide-react';

const tabs = [
  { key: 'summaries', label: 'Rangkuman', icon: FileText },
  { key: 'quizzes',   label: 'Quiz',      icon: Brain    },
  { key: 'plans',     label: 'Jadwal',    icon: Calendar },
];

const PRIORITY_STYLE = {
  high:   'bg-rose-500/15 text-rose-300 border-rose-500/20',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  low:    'bg-pink-500/15 text-pink-300 border-pink-500/20',
};
const PRIORITY_LABEL = { high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };

// ---- Modal Detail Summary ----
function SummaryDetail({ item, onClose }) {
  const [expandedConcept, setExpandedConcept] = useState(null);
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">{item.title}</h3>
          {item.topic && <span className="badge bg-pink-500/15 text-pink-300 border border-pink-500/20 mt-1">{item.topic}</span>}
        </div>
        <button onClick={onClose} className="text-pink-300/40 hover:text-white p-1 transition-colors flex-shrink-0">
          <X size={18} />
        </button>
      </div>

      {item.summary && (
        <div className="bg-white/[0.03] rounded-xl border border-pink-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-pink-400" />
            <p className="text-sm font-semibold text-white">Ringkasan</p>
          </div>
          <p className="text-sm text-pink-100/70 leading-relaxed whitespace-pre-line">{item.summary}</p>
        </div>
      )}

      {item.key_points?.length > 0 && (
        <div className="bg-white/[0.03] rounded-xl border border-pink-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <List size={14} className="text-fuchsia-400" />
            <p className="text-sm font-semibold text-white">Poin Penting</p>
          </div>
          <ul className="space-y-1.5">
            {item.key_points.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-pink-100/70">
                <span className="w-4 h-4 rounded-full bg-fuchsia-500/20 text-fuchsia-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.keywords?.length > 0 && (
        <div className="bg-white/[0.03] rounded-xl border border-pink-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag size={14} className="text-rose-400" />
            <p className="text-sm font-semibold text-white">Keywords</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {item.keywords.map((kw, i) => (
              <span key={i} className="badge bg-rose-500/15 text-rose-300 border border-rose-500/20">{kw}</span>
            ))}
          </div>
        </div>
      )}

      {item.difficult_concepts?.length > 0 && (
        <div className="bg-white/[0.03] rounded-xl border border-pink-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={14} className="text-amber-400" />
            <p className="text-sm font-semibold text-white">Konsep Sulit</p>
          </div>
          <div className="space-y-1.5">
            {item.difficult_concepts.map((c, i) => (
              <div key={i} className="rounded-lg border border-pink-500/10 overflow-hidden">
                <button onClick={() => setExpandedConcept(expandedConcept === i ? null : i)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-pink-500/5 transition-colors">
                  <span className="text-sm font-medium text-white">{c.concept}</span>
                  {expandedConcept === i ? <ChevronUp size={13} className="text-pink-300/30" /> : <ChevronDown size={13} className="text-pink-300/30" />}
                </button>
                {expandedConcept === i && (
                  <div className="px-3 pb-2 text-xs text-pink-100/60 bg-amber-500/5 border-t border-pink-500/10">{c.explanation}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Helper: cek apakah opsi adalah jawaban benar ----
function isCorrectOption(opt, correctAnswer) {
  if (!opt || !correctAnswer) return false;
  const norm = (s) => s.toLowerCase().trim().replace(/^[a-d]\.\s*/i, '').replace(/\s+/g, ' ').trim();

  // 1. Exact match setelah normalisasi
  if (norm(opt) === norm(correctAnswer)) return true;

  // 2. correct_answer adalah huruf (A/B/C/D), cek apakah opt diawali huruf itu
  if (/^[a-d]$/i.test(correctAnswer.trim())) {
    const letter = correctAnswer.trim().toUpperCase();
    if (opt.trim().toUpperCase().startsWith(letter + '.')) return true;
  }

  // 3. opt adalah huruf saja, correct_answer adalah teks
  if (/^[a-d]$/i.test(opt.trim())) {
    const idx = opt.trim().toUpperCase().charCodeAt(0) - 65;
    // tidak bisa cek tanpa options array, skip
  }

  return false;
}

// ---- Modal Detail Quiz ----
function QuizDetail({ item, onClose, navigate }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">{item.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/20">{item.quiz_type}</span>
            <span className="text-xs text-pink-300/40">{item.num_questions} soal</span>
          </div>
        </div>
        <button onClick={onClose} className="text-pink-300/40 hover:text-white p-1 transition-colors flex-shrink-0">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-2">
        {item.questions?.map((q, i) => (
          <div key={i} className="bg-white/[0.03] rounded-xl border border-pink-500/10 p-4">
            <div className="flex items-start gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
              <p className="text-sm font-medium text-white">{q.question}</p>
            </div>
            {q.options?.length > 0 && (
              <div className="ml-7 space-y-1 mb-2">
                {q.options.map((opt, j) => (
                  <p key={j} className={`text-xs px-2 py-1 rounded-lg ${
                    isCorrectOption(opt, q.correct_answer)
                      ? 'bg-pink-500/15 text-pink-300 border border-pink-500/20'
                      : 'text-pink-300/40'
                  }`}>{opt}</p>
                ))}
              </div>
            )}
            <div className="ml-7">
              <p className="text-xs text-pink-400">✓ {q.correct_answer}</p>
              {q.explanation && <p className="text-xs text-pink-300/30 mt-0.5 italic">{q.explanation}</p>}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => { onClose(); navigate('/quiz', { state: { preloadedQuiz: item, quizType: item.quiz_type } }); }}
        className="btn-primary w-full flex items-center justify-center gap-2">
        <Brain size={14} /> Kerjakan Quiz Ini
      </button>
    </div>
  );
}

// ---- Modal Detail Plan ----
function PlanDetail({ item, onClose }) {
  const [expandedDay, setExpandedDay] = useState(0);
  const plan = item.plan_data || item;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">{item.title}</h3>
          <p className="text-sm text-pink-300/40 mt-0.5">
            {(item.plan_data?.start_date || plan.start_date) && (
              <>
                Mulai: {new Date((item.plan_data?.start_date || plan.start_date) + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                <span className="mx-1.5 text-pink-500/30">→</span>
              </>
            )}
            Ujian: {new Date((item.exam_date || plan.exam_date) + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            <span className="mx-1.5 text-pink-500/30">·</span>
            <span className="text-pink-400">{item.days_left || plan.days_left} hari jadwal</span>
          </p>
        </div>
        <button onClick={onClose} className="text-pink-300/40 hover:text-white p-1 transition-colors flex-shrink-0">
          <X size={18} />
        </button>
      </div>

      {plan.subject_priorities?.length > 0 && (
        <div className="bg-white/[0.03] rounded-xl border border-pink-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} className="text-rose-400" />
            <p className="text-sm font-semibold text-white">Prioritas Materi</p>
          </div>
          <div className="space-y-1.5">
            {plan.subject_priorities.map((s, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-pink-500/5 rounded-lg">
                <span className={`badge border text-xs ${PRIORITY_STYLE[s.priority] || 'bg-pink-500/10 text-pink-300 border-pink-500/15'}`}>
                  {PRIORITY_LABEL[s.priority] || s.priority}
                </span>
                <span className="text-sm text-white flex-1 truncate">{s.subject}</span>
                <span className="text-xs text-pink-300/30">{s.total_hours_allocated}j</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.daily_schedule?.length > 0 && (
        <div className="bg-white/[0.03] rounded-xl border border-pink-500/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-fuchsia-400" />
            <p className="text-sm font-semibold text-white">Jadwal Harian</p>
          </div>
          <div className="space-y-1.5">
            {plan.daily_schedule.map((day, i) => (
              <div key={i} className="rounded-lg border border-pink-500/10 overflow-hidden">
                <button onClick={() => setExpandedDay(expandedDay === i ? null : i)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-pink-500/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-pink-500/15 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-pink-300 font-bold text-[10px]">H{day.day}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{day.date}</p>
                      <p className="text-xs text-pink-300/30 truncate max-w-[180px]">{day.daily_goal}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-pink-300/30">{day.total_hours}j</span>
                    {expandedDay === i ? <ChevronUp size={13} className="text-pink-300/30" /> : <ChevronDown size={13} className="text-pink-300/30" />}
                  </div>
                </button>
                {expandedDay === i && (
                  <div className="px-3 pb-3 space-y-1.5 border-t border-pink-500/10 pt-2">
                    {day.sessions?.map((s, j) => (
                      <div key={j} className="bg-pink-500/5 rounded-lg p-2.5 border border-pink-500/8">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{s.subject}</span>
                          <span className="text-xs text-pink-300/30">{s.duration_hours}j</span>
                        </div>
                        {s.topics?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {s.topics.map((t, k) => <span key={k} className="badge bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 text-xs">{t}</span>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.study_tips?.length > 0 && (
        <div className="bg-white/[0.03] rounded-xl border border-pink-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={14} className="text-amber-400" />
            <p className="text-sm font-semibold text-white">Tips Belajar</p>
          </div>
          <ul className="space-y-1.5">
            {plan.study_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-pink-100/60">
                <span className="text-pink-400 flex-shrink-0">✦</span>{tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---- Main HistoryPage ----
export default function HistoryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('summaries');
  const [data, setData]           = useState({ summaries: [], quizzes: [], plans: [] });
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);   // item yang dibuka
  const [detail, setDetail]       = useState(null);   // data detail lengkap
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/summarizer/history').catch(() => ({ data: { data: [] } })),
      api.get('/quiz/history').catch(() => ({ data: { data: [] } })),
      api.get('/planner/history').catch(() => ({ data: { data: [] } })),
    ]).then(([s, q, p]) => setData({
      summaries: s.data.data || [],
      quizzes:   q.data.data || [],
      plans:     p.data.data || [],
    })).finally(() => setLoading(false));
  }, []);

  const openDetail = async (item) => {
    setSelected(item);
    setDetail(null);
    setDetailLoading(true);
    try {
      let res;
      if (activeTab === 'summaries') res = await api.get(`/summarizer/${item.id}`);
      else if (activeTab === 'quizzes') res = await api.get(`/quiz/${item.id}`);
      else res = await api.get(`/planner/${item.id}`);
      setDetail(res.data.data);
    } catch {
      setDetail(item); // fallback ke data list
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => { setSelected(null); setDetail(null); };

  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const items = data[activeTab];

  return (
    <div className="space-y-5 fade-in">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-pink-500/5 border border-pink-500/10 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setActiveTab(key); closeDetail(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-gradient-to-r from-pink-500/25 to-rose-500/15 text-pink-200 border border-pink-500/25'
                : 'text-pink-300/40 hover:text-pink-200/70 border border-transparent'
            }`}>
            <Icon size={13} />
            {label}
            <span className={`text-xs rounded-full px-1.5 py-0.5 ${
              activeTab === key ? 'bg-pink-500/20 text-pink-300' : 'bg-pink-500/8 text-pink-300/30'
            }`}>
              {data[key].length}
            </span>
          </button>
        ))}
      </div>

      {/* Modal detail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeDetail} />
          {/* Panel */}
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#150d15] border border-pink-500/20 rounded-2xl shadow-2xl shadow-pink-900/30 overflow-hidden flex flex-col">
            <div className="overflow-y-auto p-6 flex-1">
              {detailLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
                </div>
              ) : detail ? (
                activeTab === 'summaries' ? <SummaryDetail item={detail} onClose={closeDetail} /> :
                activeTab === 'quizzes'   ? <QuizDetail   item={detail} onClose={closeDetail} navigate={navigate} /> :
                                            <PlanDetail   item={detail} onClose={closeDetail} />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/15 flex items-center justify-center mx-auto mb-4">
            {activeTab === 'summaries' ? <FileText size={22} className="text-pink-400" />
             : activeTab === 'quizzes' ? <Brain    size={22} className="text-fuchsia-400" />
             :                           <Calendar size={22} className="text-rose-400" />}
          </div>
          <p className="font-semibold text-white">Belum ada riwayat</p>
          <p className="text-sm text-pink-300/30 mt-1">
            {activeTab === 'summaries' ? 'Mulai rangkum materi pertamamu'
             : activeTab === 'quizzes' ? 'Buat quiz dari materi yang sudah dirangkum'
             : 'Buat jadwal belajar untuk ujian mendatang'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button key={item.id} onClick={() => openDetail(item)}
              className="card w-full text-left hover:border-pink-500/25 hover:bg-white/[0.06] transition-all duration-200 group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  activeTab === 'summaries' ? 'bg-pink-500/10'    :
                  activeTab === 'quizzes'   ? 'bg-fuchsia-500/10' : 'bg-rose-500/10'
                }`}>
                  {activeTab === 'summaries' ? <FileText size={16} className="text-pink-400"    />
                   : activeTab === 'quizzes' ? <Brain    size={16} className="text-fuchsia-400" />
                   :                           <Calendar size={16} className="text-rose-400"    />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {item.topic         && <span className="badge bg-pink-500/10 text-pink-300 border border-pink-500/15 text-xs">{item.topic}</span>}
                    {item.quiz_type     && <span className="badge bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/15 text-xs">{item.quiz_type}</span>}
                    {item.num_questions && <span className="text-xs text-pink-300/30">{item.num_questions} soal</span>}
                    {item.exam_date     && <span className="text-xs text-pink-300/30">Mulai: {new Date(item.exam_date).toLocaleDateString('id-ID')}</span>}
                    {item.days_left     && <span className="text-xs text-pink-300/30">{item.days_left} hari</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-pink-300/20 flex items-center gap-1">
                    <Clock size={10} /> {formatDate(item.created_at)}
                  </span>
                  <ChevronRight size={14} className="text-pink-300/20 group-hover:text-pink-400 transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
