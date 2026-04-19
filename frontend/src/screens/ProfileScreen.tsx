import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Car, User, Bell, Shield, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { Avatar, Badge, BottomSheet, Button, Input, Row, SectionTitle, Toggle } from '../components/ui';
import { subscribePush, unsubscribePush, isPushSubscribed } from '../lib/push';

export function ProfileScreen() {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState<'personal' | 'password' | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Personal edit form
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [plate, setPlate] = useState(user?.plate ?? '');

  // Password form
  const [currPwd, setCurrPwd] = useState('');
  const [nextPwd, setNextPwd] = useState('');

  useEffect(() => {
    isPushSubscribed().then(setPushEnabled);
  }, []);

  const handleTogglePush = async (v: boolean) => {
    try {
      if (v) await subscribePush();
      else    await unsubscribePush();
      setPushEnabled(v);
    } catch {
      setError('Error al configurar notificaciones');
    }
  };

  const handleSavePersonal = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.put('/auth/me', { name, phone, plate });
      await refresh();
      setSuccess('Datos actualizados');
      setTimeout(() => { setSuccess(''); setEditOpen(null); }, 1200);
    } catch {
      setError('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.put('/auth/me/password', { current: currPwd, next: nextPwd });
      setSuccess('Contraseña actualizada');
      setTimeout(() => { setSuccess(''); setEditOpen(null); }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  const roleLabel: Record<string, string> = { fixed: 'Plaza fija', floating: 'Sin plaza', admin: 'Admin', guest: 'Invitado' };

  return (
    <div className="px-5 pt-4 pb-4">
      <h1 className="text-[22px] font-extrabold text-ink tracking-[-0.6px] mb-5">Perfil</h1>

      {/* Identity card */}
      <div className="bg-white rounded-xl border border-gray-line p-4 flex items-center gap-4 mb-2">
        <Avatar name={user?.name ?? '?'} color={user?.avatarColor ?? '#6A1873'} size={64} />
        <div className="flex-1 min-w-0">
          <p className="text-[18px] font-extrabold text-ink tracking-[-0.3px] leading-tight">{user?.name}</p>
          <p className="text-[13px] text-gray-mid font-medium truncate mt-0.5">{user?.email}</p>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <Badge color="purple">{roleLabel[user?.role ?? 'floating']}</Badge>
            {user?.assignedPlaza && (
              <Badge color="blue">{user.assignedPlaza.floor} · {user.assignedPlaza.num}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Cuenta */}
      <SectionTitle>Cuenta</SectionTitle>
      <div className="bg-white rounded-xl border border-gray-line overflow-hidden">
        <Row icon={<User size={16} />} label="Datos personales" sublabel={user?.name} right={<ChevronRight size={16} className="text-gray-mid" />} onClick={() => setEditOpen('personal')} />
        <div className="border-t border-gray-line" />
        <Row icon={<Car size={16} />} label="Matrícula" sublabel={user?.plate ?? '—'} right={<ChevronRight size={16} className="text-gray-mid" />} onClick={() => setEditOpen('personal')} />
        <div className="border-t border-gray-line" />
        <Row icon={<Key size={16} />} label="Contraseña" sublabel="Cambiar contraseña" right={<ChevronRight size={16} className="text-gray-mid" />} onClick={() => setEditOpen('password')} />
      </div>

      {/* Notificaciones */}
      <SectionTitle>Notificaciones</SectionTitle>
      <div className="bg-white rounded-xl border border-gray-line overflow-hidden">
        <div className="flex items-center px-4 py-3 gap-3">
          <span className="w-9 h-9 rounded-[10px] bg-purple-soft flex items-center justify-center shrink-0 text-purple">
            <Bell size={16} />
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-ink">Nueva plaza liberada</p>
            <p className="text-[13px] text-gray-mid font-medium">Notificación push en el móvil</p>
          </div>
          <Toggle checked={pushEnabled} onChange={handleTogglePush} />
        </div>
      </div>

      {/* Admin */}
      {user?.role === 'admin' && (
        <>
          <SectionTitle>Administración</SectionTitle>
          <div className="bg-white rounded-xl border border-gray-line overflow-hidden">
            <Row icon={<Shield size={16} />} label="Panel de Admin" sublabel="Usuarios, reglas e historial" right={<ChevronRight size={16} className="text-gray-mid" />} onClick={() => navigate('/admin')} />
          </div>
        </>
      )}

      {/* Logout */}
      <SectionTitle>Sesión</SectionTitle>
      <div className="bg-white rounded-xl border border-gray-line overflow-hidden">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-3 px-4 py-3 text-red active:bg-red-soft transition-colors"
        >
          <span className="w-9 h-9 rounded-[10px] bg-red-soft flex items-center justify-center shrink-0">
            <LogOut size={16} className="text-red" />
          </span>
          <span className="text-[15px] font-semibold">Cerrar sesión</span>
        </button>
      </div>

      <p className="text-center text-[12px] text-gray-mid font-medium mt-6">Aptica Parking · v1.0.0</p>

      {/* Edit personal sheet */}
      <BottomSheet open={editOpen === 'personal'} onClose={() => setEditOpen(null)} title="Datos personales">
        <div className="pt-4 flex flex-col gap-4">
          <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} />
          <Input label="Teléfono" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
          <Input label="Matrícula" value={plate} onChange={e => setPlate(e.target.value)} />
          {error   && <p className="text-[13px] text-red font-semibold bg-red-soft px-3 py-2 rounded-md">{error}</p>}
          {success && <p className="text-[13px] text-ok font-semibold bg-ok-soft px-3 py-2 rounded-md">{success}</p>}
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setEditOpen(null)}>Cancelar</Button>
            <Button variant="primary" className="flex-1" onClick={handleSavePersonal} disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Edit password sheet */}
      <BottomSheet open={editOpen === 'password'} onClose={() => setEditOpen(null)} title="Cambiar contraseña">
        <div className="pt-4 flex flex-col gap-4">
          <Input label="Contraseña actual" type="password" value={currPwd} onChange={e => setCurrPwd(e.target.value)} />
          <Input label="Nueva contraseña" type="password" value={nextPwd} onChange={e => setNextPwd(e.target.value)} />
          {error   && <p className="text-[13px] text-red font-semibold bg-red-soft px-3 py-2 rounded-md">{error}</p>}
          {success && <p className="text-[13px] text-ok font-semibold bg-ok-soft px-3 py-2 rounded-md">{success}</p>}
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setEditOpen(null)}>Cancelar</Button>
            <Button variant="primary" className="flex-1" onClick={handleSavePassword} disabled={loading || nextPwd.length < 8}>
              {loading ? 'Guardando…' : 'Cambiar'}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
