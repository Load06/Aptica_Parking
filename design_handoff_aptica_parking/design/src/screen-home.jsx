// Home / Today screen

function HomeScreen({ role, setTab, setSheet }) {
  const mySlot = FLOOR_P2.find(s => s.id === CURRENT_USER.plazaId);
  const todayReservation = role === 'floating' ? { plaza: 'P-2 · 20', floor: 'P-2', num: 20, from: '8:00', to: '18:00' } : null;
  const myIsLiberated = role === 'fixed' && false; // simple default; sheet toggles

  return (
    <div style={{ paddingBottom: 120 }}>
      {/* Hero greeting */}
      <div style={{ padding: '6px 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: APTICA.grayMid, fontWeight: 500 }}>Jueves, 23 abr</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: APTICA.ink, letterSpacing: -0.6, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Hola, {CURRENT_USER.name.split(' ')[0]}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <button style={{
              width: 42, height: 42, borderRadius: 21, background: '#fff',
              border: `1px solid ${APTICA.grayLine}`, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {Icon.bell(APTICA.ink2, 20)}
              <span style={{
                position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4,
                background: APTICA.purple, border: '2px solid #fff',
              }}/>
            </button>
          </div>
        </div>

        {/* Main status card */}
        {role === 'fixed' && (
          <div style={{
            background: `linear-gradient(135deg, ${APTICA.purple} 0%, ${APTICA.purpleDark} 100%)`,
            borderRadius: 24, padding: 20, color: '#fff', position: 'relative', overflow: 'hidden',
            boxShadow: '0 6px 20px rgba(106,24,115,0.25)',
          }}>
            {/* Subtle pattern */}
            <svg viewBox="0 0 200 200" width="240" height="240" style={{ position: 'absolute', right: -80, top: -60, opacity: 0.08 }}>
              <circle cx="100" cy="100" r="90" fill="none" stroke="#fff" strokeWidth="1"/>
              <circle cx="100" cy="100" r="60" fill="none" stroke="#fff" strokeWidth="1"/>
              <circle cx="100" cy="100" r="30" fill="none" stroke="#fff" strokeWidth="1"/>
            </svg>
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', opacity: 0.7 }}>Tu plaza fija</div>
              <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1, marginTop: 6 }}>25</div>
              <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>Planta {CURRENT_USER.floor} · Nave derecha</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => setSheet('liberate')} style={{
                  flex: 1, height: 44, borderRadius: 12, border: 'none',
                  background: 'rgba(255,255,255,0.15)', color: '#fff',
                  fontFamily: APT_FONT, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  {Icon.key('#fff', 16)} Liberar plaza
                </button>
                <button onClick={() => setTab('map')} style={{
                  height: 44, width: 44, borderRadius: 12, border: 'none',
                  background: 'rgba(255,255,255,0.15)', color: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {Icon.map('#fff', 20)}
                </button>
              </div>
            </div>
          </div>
        )}

        {role === 'floating' && (
          todayReservation ? (
            <div style={{
              background: '#fff', borderRadius: 24, padding: 20,
              border: `1px solid ${APTICA.grayLine}`,
              boxShadow: '0 1px 2px rgba(26,18,32,0.03), 0 8px 24px rgba(26,18,32,0.04)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: APTICA.ok }}/>
                <span style={{ fontSize: 11, fontWeight: 700, color: APTICA.ok, letterSpacing: 1.2, textTransform: 'uppercase' }}>Reserva confirmada · Hoy</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
                <div style={{
                  background: APTICA.purpleSoft, color: APTICA.purple,
                  borderRadius: 16, padding: '8px 14px', minWidth: 72, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6 }}>PLAZA</div>
                  <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1 }}>20</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: APTICA.grayMid }}>Planta</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: APTICA.ink, letterSpacing: -0.3 }}>P-2 · Nave derecha</div>
                  <div style={{ fontSize: 12, color: APTICA.grayMid, marginTop: 6 }}>Libre desde</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: APTICA.ink2 }}>8:00 – 18:00</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <Button variant="secondary" size="md" full onClick={()=>setTab('map')} icon={Icon.map(APTICA.purple,16)}>Ver en el mapa</Button>
              </div>
            </div>
          ) : (
            <div style={{
              background: '#fff', borderRadius: 24, padding: 22,
              border: `1px dashed ${APTICA.grayLine}`, textAlign: 'center',
            }}>
              <div style={{ fontSize: 52, marginBottom: 4, fontWeight: 800, color: APTICA.grayLine, letterSpacing: -2 }}>—</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: APTICA.ink }}>Sin reserva para hoy</div>
              <div style={{ fontSize: 13, color: APTICA.grayMid, marginTop: 4, marginBottom: 14 }}>
                Hay 3 plazas liberadas disponibles
              </div>
              <Button variant="primary" full onClick={()=>setTab('reserve')} icon={Icon.plus('#fff',16)}>Reservar plaza</Button>
            </div>
          )
        )}

        {role === 'admin' && (
          <div style={{
            background: '#fff', borderRadius: 24, padding: 18,
            border: `1px solid ${APTICA.grayLine}`,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { k: 'Liberadas hoy', v: '7', c: APTICA.purple },
                { k: 'Reservadas',    v: '5', c: APTICA.blue },
                { k: 'Usuarios',      v: '17', c: APTICA.purpleDark },
              ].map(s => (
                <div key={s.k} style={{
                  background: APTICA.grayBg, borderRadius: 14, padding: 12,
                }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.c, letterSpacing: -1 }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: APTICA.grayMid, fontWeight: 600 }}>{s.k}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {role === 'guest' && (
          <div style={{
            background: APTICA.blueSoft, borderRadius: 24, padding: 22,
            border: `1px solid ${APTICA.blue}33`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: APTICA.blue, letterSpacing: 1.2, textTransform: 'uppercase' }}>Acceso de visita</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: APTICA.ink, marginTop: 4, letterSpacing: -0.3 }}>Solicita plaza puntual</div>
            <div style={{ fontSize: 13, color: APTICA.ink2, marginTop: 6, marginBottom: 14 }}>
              Un responsable de Aptica asignará una plaza cuando llegues.
            </div>
            <Button variant="primary" full icon={Icon.plus('#fff',16)}>Solicitar plaza</Button>
          </div>
        )}
      </div>

      {/* Week strip — quick date picker */}
      <SectionTitle>Esta semana</SectionTitle>
      <WeekStrip selected={TODAY} onPick={()=>{}}/>

      {/* Activity */}
      <SectionTitle right={<span style={{ fontSize:12, color: APTICA.purple, fontWeight:600, cursor:'pointer' }}>Ver todo</span>}>
        Actividad reciente
      </SectionTitle>
      <div style={{ padding: '0 20px' }}>
        <Card pad={0} radius={18}>
          {ACTIVITY.slice(0,4).map((a, i) => (
            <Row key={a.id}
              last={i === 3}
              left={<Avatar name={a.who} color={['#6A1873','#7296BC','#58457A','#6A1873'][i%4]} size={38}/>}
              title={<span><b>{a.who}</b> <span style={{ color: APTICA.grayMid, fontWeight: 500 }}>liberó</span> <b>{a.plaza}</b></span>}
              subtitle={`${a.date} · ${a.time}`}
              right={role==='floating' ? <Button size="sm" variant="soft">Reservar</Button> : null}
            />
          ))}
        </Card>
      </div>

      {/* Quick access */}
      {role === 'fixed' && (
        <>
          <SectionTitle>Accesos rápidos</SectionTitle>
          <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { t: 'Liberar varios días', s: 'Rango o recurrente', i: Icon.repeat(APTICA.purple, 22), onClick: ()=>setSheet('liberate') },
              { t: 'Mi plaza en el mapa', s: 'P-2 · 25', i: Icon.map(APTICA.purple, 22), onClick: ()=>setTab('map') },
            ].map((q,i) => (
              <div key={i} onClick={q.onClick} style={{
                background: '#fff', borderRadius: 18, padding: 14,
                border: `1px solid ${APTICA.grayLine}`, cursor: 'pointer',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: APTICA.purpleSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
                }}>{q.i}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: APTICA.ink, letterSpacing: -0.1 }}>{q.t}</div>
                <div style={{ fontSize: 12, color: APTICA.grayMid, marginTop: 2 }}>{q.s}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { HomeScreen });
