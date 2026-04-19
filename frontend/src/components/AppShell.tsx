import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ParkingSquare, Map, User, Key } from 'lucide-react';
import { cn } from '../lib/utils';
import { ParkingScreen } from '../screens/ParkingScreen';
import { MapScreen } from '../screens/MapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AdminScreen } from '../screens/AdminScreen';
import { LiberateSheet } from './LiberateSheet';

const tabs = [
  { path: '/',      label: 'Parking', Icon: ParkingSquare },
  { path: '/mapa',  label: 'Mapa',    Icon: Map },
  { path: '/perfil',label: 'Perfil',  Icon: User },
];

export function AppShell() {
  const [liberateOpen, setLiberateOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="h-dvh flex flex-col bg-bg">
      {/* Desktop sidebar / Mobile: full height content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <nav className="hidden md:flex flex-col w-56 bg-white border-r border-gray-line shrink-0 py-6 px-3 gap-1">
          <div className="px-3 mb-6">
            <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-gray-mid">Aptica Parking</p>
          </div>
          {tabs.filter(t => t.path !== null).map((t) => {
            const active = t.path === '/' ? pathname === '/' : pathname.startsWith(t.path!);
            return (
              <button
                key={t.path}
                onClick={() => navigate(t.path!)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-colors',
                  active ? 'bg-purple-soft text-purple' : 'text-ink2 hover:bg-gray-bg',
                )}
              >
                <t.Icon size={18} />
                {t.label}
              </button>
            );
          })}
          <button
            onClick={() => setLiberateOpen(true)}
            className="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-colors"
            style={{ background: 'linear-gradient(135deg, #6A1873, #58457A)' }}
          >
            <Key size={18} />
            Liberar plaza
          </button>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <Routes>
            <Route path="/"        element={<ParkingScreen onLiberate={() => setLiberateOpen(true)} />} />
            <Route path="/mapa"    element={<MapScreen />} />
            <Route path="/perfil"  element={<ProfileScreen />} />
            <Route path="/admin/*" element={<AdminScreen />} />
          </Routes>
        </main>
      </div>

      {/* Mobile tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3.5 pb-safe pb-2">
        <div className="bg-white rounded-[28px] border border-gray-line shadow-tabbar grid grid-cols-4 items-center h-[68px]">
          {tabs.map((t) => {
            const active = t.path === '/' ? pathname === '/' : pathname.startsWith(t.path);
            return (
              <button
                key={t.path}
                onClick={() => navigate(t.path!)}
                className="flex flex-col items-center gap-[3px] py-2"
              >
                <t.Icon size={22} color={active ? '#6A1873' : '#8E8E93'} />
                <span
                  className="text-[10px] font-bold"
                  style={{ color: active ? '#6A1873' : '#8E8E93', letterSpacing: 0.2 }}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
          {/* Liberar — botón destacado a la derecha */}
          <button
            onClick={() => setLiberateOpen(true)}
            className="flex flex-col items-center gap-[3px] py-2"
            aria-label="Liberar plaza"
          >
            <div className="w-[38px] h-[28px] rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6A1873, #58457A)' }}>
              <Key size={16} color="#fff" />
            </div>
            <span className="text-[10px] font-bold" style={{ color: '#6A1873', letterSpacing: 0.2 }}>
              Liberar
            </span>
          </button>
        </div>
      </div>

      <LiberateSheet open={liberateOpen} onClose={() => setLiberateOpen(false)} />
    </div>
  );
}
