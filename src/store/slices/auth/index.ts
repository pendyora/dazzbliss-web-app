import { combineReducers } from '@reduxjs/toolkit';

import auth, { AuthStateData } from './authSlice';

const reducer = combineReducers({
  auth,
});

export type AuthState = {
  // session: SessionState
  // user: UserState
  auth: AuthStateData;
};

export * from './sessionSlice';
export * from './userSlice';

export default reducer;
