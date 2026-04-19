import { addDays, ymd } from '../lib/utils';
import { cn } from '../lib/utils';

const DAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

interface Props {
  selected: Date;
  onPick: (d: Date) => void;
  disabledAfterDays?: number;
}

export function WeekStrip({ selected, onPick, disabledAfterDays }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-none">
      {days.map((d) => {
        const isToday   = ymd(d) === ymd(today);
        const isSelected = ymd(d) === ymd(selected);
        const isWeekend  = d.getDay() === 0 || d.getDay() === 6;
        const isDisabled = disabledAfterDays !== undefined && (d.getTime() - today.getTime()) / 86400000 > disabledAfterDays;

        return (
          <button
            key={ymd(d)}
            onClick={() => !isDisabled && onPick(d)}
            disabled={isDisabled}
            className={cn(
              'flex flex-col items-center justify-center rounded-xl shrink-0 w-[52px] h-[66px] transition-all',
              isSelected && 'bg-purple text-white',
              !isSelected && isToday && 'bg-purple-soft text-purple border border-purple',
              !isSelected && !isToday && 'bg-white border border-gray-line',
              isWeekend && !isSelected && 'text-gray-mid',
              isDisabled && 'opacity-40 pointer-events-none',
            )}
          >
            <span className={cn('text-[11px] font-bold tracking-[0.4px] uppercase', isSelected ? 'text-white/70' : 'text-gray-mid')}>
              {DAYS[d.getDay()]}
            </span>
            <span className={cn('text-[17px] font-extrabold leading-none mt-0.5', isSelected ? 'text-white' : 'text-ink')}>
              {d.getDate()}
            </span>
            {isToday && !isSelected && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple mt-1" />
            )}
          </button>
        );
      })}
    </div>
  );
}
