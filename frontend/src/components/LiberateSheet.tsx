import { useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { es } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { BottomSheet, Button, SegmentedControl } from './ui';
import { ymd, isWeekend } from '../lib/utils';

type Mode = 'single' | 'range' | 'recurring';
type HalfDay = 'full' | 'am' | 'pm';
type Until = '1m' | '3m' | '6m' | 'indefinite';
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface Props { open: boolean; onClose: () => void; }

export function LiberateSheet({ open, onClose }: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('single');
  const [halfDay, setHalfDay] = useState<HalfDay>('full');
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [range, setRange] = useState<DateRange>({ from: undefined });
  const [recWeekday, setRecWeekday] = useState(0);
  const [until, setUntil] = useState<Until>('1m');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const today = new Date(); today.setHours(0,0,0,0);
  const plazaId = user?.assignedPlaza?.id;

  const untilDate = (u: Until) => {
    const d = new Date();
    if (u === '1m') d.setMonth(d.getMonth() + 1);
    else if (u === '3m') d.setMonth(d.getMonth() + 3);
    else if (u === '6m') d.setMonth(d.getMonth() + 6);
    else d.setFullYear(d.getFullYear() + 5);
    return ymd(d);
  };

  const handleLiberate = async () => {
    if (!plazaId) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      let dates: string[] = [];
      if (mode === 'single') dates = selectedDays.filter(d => !isWeekend(d)).map(ymd);
      if (mode === 'range' && range.from && range.to!) {
        const cur = new Date(range.from);
        while (cur <= range.to!) {
          if (!isWeekend(cur)) dates.push(ymd(cur));
          cur.setDate(cur.getDate() + 1);
        }
      }

      const body = mode === 'recurring'
        ? { plazaId, dates: [], halfDay, recurrent: true, weekday: recWeekday, until: untilDate(until) }
        : { plazaId, dates, halfDay };

      const { data } = await api.post('/liberations', body);
      setSuccess(`✓ ${data.created} días liberados`);
      setTimeout(() => { setSuccess(''); onClose(); }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Error al liberar');
    } finally {
      setLoading(false);
    }
  };

  const daysCount = mode === 'single'
    ? selectedDays.filter(d => !isWeekend(d)).length
    : mode === 'range' && range.from && range.to
      ? Math.round((range.to.getTime() - range.from.getTime()) / 86400000) + 1
      : 0;

  const modifiers = { weekend: (d: Date) => isWeekend(d), today: today };
  const modifiersClassNames = {
    weekend: 'text-gray-mid opacity-60',
    today: 'border border-purple text-purple',
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Liberar plaza">
      <div className="pt-4 flex flex-col gap-4">
        <SegmentedControl
          options={[
            { value: 'single' as Mode,     label: 'Días sueltos' },
            { value: 'range' as Mode,      label: 'Rango' },
            { value: 'recurring' as Mode,  label: 'Recurrente' },
          ]}
          value={mode}
          onChange={setMode}
        />

        {/* Calendar */}
        {mode === 'single' && (
          <DayPicker
            mode="multiple"
            selected={selectedDays}
            onSelect={days => setSelectedDays(days ?? [])}
            disabled={[{ before: today }, isWeekend]}
            locale={es}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="!m-0 w-full"
          />
        )}
        {mode === 'range' && (
          <DayPicker
            mode="range"
            selected={range}
            onSelect={r => setRange(r ?? { from: undefined })}
            disabled={{ before: today }}
            locale={es}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="!m-0 w-full"
          />
        )}
        {mode === 'recurring' && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[13px] font-semibold text-ink2 mb-2">Día de la semana</p>
              <div className="flex gap-1.5 flex-wrap">
                {WEEKDAYS.map((d, i) => (
                  <button
                    key={d}
                    onClick={() => setRecWeekday(i)}
                    className={`h-9 px-3 rounded-md text-[13px] font-semibold transition-colors ${
                      recWeekday === i ? 'bg-purple text-white' : 'bg-gray-bg text-ink2'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-ink2 mb-2">Hasta</p>
              <div className="grid grid-cols-2 gap-1.5">
                {([['1m','1 mes'],['3m','3 meses'],['6m','6 meses'],['indefinite','Indefinido']] as [Until, string][]).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setUntil(v)}
                    className={`h-10 rounded-md text-[13px] font-semibold transition-colors ${
                      until === v ? 'bg-purple text-white' : 'bg-gray-bg text-ink2'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Horario */}
        <div>
          <p className="text-[13px] font-semibold text-ink2 mb-2">Horario</p>
          <div className="grid grid-cols-3 gap-2">
            {([['full','Día completo'],['am','Solo mañana\n8–14h'],['pm','Solo tarde\n14–19h']] as [HalfDay, string][]).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setHalfDay(v)}
                className={`h-14 rounded-xl text-[12px] font-semibold leading-tight transition-colors whitespace-pre-line ${
                  halfDay === v ? 'bg-purple text-white' : 'bg-gray-bg text-ink2'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Resumen */}
        {(mode !== 'recurring' && daysCount > 0) && (
          <div className="bg-gray-bg rounded-xl px-4 py-3">
            <p className="text-[13px] font-semibold text-ink2">
              {daysCount} día{daysCount !== 1 ? 's' : ''} seleccionado{daysCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {error  && <p className="text-[13px] text-red font-semibold bg-red-soft px-3 py-2 rounded-md">{error}</p>}
        {success && <p className="text-[13px] text-ok font-semibold bg-ok-soft px-3 py-2 rounded-md">{success}</p>}

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleLiberate}
            disabled={loading || (!plazaId) || (mode !== 'recurring' && daysCount === 0)}
          >
            {loading ? 'Liberando…' : 'Liberar'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
