import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import type { CreateInvitePayload, RespondInvitePayload } from '@rndvx/types';
import {
  fetchInvites,
  sendInvite,
  respondToInvite,
  selectAllInvites,
  selectPendingInvites,
  selectInvitesStatus,
  selectInvitesError,
  selectRespondStatus,
} from '../store/slices/invitesSlice';

export function useInvites() {
  const dispatch = useDispatch<AppDispatch>();
  const invites = useSelector(selectAllInvites);
  const pending = useSelector(selectPendingInvites);
  const status = useSelector(selectInvitesStatus);
  const error = useSelector(selectInvitesError);
  const respondStatus = useSelector(selectRespondStatus);

  return {
    invites,
    pending,
    status,
    error,
    respondStatus,
    isLoading: status === 'loading',
    fetch: () => dispatch(fetchInvites()),
    send: (payload: CreateInvitePayload) => dispatch(sendInvite(payload)),
    respond: (token: string, payload: RespondInvitePayload) =>
      dispatch(respondToInvite({ token, payload })),
  };
}
