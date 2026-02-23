import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type {
  Group,
  GroupWithMembers,
  CreateGroupPayload,
  UpdateGroupPayload,
} from '@rndvx/types';
import { API } from '@rndvx/types';
import { api } from '../../lib/api';
import type { RootState } from '../index';

// ─── State Shape ─────────────────────────────────────────────────────────────

export interface GroupsState {
  byId: Record<string, GroupWithMembers>;
  allIds: string[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: GroupsState = {
  byId: {},
  allIds: [],
  status: 'idle',
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchGroups = createAsyncThunk('groups/fetchAll', async () => {
  const data = await api<{ groups: GroupWithMembers[] }>(API.GROUPS);
  return data.groups;
});

export const fetchGroup = createAsyncThunk('groups/fetchOne', async (id: string) => {
  const data = await api<{ group: GroupWithMembers }>(API.group(id));
  return data.group;
});

export const createGroup = createAsyncThunk(
  'groups/create',
  async (payload: CreateGroupPayload) => {
    const data = await api<{ group: GroupWithMembers }>(API.GROUPS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.group;
  },
);

export const updateGroup = createAsyncThunk(
  'groups/update',
  async ({ id, payload }: { id: string; payload: UpdateGroupPayload }) => {
    const data = await api<{ group: Group }>(API.group(id), {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data.group;
  },
);

export const deleteGroup = createAsyncThunk('groups/delete', async (id: string) => {
  await api(API.group(id), { method: 'DELETE' });
  return id;
});

export const addGroupMember = createAsyncThunk(
  'groups/addMember',
  async ({ groupId, userId }: { groupId: string; userId: string }) => {
    const data = await api<{ group: GroupWithMembers }>(API.groupMembers(groupId), {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    return data.group;
  },
);

export const removeGroupMember = createAsyncThunk(
  'groups/removeMember',
  async ({ groupId, userId }: { groupId: string; userId: string }) => {
    const data = await api<{ group: GroupWithMembers }>(
      API.groupMember(groupId, userId),
      { method: 'DELETE' },
    );
    return data.group;
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchGroups
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.byId = {};
        state.allIds = [];
        action.payload.forEach((group) => {
          state.byId[group.id] = group;
          state.allIds.push(group.id);
        });
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to fetch groups';
      });

    // fetchGroup
    builder
      .addCase(fetchGroup.fulfilled, (state, action) => {
        const group = action.payload;
        state.byId[group.id] = group;
        if (!state.allIds.includes(group.id)) {
          state.allIds.push(group.id);
        }
      })
      .addCase(fetchGroup.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to fetch group';
      });

    // createGroup
    builder
      .addCase(createGroup.fulfilled, (state, action) => {
        const group = action.payload;
        state.byId[group.id] = group;
        state.allIds.unshift(group.id);
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to create group';
      });

    // updateGroup — merge updated fields into existing entry
    builder
      .addCase(updateGroup.fulfilled, (state, action) => {
        const group = action.payload;
        if (state.byId[group.id]) {
          state.byId[group.id] = { ...state.byId[group.id], ...group };
        }
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to update group';
      });

    // deleteGroup
    builder
      .addCase(deleteGroup.fulfilled, (state, action) => {
        const id = action.payload;
        delete state.byId[id];
        state.allIds = state.allIds.filter((existingId) => existingId !== id);
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to delete group';
      });

    // addGroupMember / removeGroupMember — refresh full group with updated members
    builder
      .addCase(addGroupMember.fulfilled, (state, action) => {
        const group = action.payload;
        state.byId[group.id] = group;
      })
      .addCase(removeGroupMember.fulfilled, (state, action) => {
        const group = action.payload;
        state.byId[group.id] = group;
      });
  },
});

export default groupsSlice.reducer;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectAllGroups = createSelector(
  (state: RootState) => state.groups.byId,
  (state: RootState) => state.groups.allIds,
  (byId, allIds) => allIds.map((id) => byId[id]).filter(Boolean),
);

export const selectGroupById = (state: RootState, id: string): GroupWithMembers | undefined =>
  state.groups.byId[id];

export const selectGroupsStatus = (state: RootState) => state.groups.status;
export const selectGroupsError = (state: RootState) => state.groups.error;

export const selectMyGroups = createSelector(
  selectAllGroups,
  (state: RootState) => state.auth.user?.id,
  (groups, userId) => groups.filter((g) => g.ownerId === userId),
);

export const selectGroupMembers = createSelector(
  (state: RootState, id: string) => state.groups.byId[id],
  (group) => group?.members ?? [],
);
