import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import type { Liberation } from '../types';
import { Badge, BottomSheet, Button } from '../components/ui';
import { WeekStrip } from '../components/WeekStrip';
import { ymd, HALF_DAY_LABELS } from '../lib/utils';

export function ReserveScreen() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [libs, setLibs] = useState<Liberation[]>([]);
  const [quota, setQuota] = useState({ used: 0, quota: 3 });
  const [rules, setRules] = useState({ advanceBookingHours: 48 });
  const [urgentLib, setUrgentLib] = useState<Liberation | null>(null);
  const [urgentReason, setUrgentReason] = useState('');
  const [urgentCount] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const advance = rules.advanceBookingHours / 24;

  useEffect(() => {
    api.get('/reservations/my/weekly').then(r => setQuota(r.data));
    api.get('/admin/rules').then(r => setRules(r.data));
  }, []);

  useEffect(() => {
    api.get<Liberation[]>(`/plazas/availability?date=${ymd(selectedDate)}`).then(r => setLibs(r.data));
  }, [selectedDate]);

  const handleReserve = async (libId: string) => {
    setLoading(libId); setError('');
    try {
      await api.post('/reservations', { liberationId: libId });
      api.get<Liberation[]>(`/plazas/availability?date=${ymd(selectedDate)}`).then(r => setLibs(r.data));
      api.get('/reservations/my/weekly').then(r => setQuota(r.data));
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Error al reservar');
    } finally {
      setLoading(null);
    }
  };

  const handleUrgent = async () => {
    if (!urgentLib || !urgentReason.trim()) return;
    setLoading('urgent'); setError('');
    try {
      await api.post('/reservations/urgent', { liberationId: urgentLib.id, reason: urgentReason });
      setUrgentLib(null);
      api.get<Liberation[]>(`/plazas/availability?date=${ymd(selectedDate)}`).then(r => setLibs(r.data));
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Error en reserva urgente');
    } finally {
      setLoading(null);
    }
  };

  const isQuotaFull = quota.used >= quota.quota;

  return (
    <div className="px-5 pt-4 pb-4">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[22px] font-extrabold text-ink tracking-[-0.6px]">Reservar plaza</h1>
        <p className="text-[13px] text-gray-mid font-medium mt-0.5">
          Ventana: <span className="font-bold text-ink2">{rules.advanceBookingHours}h por adelantado</span>
        </p>
      </div>

      {/* Cupo semanal */}
      <div className={`rounded-xl p-4 mb-5 ${isQuotaFull ? 'bg-warn-soft border border-warn/20' : 'bg-white border border-gray-line'}`}>
        <div className="flex items-center gap-2 mb-2">
          {isQuotaFull && <AlertTriangle size={16} className="text-warn" />}
          <p className="text-[13px] font-bold text-ink">Tu cupo semanal</p>
          <span className={`ml-auto text-[13px] font-bold ${isQuotaFull ? 'text-warn' : 'text-purple'}`}>
            {quota.used}/{quota.quota}
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: quota.quota }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full ${i < quota.used ? (isQuotaFull ? 'bg-warn' : 'bg-purple') : 'bg-gray-line'}`}
            />
          ))}
        </div>
        {isQuotaFull && (
          <p className="text-[12px] text-warn font-medium mt-2">Has agotado tu cupo. Solo puedes usar reservas urgentes.</p>
        )}
      </div>

      {/* Date picker */}
      <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-gray-mid mb-2">Selecciona día</p>
      <WeekStrip selected={selectedDate} onPick={setSelectedDate} disabledAfterDays={advance} />

      {/* Plaza list */}
      <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-gray-mid mt-5 mb-2">
        Plazas disponibles — {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
      </p>

      {error && <p className="text-[13px] text-red font-semibold bg-red-soft px-3 py-2 rounded-md mb-3">{error}</p>}

      {libs.length === 0 && (
        <p className="text-[14px] text-gray-mid font-medium py-4 text-center">No hay plazas liberadas para este día.</p>
      )}

      <div className="flex flex-col gap-2">
        {libs.map(lib => {
          const occupied = !!lib.reservation && lib.reservation.status === 'confirmed';
          const isMe = lib.reservation?.userId === user?.id;
          return (
            <div key={lib.id} className="bg-white rounded-xl border border-gray-line p-3 flex items-center gap-3">
              {/* Plaza tile */}
              <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${occupied ? 'bg-gray-bg' : 'bg-purple-soft'}`}>
                <p className="text-[10px] font-bold tracking-[0.4px] text-gray-mid">{lib.plaza?.floor}</p>
                <p className={`text-[22px] font-extrabold leading-none tracking-[-1px] ${occupied ? 'text-gray-mid' : 'text-purple'}`}>
                  {lib.plaza?.num}
                </p>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-ink truncate">{lib.plaza?.owner?.name ?? 'Titular'}</p>
                <p className="text-[12px] text-gray-mid font-medium">{HALF_DAY_LABELS[lib.halfDay]}</p>
                {occupied && !isMe && (
                  <Badge color="gray" className="mt-0.5">Ocupada</Badge>
                )}
                {isMe && (
                  <Badge color="ok" className="mt-0.5">Tu reserva</Badge>
                )}
              </div>
              {/* Action */}
              {!occupied && !isQuotaFull && (
                <Button size="sm" variant="secondary" onClick={() => handleReserve(lib.id)} disabled={loading === lib.id}>
                  {loading === lib.id ? '…' : 'Reservar'}
                </Button>
              )}
              {occupied && !isMe && user?.role !== 'fixed' && (
                <Button size="sm" variant="warn" onClick={() => setUrgentLib(lib)}>
                  Urgente
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Urgent sheet */}
      <BottomSheet open={!!urgentLib} onClose={() => setUrgentLib(null)} title="Reserva urgente">
        <div className="pt-4 flex flex-col gap-4">
          <div className="bg-warn-soft rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-warn mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-bold text-warn">Solo desplaza a usuarios sin plaza fija</p>
                <p className="text-[12px] text-ink2 font-medium mt-1">
                  Llevas {urgentCount} de {quota.quota} urgentes este mes. El usuario desplazado recibirá una notificación.
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
            <Button variant="warn" className="flex-1" onClick={handleUrgent} disabled={loading === 'urgent' || urgentReason.trim().length < 10}>
              {loading === 'urgent' ? '…' : 'Quitar y reservar'}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
