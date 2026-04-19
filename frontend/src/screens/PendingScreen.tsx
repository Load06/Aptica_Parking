import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

export function PendingScreen() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 bg-bg text-center">
      <div className="w-16 h-16 rounded-full bg-warn-soft flex items-center justify-center mb-5">
        <Clock size={28} className="text-warn" />
      </div>
      <h1 className="text-[22px] font-extrabold text-ink tracking-[-0.6px] mb-2">Solicitud enviada</h1>
      <p className="text-[15px] text-gray-mid font-medium max-w-xs">
        El admin revisará tu cuenta y recibirás una notificación cuando esté activada.
      </p>
      <Link to="/login" className="mt-6 text-[13px] text-purple font-semibold">
        Volver al inicio
      </Link>
    </div>
  );
}
