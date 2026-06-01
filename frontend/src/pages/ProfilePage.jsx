import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  User, Mail, AtSign, Lock, Camera, Save,
  Eye, EyeOff, CheckCircle, Edit3, KeyRound, Loader2, Trash2
} from 'lucide-react';

// ── Resize gambar ke max 300x300, JPEG quality 0.7 ──────────────────────────
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX = 300;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else        { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Avatar key per user ──────────────────────────────────────────────────────
const avatarKey = (userId) => `avatar_${userId}`;

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const fileRef = useRef();

  const [profileForm, setProfileForm]       = useState({ full_name: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);

  const [pwForm, setPwForm]           = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwLoading, setPwLoading]     = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Avatar disimpan di localStorage per user
  const [avatarSrc, setAvatarSrc]         = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Load data saat user tersedia
  useEffect(() => {
    if (!user) return;
    setProfileForm({ full_name: user.full_name || '', email: user.email || '' });
    // Prioritas: avatar dari backend (user.avatar_url), fallback ke localStorage
    if (user.avatar_url) {
      setAvatarSrc(user.avatar_url);
      localStorage.setItem(avatarKey(user.id), user.avatar_url);
    } else {
      const saved = localStorage.getItem(avatarKey(user.id));
      setAvatarSrc(saved || null);
    }
  }, [user]);

  // ── Simpan profil ──────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profileForm.full_name.trim()) { toast.error('Nama lengkap tidak boleh kosong'); return; }
    if (!profileForm.email.trim())     { toast.error('Email tidak boleh kosong'); return; }
    setProfileLoading(true);
    try {
      const res = await api.patch('/profile', {
        full_name: profileForm.full_name.trim(),
        email:     profileForm.email.trim(),
      });
      updateUser(res.data.user);
      toast.success('Profil berhasil disimpan!');
      setProfileEditing(false);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Gagal menyimpan profil';
      toast.error(msg);
      console.error('[Profile] Save error:', err.response?.data);
    } finally { setProfileLoading(false); }
  };

  // ── Ganti password ─────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!pwForm.current_password || !pwForm.new_password) { toast.error('Isi semua field password'); return; }
    if (pwForm.new_password !== pwForm.confirm_password)  { toast.error('Konfirmasi password tidak cocok'); return; }
    if (pwForm.new_password.length < 6)                   { toast.error('Password baru minimal 6 karakter'); return; }
    setPwLoading(true);
    try {
      await api.patch('/profile/password', {
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      });
      toast.success('Password berhasil diubah!');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengubah password');
    } finally { setPwLoading(false); }
  };

  // ── Upload avatar — simpan ke backend & localStorage ──────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('File harus berupa gambar'); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error('Ukuran file maksimal 5MB'); return; }

    setAvatarLoading(true);
    try {
      const base64 = await resizeImage(file);

      // Simpan ke backend
      const res = await api.patch('/profile/avatar', { avatar_base64: base64 });
      const savedAvatar = res.data.user?.avatar_url || base64;

      // Simpan ke localStorage sebagai cache
      localStorage.setItem(avatarKey(user.id), savedAvatar);
      setAvatarSrc(savedAvatar);
      updateUser(res.data.user);
      // Trigger update di Sidebar
      window.dispatchEvent(new Event('storage'));
      toast.success('Foto profil diperbarui! 📸');
    } catch (err) {
      console.error('Avatar error:', err);
      // Fallback: simpan hanya di localStorage jika backend gagal
      try {
        const base64 = await resizeImage(file);
        localStorage.setItem(avatarKey(user.id), base64);
        setAvatarSrc(base64);
        window.dispatchEvent(new Event('storage'));
        toast.success('Foto profil diperbarui (lokal)! 📸');
      } catch {
        toast.error('Gagal memproses foto');
      }
    } finally {
      setAvatarLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // ── Hapus avatar ───────────────────────────────────────────────────────────
  const handleRemoveAvatar = async () => {
    try {
      // Hapus dari backend
      await api.patch('/profile/avatar', { avatar_base64: null }).catch(() => {});
    } catch {}
    localStorage.removeItem(avatarKey(user.id));
    setAvatarSrc(null);
    updateUser({ avatar_url: null });
    window.dispatchEvent(new Event('storage'));
    toast.success('Foto profil dihapus');
  };

  const initials = (user?.full_name || user?.username || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const pwStrength = pwForm.new_password.length;
  const strengthColor = pwStrength === 0 ? 'var(--border)'
    : pwStrength < 6  ? '#f87171'
    : pwStrength < 10 ? '#fb923c'
    : pwStrength < 14 ? '#facc15'
    : '#4ade80';

  return (
    <div className="space-y-5 fade-in max-w-2xl">

      {/* ── Avatar & nama ── */}
      <div className="card">
        <div className="flex items-center gap-5">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-900/30">
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-2xl">{initials}</span>
              }
            </div>

            {/* Tombol kamera */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={avatarLoading}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-md hover:scale-110 transition-transform disabled:opacity-60"
              title="Ganti foto profil">
              {avatarLoading
                ? <Loader2 size={13} className="text-white animate-spin" />
                : <Camera size={13} className="text-white" />
              }
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {user?.full_name || user?.username}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>@{user?.username}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
              Bergabung {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                : '-'}
            </p>
          </div>

          <button
            onClick={() => setProfileEditing(!profileEditing)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex-shrink-0"
            style={{
              background:  profileEditing ? 'rgba(236,72,153,0.15)' : 'var(--bg-card)',
              borderColor: profileEditing ? 'rgba(236,72,153,0.30)' : 'var(--border)',
              color:       profileEditing ? '#f472b6' : 'var(--text-muted)',
            }}>
            <Edit3 size={12} /> {profileEditing ? 'Batal' : 'Edit'}
          </button>
        </div>

        {/* Actions foto */}
        <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={avatarLoading}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(236,72,153,0.10)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.20)' }}>
            <Camera size={12} />
            {avatarSrc ? 'Ganti Foto' : 'Upload Foto'}
          </button>
          {avatarSrc && (
            <button
              onClick={handleRemoveAvatar}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.15)' }}>
              <Trash2 size={12} /> Hapus Foto
            </button>
          )}
          <p className="text-xs ml-auto" style={{ color: 'var(--text-subtle)' }}>
            JPG/PNG/WebP · maks. 5MB
          </p>
        </div>
      </div>

      {/* ── Info profil ── */}
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <User size={16} className="text-pink-400" /> Informasi Profil
        </h3>

        <div className="space-y-4">
          {/* Username — read only */}
          <div>
            <label className="label flex items-center gap-1.5">
              <AtSign size={12} /> Username
            </label>
            <div className="input-field flex items-center gap-2" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
              <span>@{user?.username}</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 whitespace-nowrap">
                Tidak bisa diubah
              </span>
            </div>
          </div>

          {/* Nama lengkap */}
          <div>
            <label className="label flex items-center gap-1.5">
              <User size={12} /> Nama Lengkap
            </label>
            <input type="text" className="input-field"
              value={profileForm.full_name}
              onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
              disabled={!profileEditing}
              placeholder="Nama lengkap kamu"
              style={{ opacity: profileEditing ? 1 : 0.65 }}
            />
          </div>

          {/* Email */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Mail size={12} /> Email
            </label>
            <input type="email" className="input-field"
              value={profileForm.email}
              onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
              disabled={!profileEditing}
              placeholder="email@contoh.com"
              style={{ opacity: profileEditing ? 1 : 0.65 }}
            />
          </div>

          {profileEditing && (
            <button onClick={handleSaveProfile} disabled={profileLoading}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {profileLoading
                ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
                : <><Save size={15} /> Simpan Perubahan</>
              }
            </button>
          )}
        </div>
      </div>

      {/* ── Ganti password ── */}
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <KeyRound size={16} className="text-pink-400" /> Ganti Password
        </h3>

        <div className="space-y-3">
          <div>
            <label className="label">Password Saat Ini</label>
            <div className="relative">
              <input type={showCurrent ? 'text' : 'password'} className="input-field pr-11"
                placeholder="Masukkan password saat ini"
                value={pwForm.current_password}
                onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }}>
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Password Baru</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} className="input-field pr-11"
                placeholder="Minimal 6 karakter"
                value={pwForm.new_password}
                onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }}>
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwForm.new_password && (
              <div className="flex gap-1 mt-1.5">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{ background: pwStrength >= i * 3 ? strengthColor : 'var(--border)' }} />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label">Konfirmasi Password Baru</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} className="input-field pr-11"
                placeholder="Ulangi password baru"
                value={pwForm.confirm_password}
                onChange={e => setPwForm({ ...pwForm, confirm_password: e.target.value })} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {pwForm.confirm_password && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  {pwForm.new_password === pwForm.confirm_password
                    ? <CheckCircle size={15} className="text-green-400" />
                    : <div className="w-3.5 h-3.5 rounded-full bg-rose-400" />
                  }
                </div>
              )}
            </div>
          </div>

          <button onClick={handleChangePassword} disabled={pwLoading}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {pwLoading
              ? <><Loader2 size={15} className="animate-spin" /> Mengubah...</>
              : <><Lock size={15} /> Ubah Password</>
            }
          </button>
        </div>
      </div>

      {/* ── Info akun ── */}
      <div className="card">
        <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <CheckCircle size={16} className="text-pink-400" /> Info Akun
        </h3>
        <div>
          {[
            { label: 'Username',  value: '@' + (user?.username || '-') },
            { label: 'Email',     value: user?.email || '-' },
            { label: 'Bergabung', value: user?.created_at
                ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                : '-'
            },
          ].map(({ label, value }, i, arr) => (
            <div key={label}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
