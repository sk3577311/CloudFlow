"use client";

import { createContext, useContext, useRef, useState } from "react";

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

/**
 * Detect if current route is a "reloader" screen.
 * We disable automatic refresh cascades during reloaders,
 * or they will cause double-navigation, double-mount, and stuck loaders.
 */
const isReloaderRoute = () => {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/reloading/");
};

export const RefreshProvider = ({ children }: { children: React.ReactNode }) => {
  const listeners = useRef(new Set<() => void>());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const activeRequests = useRef(0);

  const subscribe = (callback: () => void) => {
    listeners.current.add(callback);
    return () => listeners.current.delete(callback);
  };

  const trigger = () => {
    // Prevent refresh operations on reloader pages
    if (!isReloaderRoute()) {
      setIsRefreshing(true);
    }

    // Notify all subscribers (components listening for refresh)
    listeners.current.forEach((cb) => cb());
  };

  const startLoading = () => {
    activeRequests.current += 1;

    // Prevent showing refreshing state on reloader screens
    if (!isReloaderRoute()) {
      setIsRefreshing(true);
    }
  };

  const stopLoading = () => {
    activeRequests.current = Math.max(0, activeRequests.current - 1);

    if (activeRequests.current === 0) {
      // Also prevent stop-refresh flicker inside reloaders
      if (!isReloaderRoute()) {
        setIsRefreshing(false);
      }
    }
  };

  return (
    <RefreshContext.Provider
      value={{
        subscribe,
        trigger,
        startLoading,
        stopLoading,
        isRefreshing,
      }}
    >
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => useContext(RefreshContext);
