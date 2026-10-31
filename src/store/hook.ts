import { ThunkDispatch, AnyAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

import type { RootState } from './rootReducer';
import type { TypedUseSelectorHook } from 'react-redux';

export type AppThunkDispatch = ThunkDispatch<RootState, any, AnyAction>;
export const useAppDispatch = () => useDispatch<AppThunkDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
