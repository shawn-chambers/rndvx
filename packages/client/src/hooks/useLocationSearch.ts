import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import type { CastLocationVotePayload } from '@rndvx/types';
import {
  searchPlaces,
  fetchLocationVotes,
  castLocationVote,
  removeLocationVote,
  clearSuggestions,
  selectPlaceSuggestions,
  selectSearchStatus,
  selectSearchError,
  selectVoteStatus,
} from '../store/slices/locationsSlice';

export function useLocationSearch() {
  const dispatch = useDispatch<AppDispatch>();
  const suggestions = useSelector(selectPlaceSuggestions);
  const searchStatus = useSelector(selectSearchStatus);
  const searchError = useSelector(selectSearchError);
  const voteStatus = useSelector(selectVoteStatus);

  return {
    suggestions,
    searchStatus,
    searchError,
    voteStatus,
    isSearching: searchStatus === 'loading',
    search: (query: string) => dispatch(searchPlaces(query)),
    clear: () => dispatch(clearSuggestions()),
    fetchVotes: (meetingId: string) => dispatch(fetchLocationVotes(meetingId)),
    castVote: (payload: CastLocationVotePayload) => dispatch(castLocationVote(payload)),
    removeVote: (meetingId: string, voteId: string) =>
      dispatch(removeLocationVote({ meetingId, voteId })),
  };
}
