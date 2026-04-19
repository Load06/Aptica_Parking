// Common UI primitives

function Button({ children, variant='primary', size='md', onClick, icon, style={}, full=false, disabled=false }) {
  const sizes = {
    sm: { h: 34, px: 14, fs: 13, rad: 10 },
    md: { h: 44, px: 18, fs: 15, rad: 12 },
    lg: { h: 54, px: 22, fs: 16, rad: 14 },
  };
  const s = sizes[size];
  const variants = {
    primary: { bg: APTICA.purple, color: '#fff', border: 'transparent', shadow: '0 1px 2px rgba(106,24,115,0.12), 0 6px 16px rgba(106,24,115,0.22)' },
    secondary:{ bg: '#fff', color: APTICA.purple, border: APTICA.grayLine, shadow: '0 1px 2px rgba(0,0,0,0.03)' },
    ghost:   { bg: 'transparent', color: APTICA.ink2, border: 'transparent', shadow: 'none' },
    danger:  { bg: '#fff', color: APTICA.red, border: APTICA.grayLine, shadow: 'none' },
    soft:    { bg: APTICA.purpleSoft, color: APTICA.purple, border: 'transparent', shadow: 'none' },
    dark:    { bg: APTICA.ink, color: '#fff', border: 'transparent', shadow: '0 1px 2px rgba(0,0,0,0.1)' },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      height: s.h, padding: `0 ${s.px}px`, borderRadius: s.rad,
      background: v.bg, color: v.color, border: `1px solid ${v.border}`,
      fontFamily: APT_FONT, fontSize: s.fs, fontWeight: 600, letterSpacing: -0.1,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: v.shadow,
      opacity: disabled ? 0.5 : 1, width: full ? '100%' : undefined,
      transition: 'transform .12s ease, box-shadow .2s',
      ...style,
    }}>
      {icon}{children}
    </button>
  );
}

function Card({ children, style={}, pad=16, radius=20 }) {
  return (
    <div style={{
      background: '#fff', borderRadius: radius, padding: pad,
      border: `1px solid ${APTICA.grayLine}`,
      boxShadow: '0 1px 2px rgba(26,18,32,0.03), 0 2px 10px rgba(26,18,32,0.025)',
      ...style,
    }}>{children}</div>
  );
}

function Badge({ children, color='purple', style={} }) {
  const colors = {
    purple: { bg: APTICA.purpleSoft, fg: APTICA.purple },
    blue:   { bg: APTICA.blueSoft,   fg: APTICA.blue },
    green:  { bg: APTICA.okSoft,     fg: APTICA.ok },
    orange: { bg: APTICA.warnSoft,   fg: APTICA.warn },
    red:    { bg: APTICA.redSoft,    fg: APTICA.red },
    gray:   { bg: APTICA.grayBg,     fg: APTICA.gray },
  };
  const c = colors[color] || colors.purple;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: c.bg, color: c.fg, padding: '3px 8px', borderRadius: 999,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.2, textTransform: 'uppercase',
      ...style,
    }}>{children}</span>
  );
}

function Avatar({ name='?', color=APTICA.purple, size=38, initials }) {
  const i = initials || name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: size/2,
      background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: APT_FONT, fontWeight: 700, fontSize: size*0.36,
      letterSpacing: -0.2, flexShrink: 0,
    }}>{i}</div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={()=>onChange(!on)} style={{
      width: 44, height: 26, borderRadius: 999,
      background: on ? APTICA.purple : '#D8D6DC',
      border: 'none', padding: 0, cursor: 'pointer', position: 'relative',
      transition: 'background .18s',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: 10, background: '#fff',
        boxShadow: '0 1px 2px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.08)',
        transition: 'left .18s',
      }}/>
    </button>
  );
}

function Row({ title, subtitle, left, right, onClick, last=false }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px', cursor: onClick ? 'pointer' : 'default',
      borderBottom: last ? 'none' : `1px solid ${APTICA.grayLine}`,
    }}>
      {left}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: APTICA.ink, letterSpacing: -0.1 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: APTICA.grayMid, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '0 20px', marginBottom: 10, marginTop: 4,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: APTICA.grayMid,
        textTransform: 'uppercase', letterSpacing: 1.2,
      }}>{children}</div>
      {right}
    </div>
  );
}

// Bottom sheet modal
function BottomSheet({ open, onClose, children, title, height='auto' }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(26,18,32,0.32)',
        animation: 'fadein .2s ease',
      }}/>
      <div style={{
        position: 'relative', background: '#fff', width: '100%',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '10px 0 32px', maxHeight: '92%', overflow: 'auto',
        animation: 'slideup .26s cubic-bezier(.2,.8,.3,1)',
        boxShadow: '0 -6px 24px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          width: 36, height: 5, borderRadius: 3, background: '#DAD7DD',
          margin: '6px auto 12px',
        }}/>
        {title && (
          <div style={{
            padding: '4px 24px 16px',
            fontSize: 20, fontWeight: 700, color: APTICA.ink, letterSpacing: -0.3,
          }}>{title}</div>
        )}
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type='text', icon, suffix }) {
  return (
    <div>
      {label && <div style={{
        fontSize: 12, fontWeight: 600, color: APTICA.gray, marginBottom: 6, letterSpacing: 0.1,
      }}>{label}</div>}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        height: 48, padding: '0 14px',
        background: '#fff', borderRadius: 12,
        border: `1px solid ${APTICA.grayLine}`,
      }}>
        {icon}
        <input value={value} onChange={e=>onChange?.(e.target.value)} type={type} placeholder={placeholder}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: APT_FONT, fontSize: 15, color: APTICA.ink,
          }}/>
        {suffix}
      </div>
    </div>
  );
}

Object.assign(window, { Button, Card, Badge, Avatar, Toggle, Row, SectionTitle, BottomSheet, Input });
