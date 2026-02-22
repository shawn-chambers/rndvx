import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { loginUser, registerUser, fetchCurrentUser, logout } from '../store/slices/authSlice';
import type { LoginPayload, RegisterPayload } from '@rndvx/types';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  return {
    user: auth.user,
    token: auth.token,
    status: auth.status,
    error: auth.error,
    isAuthenticated: !!auth.token,
    login: (payload: LoginPayload) => dispatch(loginUser(payload)),
    register: (payload: RegisterPayload) => dispatch(registerUser(payload)),
    fetchUser: () => dispatch(fetchCurrentUser()),
    logout: () => dispatch(logout()),
  };
}
