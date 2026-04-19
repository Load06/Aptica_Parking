import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Map, Key, RotateCw, Plus, Undo2, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { Avatar, Button, Card } from '../components/ui';
import { WeekStrip } from '../components/WeekStrip';
import type { Liberation, Reservation } from '../types';
import { ymd } from '../lib/utils';

interface HomeProps {
  onLiberate: () => void;
}

const BAY_LABELS: Record<string, string> = {
  top: 'Nave superior', left: 'Nave izquierda', mid: 'Nave central', right: 'Nave derecha',
};

export function HomeScreen({ onLiberate }: HomeProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todayLibs, setTodayLibs] = useState<Liberation[]>([]);
  const [myReservation, setMyReservation] = useState<Reservation | null>(null);
  const [myLiberation, setMyLiberation] = useState<Liberation | null>(null);
  const [stats, setStats] = useState({ liberated: 0, reserved: 0, users: 0 });
  const [actionLoading, setActionLoading] = useState(false);

  const today = new Date();
  const dateStr = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });

  useEffect(() => {
    const d = ymd(selectedDate);
    api.get<Liberation[]>(`/plazas/availability?date=${d}`).then(r => {
      setTodayLibs(r.data);
      const mine = r.data.find(l => l.reservation?.userId === user?.id && l.reservation?.status === 'confirmed');
      setMyReservation(mine?.reservation ?? null);
      setMyLiberation(r.data.find(l => l.userId === user?.id) ?? null);
    });
    if (user?.role === 'admin') {
      Promise.all([
        api.get(`/plazas/availability?date=${d}`),
        api.get(`/reservations?date=${d}`),
        api.get('/admin/users'),
      ]).then(([libR, resR, usrR]) => {
        setStats({ liberated: libR.data.length, reserved: resR.data.length, users: usrR.data.length });
      });
    }
  }, [selectedDate, user]);

  const refreshData = async () => {
    const d = ymd(selectedDate);
    const r = await api.get<Liberation[]>(`/plazas/availability?date=${d}`);
    setTodayLibs(r.data);
    const mine = r.data.find(l => l.reservation?.userId === user?.id && l.reservation?.status === 'confirmed');
    setMyReservation(mine?.reservation ?? null);
    setMyLiberation(r.data.find(l => l.userId === user?.id) ?? null);
  };

  const handleRecoverPlaza = async () => {
    if (!myLiberation) return;
    setActionLoading(true);
    try { await api.delete(`/liberations/${myLiberation.id}`); await refreshData(); }
    finally { setActionLoading(false); }
  };

  const handleCancelReservation = async () => {
    if (!myReservation) return;
    setActionLoading(true);
    try { await api.delete(`/reservations/${myReservation.id}`); await refreshData(); }
    finally { setActionLoading(false); }
  };

  const firstName = user?.name?.split(' ')[0] ?? '';
  const plaza = user?.assignedPlaza;

  return (
    <div className="px-5 pt-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[13px] text-gray-mid font-medium capitalize">{dateStr}</p>
          <h1 className="text-[24px] font-extrabold text-ink tracking-[-0.6px] mt-0.5">Hola, {firstName}</h1>
        </div>
        <button className="w-[42px] h-[42px] rounded-full bg-white border border-gray-line flex items-center justify-center relative">
          <Bell size={20} className="text-ink2" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple border-2 border-white" />
        </button>
      </div>

      {/* ── HERO CARD ── */}

      {/* fixed: Plaza fija */}
      {user?.role === 'fixed' && plaza && (
        <div
          className="rounded-2xl p-5 text-white relative overflow-hidden mb-5"
          style={{
            background: 'linear-gradient(135deg, #6A1873 0%, #58457A 100%)',
            boxShadow: '0 6px 20px rgba(106,24,115,0.25)',
          }}
        >
          <svg viewBox="0 0 200 200" width="240" height="240" className="absolute -right-20 -top-16 opacity-[0.08] pointer-events-none">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#fff" strokeWidth="1"/>
            <circle cx="100" cy="100" r="60" fill="none" stroke="#fff" strokeWidth="1"/>
            <circle cx="100" cy="100" r="30" fill="none" stroke="#fff" strokeWidth="1"/>
          </svg>
          <div className="relative">
            <p className="text-[11px] font-bold tracking-[1.4px] uppercase opacity-70">Tu plaza fija</p>
            <p className="text-[56px] font-extrabold leading-none tracking-[-2.5px] mt-1.5">{plaza.num}</p>
            <p className="text-[14px] opacity-85 mt-1">{plaza.floor} · {BAY_LABELS[plaza.bay] ?? plaza.bay}</p>
            {myLiberation && (
              <div className="mt-3 px-3 py-2 rounded-lg text-[12px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                🔓 Plaza liberada hoy
                {myLiberation.reservation?.status === 'confirmed' && ' · Reservada'}
              </div>
            )}
            <div className="flex gap-2 mt-3">
              {myLiberation ? (
                <button
                  onClick={handleRecoverPlaza}
                  disabled={actionLoading}
                  className="flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 text-[14px] font-bold text-white disabled:opacity-60"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
                >
                  <Undo2 size={16} /> Recuperar plaza
                </button>
              ) : (
                <button
                  onClick={onLiberate}
                  className="flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 text-[14px] font-bold text-white"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
                >
                  <Key size={16} /> Liberar plaza
                </button>
              )}
              <button
                onClick={() => navigate('/mapa')}
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <Map size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* floating con reserva */}
      {user?.role === 'floating' && myReservation && (
        <Card className="rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-ok" />
            <span className="text-[11px] font-bold text-ok tracking-[1.2px] uppercase">Reserva confirmada · Hoy</span>
          </div>
          <div className="flex items-end gap-4">
            <div className="bg-purple-soft text-purple rounded-xl px-3.5 py-2 text-center min-w-[72px]">
              <p className="text-[10px] font-bold tracking-[0.6px]">PLAZA</p>
              <p className="text-[34px] font-extrabold leading-none tracking-[-1.5px]">{myReservation.plaza?.num}</p>
            </div>
            <div>
              <p className="text-[12px] text-gray-mid">Planta</p>
              <p className="text-[18px] font-bold text-ink tracking-[-0.3px]">{myReservation.plaza?.floor}</p>
              <p className="text-[14px] font-semibold text-ink2 mt-1">
                {myReservation.halfDay === 'full' ? '8:00 – 19:00' : myReservation.halfDay === 'am' ? '8:00 – 14:00' : '14:00 – 19:00'}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" size="md" fullWidth onClick={() => navigate('/mapa')}>
              <Map size={16} /> Ver en el mapa
            </Button>
            <Button variant="danger" size="md" onClick={handleCancelReservation} disabled={actionLoading}>
              <X size={16} />
            </Button>
          </div>
        </Card>
      )}

      {/* floating sin reserva */}
      {user?.role === 'floating' && !myReservation && (
        <div className="rounded-2xl p-5 bg-white border border-dashed border-gray-line text-center mb-5">
          <p className="text-[52px] font-extrabold text-gray-line leading-none tracking-[-2px] mb-1">—</p>
          <p className="text-[15px] font-bold text-ink">Sin reserva para hoy</p>
          <p className="text-[13px] text-gray-mid mt-1 mb-4">
            Hay {todayLibs.filter(l => !l.reservation).length} plazas liberadas disponibles
          </p>
          <Button variant="primary" fullWidth onClick={() => navigate('/reservar')}>
            <Plus size={16} /> Reservar plaza
          </Button>
        </div>
      )}

      {/* admin stats */}
      {user?.role === 'admin' && (
        <Card className="rounded-2xl p-4 mb-5">
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { k: 'Liberadas hoy', v: stats.liberated, c: '#6A1873' },
              { k: 'Reservadas',    v: stats.reserved,  c: '#7296BC' },
              { k: 'Usuarios',      v: stats.users,     c: '#58457A' },
            ].map(s => (
              <div key={s.k} className="bg-gray-bg rounded-xl p-3">
                <p className="text-[28px] font-extrabold leading-none tracking-[-1px]" style={{ color: s.c }}>{s.v}</p>
                <p className="text-[11px] text-gray-mid font-semibold mt-0.5">{s.k}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Week strip */}
      <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-gray-mid mb-2">Esta semana</p>
      <WeekStrip selected={selectedDate} onPick={setSelectedDate} />

      {/* Activity feed */}
      <div className="flex items-center justify-between mt-5 mb-2">
        <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-gray-mid">Actividad reciente</p>
      </div>
      <Card className="rounded-xl overflow-hidden">
        {todayLibs.length === 0 && (
          <p className="px-4 py-4 text-[14px] text-gray-mid font-medium">Sin actividad para esta fecha.</p>
        )}
        {todayLibs.slice(0, 5).map((lib, i) => (
          <div
            key={lib.id}
            className={`flex items-center gap-3 px-4 py-3 ${i < Math.min(todayLibs.length, 5) - 1 ? 'border-b border-gray-line' : ''}`}
          >
            <Avatar name={lib.plaza?.assignedUsers?.[0]?.name ?? '?'} color={lib.plaza?.assignedUsers?.[0]?.avatarColor ?? '#6A1873'} size={38} />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-ink truncate">
                <span className="font-bold">{lib.plaza?.assignedUsers?.[0]?.name ?? 'Titular'}</span>
                <span className="text-gray-mid font-medium"> liberó </span>
                <span className="font-bold">{lib.plaza?.floor} · {lib.plaza?.num}</span>
              </p>
              <p className="text-[12px] text-gray-mid font-medium">
                {new Date(lib.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            {user?.role === 'floating' && lib.reservation?.status !== 'confirmed' && (
              <Button size="sm" variant="secondary" onClick={() => navigate('/reservar')}>Reservar</Button>
            )}
          </div>
        ))}
      </Card>

      {/* Quick access (fixed only) */}
      {user?.role === 'fixed' && (
        <>
          <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-gray-mid mt-5 mb-2">Accesos rápidos</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { t: 'Liberar varios días', s: 'Rango o recurrente', icon: <RotateCw size={22} className="text-purple" />, action: onLiberate },
              { t: 'Mi plaza en el mapa', s: plaza ? `${plaza.floor} · ${plaza.num}` : '', icon: <Map size={22} className="text-purple" />, action: () => navigate('/mapa') },
            ].map((q, i) => (
              <button
                key={i}
                onClick={q.action}
                className="bg-white rounded-xl p-3.5 border border-gray-line text-left active:bg-gray-bg transition-colors"
              >
                <div className="w-[38px] h-[38px] rounded-[10px] bg-purple-soft flex items-center justify-center mb-2.5">
                  {q.icon}
                </div>
                <p className="text-[14px] font-bold text-ink leading-tight">{q.t}</p>
                <p className="text-[12px] text-gray-mid mt-0.5">{q.s}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
