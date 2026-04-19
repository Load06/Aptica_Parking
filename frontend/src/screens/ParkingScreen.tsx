import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Key, Map, RotateCw, Undo2, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import type { Liberation, Reservation } from '../types';
import { Avatar, Badge, BottomSheet, Button, Card } from '../components/ui';
import { WeekStrip } from '../components/WeekStrip';
import { ymd, HALF_DAY_LABELS } from '../lib/utils';

interface ParkingScreenProps {
  onLiberate: () => void;
}

const BAY_LABELS: Record<string, string> = {
  top: 'Nave superior', left: 'Nave izquierda', mid: 'Nave central', right: 'Nave derecha',
};

export function ParkingScreen({ onLiberate }: ParkingScreenProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [libs, setLibs] = useState<Liberation[]>([]);
  const [myReservation, setMyReservation] = useState<Reservation | null>(null);
  const [myLiberation, setMyLiberation] = useState<Liberation | null>(null);
  const [quota, setQuota] = useState({ used: 0, quota: 3 });
  const [rules, setRules] = useState({ advanceBookingHours: 48 });
  const [stats, setStats] = useState({ liberated: 0, reserved: 0, users: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [urgentLib, setUrgentLib] = useState<Liberation | null>(null);
  const [urgentReason, setUrgentReason] = useState('');

  const today = new Date();
  const dateStr = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
  const firstName = user?.name.split(' ')[0] ?? '';
  const plaza = user?.assignedPlaza;
  const myPlazaId = plaza?.id;
  const advance = rules.advanceBookingHours / 24;
  const isQuotaFull = quota.used >= quota.quota;

  useEffect(() => {
    api.get('/rules').then(r => setRules(r.data));
  }, [user]);

  useEffect(() => {
    const d = ymd(selectedDate);
    api.get<Liberation[]>(`/plazas/availability?date=${d}`).then(r => {
      setLibs(r.data);
      const mine = r.data.find(l => l.reservation?.userId === user?.id && l.reservation?.status === 'confirmed');
      setMyReservation(mine && mine.reservation ? { ...mine.reservation, plaza: mine.plaza } : null);
      setMyLiberation(r.data.find(l => l.userId === user?.id) ?? null);
    });
    if (user?.role !== 'admin') {
      api.get(`/reservations/my/weekly?date=${ymd(selectedDate)}`).then(r => setQuota(r.data));
    }
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

  const refreshDate = async () => {
    const d = ymd(selectedDate);
    const r = await api.get<Liberation[]>(`/plazas/availability?date=${d}`);
    setLibs(r.data);
    const mine = r.data.find(l => l.reservation?.userId === user?.id && l.reservation?.status === 'confirmed');
    setMyReservation(mine?.reservation ?? null);
    setMyLiberation(r.data.find(l => l.userId === user?.id) ?? null);
    if (user?.role !== 'admin') {
      const qr = await api.get(`/reservations/my/weekly?date=${d}`);
      setQuota(qr.data);
    }
  };

  const handleReserve = async (libId: string) => {
    setActionLoading(libId); setError('');
    try {
      const { data: created } = await api.post<Reservation>('/reservations', { liberationId: libId });
      // Actualización inmediata: el backend ya devuelve plaza incluida
      setMyReservation(created);
      setQuota(prev => ({ ...prev, used: prev.used + 1 }));
      await refreshDate();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Error al reservar');
    } finally { setActionLoading(null); }
  };

  const handleCancelReservation = async () => {
    if (!myReservation) return;
    setActionLoading('cancel');
    try {
      await api.delete(`/reservations/${myReservation.id}`);
      setMyReservation(null);
      setQuota(prev => ({ ...prev, used: Math.max(0, prev.used - 1) }));
      await refreshDate();
    } finally { setActionLoading(null); }
  };

  const handleRecoverPlaza = async () => {
    if (!myLiberation) return;
    setActionLoading('recover');
    try { await api.delete(`/liberations/${myLiberation.id}`); await refreshDate(); }
    finally { setActionLoading(null); }
  };

  const handleUrgent = async () => {
    if (!urgentLib || urgentReason.trim().length < 10) return;
    setActionLoading('urgent');
    try {
      await api.post('/reservations/urgent', { liberationId: urgentLib.id, reason: urgentReason });
      setUrgentLib(null); setUrgentReason('');
      await refreshDate();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Error en reserva urgente');
    } finally { setActionLoading(null); }
  };

  return (
    <div className="px-5 pt-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[13px] text-gray-mid font-medium capitalize">{dateStr}</p>
          <h1 className="text-[24px] font-extrabold text-ink tracking-[-0.6px] mt-0.5">Hola, {firstName}</h1>
        </div>
      </div>

      {/* ── HERO: Plaza fija ── */}
      {user?.role === 'fixed' && plaza && (
        <div
          className="rounded-2xl p-5 text-white relative overflow-hidden mb-5"
          style={{ background: 'linear-gradient(135deg, #6A1873 0%, #58457A 100%)', boxShadow: '0 6px 20px rgba(106,24,115,0.25)' }}
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
              <div className="mt-3 px-3 py-2 rounded-lg text-[12px] font-semibold" style={{ background: 'rgba(255,255,255,0.15)' }}>
                🔓 Plaza liberada{myLiberation.reservation?.status === 'confirmed' ? ' · Reservada' : ''}
              </div>
            )}
            <div className="flex gap-2 mt-3">
              {myLiberation ? (
                <button
                  onClick={handleRecoverPlaza}
                  disabled={actionLoading === 'recover'}
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
                onClick={() => navigate('/mapa', { state: { highlightPlazaId: plaza?.id, floor: plaza?.floor } })}
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <Map size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO: Reserva activa ── */}
      {myReservation && (
        <Card className="rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-ok" />
            <span className="text-[11px] font-bold text-ok tracking-[1.2px] uppercase">
              Reserva confirmada · {new Date(myReservation.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </span>
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
            <Button variant="secondary" size="md" fullWidth onClick={() => navigate('/mapa', { state: { highlightPlazaId: myReservation.plazaId, floor: myReservation.plaza?.floor } })}>
              <Map size={16} /> Ver en el mapa
            </Button>
            <Button variant="danger" size="md" onClick={handleCancelReservation} disabled={actionLoading === 'cancel'}>
              <X size={16} />
            </Button>
          </div>
        </Card>
      )}

      {/* ── HERO: Admin stats ── */}
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

      {/* ── Cupo semanal ── */}
      {user?.role !== 'admin' && (
        <div className={`rounded-xl p-4 mb-5 ${isQuotaFull ? 'bg-warn-soft border border-warn/20' : 'bg-white border border-gray-line'}`}>
          <div className="flex items-center gap-2 mb-2">
            {isQuotaFull && <AlertTriangle size={16} className="text-warn" />}
            <p className="text-[13px] font-bold text-ink">Cupo semanal</p>
            <span className={`ml-auto text-[13px] font-bold ${isQuotaFull ? 'text-warn' : 'text-purple'}`}>
              {quota.used}/{quota.quota}
            </span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: quota.quota }).map((_, i) => (
              <div key={i} className={`flex-1 h-2 rounded-full ${i < quota.used ? (isQuotaFull ? 'bg-warn' : 'bg-purple') : 'bg-gray-line'}`} />
            ))}
          </div>
          {isQuotaFull && (
            <p className="text-[12px] text-warn font-medium mt-2">Has agotado tu cupo. Solo puedes usar reservas urgentes.</p>
          )}
        </div>
      )}

      {/* ── Selector de día ── */}
      <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-gray-mid mb-2">Selecciona día</p>
      <WeekStrip selected={selectedDate} onPick={setSelectedDate} disabledAfterDays={advance} />

      {/* ── Lista de plazas ── */}
      <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-gray-mid mt-5 mb-2">
        Plazas disponibles · {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
      </p>

      {error && <p className="text-[13px] text-red font-semibold bg-red-soft px-3 py-2 rounded-md mb-3">{error}</p>}

      {libs.length === 0 && (
        <p className="text-[14px] text-gray-mid font-medium py-4 text-center">No hay plazas liberadas para este día.</p>
      )}

      <div className="flex flex-col gap-2">
        {libs.map(lib => {
          const occupied    = lib.reservation?.status === 'confirmed';
          const isMyRes     = lib.reservation?.userId === user?.id && occupied;
          const isMyPlaza   = lib.plazaId === myPlazaId;
          const isMyLib     = lib.userId === user?.id;
          const ownerName   = lib.plaza?.assignedUsers?.[0]?.name ?? 'Titular';

          return (
            <div key={lib.id} className="bg-white rounded-xl border border-gray-line p-3 flex items-center gap-3">
              {/* Plaza badge */}
              <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${occupied ? 'bg-gray-bg' : 'bg-purple-soft'}`}>
                <p className="text-[10px] font-bold tracking-[0.4px] text-gray-mid">{lib.plaza?.floor}</p>
                <p className={`text-[22px] font-extrabold leading-none tracking-[-1px] ${occupied ? 'text-gray-mid' : 'text-purple'}`}>
                  {lib.plaza?.num}
                </p>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-ink truncate">{ownerName}</p>
                <p className="text-[12px] text-gray-mid font-medium">{HALF_DAY_LABELS[lib.halfDay]}</p>
                <div className="flex gap-1.5 mt-0.5 flex-wrap">
                  {isMyRes     && <Badge color="ok">Tu reserva</Badge>}
                  {isMyPlaza && !isMyLib && <Badge color="purple">Tu plaza</Badge>}
                  {occupied && !isMyRes && <Badge color="gray">Ocupada</Badge>}
                </div>
              </div>

              {/* Acción */}
              {isMyRes && (
                <Button size="sm" variant="danger" onClick={handleCancelReservation} disabled={actionLoading === 'cancel'}>
                  <X size={14} />
                </Button>
              )}
              {!occupied && !isMyPlaza && !isQuotaFull && (
                <Button size="sm" variant="secondary" onClick={() => handleReserve(lib.id)} disabled={actionLoading === lib.id}>
                  {actionLoading === lib.id ? '…' : 'Reservar'}
                </Button>
              )}
              {!occupied && !isMyPlaza && isQuotaFull && (
                <Button size="sm" variant="warn" onClick={() => { setUrgentLib(lib); setError(''); }}>
                  Urgente
                </Button>
              )}
              {occupied && !isMyRes && user?.role !== 'fixed' && (
                <Button size="sm" variant="warn" onClick={() => { setUrgentLib(lib); setError(''); }}>
                  Urgente
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Accesos rápidos (fixed) */}
      {user?.role === 'fixed' && (
        <>
          <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-gray-mid mt-5 mb-2">Accesos rápidos</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { t: 'Liberar varios días', s: 'Rango o recurrente', icon: <RotateCw size={22} className="text-purple" />, action: onLiberate },
              { t: 'Mi plaza en el mapa', s: plaza ? `${plaza.floor} · ${plaza.num}` : '', icon: <Map size={22} className="text-purple" />, action: () => navigate('/mapa') },
            ].map((q, i) => (
              <button key={i} onClick={q.action} className="bg-white rounded-xl p-3.5 border border-gray-line text-left active:bg-gray-bg transition-colors">
                <div className="w-[38px] h-[38px] rounded-[10px] bg-purple-soft flex items-center justify-center mb-2.5">{q.icon}</div>
                <p className="text-[14px] font-bold text-ink leading-tight">{q.t}</p>
                <p className="text-[12px] text-gray-mid mt-0.5">{q.s}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Sheet urgente */}
      <BottomSheet open={!!urgentLib} onClose={() => setUrgentLib(null)} title="Reserva urgente">
        <div className="pt-4 flex flex-col gap-4">
          <div className="bg-warn-soft rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-warn mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-bold text-warn">Solo desplaza a usuarios sin plaza fija</p>
                <p className="text-[12px] text-ink2 font-medium mt-1">
                  El usuario desplazado recibirá una notificación.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink2">Motivo (obligatorio)</label>
            <textarea
              value={urgentReason}
              onChange={e => setUrgentReason(e.target.value)}
              placeholder="Explica por qué necesitas esta plaza de forma urgente…"
              className="border border-gray-line rounded-md p-3 text-[14px] font-medium resize-none h-24 outline-none focus:border-purple"
            />
          </div>
          {error && <p className="text-[13px] text-red font-semibold bg-red-soft px-3 py-2 rounded-md">{error}</p>}
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setUrgentLib(null)}>Cancelar</Button>
            <Button variant="warn" className="flex-1" onClick={handleUrgent}
              disabled={actionLoading === 'urgent' || urgentReason.trim().length < 10}>
              {actionLoading === 'urgent' ? '…' : 'Quitar y reservar'}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
