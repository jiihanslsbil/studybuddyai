import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, FileText, Brain, Calendar, LayoutDashboard, History, Sun, Moon, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const pageMeta = {
  '/dashboard':  { title: 'Dashboard',        icon: LayoutDashboard },
  '/summarizer': { title: 'Smart Summarizer',  icon: FileText        },
  '/quiz':       { title: 'Quiz & Flashcard',  icon: Brain           },
  '/planner':    { title: 'Study Planner',     icon: Calendar        },
  '/history':    { title: 'Riwayat',           icon: History         },
  '/profile':    { title: 'Profil Saya',       icon: User            },
};

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const meta = pageMeta[location.pathname] || pageMeta['/dashboard'];
  const Icon = meta.icon;

  return (
    <header className="backdrop-blur-sm px-4 md:px-6 py-3.5 flex items-center gap-4 sticky top-0 z-10 transition-colors duration-300"
      style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
      <button onClick={onMenuClick} className="lg:hidden p-1 transition-colors" style={{ color: 'var(--text-muted)' }}>
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2.5 flex-1">
        <Icon size={17} className="text-pink-400" />
        <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{meta.title}</h2>
      </div>

      {/* Theme toggle — visible di semua ukuran */}
      <button onClick={toggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        {dark
          ? <><Sun size={14} className="text-amber-400" /> <span className="hidden sm:inline">Terang</span></>
          : <><Moon size={14} className="text-indigo-400" /> <span className="hidden sm:inline">Gelap</span></>
        }
      </button>
    </header>
  );
}
