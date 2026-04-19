import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Button, Input } from '../components/ui';

export function RegisterScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', plate: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/pending');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 bg-bg py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <Link to="/login" className="text-[13px] text-gray-mid font-semibold">← Volver</Link>
          <h1 className="text-[26px] font-extrabold text-ink tracking-[-0.8px] mt-3">Crear cuenta</h1>
          <p className="text-[14px] text-gray-mid font-medium">El admin revisará tu solicitud.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nombre completo" value={form.name} onChange={set('name')} placeholder="Tu nombre" required />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="tu@aptica.es" required autoComplete="email" />
          <Input label="Contraseña" type="password" value={form.password} onChange={set('password')} placeholder="Mínimo 8 caracteres" required autoComplete="new-password" />
          <Input label="Matrícula (opcional)" value={form.plate} onChange={set('plate')} placeholder="1234 ABC" />
          <Input label="Teléfono (opcional)" type="tel" value={form.phone} onChange={set('phone')} placeholder="+34 600 000 000" />

          {error && (
            <p className="text-[13px] text-red font-semibold bg-red-soft px-3 py-2 rounded-md">{error}</p>
          )}
          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? 'Enviando…' : 'Solicitar acceso'}
          </Button>
        </form>
      </div>
    </div>
  );
}
