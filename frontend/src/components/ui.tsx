import { type ReactNode, useEffect } from 'react';
import { cn } from '../lib/utils';

// ─── Button ──────────────────────────────────────────────────────────────────

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const btnBase = 'inline-flex items-center justify-center gap-2 font-semibold rounded-[14px] transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none';

const btnVariants: Record<BtnVariant, string> = {
  primary:   'bg-purple text-white shadow-btn',
  secondary: 'bg-purple-soft text-purple border border-purple-badge',
  ghost:     'bg-transparent text-ink2 border border-gray-line',
  danger:    'bg-red-soft text-red border border-red/20',
  warn:      'bg-warn-soft text-warn border border-warn/20',
};

const btnSizes = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-[52px] px-6 text-[15px]',
};

export function Button({ variant = 'primary', size = 'md', fullWidth, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(btnBase, btnVariants[variant], btnSizes[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-white rounded-xl shadow-card', className)} {...props}>
      {children}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeColor = 'purple' | 'ok' | 'warn' | 'red' | 'blue' | 'gray';

const badgeColors: Record<BadgeColor, string> = {
  purple: 'bg-purple-badge text-purple',
  ok:     'bg-ok-soft text-ok',
  warn:   'bg-warn-soft text-warn',
  red:    'bg-red-soft text-red',
  blue:   'bg-blue-soft text-blue',
  gray:   'bg-gray-bg text-gray-mid',
};

export function Badge({ color = 'purple', className, children }: { color?: BadgeColor; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-bold tracking-[0.4px] uppercase', badgeColors[color], className)}>
      {children}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'w-12 h-7 rounded-full relative transition-colors duration-200',
        checked ? 'bg-purple' : 'bg-gray-line',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-200',
          checked ? 'left-[22px]' : 'left-0.5',
        )}
      />
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-ink2">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'h-12 px-4 rounded-md border text-[15px] font-medium bg-white outline-none transition-colors',
          'border-gray-line focus:border-purple placeholder:text-gray-mid',
          error && 'border-red',
          className,
        )}
        {...props}
      />
      {error && <p className="text-[12px] text-red font-medium">{error}</p>}
    </div>
  );
}

// ─── BottomSheet ──────────────────────────────────────────────────────────────

export function BottomSheet({ open, onClose, children, title }: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 200ms ease' }}
      />
      {/* Sheet */}
      <div
        className="relative w-full bg-white rounded-t-[28px] shadow-sheet max-h-[92dvh] flex flex-col"
        style={{ animation: 'slideUp 260ms cubic-bezier(.2,.8,.3,1)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-line rounded-full" />
        </div>
        {title && (
          <div className="px-5 pt-1 pb-3 border-b border-gray-line">
            <h2 className="text-[17px] font-bold text-ink tracking-[-0.3px]">{title}</h2>
          </div>
        )}
        <div className="overflow-y-auto flex-1 px-5 pb-8">{children}</div>
      </div>
    </div>
  );
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-gray-mid mb-2 mt-4">
      {children}
    </p>
  );
}

// ─── Row (list item) ──────────────────────────────────────────────────────────

export function Row({ icon, label, sublabel, right, onClick, className }: {
  icon?: ReactNode;
  label: string;
  sublabel?: string;
  right?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white active:bg-gray-bg transition-colors text-left',
        className,
      )}
    >
      {icon && (
        <span className="w-9 h-9 rounded-[10px] bg-purple-soft flex items-center justify-center shrink-0 text-purple">
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-ink leading-tight">{label}</p>
        {sublabel && <p className="text-[13px] text-gray-mid font-medium">{sublabel}</p>}
      </div>
      {right}
    </button>
  );
}

// ─── SegmentedControl ─────────────────────────────────────────────────────────

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: any) => void;
}) {
  return (
    <div className="flex bg-gray-bg rounded-md p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 h-8 rounded-[8px] text-[13px] font-semibold transition-all',
            value === opt.value
              ? 'bg-white text-ink shadow-card'
              : 'text-gray-mid',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
