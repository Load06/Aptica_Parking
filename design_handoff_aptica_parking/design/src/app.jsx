// App shell — tab bar, frame wrapper, Tweaks
(() => {
  const { useState, useEffect } = React;

  function TabBar({ tab, setTab, setSheet }) {
    const tabs = [
      { k: 'home',    l: 'Hoy',      i: Icon.home },
      { k: 'reserve', l: 'Reservar', i: Icon.calendar },
      { k: null, fab: true },
      { k: 'map',     l: 'Mapa',     i: Icon.map },
      { k: 'profile', l: 'Perfil',   i: Icon.user },
    ];
    return (
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50,
        padding: '8px 14px 24px',
        background: 'linear-gradient(180deg, rgba(251,250,252,0) 0%, rgba(251,250,252,1) 40%)',
      }}>
        <div style={{
          background: '#fff', borderRadius: 28, height: 68,
          border: `1px solid ${APTICA.grayLine}`,
          boxShadow: '0 8px 24px rgba(26,18,32,0.08), 0 2px 6px rgba(26,18,32,0.04)',
          display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', alignItems: 'center',
          position: 'relative',
        }}>
          {tabs.map((t, i) => {
            if (t.fab) {
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                  <button onClick={() => setSheet('liberate')} style={{
                    width: 54, height: 54, borderRadius: 27, border: 'none',
                    background: `linear-gradient(135deg, ${APTICA.purple} 0%, ${APTICA.purpleDark} 100%)`,
                    color: '#fff', cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(106,24,115,0.4), 0 2px 4px rgba(106,24,115,0.2)',
                    transform: 'translateY(-14px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {Icon.key('#fff', 22)}
                  </button>
                </div>
              );
            }
            const active = tab === t.k;
            return (
              <button key={t.k} onClick={() => setTab(t.k)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '8px 0', fontFamily: APT_FONT,
              }}>
                {t.i(active ? APTICA.purple : APTICA.grayMid, 22)}
                <span style={{
                  fontSize: 10, fontWeight: active ? 700 : 500,
                  color: active ? APTICA.purple : APTICA.grayMid, letterSpacing: 0.2,
                }}>{t.l}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function AppContent() {
    const TWEAKS = /*EDITMODE-BEGIN*/{
      "role": "fixed",
      "theme": "light",
      "deviceVariant": "iphone"
    }/*EDITMODE-END*/;

    const [role, setRole] = useState(() => localStorage.getItem('aptica.role') || TWEAKS.role);
    const [tab, setTab] = useState(() => localStorage.getItem('aptica.tab') || 'home');
    const [sheet, setSheet] = useState(null);
    const [adminOpen, setAdminOpen] = useState(false);
    const [tweaksOn, setTweaksOn] = useState(false);

    useEffect(() => { localStorage.setItem('aptica.role', role); }, [role]);
    useEffect(() => { localStorage.setItem('aptica.tab', tab); }, [tab]);
    useEffect(() => { window.__goAdmin = () => setAdminOpen(true); }, []);

    // Tweaks wiring
    useEffect(() => {
      const onMsg = (e) => {
        if (e.data?.type === '__activate_edit_mode') setTweaksOn(true);
        if (e.data?.type === '__deactivate_edit_mode') setTweaksOn(false);
      };
      window.addEventListener('message', onMsg);
      window.parent.postMessage({ type: '__edit_mode_available' }, '*');
      return () => window.removeEventListener('message', onMsg);
    }, []);

    const pushEdits = (edits) => {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
    };

    let Screen;
    if (adminOpen) Screen = <AdminScreen goBack={()=>setAdminOpen(false)}/>;
    else if (tab === 'home')    Screen = <HomeScreen role={role} setTab={setTab} setSheet={setSheet}/>;
    else if (tab === 'reserve') Screen = <ReserveScreen role={role}/>;
    else if (tab === 'map')     Screen = <MapScreen/>;
    else                         Screen = <ProfileScreen role={role} setRole={setRole}/>;

    const phoneUI = (
      <div data-screen-label={adminOpen ? 'Admin' : tab}
        style={{ position: 'absolute', inset: 0, background: APTICA.bg, overflow: 'hidden' }}>
        {/* Status bar space */}
        <div style={{ height: 58 }}/>
        <div style={{ height: 'calc(100% - 58px)', overflowY: 'auto', paddingTop: 10 }}>
          {Screen}
        </div>
        {!adminOpen && <TabBar tab={tab} setTab={setTab} setSheet={setSheet}/>}
        <LiberateSheet open={sheet === 'liberate'} onClose={() => setSheet(null)}/>
      </div>
    );

    return (
      <>
        {/* iOS Status bar overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
          <IOSStatusBar dark={false}/>
        </div>

        {/* Home indicator */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 120,
          height: 34, display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
          paddingBottom: 8, pointerEvents: 'none',
        }}>
          <div style={{ width: 139, height: 5, borderRadius: 100, background: 'rgba(0,0,0,0.25)' }}/>
        </div>

        {phoneUI}

        {/* Tweaks panel */}
        {tweaksOn && (
          <TweaksPanel
            role={role} setRole={(r)=>{setRole(r); pushEdits({role:r});}}
            onOpenAdmin={()=>setAdminOpen(true)}
            tab={tab} setTab={setTab}
          />
        )}
      </>
    );
  }

  function TweaksPanel({ role, setRole, onOpenAdmin, tab, setTab }) {
    return (
      <div style={{
        position: 'fixed', right: 16, bottom: 16, zIndex: 1000,
        width: 280, background: '#fff', borderRadius: 18,
        border: `1px solid ${APTICA.grayLine}`,
        boxShadow: '0 12px 40px rgba(0,0,0,0.18)', padding: 16,
        fontFamily: APT_FONT,
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: APTICA.ink, letterSpacing: -0.3 }}>Tweaks</div>
          <Badge color="purple">LIVE</Badge>
        </div>
        <div style={{ fontSize: 11, color: APTICA.grayMid, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Rol del usuario</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
          {[
            {k:'fixed',l:'Plaza fija'},
            {k:'floating',l:'Sin plaza'},
            {k:'admin',l:'Admin'},
            {k:'guest',l:'Invitado'},
          ].map(r => (
            <button key={r.k} onClick={()=>setRole(r.k)} style={{
              height: 34, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: role===r.k ? APTICA.purple : '#fff',
              color: role===r.k ? '#fff' : APTICA.ink2,
              border: `1px solid ${role===r.k ? APTICA.purple : APTICA.grayLine}`,
              fontFamily: APT_FONT,
            }}>{r.l}</button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: APTICA.grayMid, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Atajos</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={onOpenAdmin} style={{
            height: 34, borderRadius: 8, background: APTICA.purpleSoft,
            color: APTICA.purple, border: 'none', cursor: 'pointer',
            fontFamily: APT_FONT, fontSize: 12, fontWeight: 600,
          }}>Abrir panel de Admin</button>
          <button onClick={()=>setTab('map')} style={{
            height: 34, borderRadius: 8, background: '#fff', color: APTICA.ink2,
            border: `1px solid ${APTICA.grayLine}`, cursor: 'pointer',
            fontFamily: APT_FONT, fontSize: 12, fontWeight: 600,
          }}>Ir al Mapa</button>
        </div>
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <div style={{
      width: '100vw', height: '100vh', background: '#EFEDF1',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', fontFamily: APT_FONT,
    }}>
      <div style={{
        width: 402, height: 874, borderRadius: 48, overflow: 'hidden', position: 'relative',
        background: APTICA.bg,
        boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
      }}>
        {/* Dynamic island */}
        <div style={{
          position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
          width: 126, height: 37, borderRadius: 24, background: '#000', zIndex: 150,
        }}/>
        <AppContent/>
      </div>
    </div>
  );
})();
