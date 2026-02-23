import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { PlaceSuggestion, LocationVote, CastLocationVotePayload } from '@rndvx/types';
import { API } from '@rndvx/types';
import { api } from '../../lib/api';
import type { RootState } from '../index';

// ─── State Shape ─────────────────────────────────────────────────────────────

export interface LocationsState {
  suggestions: PlaceSuggestion[];
  searchQuery: string;
  searchStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  searchError: string | null;
  votesByMeetingId: Record<string, LocationVote[]>;
  voteStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  voteError: string | null;
}

const initialState: LocationsState = {
  suggestions: [],
  searchQuery: '',
  searchStatus: 'idle',
  searchError: null,
  votesByMeetingId: {},
  voteStatus: 'idle',
  voteError: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const searchPlaces = createAsyncThunk(
  'locations/search',
  async (query: string) => {
    const encoded = encodeURIComponent(query);
    const data = await api<{ places: PlaceSuggestion[] }>(`${API.PLACES_SEARCH}?q=${encoded}`);
    return { query, places: data.places };
  },
);

export const fetchLocationVotes = createAsyncThunk(
  'locations/fetchVotes',
  async (meetingId: string) => {
    try {
      const data = await api<{ votes: LocationVote[] }>(API.meetingLocationVotes(meetingId));
      return { meetingId, votes: data.votes };
    } catch {
      // Endpoint not yet implemented — return empty votes silently
      return { meetingId, votes: [] };
    }
  },
);

export const castLocationVote = createAsyncThunk(
  'locations/castVote',
  async (payload: CastLocationVotePayload, { rejectWithValue }) => {
    try {
      const data = await api<{ vote: LocationVote }>(
        API.meetingLocationVotes(payload.meetingId),
        { method: 'POST', body: JSON.stringify(payload) },
      );
      return data.vote;
    } catch (err) {
      return rejectWithValue('Location voting is not available yet');
    }
  },
);

export const removeLocationVote = createAsyncThunk(
  'locations/removeVote',
  async ({ meetingId, voteId }: { meetingId: string; voteId: string }, { rejectWithValue }) => {
    try {
      await api(`${API.meetingLocationVotes(meetingId)}/${voteId}`, { method: 'DELETE' });
      return { meetingId, voteId };
    } catch {
      return rejectWithValue('Location voting is not available yet');
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const locationsSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    clearSuggestions(state) {
      state.suggestions = [];
      state.searchQuery = '';
      state.searchStatus = 'idle';
      state.searchError = null;
    },
  },
  extraReducers: (builder) => {
    // searchPlaces
    builder
      .addCase(searchPlaces.pending, (state, action) => {
        state.searchStatus = 'loading';
        state.searchQuery = action.meta.arg;
        state.searchError = null;
      })
      .addCase(searchPlaces.fulfilled, (state, action) => {
        // Discard stale results if a newer query is in flight
        if (action.payload.query === state.searchQuery) {
          state.searchStatus = 'succeeded';
          state.suggestions = action.payload.places;
        }
      })
      .addCase(searchPlaces.rejected, (state, action) => {
        state.searchStatus = 'failed';
        state.searchError = action.error.message ?? 'Search failed';
      });

    // fetchLocationVotes
    builder.addCase(fetchLocationVotes.fulfilled, (state, action) => {
      state.votesByMeetingId[action.payload.meetingId] = action.payload.votes;
    });

    // castLocationVote — optimistic insert, confirmed on fulfilled
    builder
      .addCase(castLocationVote.pending, (state, action) => {
        state.voteStatus = 'loading';
        state.voteError = null;
        const { meetingId, placeId, placeName, placeAddress } = action.meta.arg;
        const existing = state.votesByMeetingId[meetingId] ?? [];
        const alreadyVoted = existing.some((v) => v.placeId === placeId);
        if (!alreadyVoted) {
          // Optimistic placeholder — id will be replaced on fulfilled
          existing.push({
            id: `optimistic-${Date.now()}`,
            meetingId,
            userId: '',
            placeId,
            placeName,
            placeAddress,
            createdAt: new Date(),
          });
          state.votesByMeetingId[meetingId] = existing;
        }
      })
      .addCase(castLocationVote.fulfilled, (state, action) => {
        state.voteStatus = 'succeeded';
        const vote = action.payload;
        const votes = state.votesByMeetingId[vote.meetingId] ?? [];
        const idx = votes.findIndex(
          (v) => v.id.startsWith('optimistic-') && v.placeId === vote.placeId,
        );
        if (idx !== -1) {
          votes[idx] = vote;
        } else {
          votes.push(vote);
        }
        state.votesByMeetingId[vote.meetingId] = votes;
      })
      .addCase(castLocationVote.rejected, (state, action) => {
        state.voteStatus = 'failed';
        state.voteError = (action.payload as string) ?? 'Failed to cast vote';
        // Remove optimistic entry — components should re-fetch votes on failure
        const meetingId = action.meta.arg.meetingId;
        if (state.votesByMeetingId[meetingId]) {
          state.votesByMeetingId[meetingId] = state.votesByMeetingId[meetingId].filter(
            (v) => !v.id.startsWith('optimistic-'),
          );
        }
      });

    // removeLocationVote
    builder.addCase(removeLocationVote.fulfilled, (state, action) => {
      const { meetingId, voteId } = action.payload;
      if (state.votesByMeetingId[meetingId]) {
        state.votesByMeetingId[meetingId] = state.votesByMeetingId[meetingId].filter(
          (v) => v.id !== voteId,
        );
      }
    });
  },
});

export const { clearSuggestions } = locationsSlice.actions;
export default locationsSlice.reducer;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectPlaceSuggestions = (state: RootState) => state.locations.suggestions;
export const selectSearchStatus = (state: RootState) => state.locations.searchStatus;
export const selectSearchError = (state: RootState) => state.locations.searchError;
export const selectSearchQuery = (state: RootState) => state.locations.searchQuery;

export const selectLocationVotesByMeeting = (
  state: RootState,
  meetingId: string,
): LocationVote[] => state.locations.votesByMeetingId[meetingId] ?? [];

export const selectVoteStatus = (state: RootState) => state.locations.voteStatus;

export const selectVoteTallyByMeeting = createSelector(
  (state: RootState, meetingId: string) =>
    state.locations.votesByMeetingId[meetingId] ?? [],
  (votes) => {
    const tally: Record<string, { placeName: string; placeAddress: string; count: number }> = {};
    votes.forEach((v) => {
      if (!tally[v.placeId]) {
        tally[v.placeId] = { placeName: v.placeName, placeAddress: v.placeAddress, count: 0 };
      }
      tally[v.placeId].count += 1;
    });
    return Object.entries(tally)
      .map(([placeId, info]) => ({ placeId, ...info }))
      .sort((a, b) => b.count - a.count);
  },
);

export const selectMyLocationVote = createSelector(
  (state: RootState, meetingId: string) =>
    state.locations.votesByMeetingId[meetingId] ?? [],
  (state: RootState) => state.auth.user?.id,
  (votes, userId) => (userId ? votes.find((v) => v.userId === userId) : undefined),
);
