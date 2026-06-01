import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Eye, EyeOff, LogIn, Sparkles, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) { toast.error('Isi semua field'); return; }
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success('Selamat datang kembali! 💕');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login gagal');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0f0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-pink-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-rose-700/8 rounded-full blur-3xl" />
      <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-fuchsia-700/6 rounded-full blur-3xl" />

      {/* Floating orbs */}
      <div className="absolute top-20 right-20 w-3 h-3 bg-pink-400/30 rounded-full float" style={{ animationDelay: '0s' }} />
      <div className="absolute top-40 left-16 w-2 h-2 bg-rose-400/20 rounded-full float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-32 right-32 w-4 h-4 bg-pink-300/15 rounded-full float" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
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
            <Sparkles size={13} className="text-pink-400" /> AI Learning Assistant untuk Mahasiswa
          </p>
        </div>

        {/* Card */}
        <div className="relative rounded-2xl border p-8 shadow-2xl"
          style={{ background: 'var(--bg-modal)', borderColor: 'var(--border)' }}>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Masuk ke Akun</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Selamat datang kembali 💕</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input type="text" className="input-field" placeholder="Masukkan username"
                  value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  autoComplete="username" />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} className="input-field pr-12"
                    placeholder="Masukkan password"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    autoComplete="current-password" />
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
                  : <><LogIn size={16} /> Masuk</>
                }
              </button>
            </form>

            <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Belum punya akun?{' '}
                <Link to="/register" className="text-pink-400 font-semibold hover:text-pink-300 transition-colors">
                  Daftar sekarang
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
