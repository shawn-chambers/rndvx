import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <h1 className="mb-6 text-3xl font-bold text-charcoal sm:text-4xl">
        Hello, {user?.name ?? 'World'}!
      </h1>
      <button
        onClick={logout}
        className="rounded-lg bg-coral px-6 py-3 font-heading font-semibold text-white active:opacity-80 sm:hover:opacity-90"
      >
        Logout
      </button>
    </div>
  );
}
