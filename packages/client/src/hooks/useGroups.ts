import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import type { CreateGroupPayload, UpdateGroupPayload } from '@rndvx/types';
import {
  fetchGroups,
  fetchGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  addGroupMember,
  removeGroupMember,
  selectAllGroups,
  selectMyGroups,
  selectGroupsStatus,
  selectGroupsError,
} from '../store/slices/groupsSlice';

export function useGroups() {
  const dispatch = useDispatch<AppDispatch>();
  const groups = useSelector(selectAllGroups);
  const myGroups = useSelector(selectMyGroups);
  const status = useSelector(selectGroupsStatus);
  const error = useSelector(selectGroupsError);

  return {
    groups,
    myGroups,
    status,
    error,
    isLoading: status === 'loading',
    fetch: () => dispatch(fetchGroups()),
    fetchOne: (id: string) => dispatch(fetchGroup(id)),
    create: (payload: CreateGroupPayload) => dispatch(createGroup(payload)),
    update: (id: string, payload: UpdateGroupPayload) => dispatch(updateGroup({ id, payload })),
    remove: (id: string) => dispatch(deleteGroup(id)),
    addMember: (groupId: string, userId: string) =>
      dispatch(addGroupMember({ groupId, userId })),
    removeMember: (groupId: string, userId: string) =>
      dispatch(removeGroupMember({ groupId, userId })),
  };
}
