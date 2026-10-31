'use client';
import React, { useState } from 'react';

import useIsResize from '@/hook/useResize';

import AppContext, { GlobalState } from './AppContext';

export const AppProvider: any = ({ children }: any) => {
  const { isMobile, isTablet } = useIsResize();
  const [globalState, setGlobalState] = useState<GlobalState>({
    user: null,
    theme: 'light',
  });

  return <AppContext.Provider value={{ isMobile, isTablet, globalState, setGlobalState }}>{children}</AppContext.Provider>;
};
