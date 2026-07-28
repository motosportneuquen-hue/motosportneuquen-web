import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, LogIn, UserPlus, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signIn, signUp } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const sendMagicLink = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setAuthError(null);
    setSuccessMessage(null);
    if (!normalizedEmail) {
      setAuthError('Ingresá tu correo electrónico.');
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    });
    setIsSubmitting(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    setSuccessMessage('Te enviamos un enlace de acceso. Revisá tu correo y abrilo desde este dispositivo.');
  };
  
  // Get redirect information from location state
  const from = location.state?.from || '/';
  const message = location.state?.message || '';

  useEffect(() => {
    if (user && !loading) {
      // Redirect to the page they were trying to access or home
      navigate(from);
    }
  }, [user, loading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    
    try {
      if (isSignUp) {
        // Handle sign up
        if (!username.trim()) {
          setAuthError('El nombre de usuario es obligatorio');
          setIsSubmitting(false);
          return;
        }
        
        const { error } = await signUp(email, password, username);
        if (error) {
          setAuthError(error.message);
        } else {
          // Show success message for sign up
          setSuccessMessage('Cuenta creada correctamente. Ya iniciaste sesion.');
          // Redirect to home page after a short delay
          setTimeout(() => {
            navigate('/');
          }, 1500);
        }
      } else {
        // Handle sign in
        const { error } = await signIn(email, password);
        if (error) {
          setAuthError(error.message);
        } else {
          // Show success message for sign in
          setSuccessMessage("Inicio de sesion exitoso. Redirigiendo...");
          // Redirect to home page after a short delay
          setTimeout(() => {
            navigate('/');
          }, 1000);
        }
      }
    } catch (error: unknown) {
      setAuthError(error instanceof Error ? error.message : 'Ocurrio un error durante la autenticacion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-12">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {isSignUp ? 'Crear una cuenta' : 'Iniciar sesion'}
        </h1>
        
        {message && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 dark:text-yellow-200">{message}</p>
          </div>
        )}
        
        {authError && (
          <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
            <p className="text-purple-800 dark:text-purple-200">{authError}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <p className="text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre de usuario *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-10 w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Elegi un nombre de usuario"
                />
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Correo electronico *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="tu@email.com"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contrasena *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || !!successMessage}
            className="w-full flex items-center justify-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-white hover:text-black transition-colors disabled:bg-gray-400 btn-hover-scale"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </span>
            ) : isSignUp ? (
              <span className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2" />
                Registrarse
              </span>
            ) : (
              <span className="flex items-center">
                <LogIn className="h-5 w-5 mr-2" />
                Iniciar sesion
              </span>
            )}
          </button>
        </form>

        {!isSignUp ? (
          <div className="mt-4">
            <div className="mb-4 flex items-center gap-3 text-xs text-gray-400">
              <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              <span>o ingresá sin contraseña</span>
              <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>
            <button
              type="button"
              onClick={sendMagicLink}
              disabled={isSubmitting || !email.trim()}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary/50 px-4 font-bold text-primary transition hover:bg-primary hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Mail className="h-5 w-5" />
              Enviarme un enlace de acceso
            </button>
          </div>
        ) : null}
        
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setAuthError(null);
            }}
            className="text-primary hover:text-gray-300 transition-colors link-hover"
          >
            {isSignUp ? '¿Ya tenes una cuenta? Iniciar sesion' : '¿No tenes una cuenta? Registrarse'}
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Al iniciar sesion o crear una cuenta, aceptas nuestros{' '}
            <a href="/terms" className="text-primary hover:text-gray-300 transition-colors link-hover">
              Terminos del servicio
            </a>{' '}
            y nuestra{' '}
            <a href="/privacy" className="text-primary hover:text-gray-300 transition-colors link-hover">
              Politica de privacidad
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

