import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface NavigationState {
  selectedChallenge?: {
    type: string;
    doctor: string;
    challengeId: string;
    reward: number;
    target: string;
    title?: string;
    description?: string;
  };
  charityTab?: boolean;
  [key: string]: any;
}

interface NavigationContextType {
  navigationState: NavigationState;
  setNavigationState: (state: NavigationState) => void;
  clearNavigationState: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [navigationState, setNavigationState] = useState<NavigationState>({});

  const clearNavigationState = () => {
    setNavigationState({});
  };

  return (
    <NavigationContext.Provider value={{ navigationState, setNavigationState, clearNavigationState }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

