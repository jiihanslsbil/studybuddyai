import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FileText, Brain, Calendar, ArrowRight, Sparkles, Zap, Star } from 'lucide-react';

const features = [
  {
    to: '/summarizer', icon: FileText,
    gradient: 'from-pink-500 to-rose-500',
    glow: 'shadow-pink-900/40',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    text: 'text-pink-300',
    title: 'Smart Summarizer',
    desc: 'Upload PDF atau teks, AI merangkum materi dan mengambil poin penting secara otomatis.',
    cta: 'Mulai Merangkum',
  },
  {
    to: '/quiz', icon: Brain,
    gradient: 'from-fuchsia-500 to-pink-600',
    glow: 'shadow-fuchsia-900/40',
    bg: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/20',
    text: 'text-fuchsia-300',
    title: 'Quiz & Flashcard',
    desc: 'Generate soal pilihan ganda, benar/salah, essay, dan flashcard dari materi secara otomatis.',
    cta: 'Buat Quiz',
  },
  {
    to: '/planner', icon: Calendar,
    gradient: 'from-rose-500 to-pink-700',
    glow: 'shadow-rose-900/40',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    text: 'text-rose-300',
    title: 'Study Planner',
    desc: 'Buat jadwal belajar cerdas berdasarkan tanggal ujian, mata kuliah, dan waktu luang kamu.',
    cta: 'Buat Jadwal',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ summaries: 0, quizzes: 0, plans: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/summarizer/history').catch(() => ({ data: { data: [] } })),
      api.get('/quiz/history').catch(() => ({ data: { data: [] } })),
      api.get('/planner/history').catch(() => ({ data: { data: [] } })),
    ]).then(([s, q, p]) => setStats({
      summaries: s.data.data?.length || 0,
      quizzes:   q.data.data?.length || 0,
      plans:     p.data.data?.length || 0,
    }));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat pagi' : hour < 17 ? 'Selamat siang' : 'Selamat malam';

  return (
    <div className="space-y-6 fade-in">

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-pink-500/20 p-6 md:p-8">
        {/* Gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent" />
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-pink-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-pink-300/60 text-sm font-medium flex items-center gap-1.5 mb-1">
              <Sparkles size={12} className="text-pink-400" /> {greeting}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {user?.full_name || user?.username} 👋
            </h1>
            <p className="text-pink-200/40 mt-2 text-sm max-w-sm">
              Siap belajar lebih cerdas hari ini? Pilih fitur di bawah untuk memulai.
            </p>
            <div className="flex gap-2 mt-4">
              <Link to="/summarizer" className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
                <Zap size={13} /> Mulai Sekarang
              </Link>
              <Link to="/history" className="btn-secondary text-sm py-2 px-4">
                Lihat Riwayat
              </Link>
            </div>
          </div>
          <div className="hidden md:flex w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 items-center justify-center flex-shrink-0 shadow-2xl shadow-pink-900/50 float">
            <Star size={26} className="text-white" fill="white" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Rangkuman', value: stats.summaries, icon: FileText, bg: 'bg-pink-500/10',    color: 'text-pink-400'    },
          { label: 'Quiz',      value: stats.quizzes,   icon: Brain,    bg: 'bg-fuchsia-500/10', color: 'text-fuchsia-400' },
          { label: 'Jadwal',    value: stats.plans,     icon: Calendar, bg: 'bg-rose-500/10',    color: 'text-rose-400'    },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="card text-center hover:border-pink-500/20 transition-all duration-200">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
              <Icon size={16} className={color} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-pink-300/30 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Feature cards */}
      <div>
        <p className="text-xs font-semibold text-pink-300/30 uppercase tracking-widest mb-3">Fitur Utama</p>
        <div className="grid md:grid-cols-3 gap-4">
          {features.map(({ to, icon: Icon, gradient, glow, bg, border, text, title, desc, cta }) => (
            <div key={to} className={`card border ${border} hover:bg-white/[0.06] transition-all duration-200 flex flex-col group`}>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg ${glow}`}>
                <Icon size={19} className="text-white" />
              </div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-pink-200/40 leading-relaxed flex-1">{desc}</p>
              <Link to={to}
                className={`flex items-center gap-1.5 text-sm font-semibold mt-4 ${text} hover:opacity-80 transition-opacity`}>
                {cta} <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
