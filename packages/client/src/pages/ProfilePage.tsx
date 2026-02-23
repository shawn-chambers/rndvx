import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '../hooks/useProfile';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../hooks/useAuth';
import type { UpdateProfilePayload, CreateGroupPayload } from '@rndvx/types';

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block font-body text-sm font-medium text-charcoal">
        {label}
      </label>
      {children}
    </div>
  );
}

function GroupRow({
  name,
  memberCount,
  isOwner,
  onLeave,
  onDelete,
}: {
  name: string;
  memberCount: number;
  isOwner: boolean;
  onLeave: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div>
        <p className="font-body text-sm font-medium text-charcoal">{name}</p>
        <p className="font-body text-xs text-charcoal/50">
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
          {isOwner && ' · Owner'}
        </p>
      </div>
      <button
        type="button"
        onClick={isOwner ? onDelete : onLeave}
        className="min-h-[44px] rounded-lg px-3 py-2 font-body text-xs font-medium text-coral active:opacity-70 sm:hover:underline"
      >
        {isOwner ? 'Delete' : 'Leave'}
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { profile, isSaving, updateStatus, updateError, fetch, update, resetUpdate } = useProfile();
  const { myGroups, status: groupsStatus, create: createGroup, remove: removeGroup } = useGroups();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);

  useEffect(() => {
    fetch();
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setEmail(profile.email ?? '');
    }
  }, [profile]);

  useEffect(() => {
    if (updateStatus === 'succeeded') {
      setSaveSuccess(true);
      const t = setTimeout(() => {
        setSaveSuccess(false);
        resetUpdate();
      }, 2500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [updateStatus, resetUpdate]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: UpdateProfilePayload = {};
    if (name.trim() && name !== profile?.name) payload.name = name.trim();
    if (email.trim() && email !== profile?.email) payload.email = email.trim();
    if (Object.keys(payload).length > 0) update(payload);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const payload: CreateGroupPayload = { name: newGroupName.trim() };
    await createGroup(payload);
    setNewGroupName('');
    setShowNewGroup(false);
  };

  return (
    <div className="min-h-dvh bg-cream px-4 pb-12 pt-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-1.5 font-body text-sm text-charcoal/60 active:opacity-70 sm:hover:text-charcoal"
          >
            <span aria-hidden="true">←</span>
            Back
          </Link>
          <button
            type="button"
            onClick={logout}
            className="min-h-[44px] rounded-lg px-4 py-2 font-body text-sm text-coral active:opacity-70"
          >
            Sign out
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="space-y-6"
        >
          {/* Avatar + name header */}
          <div className="flex items-center gap-4">
            <div
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-xl bg-lime font-heading text-xl font-bold text-white"
            >
              {(profile?.name ?? user?.name ?? '?')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-charcoal">
                {profile?.name ?? user?.name ?? 'Your profile'}
              </h1>
              <p className="font-body text-sm text-charcoal/50">{profile?.email ?? user?.email}</p>
            </div>
          </div>

          {/* Personal info */}
          <section className="rounded-lg bg-white px-4 py-4">
            <p className="mb-4 font-body text-xs font-medium uppercase tracking-wide text-charcoal/40">
              Personal info
            </p>
            <form onSubmit={handleProfileSubmit} noValidate className="space-y-4">
              <Field label="Name" htmlFor="profile-name">
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-muted bg-cream px-4 py-3 font-body text-base text-charcoal focus:border-sky focus:outline-none"
                />
              </Field>
              <Field label="Email" htmlFor="profile-email">
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-muted bg-cream px-4 py-3 font-body text-base text-charcoal focus:border-sky focus:outline-none"
                />
              </Field>

              <AnimatePresence>
                {updateError && (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    role="alert"
                    className="font-body text-xs text-coral"
                  >
                    {updateError}
                  </motion.p>
                )}
                {saveSuccess && (
                  <motion.p
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-body text-xs text-lime"
                  >
                    Saved!
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isSaving}
                className="min-h-[44px] w-full rounded-lg bg-sky px-6 py-3 font-heading text-base font-semibold text-white active:opacity-80 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </section>

          {/* Groups */}
          <section className="rounded-lg bg-white px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-body text-xs font-medium uppercase tracking-wide text-charcoal/40">
                Groups
              </p>
              <button
                type="button"
                onClick={() => setShowNewGroup((v) => !v)}
                className="min-h-[44px] rounded-lg px-3 py-2 font-body text-xs font-medium text-sky active:opacity-70"
              >
                {showNewGroup ? 'Cancel' : '+ New group'}
              </button>
            </div>

            <AnimatePresence>
              {showNewGroup && (
                <motion.form
                  key="new-group-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleCreateGroup}
                  className="mb-3 overflow-hidden"
                >
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Group name"
                      className="min-w-0 flex-1 rounded-lg border border-muted bg-cream px-4 py-3 font-body text-base text-charcoal placeholder:text-charcoal/30 focus:border-sky focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newGroupName.trim()}
                      className="min-h-[44px] rounded-lg bg-lime px-4 py-2 font-heading text-sm font-semibold text-white active:opacity-80 disabled:opacity-40"
                    >
                      Create
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {groupsStatus === 'loading' && (
              <div className="space-y-3" aria-busy="true">
                {[1, 2].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            )}

            {groupsStatus !== 'loading' && myGroups.length === 0 && (
              <p className="py-3 font-body text-sm text-charcoal/40">
                You&apos;re not in any groups yet.
              </p>
            )}

            {myGroups.length > 0 && (
              <motion.ul
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.05 } },
                }}
                className="divide-y divide-muted"
              >
                {myGroups.map((group) => (
                  <motion.li
                    key={group.id}
                    variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                  >
                    <GroupRow
                      name={group.name}
                      memberCount={0}
                      isOwner={group.ownerId === user?.id}
                      onLeave={() => {}}
                      onDelete={() => removeGroup(group.id)}
                    />
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </section>

          {/* Notification preferences — placeholder */}
          <section className="rounded-lg bg-white px-4 py-4">
            <p className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-charcoal/40">
              Notifications
            </p>
            <p className="font-body text-sm text-charcoal/50">
              Push notification preferences coming soon.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
