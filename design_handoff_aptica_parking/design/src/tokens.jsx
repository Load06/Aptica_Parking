// Design tokens for Aptica Parking
const APTICA = {
  purple: '#6A1873',
  purpleDark: '#58457A',
  purpleSoft: '#F4EEF5',
  purpleBadge: '#EADDEE',
  blue: '#7296BC',
  blueSoft: '#EAF1F8',
  gray: '#5A5A5C',
  grayMid: '#8E8E93',
  grayLine: '#E8E6EA',
  grayBg: '#F6F5F7',
  bg: '#FBFAFC',
  ink: '#1A1220',
  ink2: '#3A3340',
  ok: '#2E9E6A',
  okSoft: '#E6F4ED',
  warn: '#D97706',
  warnSoft: '#FDF2E0',
  red: '#C4314B',
  redSoft: '#FBE8EC',
};

const APT_FONT = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

// Reusable chevron
const Chev = ({ dir = 'right', size = 12, color = '#8E8E93', w = 2 }) => {
  const rotations = { right: 0, left: 180, up: -90, down: 90 };
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 8 12" style={{ transform: `rotate(${rotations[dir]}deg)` }}>
      <path d="M1 1l6 5-6 5" stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// Icons — simple stroked set
const Icon = {
  home:    (c='#5A5A5C',s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V11z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  calendar:(c='#5A5A5C',s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="3" stroke={c} strokeWidth="1.8"/><path d="M3 10h18M8 3v4M16 3v4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  map:     (c='#5A5A5C',s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 4v14M15 6v14" stroke={c} strokeWidth="1.8"/></svg>,
  user:    (c='#5A5A5C',s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.8"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  plus:    (c='#fff',s=20) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke={c} strokeWidth="2.4" strokeLinecap="round"/></svg>,
  bell:    (c='#5A5A5C',s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><path d="M10 19a2 2 0 004 0" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  check:   (c='#fff',s=16) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M5 12l4 4 10-10" stroke={c} strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close:   (c='#5A5A5C',s=18) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>,
  car:     (c='#5A5A5C',s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 13l2-5c.4-1.1 1.4-2 2.6-2h8.8c1.2 0 2.2.9 2.6 2l2 5" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><rect x="3" y="13" width="18" height="6" rx="1.5" stroke={c} strokeWidth="1.8"/><circle cx="7.5" cy="19" r="1.5" fill={c}/><circle cx="16.5" cy="19" r="1.5" fill={c}/></svg>,
  key:     (c='#5A5A5C',s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="8" cy="15" r="4" stroke={c} strokeWidth="1.8"/><path d="M11 13l9-9m-3 3l2 2m-4 0l2 2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  bolt:    (c='#fff',s=16) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill={c}/></svg>,
  clock:   (c='#5A5A5C',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8"/><path d="M12 7v5l3 2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  shield:  (c='#5A5A5C',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-3z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  settings:(c='#5A5A5C',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={c} strokeWidth="1.8"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" stroke={c} strokeWidth="1.6"/></svg>,
  logout:  (c='#C4314B',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l5-5-5-5M15 12H3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  moon:    (c='#5A5A5C',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M20 15a8 8 0 01-11-11 8 8 0 1011 11z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  lock:    (c='#5A5A5C',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="4" y="11" width="16" height="10" rx="2" stroke={c} strokeWidth="1.8"/><path d="M8 11V7a4 4 0 018 0v4" stroke={c} strokeWidth="1.8"/></svg>,
  mail:    (c='#5A5A5C',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke={c} strokeWidth="1.8"/><path d="M3 7l9 6 9-6" stroke={c} strokeWidth="1.8"/></svg>,
  phone:   (c='#5A5A5C',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 5a2 2 0 012-2h2l2 5-2 1a11 11 0 006 6l1-2 5 2v2a2 2 0 01-2 2A16 16 0 014 5z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  trash:   (c='#C4314B',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  edit:    (c='#5A5A5C',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 20h4l11-11-4-4L4 16v4z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  search:  (c='#8E8E93',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={c} strokeWidth="1.8"/><path d="M20 20l-4-4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  sun:     (c='#5A5A5C',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke={c} strokeWidth="1.8"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  arrow:   (c='#6A1873',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  info:    (c='#5A5A5C',s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8"/><path d="M12 11v6M12 7.5v.5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  repeat:  (c='#5A5A5C',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M17 3l3 3-3 3M20 6H8a5 5 0 00-5 5M7 21l-3-3 3-3M4 18h12a5 5 0 005-5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  users:   (c='#5A5A5C',s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.5" stroke={c} strokeWidth="1.8"/><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><path d="M16 7a3 3 0 010 6M18 20c0-2.6-1.6-4.9-4-5.7" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  flag:    (c='#fff',s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 3v18M5 4h12l-2 4 2 4H5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  motor:   (c='#6A1873',s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="5" cy="16" r="3" stroke={c} strokeWidth="1.6"/><circle cx="19" cy="16" r="3" stroke={c} strokeWidth="1.6"/><path d="M5 16l5-7h3l2 3h4" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

Object.assign(window, { APTICA, APT_FONT, Chev, Icon });
