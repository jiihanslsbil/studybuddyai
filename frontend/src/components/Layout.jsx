import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-300" style={{ background: 'var(--bg-base)' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ background: 'var(--glow-1)' }} />
          <div className="fixed bottom-0 left-0 w-[300px] h-[300px] rounded-full blur-3xl pointer-events-none" style={{ background: 'var(--glow-2)' }} />
          <div className="relative max-w-4xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
