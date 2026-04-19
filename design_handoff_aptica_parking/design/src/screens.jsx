// Reserve + Liberate + Map + Profile + Admin screens

// -----------------------------
// LIBERATE SHEET
// -----------------------------
function LiberateSheet({ open, onClose }) {
  const [mode, setMode] = React.useState('multi'); // multi | range | recurring
  const [dates, setDates] = React.useState([]);
  const [halfDay, setHalfDay] = React.useState('full'); // full | am | pm
  const [recurDay, setRecurDay] = React.useState(null);
  const [recurUntil, setRecurUntil] = React.useState(null);

  const toggleDate = (d) => {
    if (mode === 'range') {
      if (dates.length < 2) setDates([...dates, d].sort((a,b)=>a-b));
      else setDates([d]);
    } else {
      const exists = dates.some(x => sameYMD(x,d));
      setDates(exists ? dates.filter(x => !sameYMD(x,d)) : [...dates, d]);
    }
  };

  const count = mode === 'range' && dates.length === 2
    ? Math.round((dates[1] - dates[0]) / 86400000) + 1
    : dates.length;

  return (
    <BottomSheet open={open} onClose={onClose} title="Liberar plaza 25">
      <div style={{ padding: '0 20px' }}>
        {/* Mode tabs */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4,
          background: APTICA.grayBg, padding: 4, borderRadius: 12, marginBottom: 18,
        }}>
          {[
            { k:'multi',     l:'Días sueltos' },
            { k:'range',     l:'Rango' },
            { k:'recurring', l:'Recurrente' },
          ].map(t => (
            <button key={t.k} onClick={()=>{setMode(t.k); setDates([]);}} style={{
              height: 36, borderRadius: 9, border: 'none',
              background: mode===t.k ? '#fff' : 'transparent',
              color: mode===t.k ? APTICA.ink : APTICA.grayMid,
              fontFamily: APT_FONT, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: mode===t.k ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}>{t.l}</button>
          ))}
        </div>

        {mode !== 'recurring' && (
          <>
            <Calendar selected={dates} onToggle={toggleDate} mode={mode==='range'?'range':'multi'} />

            {/* Half day */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: APTICA.gray, marginBottom: 8 }}>Horario</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { k:'full', l:'Día completo', i: Icon.sun(APTICA.ink2,16) },
                  { k:'am',   l:'Sólo mañana (8–14h)', i: Icon.sun(APTICA.warn,16) },
                  { k:'pm',   l:'Sólo tarde (14–19h)', i: Icon.moon(APTICA.purple,16) },
                ].map(o => (
                  <button key={o.k} onClick={()=>setHalfDay(o.k)} style={{
                    flex: 1, height: 56, borderRadius: 12,
                    background: halfDay===o.k ? APTICA.purpleSoft : '#fff',
                    border: `1.5px solid ${halfDay===o.k ? APTICA.purple : APTICA.grayLine}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                    fontFamily: APT_FONT, fontSize: 11, fontWeight: 600,
                    color: halfDay===o.k ? APTICA.purple : APTICA.ink2, cursor: 'pointer',
                    padding: 4,
                  }}>{o.i}<span>{o.l}</span></button>
                ))}
              </div>
            </div>
          </>
        )}

        {mode === 'recurring' && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: APTICA.gray, marginBottom: 10 }}>Repetir los</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
              {DAYS_ES_LONG.map((d,i) => (
                <button key={i} onClick={()=>setRecurDay(i)} style={{
                  flex: 1, height: 54, borderRadius: 12,
                  background: recurDay===i ? APTICA.purple : '#fff',
                  color: recurDay===i ? '#fff' : APTICA.ink,
                  border: `1.5px solid ${recurDay===i ? APTICA.purple : APTICA.grayLine}`,
                  fontFamily: APT_FONT, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>{d}</button>
              ))}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: APTICA.gray, marginBottom: 10 }}>Hasta</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {['1 mes','3 meses','6 meses','Indefinido'].map((o,i) => (
                <button key={i} onClick={()=>setRecurUntil(i)} style={{
                  flex: 1, height: 44, borderRadius: 10,
                  background: recurUntil===i ? APTICA.purpleSoft : '#fff',
                  color: recurUntil===i ? APTICA.purple : APTICA.ink2,
                  border: `1.5px solid ${recurUntil===i ? APTICA.purple : APTICA.grayLine}`,
                  fontFamily: APT_FONT, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>{o}</button>
              ))}
            </div>
          </div>
        )}

        {/* Summary + CTA */}
        <div style={{
          marginTop: 18, padding: 14, borderRadius: 14,
          background: APTICA.grayBg,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: APTICA.grayMid, letterSpacing: 1, textTransform: 'uppercase' }}>Resumen</div>
            <div style={{ fontSize: 14, color: APTICA.ink, fontWeight: 600, marginTop: 2 }}>
              {mode === 'recurring'
                ? (recurDay!==null ? `Cada ${DAYS_ES_LONG[recurDay].toLowerCase()}` : 'Selecciona un día')
                : count === 0
                  ? 'Ningún día seleccionado'
                  : `${count} día${count>1?'s':''}${halfDay!=='full' ? ` · ${halfDay==='am'?'mañanas':'tardes'}` : ''}`}
            </div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 20, background: APTICA.purple,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: APT_FONT,
          }}>{count || (mode==='recurring' && recurDay!==null ? '∞' : '0')}</div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
          <Button variant="primary" onClick={onClose} style={{ flex: 2 }} icon={Icon.check('#fff',16)}>Liberar</Button>
        </div>
      </div>
    </BottomSheet>
  );
}

// -----------------------------
// RESERVE SCREEN
// -----------------------------
function ReserveScreen({ role, onReserved }) {
  const [day, setDay] = React.useState(TODAY);
  const [showUrgent, setShowUrgent] = React.useState(false);
  const [selSlot, setSelSlot] = React.useState(null);

  const available = [
    { id:'P-1-17', num:17, floor:'P-1', owner:'Juanma L.', from:'Todo el día', reserved:null },
    { id:'P-2-20', num:20, floor:'P-2', owner:'Jesús H.',  from:'08:00 – 18:00', reserved:{by:'Diego N.', floating:true} },
    { id:'P-2-22', num:22, floor:'P-2', owner:'J.V. Rodríguez', from:'Todo el día', reserved:null },
    { id:'P-2-43', num:43, floor:'P-2', owner:'Josué M.', from:'08:00 – 14:00', reserved:null },
    { id:'P-1-16', num:16, floor:'P-1', owner:'Joserra D.', from:'14:00 – 19:00', reserved:null },
  ];

  const usageWeek = 2; // reservas usadas
  const usageMax = 3;
  const usageLow = usageWeek >= usageMax;

  return (
    <div style={{ paddingBottom: 120 }}>
      <div style={{ padding: '4px 20px 14px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: APTICA.ink, letterSpacing: -0.8 }}>Reservar plaza</div>
        <div style={{ fontSize: 13, color: APTICA.grayMid, marginTop: 2 }}>Ventana: <b style={{ color: APTICA.ink2 }}>48 h por adelantado</b></div>
      </div>

      {/* Weekly usage tracker */}
      <div style={{ padding: '0 20px 10px' }}>
        <Card pad={14} radius={16} style={{ background: usageLow ? APTICA.warnSoft : '#fff', borderColor: usageLow ? APTICA.warn+'55' : APTICA.grayLine }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: usageLow?APTICA.warn:APTICA.grayMid, letterSpacing: 1, textTransform: 'uppercase' }}>Tu cupo semanal</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: APTICA.ink, marginTop: 2 }}>
                {usageWeek} de {usageMax} reservas usadas
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({length: usageMax}, (_,i) => (
                <div key={i} style={{
                  width: 10, height: 24, borderRadius: 3,
                  background: i < usageWeek ? APTICA.purple : APTICA.grayLine,
                }}/>
              ))}
            </div>
          </div>
          {usageLow && (
            <div style={{ fontSize: 12, color: APTICA.warn, marginTop: 8, display: 'flex', gap: 6 }}>
              {Icon.info(APTICA.warn,14)} Has alcanzado tu límite. Otros usuarios tienen prioridad esta semana.
            </div>
          )}
        </Card>
      </div>

      <WeekStrip selected={day} onPick={setDay}/>

      <SectionTitle right={<span style={{fontSize:12, color:APTICA.grayMid}}>{available.length} plazas</span>}>
        Disponibles · {DAYS_ES_LONG[(day.getDay()+6)%7]} {day.getDate()} {MONTHS_ES[day.getMonth()].toLowerCase()}
      </SectionTitle>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {available.map(s => (
          <div key={s.id} style={{
            background: '#fff', borderRadius: 18, padding: 14,
            border: `1px solid ${selSlot===s.id ? APTICA.purple : APTICA.grayLine}`,
            boxShadow: selSlot===s.id ? `0 0 0 3px ${APTICA.purple}20` : 'none',
            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
            transition: 'border-color .15s, box-shadow .15s',
          }} onClick={()=>setSelSlot(s.id)}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: s.reserved ? APTICA.grayBg : APTICA.purpleSoft,
              color: s.reserved ? APTICA.grayMid : APTICA.purple,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.6, opacity: 0.8 }}>{s.floor}</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1 }}>{s.num}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: APTICA.ink, letterSpacing: -0.1 }}>Plaza {s.num}</span>
                {s.reserved && <Badge color="orange">Ocupada</Badge>}
              </div>
              <div style={{ fontSize: 13, color: APTICA.grayMid, marginTop: 2 }}>
                Libera <b style={{color:APTICA.ink2}}>{s.owner}</b> · {s.from}
              </div>
              {s.reserved && (
                <div style={{ fontSize: 12, color: APTICA.warn, marginTop: 4, fontWeight: 500 }}>
                  Reservada por {s.reserved.by}
                </div>
              )}
            </div>
            {s.reserved ? (
              <button onClick={(e)=>{e.stopPropagation();setShowUrgent(s);}} style={{
                height: 34, padding: '0 12px', borderRadius: 10, border: `1px solid ${APTICA.warn}55`,
                background: APTICA.warnSoft, color: APTICA.warn, fontFamily: APT_FONT, fontWeight: 700, fontSize: 12,
                cursor: 'pointer', display: 'flex', alignItems:'center', gap: 4,
              }}>{Icon.bolt(APTICA.warn,12)} Urgente</button>
            ) : (
              <Button size="sm" variant={selSlot===s.id?'primary':'soft'}>
                {selSlot===s.id ? 'Confirmar' : 'Reservar'}
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Urgent modal */}
      <BottomSheet open={!!showUrgent} onClose={()=>setShowUrgent(false)} title="Reserva urgente">
        {showUrgent && (
          <div style={{ padding: '0 20px' }}>
            <div style={{ fontSize: 14, color: APTICA.ink2, lineHeight: 1.5 }}>
              La plaza <b>{showUrgent.floor} · {showUrgent.num}</b> ya está reservada por <b>{showUrgent.reserved?.by}</b>.
              Si tu necesidad es prioritaria, puedes <b>desplazarle</b> y quedártela.
            </div>
            <div style={{
              marginTop: 14, padding: 14, background: APTICA.warnSoft, borderRadius: 12,
              display: 'flex', gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 16, background: APTICA.warn,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>{Icon.bolt('#fff',16)}</div>
              <div style={{ fontSize: 12, color: APTICA.warn, lineHeight: 1.5 }}>
                Sólo puedes quitar reservas de usuarios sin plaza fija. Consume 1 de tus reservas urgentes mensuales.
                <div style={{ marginTop: 4, fontWeight: 700 }}>Disponibles: 2 de 3 este mes</div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: APTICA.gray, marginBottom: 6 }}>Motivo (visible para el admin)</div>
              <div style={{
                background: '#fff', border: `1px solid ${APTICA.grayLine}`, borderRadius: 12,
                padding: 12, fontSize: 13, color: APTICA.grayMid, minHeight: 60,
              }}>Visita médica a las 16:00...</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Button variant="secondary" onClick={()=>setShowUrgent(false)} style={{flex:1}}>Cancelar</Button>
              <Button variant="primary" style={{flex:2, background: APTICA.warn, boxShadow:'0 6px 16px rgba(217,119,6,0.3)'}} onClick={()=>setShowUrgent(false)} icon={Icon.bolt('#fff',14)}>Quitar y reservar</Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

// -----------------------------
// MAP SCREEN
// -----------------------------
function MapScreen({ activeFloor: initialFloor = 'P-2' }) {
  const [floor, setFloor] = React.useState(initialFloor);
  const [sel, setSel] = React.useState(null);
  const slots = floor === 'P-1' ? FLOOR_P1 : FLOOR_P2;

  // Today availability mock
  const reservedToday = {
    'P-1-T17': { by: 'María Soler' },
    'P-2-R-I-20': { by: 'Diego Navarro' },
  };

  return (
    <div style={{ paddingBottom: 120 }}>
      <div style={{ padding: '4px 20px 14px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: APTICA.ink, letterSpacing: -0.8 }}>Mapa del parking</div>
        <div style={{ fontSize: 13, color: APTICA.grayMid, marginTop: 2 }}>Toca una plaza para ver los detalles</div>
      </div>

      {/* Floor tabs */}
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
          background: APTICA.grayBg, padding: 4, borderRadius: 14,
        }}>
          {['P-1','P-2'].map(f => (
            <button key={f} onClick={()=>setFloor(f)} style={{
              height: 40, borderRadius: 10, border: 'none',
              background: floor===f ? '#fff' : 'transparent',
              color: floor===f ? APTICA.ink : APTICA.grayMid,
              fontFamily: APT_FONT, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: floor===f ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span style={{
                fontSize: 10, background: floor===f?APTICA.purple:APTICA.grayLine,
                color: floor===f?'#fff':APTICA.grayMid,
                padding: '2px 6px', borderRadius: 4, fontWeight: 700,
              }}>GARAJE</span>
              Planta {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: 8 }}>
        {[
          { k: 'Libres hoy', v: floor==='P-2'?'4':'3', c: APTICA.ok },
          { k: 'Liberadas', v: floor==='P-2'?'2':'1', c: APTICA.purple },
          { k: 'Ocupadas', v: floor==='P-2'?'109':'112', c: APTICA.grayMid },
        ].map(s => (
          <div key={s.k} style={{ flex: 1, background: '#fff', border: `1px solid ${APTICA.grayLine}`, borderRadius: 12, padding: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.c, letterSpacing: -0.4 }}>{s.v}</div>
            <div style={{ fontSize: 10, color: APTICA.grayMid, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>{s.k}</div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div style={{ padding: '0 14px' }}>
        <div style={{
          background: '#fff', borderRadius: 18, padding: 10,
          border: `1px solid ${APTICA.grayLine}`,
        }}>
          <ParkingMap floor={floor} slots={slots} onSlotClick={setSel}
            myPlazaId={CURRENT_USER.plazaId} reservedToday={reservedToday}/>
        </div>
      </div>

      {/* Legend */}
      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { c: APTICA.purple, l: 'Asignada' },
          { c: APTICA.purpleSoft, b: APTICA.purple, l: 'Liberada' },
          { c: '#fff', b: APTICA.grayLine, l: 'Libre' },
          { c: '#fff', b: APTICA.ok, l: 'Tu plaza' },
          { c: APTICA.purpleDark, l: 'Servicio' },
        ].map((x,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{
              width:16, height:12, borderRadius: 2, background: x.c,
              border: `${x.b?2:1}px solid ${x.b || APTICA.grayLine}`,
            }}/>
            <span style={{ fontSize: 11, color: APTICA.ink2, fontWeight: 500 }}>{x.l}</span>
          </div>
        ))}
      </div>

      {/* Slot detail bottom sheet */}
      <BottomSheet open={!!sel} onClose={()=>setSel(null)} title={sel ? `Plaza ${sel.num}` : ''}>
        {sel && (
          <div style={{ padding: '0 20px' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{
                width: 80, height: 80, borderRadius: 18,
                background: sel.assigned ? APTICA.purple : APTICA.purpleSoft,
                color: sel.assigned ? '#fff' : APTICA.purple,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, opacity: 0.8 }}>{sel.floor}</div>
                <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>{sel.num}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: APTICA.grayMid }}>Planta {sel.floor} · {sel.bay==='top'?'Perímetro':sel.bay==='left'?'Nave izquierda':sel.bay==='mid'?'Nave central':'Nave derecha'}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: APTICA.ink, marginTop: 4, letterSpacing: -0.3 }}>
                  {sel.isService ? 'Carga y descarga' : sel.assigned ? sel.assigned.name : 'Plaza libre'}
                </div>
                {sel.shared && (
                  <div style={{ display:'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <Badge color="purple">{Icon.motor(APTICA.purple,12)}<span style={{marginLeft:4}}>Compartida</span></Badge>
                    {(sel.sharedWith||[]).map(u => <Badge key={u} color="gray">{u}</Badge>)}
                  </div>
                )}
              </div>
            </div>
            {sel.id === CURRENT_USER.plazaId && (
              <div style={{
                marginTop: 16, padding: 14, background: APTICA.okSoft, borderRadius: 12,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 16, background: APTICA.ok,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{Icon.check('#fff',18)}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: APTICA.ok }}>Es tu plaza fija</div>
                  <div style={{ fontSize: 12, color: APTICA.ink2 }}>Puedes liberarla para otro día</div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              {sel.id === CURRENT_USER.plazaId ? (
                <Button variant="primary" full icon={Icon.key('#fff',16)}>Liberar esta plaza</Button>
              ) : sel.assigned ? (
                <Button variant="secondary" full>Ver titular</Button>
              ) : (
                <Button variant="primary" full icon={Icon.plus('#fff',16)}>Reservar para hoy</Button>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

// -----------------------------
// PROFILE SCREEN
// -----------------------------
function ProfileScreen({ role, setRole }) {
  return (
    <div style={{ paddingBottom: 120 }}>
      <div style={{ padding: '4px 20px 18px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: APTICA.ink, letterSpacing: -0.8 }}>Perfil</div>
      </div>

      {/* Identity card */}
      <div style={{ padding: '0 20px 18px' }}>
        <Card pad={18} radius={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={CURRENT_USER.name} color={APTICA.purple} size={64}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: APTICA.ink, letterSpacing: -0.3 }}>{CURRENT_USER.name}</div>
              <div style={{ fontSize: 13, color: APTICA.grayMid }}>{CURRENT_USER.email}</div>
              <div style={{ marginTop: 6, display:'flex', gap: 6 }}>
                <Badge color="purple">
                  {role==='fixed'?'Plaza fija':role==='floating'?'Sin plaza':role==='admin'?'Administrador':'Invitado'}
                </Badge>
                {role==='fixed' && <Badge color="gray">P-2 · 25</Badge>}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <SectionTitle>Cuenta</SectionTitle>
      <div style={{ padding: '0 20px 18px' }}>
        <Card pad={0} radius={18}>
          <Row title="Datos personales" subtitle={CURRENT_USER.phone}
            left={<div style={{width:36,height:36,borderRadius:10,background:APTICA.purpleSoft,display:'flex',alignItems:'center',justifyContent:'center'}}>{Icon.user(APTICA.purple,18)}</div>}
            right={<Chev/>}/>
          <Row title="Matrícula" subtitle={CURRENT_USER.plate}
            left={<div style={{width:36,height:36,borderRadius:10,background:APTICA.purpleSoft,display:'flex',alignItems:'center',justifyContent:'center'}}>{Icon.car(APTICA.purple,18)}</div>}
            right={<Chev/>}/>
          <Row title="Contraseña" subtitle="Última actualización hace 2 meses"
            left={<div style={{width:36,height:36,borderRadius:10,background:APTICA.purpleSoft,display:'flex',alignItems:'center',justifyContent:'center'}}>{Icon.lock(APTICA.purple,18)}</div>}
            right={<Chev/>} last/>
        </Card>
      </div>

      <SectionTitle>Notificaciones</SectionTitle>
      <div style={{ padding: '0 20px 18px' }}>
        <Card pad={0} radius={18}>
          <Row title="Nueva plaza liberada" subtitle="Aviso cuando alguien libere su plaza"
            left={<div style={{width:36,height:36,borderRadius:10,background:APTICA.purpleSoft,display:'flex',alignItems:'center',justifyContent:'center'}}>{Icon.bell(APTICA.purple,18)}</div>}
            right={<Toggle on={true} onChange={()=>{}}/>}/>
          <Row title="Recordatorio de reserva" subtitle="El día anterior a las 18:00"
            left={<div style={{width:36,height:36,borderRadius:10,background:APTICA.purpleSoft,display:'flex',alignItems:'center',justifyContent:'center'}}>{Icon.clock(APTICA.purple,18)}</div>}
            right={<Toggle on={false} onChange={()=>{}}/>} last/>
        </Card>
      </div>

      {role === 'admin' && (
        <>
          <SectionTitle>Administración</SectionTitle>
          <div style={{ padding: '0 20px 18px' }}>
            <Card pad={0} radius={18}>
              <Row title="Gestionar usuarios" subtitle={`${USERS_DB.length} usuarios registrados`}
                left={<div style={{width:36,height:36,borderRadius:10,background:APTICA.purpleSoft,display:'flex',alignItems:'center',justifyContent:'center'}}>{Icon.users(APTICA.purple,18)}</div>}
                right={<Chev/>} onClick={()=>{window.__goAdmin?.();}}/>
              <Row title="Reglas de reserva" subtitle="48h · 3 reservas/semana"
                left={<div style={{width:36,height:36,borderRadius:10,background:APTICA.purpleSoft,display:'flex',alignItems:'center',justifyContent:'center'}}>{Icon.shield(APTICA.purple,18)}</div>}
                right={<Chev/>} last/>
            </Card>
          </div>
        </>
      )}

      <SectionTitle>Sesión</SectionTitle>
      <div style={{ padding: '0 20px' }}>
        <Card pad={0} radius={18}>
          <Row title={<span style={{color:APTICA.red}}>Cerrar sesión</span>}
            left={<div style={{width:36,height:36,borderRadius:10,background:APTICA.redSoft,display:'flex',alignItems:'center',justifyContent:'center'}}>{Icon.logout(APTICA.red,18)}</div>}
            right={null} last/>
        </Card>
        <div style={{ textAlign:'center', marginTop: 20, fontSize: 11, color: APTICA.grayMid, letterSpacing: 0.4 }}>
          Aptica Parking · v1.2.0
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LiberateSheet, ReserveScreen, MapScreen, ProfileScreen });
