import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login, status, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  const isLoading = status === 'loading';

  return (
    <div className="flex min-h-dvh items-start justify-center px-4 pb-8 pt-16 sm:items-center sm:pb-0 sm:pt-0">
      <motion.div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-md sm:p-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <h1 className="mb-1 text-center font-heading text-3xl font-bold text-charcoal">
          Welcome back
        </h1>
        <p className="mb-6 text-center font-body text-sm text-charcoal/50">
          Log in to see what&apos;s planned
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-md border border-muted bg-cream px-3 py-3 font-body text-charcoal placeholder-charcoal/40 outline-none focus:ring-2 focus:ring-sky"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-muted bg-cream px-3 py-3 font-body text-charcoal placeholder-charcoal/40 outline-none focus:ring-2 focus:ring-sky"
          />

          {error && (
            <p role="alert" className="text-sm text-coral">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="min-h-[44px] w-full rounded-lg bg-lime px-4 py-3 font-heading font-semibold text-white active:opacity-80 disabled:opacity-50 sm:hover:opacity-90"
          >
            {isLoading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p className="mt-4 text-center font-body text-sm text-charcoal/60">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-sky active:opacity-80 sm:hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
