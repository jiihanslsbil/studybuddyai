import React, { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  Calendar, Plus, Trash2, Loader2, ChevronDown, ChevronUp,
  Target, Clock, BookOpen, Lightbulb, RotateCcw
} from 'lucide-react';

const DIFFICULTY = ['mudah', 'sedang', 'sulit'];
const PRIORITY_STYLE = {
  high:   'bg-rose-500/15 text-rose-300 border-rose-500/20',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  low:    'bg-pink-500/15 text-pink-300 border-pink-500/20',
};
const PRIORITY_LABEL = { high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };

export default function PlannerPage() {
  const [step, setStep]               = useState('form');
  const [loading, setLoading]         = useState(false);
  const [plan, setPlan]               = useState(null);
  const [expandedDay, setExpandedDay] = useState(0);

  const [form, setForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    exam_date: '', daily_hours: 3, notes: '',
    subjects: [{ name: '', difficulty: 'sedang', hours: '' }]
  });

  const addSubject    = () => setForm({ ...form, subjects: [...form.subjects, { name: '', difficulty: 'sedang', hours: '' }] });
  const removeSubject = (i) => setForm({ ...form, subjects: form.subjects.filter((_, idx) => idx !== i) });
  const updateSubject = (i, f, v) => { const s = [...form.subjects]; s[i] = { ...s[i], [f]: v }; setForm({ ...form, subjects: s }); };

  const handleGenerate = async () => {
    if (!form.start_date) { toast.error('Masukkan tanggal mulai belajar'); return; }
    if (!form.exam_date)  { toast.error('Masukkan tanggal ujian'); return; }
    if (form.exam_date <= form.start_date) { toast.error('Tanggal ujian harus setelah tanggal mulai belajar'); return; }
    const valid = form.subjects.filter(s => s.name.trim());
    if (!valid.length) { toast.error('Tambahkan minimal 1 mata kuliah'); return; }
    setLoading(true);
    try {
      const res = await api.post('/planner/generate', { ...form, subjects: valid });
      setPlan(res.data.data); setStep('result'); setExpandedDay(0);
      toast.success('Jadwal belajar siap! 📅');
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal membuat jadwal'); }
    finally { setLoading(false); }
  };

  if (step === 'form') return (
    <div className="space-y-4 fade-in">
      <div className="card">
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={17} className="text-rose-400" />
          <h2 className="text-lg font-bold text-white">Smart Study Planner</h2>
        </div>
        <p className="text-sm text-pink-200/40 mb-5">AI membuat jadwal belajar optimal berdasarkan target dan waktu luangmu.</p>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tanggal Mulai Belajar <span className="text-pink-500">*</span></label>
              <input type="date" className="input-field" value={form.start_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Tanggal Ujian <span className="text-pink-500">*</span></label>
              <input type="date" className="input-field" value={form.exam_date}
                min={form.start_date || new Date().toISOString().split('T')[0]}
                onChange={e => setForm({ ...form, exam_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Jam Belajar / Hari</label>
            <select className="input-field" value={form.daily_hours} onChange={e => setForm({ ...form, daily_hours: parseFloat(e.target.value) })}>
              {[1, 1.5, 2, 2.5, 3, 4, 5, 6, 8].map(h => <option key={h} value={h}>{h} jam</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Mata Kuliah <span className="text-pink-500">*</span></label>
              <button onClick={addSubject} className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 font-medium transition-colors">
                <Plus size={12} /> Tambah
              </button>
            </div>
            <div className="space-y-2">
              {form.subjects.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" className="input-field flex-1 text-sm" placeholder={`Mata kuliah ${i + 1}`}
                    value={s.name} onChange={e => updateSubject(i, 'name', e.target.value)} />
                  <select className="input-field w-28 text-sm" value={s.difficulty} onChange={e => updateSubject(i, 'difficulty', e.target.value)}>
                    {DIFFICULTY.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input type="number" className="input-field w-20 text-sm" placeholder="Jam"
                    value={s.hours} onChange={e => updateSubject(i, 'hours', e.target.value)} />
                  {form.subjects.length > 1 && (
                    <button onClick={() => removeSubject(i)} className="text-pink-300/20 hover:text-rose-400 p-1 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-pink-300/20 mt-1.5">Kolom jam = estimasi total jam yang dibutuhkan (opsional)</p>
          </div>

          <div>
            <label className="label">Catatan Tambahan</label>
            <textarea className="input-field resize-none" rows={3}
              placeholder="Contoh: saya lemah di bab 3, ada ujian praktikum juga..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>

          <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> AI sedang membuat jadwal...</>
              : <><Calendar size={16} /> Buat Jadwal Belajar</>
            }
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">{plan.title}</h2>
          <p className="text-sm text-pink-300/40 mt-0.5">
            Mulai belajar: {plan.start_date
              ? new Date(plan.start_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
              : '-'}
            <span className="mx-1.5 text-pink-500/30">→</span>
            Ujian: {new Date(plan.exam_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            <span className="mx-1.5 text-pink-500/30">·</span>
            <span className="text-pink-400 font-medium">{plan.days_left} hari jadwal</span>
          </p>
        </div>
        <button onClick={() => setStep('form')} className="btn-secondary text-sm flex items-center gap-1.5 flex-shrink-0">
          <RotateCcw size={12} /> Buat Ulang
        </button>
      </div>

      {plan.subject_priorities?.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Target size={15} className="text-rose-400" />
            <h3 className="font-semibold text-white">Prioritas Materi</h3>
          </div>
          <div className="space-y-2">
            {plan.subject_priorities.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-pink-500/5 rounded-xl border border-pink-500/10">
                <span className={`badge border ${PRIORITY_STYLE[s.priority] || 'bg-pink-500/10 text-pink-300 border-pink-500/15'}`}>
                  {PRIORITY_LABEL[s.priority] || s.priority}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{s.subject}</p>
                  <p className="text-xs text-pink-300/30 truncate">{s.reason}</p>
                </div>
                <span className="text-xs text-pink-300/30 flex-shrink-0">{s.total_hours_allocated}j</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={15} className="text-fuchsia-400" />
          <h3 className="font-semibold text-white">Jadwal Harian</h3>
        </div>
        <div className="space-y-2">
          {plan.daily_schedule?.map((day, i) => (
            <div key={i} className="rounded-xl border border-pink-500/10 overflow-hidden">
              <button onClick={() => setExpandedDay(expandedDay === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-pink-500/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-pink-300 font-bold text-xs">H{day.day}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{day.date}</p>
                    <p className="text-xs text-pink-300/30 truncate max-w-[200px]">{day.daily_goal}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-pink-300/30">{day.total_hours}j</span>
                  {expandedDay === i ? <ChevronUp size={14} className="text-pink-300/30" /> : <ChevronDown size={14} className="text-pink-300/30" />}
                </div>
              </button>

              {expandedDay === i && (
                <div className="px-4 pb-4 space-y-2 border-t border-pink-500/10 pt-3">
                  {day.sessions?.map((session, j) => (
                    <div key={j} className="bg-pink-500/5 rounded-xl p-3 border border-pink-500/8">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <BookOpen size={12} className="text-fuchsia-400" />
                          <span className="text-sm font-medium text-white">{session.subject}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`badge border text-xs ${PRIORITY_STYLE[session.priority] || 'bg-pink-500/10 text-pink-300 border-pink-500/15'}`}>
                            {PRIORITY_LABEL[session.priority] || session.priority}
                          </span>
                          <span className="text-xs text-pink-300/30">{session.duration_hours}j</span>
                        </div>
                      </div>
                      {session.topics?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {session.topics.map((t, k) => (
                            <span key={k} className="badge bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 text-xs">{t}</span>
                          ))}
                        </div>
                      )}
                      {session.tips && <p className="text-xs text-pink-300/30 mt-2 italic">{session.tips}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {plan.study_tips?.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={15} className="text-amber-400" />
            <h3 className="font-semibold text-white">Tips Belajar</h3>
          </div>
          <ul className="space-y-2">
            {plan.study_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-pink-100/60">
                <span className="text-pink-400 mt-0.5 flex-shrink-0">✦</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
