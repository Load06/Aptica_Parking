// ParkingMap — SVG renderer for the two floors

function ParkingMap({ floor, slots, onSlotClick, highlight = [], reservedToday = {}, myPlazaId, interactive = true, compact = false }) {
  // Layout constants — tuned to match source PDFs visually
  const stallW = 34;
  const stallH = compact ? 22 : 26;
  const gap = 4;
  const bayGap = 76; // aisle width
  const topPad = compact ? 66 : 88;
  const leftPad = 28;

  // Positions:
  // Top row is outside perimeter with 17 cells; crosswalks at 8, 10 (ramps/gaps)
  const topW = 17;
  const topStartX = leftPad;
  const topY = topPad - stallH - 18;

  // Three bays stacked vertically; each bay has 18 rows
  // Left bay: inner(80..97) + outer(98..115) — two columns
  // We'll size layout so 3 bays fit with aisles.
  const bayStartY = topPad + 6;
  const colGap = 2;

  const bayWidth = stallW * 2 + colGap; // two cols
  const bayXLeft = leftPad;
  const bayXMid = bayXLeft + bayWidth + bayGap;
  const bayXRight = bayXMid + bayWidth + bayGap;

  const totalW = bayXRight + bayWidth + leftPad;
  // Left bay: 18 rows
  const leftRows = 18;
  const midRows = 22; // with island
  const rightRows = 18;
  const bayH = Math.max(leftRows, midRows, rightRows) * (stallH + gap) - gap;
  const totalH = bayH + topPad + 50;

  // Helpers
  const renderStall = (s, x, y) => {
    const isAssigned = !!s.assigned;
    const isMine = s.id === myPlazaId;
    const isHighlight = highlight.includes(s.id);
    const resToday = reservedToday[s.id];
    const isService = s.isService;
    const isMoto = s.isMoto;
    const fill = isService
      ? APTICA.purpleDark
      : isAssigned
        ? APTICA.purple
        : resToday ? APTICA.purpleSoft : '#fff';
    const stroke = isMine ? APTICA.ok : isHighlight ? APTICA.purple : APTICA.grayLine;
    const strokeW = isMine || isHighlight ? 2 : 1;
    const textColor = (isAssigned || isService) ? '#fff' : APTICA.ink2;
    return (
      <g key={s.id} onClick={() => interactive && onSlotClick?.(s)} style={{ cursor: interactive ? 'pointer' : 'default' }}>
        <rect x={x} y={y} width={stallW} height={stallH} rx={2} fill={fill} stroke={stroke} strokeWidth={strokeW} />
        {isAssigned && s.assigned.tag && !compact && (
          <text x={x + stallW/2} y={y + stallH/2 - 2} textAnchor="middle" fill={textColor}
            style={{ fontFamily: APT_FONT, fontSize: 5.4, fontWeight: 700 }}>
            {String(s.assigned.tag).length > 14 ? s.assigned.tag.slice(0,14)+'…' : s.assigned.tag}
          </text>
        )}
        {isAssigned && s.assigned.name && !s.assigned.tag && !compact && (
          <text x={x + stallW/2} y={y + stallH/2 - 2} textAnchor="middle" fill={textColor}
            style={{ fontFamily: APT_FONT, fontSize: 6, fontWeight: 700 }}>
            {s.assigned.name}
          </text>
        )}
        <text x={x + stallW/2} y={y + stallH - (compact?5:4)} textAnchor="middle" fill={textColor}
          style={{ fontFamily: APT_FONT, fontSize: compact?7:8.5, fontWeight: 700 }}>
          {s.num}
        </text>
        {isMoto && (
          <circle cx={x+stallW-5} cy={y+5} r={3} fill="#fff" stroke={APTICA.purple} strokeWidth={0.8}/>
        )}
        {resToday && !isAssigned && (
          <circle cx={x+stallW-5} cy={y+5} r={3} fill={APTICA.purple}/>
        )}
      </g>
    );
  };

  // Build lookup by slot.bay / col / row
  const byKey = {};
  slots.forEach(s => { byKey[`${s.bay}_${s.col||''}_${s.row}`] = s; byKey[`top_${s.num}`] = s.bay==='top'?s:byKey[`top_${s.num}`]; });

  // Top row — positions from right-to-left: 1 is at the far right, 17 at left.
  const topCells = [];
  for (let i = 1; i <= 17; i++) {
    const s = slots.find(x => x.bay==='top' && x.num===i);
    if (!s) continue;
    // position: x from right: (17 - i) slot from left-start
    const x = leftPad + (17 - i) * (stallW + gap);
    if (s.isRamp) {
      topCells.push(
        <g key={'top-ramp-'+i}>
          <rect x={x} y={topY} width={stallW} height={stallH} rx={2} fill="#E8E6EA" />
          <path d={`M${x+3},${topY+4} h${stallW-6} M${x+3},${topY+stallH/2} h${stallW-6} M${x+3},${topY+stallH-4} h${stallW-6}`} stroke="#fff" strokeWidth={1.5}/>
        </g>
      );
    } else {
      topCells.push(renderStall(s, x, topY));
    }
  }

  // Left bay: outer col (leftmost) 115..98 top-to-bottom; inner col 80..97
  const leftCells = [];
  for (let row = 1; row <= 18; row++) {
    const outer = slots.find(s => s.bay==='left' && s.col==='outer' && s.row===row);
    const inner = slots.find(s => s.bay==='left' && s.col==='inner' && s.row===row);
    const y = bayStartY + (row - 1) * (stallH + gap);
    if (outer) leftCells.push(renderStall(outer, bayXLeft, y));
    if (inner) leftCells.push(renderStall(inner, bayXLeft + stallW + colGap, y));
  }

  // Middle bay: top section rows 1..8 (L:53..46, R:54..61), island rows 9..13, bottom rows 14..18
  const midCells = [];
  // top 8 rows
  for (let row = 1; row <= 8; row++) {
    const l = slots.find(s => s.bay==='mid' && s.col==='outer' && s.row===row);
    const r = slots.find(s => s.bay==='mid' && s.col==='inner' && s.row===row);
    const y = bayStartY + (row - 1) * (stallH + gap);
    if (l) midCells.push(renderStall(l, bayXMid, y));
    if (r) midCells.push(renderStall(r, bayXMid + stallW + colGap, y));
  }
  // island placeholder rows 9..13 (approximate)
  const islandY = bayStartY + 8 * (stallH + gap);
  const islandH = 5 * (stallH + gap) - gap;
  midCells.push(
    <g key="island">
      <rect x={bayXMid} y={islandY} width={bayWidth} height={islandH} fill="#E8E6EA" rx={3}/>
      <line x1={bayXMid} y1={islandY} x2={bayXMid+bayWidth} y2={islandY+islandH} stroke="#C8C5CC" strokeWidth={0.8}/>
      <line x1={bayXMid+bayWidth} y1={islandY} x2={bayXMid} y2={islandY+islandH} stroke="#C8C5CC" strokeWidth={0.8}/>
    </g>
  );
  // bottom rows 14..18 — use our data rows 14..18
  for (let row = 14; row <= 18; row++) {
    const l = slots.find(s => s.bay==='mid' && s.col==='outer' && s.row===row);
    const r = slots.find(s => s.bay==='mid' && s.col==='inner' && s.row===row);
    const y = bayStartY + (row - 1) * (stallH + gap);
    if (l) midCells.push(renderStall(l, bayXMid, y));
    if (r) midCells.push(renderStall(r, bayXMid + stallW + colGap, y));
  }

  // Right bay: outer (left col) 53..36, inner (right col) 18..35
  const rightCells = [];
  for (let row = 1; row <= 18; row++) {
    const outer = slots.find(s => s.bay==='right' && s.col==='outer' && s.row===row);
    const inner = slots.find(s => s.bay==='right' && s.col==='inner' && s.row===row);
    const y = bayStartY + (row - 1) * (stallH + gap);
    if (outer) rightCells.push(renderStall(outer, bayXRight, y));
    if (inner) rightCells.push(renderStall(inner, bayXRight + stallW + colGap, y));
  }

  // Arrows (traffic flow)
  const arrow = (x1,y1,x2,y2,k) => (
    <g key={k}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#D8D6DC" strokeWidth={2} markerEnd="url(#arr)"/>
    </g>
  );

  // Entrada / Salida (depends on floor — mirror for P-1)
  const mirror = floor === 'P-1';
  const entranceX = mirror ? bayXRight + bayWidth + 10 : bayXRight + bayWidth + 10;
  const exitX = mirror ? leftPad - 12 : leftPad - 12;

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} width="100%" style={{ maxWidth: '100%', display: 'block' }}>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0L10 5L0 10z" fill="#B8B5BC"/>
        </marker>
      </defs>
      {/* Outer frame */}
      <rect x={leftPad-10} y={topY-14} width={totalW - 2*(leftPad-10)} height={bayH + 94} rx={8}
        fill="none" stroke="#DAD7DD" strokeWidth={1.2}/>

      {/* Entrada / Salida labels */}
      <g>
        <rect x={mirror ? leftPad-20 : totalW-leftPad} y={topY+stallH+6} width={50} height={14} rx={3} fill={APTICA.purple} opacity={mirror?0.15:1}/>
        <text x={mirror ? leftPad+5 : totalW-leftPad+25} y={topY+stallH+16} textAnchor="middle" fill={mirror?APTICA.purple:'#fff'} style={{fontFamily:APT_FONT,fontSize:7,fontWeight:700}}>
          {mirror?'SALIDA':'ENTRADA'}
        </text>
      </g>

      {/* Top row */}
      {topCells}

      {/* Crosswalks */}
      <g opacity={0.35}>
        {[0,1,2,3].map(i => <rect key={'cw1-'+i} x={leftPad + (17-8)*(stallW+gap) + i*7 + 2} y={topY} width={4} height={stallH} fill={APTICA.ink}/>)}
        {[0,1,2,3].map(i => <rect key={'cw2-'+i} x={leftPad + (17-10)*(stallW+gap) + i*7 + 2} y={topY} width={4} height={stallH} fill={APTICA.ink}/>)}
      </g>

      {/* Bays */}
      {leftCells}
      {midCells}
      {rightCells}

      {/* Floor title */}
      <text x={totalW/2} y={16} textAnchor="middle" style={{ fontFamily: APT_FONT, fontSize: 11, fontWeight: 800, fill: APTICA.ink, letterSpacing: 2 }}>
        GARAJE {floor}
      </text>
    </svg>
  );
}

Object.assign(window, { ParkingMap });
