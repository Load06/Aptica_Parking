// Calendar — multi-select, range, recurring, half-day support
function Calendar({ selected = [], onToggle, mode = 'multi', minDate, monthOffset = 0 }) {
  const [cursor, setCursor] = React.useState(startOfMonth(TODAY));

  React.useEffect(() => {
    if (monthOffset !== 0) setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + monthOffset, 1));
  }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first index
  const firstDow = (first.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (d) => selected.some(s => sameYMD(s, d));
  const selectedSet = new Set(selected.map(ymd));

  return (
    <div style={{ fontFamily: APT_FONT }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 4px 14px',
      }}>
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} style={{
          width: 36, height: 36, border: `1px solid ${APTICA.grayLine}`, background: '#fff',
          borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Chev dir="left" color={APTICA.ink2}/></button>
        <div style={{ fontSize: 16, fontWeight: 700, color: APTICA.ink, letterSpacing: -0.2 }}>
          {MONTHS_ES[month]} {year}
        </div>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} style={{
          width: 36, height: 36, border: `1px solid ${APTICA.grayLine}`, background: '#fff',
          borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Chev dir="right" color={APTICA.ink2}/></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
        {DAYS_ES.map((d,i) => (
          <div key={i} style={{
            textAlign: 'center', fontSize: 11, fontWeight: 700, color: APTICA.grayMid,
            letterSpacing: 0.4, padding: 4,
          }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const isToday = sameYMD(d, TODAY);
          const sel = selectedSet.has(ymd(d));
          const past = d < TODAY && !isToday;
          const we = isWeekend(d);

          // Build range visual — if range mode and selected has 2 dates
          let isBetween = false;
          if (mode === 'range' && selected.length === 2) {
            const [a,b] = [...selected].sort((x,y)=>x-y);
            if (d > a && d < b) isBetween = true;
          }

          return (
            <button key={i} disabled={past} onClick={() => onToggle?.(d)} style={{
              aspectRatio: '1', border: 'none',
              background: sel ? APTICA.purple : isBetween ? APTICA.purpleSoft : 'transparent',
              color: sel ? '#fff' : past ? '#C8C5CC' : we ? APTICA.grayMid : APTICA.ink,
              borderRadius: 12, cursor: past ? 'not-allowed' : 'pointer',
              fontFamily: APT_FONT, fontSize: 14, fontWeight: sel || isToday ? 700 : 500,
              position: 'relative',
              transition: 'background .15s, transform .1s',
              outline: isToday && !sel ? `1.5px solid ${APTICA.purple}` : 'none',
              outlineOffset: -1.5,
            }}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Weekly strip calendar (compact, today-first screen)
function WeekStrip({ selected, onPick }) {
  const start = addDays(TODAY, -((TODAY.getDay()+6)%7)); // monday
  const days = Array.from({length: 14}, (_,i) => addDays(start, i));
  return (
    <div style={{
      display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 20px 14px',
      scrollbarWidth: 'none',
    }}>
      {days.map((d,i) => {
        const sel = selected && sameYMD(d, selected);
        const isToday = sameYMD(d, TODAY);
        const past = d < TODAY && !isToday;
        return (
          <button key={i} onClick={()=>onPick?.(d)} disabled={past} style={{
            minWidth: 52, padding: '10px 6px', borderRadius: 14,
            background: sel ? APTICA.purple : '#fff',
            color: sel ? '#fff' : past ? '#C8C5CC' : APTICA.ink,
            border: `1px solid ${sel ? APTICA.purple : APTICA.grayLine}`,
            fontFamily: APT_FONT, cursor: past ? 'not-allowed' : 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase' }}>
              {DAYS_ES_LONG[(d.getDay()+6)%7]}
            </span>
            <span style={{ fontSize: 18, fontWeight: 700 }}>{d.getDate()}</span>
            {isToday && !sel && <span style={{ width: 4, height: 4, background: APTICA.purple, borderRadius: 2 }}/>}
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, { Calendar, WeekStrip });
