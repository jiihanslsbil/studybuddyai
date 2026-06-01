import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Eye, EyeOff, UserPlus, Sparkles, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) { toast.error('Isi semua field wajib'); return; }
    if (form.password.length < 6) { toast.error('Password minimal 6 karakter'); return; }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.full_name);
      toast.success('Akun berhasil dibuat! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registrasi gagal');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0f0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-1/3 w-[500px] h-[400px] bg-pink-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-700/8 rounded-full blur-3xl" />
      <div className="absolute top-20 right-10 w-3 h-3 bg-pink-400/30 rounded-full float" />
      <div className="absolute bottom-40 left-20 w-2 h-2 bg-rose-400/20 rounded-full float" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center shadow-2xl shadow-pink-900/60 mx-auto">
              <BookOpen size={32} className="text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-pink-300 to-rose-400 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles size={12} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Study Buddy</h1>
          <p className="mt-1 text-sm flex items-center justify-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <Sparkles size={13} className="text-pink-400" /> Buat akun dan mulai belajar lebih cerdas
          </p>
        </div>

        <div className="relative rounded-2xl border p-8 shadow-2xl"
          style={{ background: 'var(--bg-modal)', borderColor: 'var(--border)' }}>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Buat Akun Baru</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Bergabung dan mulai perjalanan belajarmu ✨</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nama Lengkap</label>
                <input type="text" className="input-field" placeholder="Nama lengkap kamu"
                  value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Username <span className="text-pink-500">*</span></label>
                <input type="text" className="input-field" placeholder="Pilih username unik"
                  value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
              <div>
                <label className="label">Email <span className="text-pink-500">*</span></label>
                <input type="email" className="input-field" placeholder="email@contoh.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Password <span className="text-pink-500">*</span></label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} className="input-field pr-12"
                    placeholder="Minimal 6 karakter"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-300/30 hover:text-pink-300/70 transition-colors">
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><UserPlus size={16} /> Daftar Sekarang</>
                }
              </button>
            </form>

            <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Sudah punya akun?{' '}
                <Link to="/login" className="text-pink-400 font-semibold hover:text-pink-300 transition-colors">
                  Masuk di sini
                </Link>
              </p>
            </div>
          </div>

        <p className="text-center text-xs text-pink-300/20 mt-6 flex items-center justify-center gap-1">
          Made with <Heart size={10} className="text-pink-400" fill="currentColor" /> for students
        </p>
      </div>
    </div>
  );
}
