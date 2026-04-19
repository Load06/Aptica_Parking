import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button, Input } from '../components/ui';

export function LoginScreen() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 bg-bg">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6A1873, #58457A)' }}
          >
            <span className="text-white text-2xl font-black">P</span>
          </div>
          <h1 className="text-[26px] font-extrabold text-ink tracking-[-0.8px]">Aptica Parking</h1>
          <p className="text-[14px] text-gray-mid font-medium mt-1">Gestión de plazas de aparcamiento</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@aptica.es"
            required
            autoComplete="email"
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
          {error && (
            <p className="text-[13px] text-red font-semibold bg-red-soft px-3 py-2 rounded-md">{error}</p>
          )}
          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </Button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2 text-[13px]">
          <Link to="/register" className="text-purple font-semibold">
            ¿No tienes cuenta? Regístrate
          </Link>
          <Link to="/reset-password" className="text-gray-mid font-medium">
            Olvidé mi contraseña
          </Link>
        </div>
      </div>
    </div>
  );
}
