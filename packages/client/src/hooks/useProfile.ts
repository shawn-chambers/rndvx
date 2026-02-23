import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import type { UpdateProfilePayload } from '@rndvx/types';
import {
  fetchProfile,
  updateProfile,
  resetUpdateStatus,
  selectProfile,
  selectProfileStatus,
  selectProfileError,
  selectUpdateStatus,
  selectUpdateError,
} from '../store/slices/profileSlice';

export function useProfile() {
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector(selectProfile);
  const status = useSelector(selectProfileStatus);
  const error = useSelector(selectProfileError);
  const updateStatus = useSelector(selectUpdateStatus);
  const updateError = useSelector(selectUpdateError);

  return {
    profile,
    status,
    error,
    updateStatus,
    updateError,
    isLoading: status === 'loading',
    isSaving: updateStatus === 'loading',
    fetch: () => dispatch(fetchProfile()),
    update: (payload: UpdateProfilePayload) => dispatch(updateProfile(payload)),
    resetUpdate: () => dispatch(resetUpdateStatus()),
  };
}
