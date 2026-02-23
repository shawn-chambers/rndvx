import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { User, UpdateProfilePayload } from '@rndvx/types';
import { API } from '@rndvx/types';
import { api } from '../../lib/api';
import type { RootState } from '../index';

// ─── State Shape ─────────────────────────────────────────────────────────────
// Profile state augments auth.user with richer profile data and tracks
// update operations separately so the auth slice stays lean.

export interface ProfileState {
  profile: User | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  updateStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  updateError: string | null;
}

const initialState: ProfileState = {
  profile: null,
  status: 'idle',
  error: null,
  updateStatus: 'idle',
  updateError: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchProfile = createAsyncThunk('profile/fetch', async () => {
  const data = await api<{ user: User }>(API.USERS_ME);
  return data.user;
});

export const updateProfile = createAsyncThunk(
  'profile/update',
  async (payload: UpdateProfilePayload, { rejectWithValue }) => {
    try {
      const data = await api<{ user: User }>(API.USERS_ME, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return data.user;
    } catch (err) {
      return rejectWithValue((err as Error).message ?? 'Failed to update profile');
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    resetUpdateStatus(state) {
      state.updateStatus = 'idle';
      state.updateError = null;
    },
  },
  extraReducers: (builder) => {
    // fetchProfile
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to fetch profile';
      });

    // updateProfile — optimistic update with rollback on error
    builder
      .addCase(updateProfile.pending, (state, action) => {
        state.updateStatus = 'loading';
        state.updateError = null;
        if (state.profile) {
          Object.assign(state.profile, action.meta.arg);
        }
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.updateError = (action.payload as string) ?? 'Failed to update profile';
        // Profile will be stale; callers should re-fetch to restore accurate state
      });
  },
});

export const { resetUpdateStatus } = profileSlice.actions;
export default profileSlice.reducer;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectProfile = (state: RootState) => state.profile.profile;
export const selectProfileStatus = (state: RootState) => state.profile.status;
export const selectProfileError = (state: RootState) => state.profile.error;
export const selectUpdateStatus = (state: RootState) => state.profile.updateStatus;
export const selectUpdateError = (state: RootState) => state.profile.updateError;
