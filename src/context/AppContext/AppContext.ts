/* eslint-disable import/no-named-as-default-member */
import React from 'react';

// Define the shape of your global state
export interface GlobalState {
  user: string | null;
  theme: 'light' | 'dark';
}

// Define the context type
export interface AppContextType {
  globalState: GlobalState;
  setGlobalState: React.Dispatch<React.SetStateAction<GlobalState>>;
  isMobile: boolean;
  isTablet: boolean;
}

// Initialize the context with undefined, since we’ll provide the values through the provider
const AppContext: any = React.createContext<AppContextType | undefined>(undefined);

// AppProvider component to wrap your application with the global state context

export default AppContext;
