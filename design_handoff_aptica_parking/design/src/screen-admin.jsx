// Admin screen — user management, rules

function AdminScreen({ goBack }) {
  const [tab, setTab] = React.useState('users');
  const [query, setQuery] = React.useState('');
  const [selUser, setSelUser] = React.useState(null);
  const [openRules, setOpenRules] = React.useState(false);

  const filtered = USERS_DB.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  );

  const roleStyle = (r) => {
    const m = {
      fixed:    { l:'Plaza fija',   c:'purple' },
      floating: { l:'Sin plaza',    c:'blue' },
      admin:    { l:'Admin',        c:'orange' },
      guest:    { l:'Invitado',     c:'gray' },
    };
    return m[r];
  };

  return (
    <div style={{ paddingBottom: 120 }}>
      <div style={{ padding: '4px 20px 14px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={goBack} style={{
          width:36,height:36,borderRadius:18,background:'#fff',border:`1px solid ${APTICA.grayLine}`,
          display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
        }}><Chev dir="left" color={APTICA.ink2}/></button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: APTICA.ink, letterSpacing: -0.6 }}>Administración</div>
          <div style={{ fontSize: 12, color: APTICA.grayMid }}>Usuarios, plazas y reglas</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ display:'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, background: APTICA.grayBg, padding: 4, borderRadius: 12 }}>
          {[
            {k:'users', l:'Usuarios'},
            {k:'rules', l:'Reglas'},
            {k:'log',   l:'Historial'},
          ].map(t => (
            <button key={t.k} onClick={()=>setTab(t.k)} style={{
              height: 36, borderRadius: 9, border: 'none',
              background: tab===t.k ? '#fff' : 'transparent',
              color: tab===t.k ? APTICA.ink : APTICA.grayMid,
              fontFamily: APT_FONT, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: tab===t.k ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}>{t.l}</button>
          ))}
        </div>
      </div>

      {tab === 'users' && (
        <>
          <div style={{ padding: '0 20px 12px', display: 'flex', gap: 8 }}>
            <Input placeholder="Buscar usuario..." value={query} onChange={setQuery} icon={Icon.search(APTICA.grayMid,18)}/>
            <Button variant="primary" size="md" icon={Icon.plus('#fff',16)}>Nuevo</Button>
          </div>

          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(u => {
              const rs = roleStyle(u.role);
              return (
                <div key={u.id} onClick={()=>setSelUser(u)} style={{
                  background: '#fff', borderRadius: 16, padding: 12,
                  border: `1px solid ${APTICA.grayLine}`, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <Avatar name={u.name} color={u.avatar} size={44}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: APTICA.ink, letterSpacing: -0.1 }}>{u.name}</span>
                      {u.status==='pending' && <Badge color="orange">Pendiente</Badge>}
                    </div>
                    <div style={{ fontSize: 12, color: APTICA.grayMid, marginTop: 1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.email}</div>
                    <div style={{ display:'flex', gap: 6, marginTop: 6 }}>
                      <Badge color={rs.c}>{rs.l}</Badge>
                      {u.plaza !== '—' && <Badge color="gray">{u.plaza}</Badge>}
                    </div>
                  </div>
                  <Chev/>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'rules' && (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card pad={16} radius={18}>
            <div style={{ fontSize: 11, fontWeight: 700, color: APTICA.grayMid, letterSpacing: 1.2, textTransform: 'uppercase' }}>Antelación máxima</div>
            <div style={{ fontSize: 14, color: APTICA.ink2, marginTop: 4 }}>Cuántas horas antes pueden reservar los usuarios</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              {['24h','48h','72h','1 semana'].map((o,i) => (
                <button key={o} style={{
                  flex: 1, height: 44, borderRadius: 10,
                  background: i===1 ? APTICA.purple : '#fff',
                  color: i===1 ? '#fff' : APTICA.ink2,
                  border: `1.5px solid ${i===1 ? APTICA.purple : APTICA.grayLine}`,
                  fontFamily: APT_FONT, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}>{o}</button>
              ))}
            </div>
          </Card>

          <Card pad={16} radius={18}>
            <div style={{ fontSize: 11, fontWeight: 700, color: APTICA.grayMid, letterSpacing: 1.2, textTransform: 'uppercase' }}>Cupo semanal por usuario</div>
            <div style={{ fontSize: 14, color: APTICA.ink2, marginTop: 4 }}>Reservas permitidas por semana para usuarios sin plaza</div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button style={{width:44,height:44,borderRadius:22,background:'#fff',border:`1.5px solid ${APTICA.grayLine}`,fontSize:20,fontWeight:700,color:APTICA.ink2,cursor:'pointer'}}>−</button>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 46, fontWeight: 800, color: APTICA.purple, letterSpacing: -2, lineHeight: 1 }}>3</div>
                <div style={{ fontSize: 11, color: APTICA.grayMid, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>reservas / semana</div>
              </div>
              <button style={{width:44,height:44,borderRadius:22,background:APTICA.purple,border:'none',fontSize:20,fontWeight:700,color:'#fff',cursor:'pointer'}}>+</button>
            </div>
            <div style={{ marginTop: 14, padding: 10, background: APTICA.purpleSoft, borderRadius: 10, fontSize: 12, color: APTICA.purple, display:'flex', gap: 8 }}>
              {Icon.info(APTICA.purple,14)}
              <span>Quien supere el límite tendrá prioridad menor. Otros usuarios pueden desplazarles.</span>
            </div>
          </Card>

          <Card pad={16} radius={18}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: APTICA.grayMid, letterSpacing: 1.2, textTransform: 'uppercase' }}>Reservas urgentes</div>
                <div style={{ fontSize: 14, color: APTICA.ink, fontWeight: 700, marginTop: 4 }}>Permitir desplazar reservas</div>
                <div style={{ fontSize: 12, color: APTICA.grayMid, marginTop: 2 }}>3 por mes · Sólo a usuarios sin plaza</div>
              </div>
              <Toggle on={true} onChange={()=>{}}/>
            </div>
          </Card>

          <Card pad={16} radius={18}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: APTICA.grayMid, letterSpacing: 1.2, textTransform: 'uppercase' }}>Notificaciones push</div>
                <div style={{ fontSize: 14, color: APTICA.ink, fontWeight: 700, marginTop: 4 }}>Aviso al liberarse una plaza</div>
                <div style={{ fontSize: 12, color: APTICA.grayMid, marginTop: 2 }}>Sólo a usuarios sin cupo excedido</div>
              </div>
              <Toggle on={true} onChange={()=>{}}/>
            </div>
          </Card>
        </div>
      )}

      {tab === 'log' && (
        <div style={{ padding: '0 20px' }}>
          <Card pad={0} radius={18}>
            {[
              { t:'Usuario creado', u:'Paula Vidal', time:'Hoy 10:22' },
              { t:'Reserva urgente', u:'Elena G. quitó plaza a Diego N.', time:'Hoy 09:48' },
              { t:'Plaza liberada', u:'Juanma L. · P-1 · 17', time:'Hoy 09:12' },
              { t:'Contraseña restablecida', u:'María Soler', time:'Ayer 18:30' },
              { t:'Regla actualizada', u:'Cupo semanal: 2 → 3', time:'24 Abr' },
            ].map((e,i,arr) => (
              <Row key={i} last={i===arr.length-1}
                left={<div style={{width:8,height:8,borderRadius:4,background:APTICA.purple}}/>}
                title={e.t} subtitle={`${e.u} · ${e.time}`} right={null}/>
            ))}
          </Card>
        </div>
      )}

      {/* User detail */}
      <BottomSheet open={!!selUser} onClose={()=>setSelUser(null)} title={selUser?.name}>
        {selUser && (
          <div style={{ padding: '0 20px' }}>
            <div style={{ display:'flex', gap: 14, alignItems:'center' }}>
              <Avatar name={selUser.name} color={selUser.avatar} size={64}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize: 14, color: APTICA.grayMid }}>{selUser.email}</div>
                <div style={{ display:'flex', gap: 6, marginTop: 6 }}>
                  <Badge color={roleStyle(selUser.role).c}>{roleStyle(selUser.role).l}</Badge>
                  {selUser.plaza !== '—' && <Badge color="gray">{selUser.plaza}</Badge>}
                </div>
              </div>
            </div>
            <Card pad={0} radius={14} style={{ marginTop: 16 }}>
              <Row title="Rol" right={<span style={{fontSize:13,color:APTICA.grayMid}}>{roleStyle(selUser.role).l} <Chev/></span>}/>
              <Row title="Plaza asignada" right={<span style={{fontSize:13,color:APTICA.grayMid}}>{selUser.plaza} <Chev/></span>}/>
              <Row title="Matrícula" right={<span style={{fontSize:13,color:APTICA.grayMid}}>{selUser.plate} <Chev/></span>} last/>
            </Card>
            <div style={{ display:'flex', gap: 8, marginTop: 14 }}>
              <Button variant="secondary" style={{flex:1}} icon={Icon.mail(APTICA.purple,16)}>Enviar reset</Button>
              <Button variant="danger" style={{flex:1}} icon={Icon.trash(APTICA.red,16)}>Eliminar</Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

Object.assign(window, { AdminScreen });
