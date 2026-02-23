import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocationSearch } from '../../hooks/useLocationSearch';
import { useAuth } from '../../hooks/useAuth';
import {
  selectLocationVotesByMeeting,
  selectVoteTallyByMeeting,
  selectMyLocationVote,
} from '../../store/slices/locationsSlice';
import type { RootState } from '../../store';
import type { PlaceSuggestion } from '@rndvx/types';

// ─── Vote card ────────────────────────────────────────────────────────────────

function VoteCard({
  placeName,
  placeAddress,
  count,
  isLeading,
  hasMyVote,
  onVote,
}: {
  placeName: string;
  placeAddress: string;
  count: number;
  isLeading: boolean;
  hasMyVote: boolean;
  onVote: () => void;
}) {
  const base = isLeading
    ? 'bg-yellow border-yellow/40'
    : 'bg-sky/10 border-sky/20';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`rounded-lg border px-4 py-3 ${base}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-body text-sm font-semibold text-charcoal">{placeName}</p>
          <p className="truncate font-body text-xs text-charcoal/60">{placeAddress}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-heading text-lg font-bold text-charcoal">{count}</span>
          <span className="font-body text-xs text-charcoal/50">
            {count === 1 ? 'vote' : 'votes'}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onVote}
        className={`mt-3 min-h-[44px] w-full rounded-md px-4 py-2 font-heading text-sm font-semibold active:opacity-80 ${
          hasMyVote
            ? 'bg-charcoal/10 text-charcoal'
            : 'bg-sky text-white'
        }`}
      >
        {hasMyVote ? '✓ Voted' : 'Vote for this'}
      </button>
    </motion.div>
  );
}

// ─── Suggestion item ──────────────────────────────────────────────────────────

function SuggestionItem({
  place,
  onSelect,
}: {
  place: PlaceSuggestion;
  onSelect: (place: PlaceSuggestion) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(place)}
      className="w-full rounded-lg px-4 py-3 text-left active:bg-muted sm:hover:bg-muted"
    >
      <p className="font-body text-sm font-medium text-charcoal">{place.name}</p>
      <p className="font-body text-xs text-charcoal/50">{place.address}</p>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface LocationSuggestionUIProps {
  meetingId: string;
}

export function LocationSuggestionUI({ meetingId }: LocationSuggestionUIProps) {
  const { user } = useAuth();
  const { suggestions, isSearching, searchError, search, clear, fetchVotes, castVote } =
    useLocationSearch();

  const votes = useSelector((state: RootState) => selectLocationVotesByMeeting(state, meetingId));
  const tally = useSelector((state: RootState) => selectVoteTallyByMeeting(state, meetingId));
  const myVote = useSelector((state: RootState) => selectMyLocationVote(state, meetingId));

  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchVotes(meetingId);
  }, [meetingId]);

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (val.trim().length < 2) {
        clear();
        setShowDropdown(false);
        return;
      }

      debounceRef.current = setTimeout(() => {
        search(val.trim());
        setShowDropdown(true);
      }, 350);
    },
    [search, clear],
  );

  const handleSelect = useCallback(
    (place: PlaceSuggestion) => {
      if (!user) return;
      castVote({
        meetingId,
        placeId: place.placeId,
        placeName: place.name,
        placeAddress: place.address,
        lat: place.lat,
        lng: place.lng,
      });
      setQuery('');
      clear();
      setShowDropdown(false);
    },
    [meetingId, user, castVote, clear],
  );

  const handleVoteForExisting = useCallback(
    (placeId: string, placeName: string, placeAddress: string) => {
      if (!user) return;
      castVote({ meetingId, placeId, placeName, placeAddress });
    },
    [meetingId, user, castVote],
  );

  const leadingPlaceId = tally[0]?.placeId;

  return (
    <div className="rounded-lg bg-white px-4 py-4">
      <p className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-charcoal/40">
        Location suggestions
      </p>

      {/* Search input */}
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Search for a place…"
          aria-label="Search for a location"
          className="w-full rounded-lg border border-muted bg-cream px-4 py-3 font-body text-base text-charcoal placeholder:text-charcoal/30 focus:border-sky focus:outline-none"
        />

        {isSearching && (
          <span
            aria-label="Searching…"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-sky border-t-transparent"
          />
        )}

        <AnimatePresence>
          {showDropdown && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-muted bg-white shadow-md"
            >
              {suggestions.map((place) => (
                <SuggestionItem key={place.placeId} place={place} onSelect={handleSelect} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {searchError && (
        <p role="alert" className="mt-2 font-body text-xs text-coral">
          {searchError}
        </p>
      )}

      {/* Vote tally */}
      {tally.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 space-y-2"
          aria-label="Location vote results"
        >
          <AnimatePresence>
            {tally.map((entry) => (
              <VoteCard
                key={entry.placeId}
                placeName={entry.placeName}
                placeAddress={entry.placeAddress}
                count={entry.count}
                isLeading={entry.placeId === leadingPlaceId}
                hasMyVote={myVote?.placeId === entry.placeId}
                onVote={() =>
                  handleVoteForExisting(entry.placeId, entry.placeName, entry.placeAddress)
                }
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {tally.length === 0 && votes.length === 0 && (
        <p className="mt-3 font-body text-sm text-charcoal/40">
          No location suggestions yet. Search above to add one.
        </p>
      )}
    </div>
  );
}
