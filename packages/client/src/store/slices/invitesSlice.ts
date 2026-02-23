import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type {
  Invite,
  InviteWithDetails,
  CreateInvitePayload,
  RespondInvitePayload,
} from '@rndvx/types';
import { API } from '@rndvx/types';
import { api } from '../../lib/api';
import type { RootState } from '../index';

// ─── State Shape ─────────────────────────────────────────────────────────────

export interface InvitesState {
  byId: Record<string, InviteWithDetails>;
  allIds: string[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  respondStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  respondError: string | null;
}

const initialState: InvitesState = {
  byId: {},
  allIds: [],
  status: 'idle',
  error: null,
  respondStatus: 'idle',
  respondError: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchInvites = createAsyncThunk('invites/fetchAll', async () => {
  const data = await api<{ invites: InviteWithDetails[] }>(API.INVITES);
  return data.invites;
});

export const sendInvite = createAsyncThunk(
  'invites/send',
  async (payload: CreateInvitePayload) => {
    const data = await api<{ invite: InviteWithDetails }>(API.INVITES, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.invite;
  },
);

export const respondToInvite = createAsyncThunk(
  'invites/respond',
  async (
    { token, payload }: { token: string; payload: RespondInvitePayload },
    { rejectWithValue },
  ) => {
    try {
      const data = await api<{ invite: Invite }>(API.inviteRespond(token), {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return data.invite;
    } catch (err) {
      return rejectWithValue((err as Error).message ?? 'Failed to respond to invite');
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const invitesSlice = createSlice({
  name: 'invites',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchInvites
    builder
      .addCase(fetchInvites.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchInvites.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.byId = {};
        state.allIds = [];
        action.payload.forEach((invite) => {
          state.byId[invite.id] = invite;
          state.allIds.push(invite.id);
        });
      })
      .addCase(fetchInvites.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to fetch invites';
      });

    // sendInvite
    builder
      .addCase(sendInvite.fulfilled, (state, action) => {
        const invite = action.payload;
        state.byId[invite.id] = invite;
        state.allIds.unshift(invite.id);
      })
      .addCase(sendInvite.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to send invite';
      });

    // respondToInvite — optimistic status update
    builder
      .addCase(respondToInvite.pending, (state, action) => {
        state.respondStatus = 'loading';
        state.respondError = null;
        const { token, payload } = action.meta.arg;
        const invite = Object.values(state.byId).find((i) => i.token === token);
        if (invite) {
          invite.status = payload.status;
        }
      })
      .addCase(respondToInvite.fulfilled, (state, action) => {
        state.respondStatus = 'succeeded';
        const invite = action.payload;
        if (state.byId[invite.id]) {
          state.byId[invite.id].status = invite.status;
        }
      })
      .addCase(respondToInvite.rejected, (state, action) => {
        state.respondStatus = 'failed';
        state.respondError = (action.payload as string) ?? 'Failed to respond to invite';
      });
  },
});

export default invitesSlice.reducer;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectAllInvites = createSelector(
  (state: RootState) => state.invites.byId,
  (state: RootState) => state.invites.allIds,
  (byId, allIds) => allIds.map((id) => byId[id]).filter(Boolean),
);

export const selectPendingInvites = createSelector(selectAllInvites, (invites) =>
  invites.filter((i) => i.status === 'PENDING'),
);

export const selectInviteById = (state: RootState, id: string): InviteWithDetails | undefined =>
  state.invites.byId[id];

export const selectInvitesForMeeting = createSelector(
  selectAllInvites,
  (_state: RootState, meetingId: string) => meetingId,
  (invites, meetingId) => invites.filter((i) => i.meetingId === meetingId),
);

export const selectInvitesForGroup = createSelector(
  selectAllInvites,
  (_state: RootState, groupId: string) => groupId,
  (invites, groupId) => invites.filter((i) => i.groupId === groupId),
);

export const selectInvitesStatus = (state: RootState) => state.invites.status;
export const selectInvitesError = (state: RootState) => state.invites.error;
export const selectRespondStatus = (state: RootState) => state.invites.respondStatus;
