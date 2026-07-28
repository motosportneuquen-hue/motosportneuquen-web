import { ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, profile, loading } = useAuthStore();

  if (loading) {
    return <section className="container py-10 text-gray-200">Cargando seguridad...</section>;
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: '/admin-speedy', message: 'Inicia sesion para acceder al panel.' }} />;
  }

  if (!profile) {
    return <section className="container py-10 text-gray-200">Verificando permisos...</section>;
  }

  if (!profile?.is_admin) {
    return (
      <section className="container py-10">
        <div className="rounded-lg border border-white/30 bg-black/60 p-4 text-gray-200 backdrop-blur-sm">
          <h1 className="font-brand text-3xl text-white">Acceso denegado</h1>
          <p className="mt-3">Este panel es solo para administradores de MotoSport Neuquén.</p>
          <Link to="/" className="mt-5 inline-flex rounded-md bg-white px-4 py-2 font-bold text-black">
            Volver al inicio
          </Link>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
