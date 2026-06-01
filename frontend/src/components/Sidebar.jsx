import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, FileText, Brain, Calendar,
  History, LogOut, BookOpen, X, Sparkles, User, Sun, Moon
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'        },
  { to: '/summarizer', icon: FileText,         label: 'Summarizer'       },
  { to: '/quiz',       icon: Brain,            label: 'Quiz & Flashcard' },
  { to: '/planner',    icon: Calendar,         label: 'Study Planner'    },
  { to: '/history',    icon: History,          label: 'Riwayat'          },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  // Baca avatar dari localStorage atau user context
  const [avatarSrc, setAvatarSrc] = useState(null);
  useEffect(() => {
    if (!user?.id) return;
    // Prioritas: avatar dari user context (backend), fallback ke localStorage
    if (user.avatar_url) {
      setAvatarSrc(user.avatar_url);
    } else {
      const saved = localStorage.getItem(`avatar_${user.id}`);
      setAvatarSrc(saved || null);
    }
    // Listen perubahan localStorage (dari ProfilePage di tab yang sama)
    const handler = () => {
      if (user.avatar_url) return; // sudah ada dari backend, skip
      const updated = localStorage.getItem(`avatar_${user.id}`);
      setAvatarSrc(updated || null);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [user?.id, user?.avatar_url]);

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col
      border-r transition-colors duration-300
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      transform transition-transform duration-300 ease-in-out
    `}
    style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}>

      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-900/30">
            <BookOpen size={17} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none" style={{ color: 'var(--text-primary)' }}>Study Buddy</p>
            <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-subtle)' }}>
              <Sparkles size={9} className="text-pink-400" /> AI Learning Assistant
            </p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 transition-colors" style={{ color: 'var(--text-subtle)' }}>
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border ${
                isActive
                  ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/10 text-pink-400 border-pink-500/20'
                  : 'border-transparent hover:bg-pink-500/8'
              }`
            }
            style={({ isActive }) => ({ color: isActive ? undefined : 'var(--text-muted)' })}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-pink-400' : ''} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>

        {/* Theme toggle */}
        <button onClick={toggle}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border border-transparent hover:bg-pink-500/8"
          style={{ color: 'var(--text-muted)' }}>
          {dark
            ? <><Sun size={15} className="text-amber-400" /> Mode Terang</>
            : <><Moon size={15} className="text-indigo-400" /> Mode Gelap</>
          }
        </button>

        {/* Profile link */}
        <NavLink to="/profile" onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border ${
              isActive ? 'bg-pink-500/15 text-pink-400 border-pink-500/20' : 'border-transparent hover:bg-pink-500/8'
            }`
          }
          style={({ isActive }) => ({ color: isActive ? undefined : 'var(--text-muted)' })}>
          {({ isActive }) => (
            <>
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                : <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-[10px]">{user?.username?.[0]?.toUpperCase()}</span>
                  </div>
              }
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{user?.full_name || user?.username}</p>
                <p className="truncate text-[10px]" style={{ color: 'var(--text-subtle)' }}>@{user?.username}</p>
              </div>
              <User size={13} className={isActive ? 'text-pink-400' : ''} style={{ color: isActive ? undefined : 'var(--text-subtle)' }} />
            </>
          )}
        </NavLink>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 hover:bg-rose-500/10 hover:text-rose-400"
          style={{ color: 'var(--text-subtle)' }}>
          <LogOut size={15} /> Keluar
        </button>
      </div>
    </aside>
  );
}
