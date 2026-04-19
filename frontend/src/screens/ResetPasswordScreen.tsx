import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Button, Input } from '../components/ui';

export function ResetPasswordScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setMessage('Si el email existe, recibirás un enlace en breve.');
    } catch {
      setError('Error al enviar el email');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Token inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 bg-bg">
      <div className="w-full max-w-sm">
        <Link to="/login" className="text-[13px] text-gray-mid font-semibold">← Volver</Link>
        <h1 className="text-[22px] font-extrabold text-ink tracking-[-0.6px] mt-3 mb-1">
          {token ? 'Nueva contraseña' : 'Recuperar contraseña'}
        </h1>

        {!token ? (
          <form onSubmit={handleForgot} className="flex flex-col gap-4 mt-4">
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@aptica.es" required />
            {message && <p className="text-[13px] text-ok font-semibold bg-ok-soft px-3 py-2 rounded-md">{message}</p>}
            {error && <p className="text-[13px] text-red font-semibold bg-red-soft px-3 py-2 rounded-md">{error}</p>}
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4 mt-4">
            <Input label="Nueva contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required />
            {error && <p className="text-[13px] text-red font-semibold bg-red-soft px-3 py-2 rounded-md">{error}</p>}
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? 'Guardando…' : 'Establecer contraseña'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
