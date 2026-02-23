import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import meetingsReducer from './slices/meetingsSlice';
import invitesReducer from './slices/invitesSlice';
import groupsReducer from './slices/groupsSlice';
import locationsReducer from './slices/locationsSlice';
import profileReducer from './slices/profileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    meetings: meetingsReducer,
    invites: invitesReducer,
    groups: groupsReducer,
    locations: locationsReducer,
    profile: profileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
