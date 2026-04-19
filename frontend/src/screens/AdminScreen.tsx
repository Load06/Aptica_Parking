import { useState, useEffect } from 'react';
import { Search, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { User, AdminRules, AuditLog, Plaza } from '../types';
import { Avatar, Badge, BottomSheet, Button, SegmentedControl, Toggle } from '../components/ui';

type Tab  = 'users' | 'rules' | 'history';
type Role = 'fixed' | 'floating' | 'admin' | 'guest';

const ROLE_LABELS: Record<string, string> = { fixed: 'Plaza fija', floating: 'Sin plaza', admin: 'Admin', guest: 'Invitado' };
const BAY_LABELS:  Record<string, string> = { left: 'Nave izq.', mid: 'Central', right: 'Nave der.', top: 'Fila sup.' };
const STATUS_LABELS: Record<string, { label: string; color: 'ok' | 'warn' | 'gray' | 'red' }> = {
  active:   { label: 'Activo',    color: 'ok' },
  pending:  { label: 'Pendiente', color: 'warn' },
  invited:  { label: 'Invitado',  color: 'blue' as any },
  disabled: { label: 'Inactivo',  color: 'red' },
};

export function AdminScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [rules, setRules] = useState<AdminRules | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  // Edit role / plaza
  const [editRole, setEditRole] = useState<Role>('floating');
  const [editPlazaId, setEditPlazaId] = useState<string | null>(null);
  const [allPlazas, setAllPlazas] = useState<Plaza[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (tab === 'users')   api.get<User[]>('/admin/users').then(r => setUsers(r.data));
    if (tab === 'history') api.get<AuditLog[]>('/admin/audit-log').then(r => setLogs(r.data));
    if (tab === 'rules')   api.get<AdminRules>('/admin/rules').then(r => setRules(r.data));
  }, [tab]);

  useEffect(() => {
    if (selected) {
      setEditRole(selected.role as Role);
      setEditPlazaId(selected.assignedPlaza?.id ?? null);
      setFeedback('');
    }
  }, [selected]);

  useEffect(() => {
    if (editRole === 'fixed' && allPlazas.length === 0) {
      api.get<Plaza[]>('/plazas').then(r =>
        setAllPlazas(r.data.filter(p => !p.isRamp && !p.isService))
      );
    }
  }, [editRole, allPlazas.length]);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleApprove = async (u: User) => {
    setLoading(true);
    await api.post(`/admin/users/${u.id}/approve`);
    setFeedback('Usuario activado'); setSelected(null);
    api.get<User[]>('/admin/users').then(r => setUsers(r.data));
    setLoading(false);
  };

  const handleResetPwd = async (u: User) => {
    setLoading(true);
    await api.post(`/admin/users/${u.id}/reset-password`);
    setFeedback('Email de reset enviado'); setSelected(null);
    setLoading(false);
  };

  const handleDisable = async (u: User) => {
    setLoading(true);
    await api.delete(`/admin/users/${u.id}`);
    setFeedback('Usuario desactivado'); setSelected(null);
    api.get<User[]>('/admin/users').then(r => setUsers(r.data));
    setLoading(false);
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    setSavingEdit(true);
    try {
      await api.put(`/admin/users/${selected.id}`, {
        role: editRole,
        assignedPlazaId: editRole === 'fixed' ? editPlazaId : null,
      });
      setFeedback('Cambios guardados');
      api.get<User[]>('/admin/users').then(r => setUsers(r.data));
      setTimeout(() => setSelected(null), 800);
    } catch {
      setFeedback('Error al guardar');
    }
    setSavingEdit(false);
  };

  const handleSaveRules = async (patch: Partial<AdminRules>) => {
    const updated = { ...rules!, ...patch };
    setRules(updated);
    await api.put('/admin/rules', patch);
  };

  const ACTION_LABELS: Record<string, string> = {
    user_registered:    '👤 Usuario registrado',
    user_approved:      '✅ Usuario activado',
    user_created:       '➕ Usuario creado',
    user_disabled:      '🚫 Usuario desactivado',
    password_reset_sent:'📧 Reset de contraseña enviado',
    plaza_liberated:    '🔓 Plaza liberada',
    reservation_urgent: '⚡ Reserva urgente',
    rules_updated:      '⚙️ Reglas actualizadas',
  };

  return (
    <div className="px-5 pt-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white border border-gray-line flex items-center justify-center">
          <ChevronLeft size={18} className="text-ink2" />
        </button>
        <h1 className="text-[22px] font-extrabold text-ink tracking-[-0.6px]">Administración</h1>
      </div>

      <SegmentedControl
        options={[
          { value: 'users' as Tab,   label: 'Usuarios' },
          { value: 'rules' as Tab,   label: 'Reglas' },
          { value: 'history' as Tab, label: 'Historial' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {/* ── USUARIOS ── */}
      {tab === 'users' && (
        <div className="mt-4">
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-mid" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar usuario…"
                className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-line text-[14px] font-medium bg-white outline-none focus:border-purple"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {filteredUsers.map(u => {
              const st = STATUS_LABELS[u.status];
              return (
                <button
                  key={u.id}
                  onClick={() => setSelected(u)}
                  className="bg-white rounded-xl border border-gray-line p-3 flex items-center gap-3 text-left active:bg-gray-bg transition-colors w-full"
                >
                  <Avatar name={u.name} color={u.avatarColor} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[15px] font-semibold text-ink">{u.name}</p>
                      {u.status !== 'active' && <Badge color={st.color as any}>{st.label}</Badge>}
                    </div>
                    <p className="text-[12px] text-gray-mid font-medium truncate">{u.email}</p>
                    <div className="flex gap-1.5 mt-1">
                      <Badge color="purple">{ROLE_LABELS[u.role]}</Badge>
                      {(u as any).assignedPlaza && (
                        <Badge color="blue">{(u as any).assignedPlaza.floor} · {(u as any).assignedPlaza.num}</Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── REGLAS ── */}
      {tab === 'rules' && rules && (
        <div className="mt-4 flex flex-col gap-4">
          {/* Antelación */}
          <div className="bg-white rounded-xl border border-gray-line p-4">
            <p className="text-[15px] font-bold text-ink mb-1">Antelación máxima</p>
            <p className="text-[12px] text-gray-mid font-medium mb-3">Máximo tiempo de antelación para reservar</p>
            <div className="grid grid-cols-4 gap-1.5">
              {[24, 48, 72, 168].map(h => (
                <button
                  key={h}
                  onClick={() => handleSaveRules({ advanceBookingHours: h })}
                  className={`h-10 rounded-lg text-[12px] font-semibold transition-colors ${
                    rules.advanceBookingHours === h ? 'bg-purple text-white' : 'bg-gray-bg text-ink2'
                  }`}
                >
                  {h === 168 ? '1 sem' : `${h}h`}
                </button>
              ))}
            </div>
          </div>

          {/* Cupo semanal */}
          <div className="bg-white rounded-xl border border-gray-line p-4">
            <p className="text-[15px] font-bold text-ink mb-1">Cupo semanal</p>
            <p className="text-[12px] text-gray-mid font-medium mb-3">Reservas por usuario por semana</p>
            <div className="flex items-center gap-4 justify-center">
              <button
                onClick={() => handleSaveRules({ weeklyQuotaPerUser: Math.max(1, rules.weeklyQuotaPerUser - 1) })}
                className="w-10 h-10 rounded-full bg-gray-bg text-ink2 font-bold text-lg flex items-center justify-center"
              >−</button>
              <span className="text-[42px] font-extrabold text-purple tracking-[-2px] w-16 text-center">
                {rules.weeklyQuotaPerUser}
              </span>
              <button
                onClick={() => handleSaveRules({ weeklyQuotaPerUser: rules.weeklyQuotaPerUser + 1 })}
                className="w-10 h-10 rounded-full bg-gray-bg text-ink2 font-bold text-lg flex items-center justify-center"
              >+</button>
            </div>
          </div>

          {/* Urgentes */}
          <div className="bg-white rounded-xl border border-gray-line p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[15px] font-bold text-ink">Reservas urgentes</p>
              <Toggle checked={rules.monthlyUrgentQuota > 0} onChange={v => handleSaveRules({ monthlyUrgentQuota: v ? 3 : 0 })} />
            </div>
            <p className="text-[12px] text-gray-mid font-medium">{rules.monthlyUrgentQuota} por mes · Solo a usuarios sin plaza</p>
          </div>

          {/* Notificaciones */}
          <div className="bg-white rounded-xl border border-gray-line p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-bold text-ink">Notificaciones push</p>
                <p className="text-[12px] text-gray-mid font-medium mt-0.5">Al liberarse una plaza</p>
              </div>
              <Toggle checked={rules.notifyOnLiberation} onChange={v => handleSaveRules({ notifyOnLiberation: v })} />
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORIAL ── */}
      {tab === 'history' && (
        <div className="mt-4 flex flex-col gap-2">
          {logs.map(log => (
            <div key={log.id} className="bg-white rounded-xl border border-gray-line px-4 py-3">
              <p className="text-[14px] font-semibold text-ink">{ACTION_LABELS[log.action] ?? log.action}</p>
              {log.user && <p className="text-[12px] text-gray-mid font-medium">{log.user.name}</p>}
              {log.detail && <p className="text-[12px] text-ink2 font-medium mt-0.5">{log.detail}</p>}
              <p className="text-[11px] text-gray-mid mt-1">
                {new Date(log.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* User detail sheet */}
      <BottomSheet open={!!selected} onClose={() => setSelected(null)} title="Detalle usuario">
        {selected && (
          <div className="pt-4 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={selected.name} color={selected.avatarColor} size={56} />
              <div>
                <p className="text-[18px] font-bold text-ink">{selected.name}</p>
                <p className="text-[13px] text-gray-mid font-medium">{selected.email}</p>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  <Badge color="purple">{ROLE_LABELS[selected.role]}</Badge>
                  <Badge color={STATUS_LABELS[selected.status].color as any}>{STATUS_LABELS[selected.status].label}</Badge>
                </div>
              </div>
            </div>

            {selected.plate && <p className="text-[13px] text-ink2 font-medium">Matrícula: <span className="font-bold">{selected.plate}</span></p>}

            {/* ─── Editar rol y plaza ─── */}
            <div className="border border-gray-line rounded-xl p-4 flex flex-col gap-3">
              <p className="text-[13px] font-bold text-ink">Rol</p>
              <SegmentedControl
                options={[
                  { value: 'fixed'    as Role, label: 'Fija' },
                  { value: 'floating' as Role, label: 'Libre' },
                  { value: 'admin'    as Role, label: 'Admin' },
                  { value: 'guest'    as Role, label: 'Invitado' },
                ]}
                value={editRole}
                onChange={setEditRole}
              />

              {editRole === 'fixed' && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[13px] font-bold text-ink">Plaza asignada</p>
                  <select
                    value={editPlazaId ?? ''}
                    onChange={e => setEditPlazaId(e.target.value || null)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-line text-[14px] font-medium bg-white outline-none focus:border-purple"
                  >
                    <option value="">Sin plaza asignada</option>
                    {allPlazas.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.floor} · {p.num} — {BAY_LABELS[p.bay] ?? p.bay}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Button variant="primary" fullWidth onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? '…' : 'Guardar cambios'}
              </Button>
            </div>

            {feedback && <p className="text-[13px] text-ok font-semibold bg-ok-soft px-3 py-2 rounded-md">{feedback}</p>}

            <div className="flex flex-col gap-2">
              {(selected.status === 'pending' || selected.status === 'invited') && (
                <Button variant="primary" fullWidth onClick={() => handleApprove(selected)} disabled={loading}>
                  ✅ Activar cuenta
                </Button>
              )}
              <Button variant="secondary" fullWidth onClick={() => handleResetPwd(selected)} disabled={loading}>
                📧 Enviar reset de contraseña
              </Button>
              <Button variant="danger" fullWidth onClick={() => handleDisable(selected)} disabled={loading}>
                Desactivar usuario
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
