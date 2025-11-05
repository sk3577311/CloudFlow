'use client';
import { createContext, useContext, useRef, useState } from 'react';

type RefreshContextType = {
  subscribe: (callback: () => void) => () => void;
  trigger: () => void;
  startLoading: () => void;
  stopLoading: () => void;
  isRefreshing: boolean;
};

const RefreshContext = createContext<RefreshContextType>({
  subscribe: () => () => {},
  trigger: () => {},
  startLoading: () => {},
  stopLoading: () => {},
  isRefreshing: false,
});

export const RefreshProvider = ({ children }: { children: React.ReactNode }) => {
  const listeners = useRef(new Set<() => void>());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const activeRequests = useRef(0);

  const subscribe = (callback: () => void) => {
    listeners.current.add(callback);
    return () => listeners.current.delete(callback);
  };

  const trigger = () => {
    if (listeners.current.size > 0) {
      setIsRefreshing(true);
      listeners.current.forEach((cb) => cb());
    }
  };

  const startLoading = () => {
    activeRequests.current += 1;
    setIsRefreshing(true);
  };

  const stopLoading = () => {
    activeRequests.current = Math.max(0, activeRequests.current - 1);
    if (activeRequests.current === 0) setIsRefreshing(false);
  };

  return (
    <RefreshContext.Provider
      value={{ subscribe, trigger, startLoading, stopLoading, isRefreshing }}
    >
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => useContext(RefreshContext);
