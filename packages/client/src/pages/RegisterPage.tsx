import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

export default function RegisterPage() {
  const { register, status, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const isLoading = status === 'loading';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      return;
    }
    setConfirmError('');
    register({ name, email, password });
  };

  return (
    <div className="flex min-h-dvh items-start justify-center px-4 pb-8 pt-16 sm:items-center sm:pb-0 sm:pt-0">
      <motion.div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-md sm:p-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <h1 className="mb-1 text-center font-heading text-3xl font-bold text-charcoal">
          Create account
        </h1>
        <p className="mb-6 text-center font-body text-sm text-charcoal/50">
          Join your crew on rndvx
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="w-full rounded-md border border-muted bg-cream px-3 py-3 font-body text-charcoal placeholder-charcoal/40 outline-none focus:ring-2 focus:ring-sky"
          />

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
            autoComplete="new-password"
            className="w-full rounded-md border border-muted bg-cream px-3 py-3 font-body text-charcoal placeholder-charcoal/40 outline-none focus:ring-2 focus:ring-sky"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full rounded-md border border-muted bg-cream px-3 py-3 font-body text-charcoal placeholder-charcoal/40 outline-none focus:ring-2 focus:ring-sky"
          />

          {(confirmError || error) && (
            <p role="alert" className="text-sm text-coral">
              {confirmError || error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="min-h-[44px] w-full rounded-lg bg-coral px-4 py-3 font-heading font-semibold text-white active:opacity-80 disabled:opacity-50 sm:hover:opacity-90"
          >
            {isLoading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-4 text-center font-body text-sm text-charcoal/60">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-sky active:opacity-80 sm:hover:underline"
          >
            Log In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
