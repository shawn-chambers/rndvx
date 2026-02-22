import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type {
  Meeting,
  Rsvp,
  CreateMeetingPayload,
  UpdateMeetingPayload,
  RsvpStatus,
} from '@rndvx/types';
import { api } from '../../lib/api';
import type { RootState } from '../index';

// ─── State Shape ─────────────────────────────────────────────────────────────

export interface MeetingsState {
  byId: Record<string, Meeting>;
  allIds: string[];
  rsvpsByMeetingId: Record<string, Rsvp[]>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  rsvpStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  rsvpError: string | null;
}

const initialState: MeetingsState = {
  byId: {},
  allIds: [],
  rsvpsByMeetingId: {},
  status: 'idle',
  error: null,
  rsvpStatus: 'idle',
  rsvpError: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchMeetings = createAsyncThunk('meetings/fetchAll', async () => {
  const data = await api<{ meetings: Meeting[] }>('/meetings');
  return data.meetings;
});

export const fetchMeeting = createAsyncThunk('meetings/fetchOne', async (id: string) => {
  const data = await api<{ meeting: Meeting }>(`/meetings/${id}`);
  return data.meeting;
});

export const createMeeting = createAsyncThunk(
  'meetings/create',
  async (payload: CreateMeetingPayload) => {
    const data = await api<{ meeting: Meeting }>('/meetings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.meeting;
  },
);

export const updateMeeting = createAsyncThunk(
  'meetings/update',
  async ({ id, payload }: { id: string; payload: UpdateMeetingPayload }) => {
    const data = await api<{ meeting: Meeting }>(`/meetings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data.meeting;
  },
);

export const deleteMeeting = createAsyncThunk('meetings/delete', async (id: string) => {
  await api(`/meetings/${id}`, { method: 'DELETE' });
  return id;
});

export const fetchMeetingRsvps = createAsyncThunk(
  'meetings/fetchRsvps',
  async (meetingId: string) => {
    const data = await api<{ rsvps: Rsvp[] }>(`/meetings/${meetingId}/rsvps`);
    return { meetingId, rsvps: data.rsvps };
  },
);

export const upsertRsvp = createAsyncThunk(
  'meetings/upsertRsvp',
  async (
    { meetingId, status }: { meetingId: string; status: RsvpStatus },
    { rejectWithValue },
  ) => {
    try {
      const data = await api<{ rsvp: Rsvp }>(`/meetings/${meetingId}/rsvp`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      return data.rsvp;
    } catch (err) {
      return rejectWithValue((err as Error).message ?? 'RSVP failed');
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const meetingsSlice = createSlice({
  name: 'meetings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchMeetings
    builder
      .addCase(fetchMeetings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMeetings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.byId = {};
        state.allIds = [];
        action.payload.forEach((meeting) => {
          state.byId[meeting.id] = meeting;
          state.allIds.push(meeting.id);
        });
      })
      .addCase(fetchMeetings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to fetch meetings';
      });

    // fetchMeeting
    builder
      .addCase(fetchMeeting.fulfilled, (state, action) => {
        const meeting = action.payload;
        state.byId[meeting.id] = meeting;
        if (!state.allIds.includes(meeting.id)) {
          state.allIds.push(meeting.id);
        }
      })
      .addCase(fetchMeeting.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to fetch meeting';
      });

    // createMeeting
    builder
      .addCase(createMeeting.fulfilled, (state, action) => {
        const meeting = action.payload;
        state.byId[meeting.id] = meeting;
        state.allIds.unshift(meeting.id);
      })
      .addCase(createMeeting.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to create meeting';
      });

    // updateMeeting
    builder
      .addCase(updateMeeting.fulfilled, (state, action) => {
        const meeting = action.payload;
        state.byId[meeting.id] = meeting;
      })
      .addCase(updateMeeting.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to update meeting';
      });

    // deleteMeeting
    builder
      .addCase(deleteMeeting.fulfilled, (state, action) => {
        const id = action.payload;
        delete state.byId[id];
        state.allIds = state.allIds.filter((existingId) => existingId !== id);
        delete state.rsvpsByMeetingId[id];
      })
      .addCase(deleteMeeting.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to delete meeting';
      });

    // fetchMeetingRsvps
    builder.addCase(fetchMeetingRsvps.fulfilled, (state, action) => {
      state.rsvpsByMeetingId[action.payload.meetingId] = action.payload.rsvps;
    });

    // upsertRsvp — optimistic update with rollback on error
    builder
      .addCase(upsertRsvp.pending, (state, action) => {
        state.rsvpStatus = 'loading';
        state.rsvpError = null;
        const { meetingId, status } = action.meta.arg;
        const rsvps = state.rsvpsByMeetingId[meetingId];
        if (rsvps) {
          // Optimistically update existing RSVP or mark as pending update
          const existing = rsvps.find((r) => r.meetingId === meetingId);
          if (existing) {
            existing.status = status;
          }
        }
      })
      .addCase(upsertRsvp.fulfilled, (state, action) => {
        state.rsvpStatus = 'succeeded';
        const rsvp = action.payload;
        const rsvps = state.rsvpsByMeetingId[rsvp.meetingId] ?? [];
        const idx = rsvps.findIndex((r) => r.id === rsvp.id || r.userId === rsvp.userId);
        if (idx !== -1) {
          rsvps[idx] = rsvp;
        } else {
          rsvps.push(rsvp);
        }
        state.rsvpsByMeetingId[rsvp.meetingId] = rsvps;
      })
      .addCase(upsertRsvp.rejected, (state, action) => {
        state.rsvpStatus = 'failed';
        state.rsvpError = (action.payload as string) ?? 'RSVP failed';
        // Rollback is handled by re-fetching RSVPs from the server.
        // Components should call fetchMeetingRsvps on rsvpStatus === 'failed'.
      });
  },
});

export default meetingsSlice.reducer;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectAllMeetings = createSelector(
  (state: RootState) => state.meetings.byId,
  (state: RootState) => state.meetings.allIds,
  (byId, allIds) => allIds.map((id) => byId[id]).filter(Boolean),
);

export const selectMeetingById = (state: RootState, id: string): Meeting | undefined =>
  state.meetings.byId[id];

export const selectMeetingsStatus = (state: RootState) => state.meetings.status;

export const selectMeetingsError = (state: RootState) => state.meetings.error;

export const selectRsvpsByMeetingId = (state: RootState, meetingId: string): Rsvp[] =>
  state.meetings.rsvpsByMeetingId[meetingId] ?? [];

export const selectMyRsvp = (
  state: RootState,
  meetingId: string,
  userId: string,
): Rsvp | undefined =>
  (state.meetings.rsvpsByMeetingId[meetingId] ?? []).find((r) => r.userId === userId);

export const selectRsvpStatus = (state: RootState) => state.meetings.rsvpStatus;

export const selectRsvpError = (state: RootState) => state.meetings.rsvpError;

export const selectUpcomingMeetings = createSelector(selectAllMeetings, (meetings) => {
  const now = new Date();
  return meetings
    .filter((m) => new Date(m.dateTime) >= now)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
});
