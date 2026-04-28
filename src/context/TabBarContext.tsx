import { createContext, useCallback, useContext, useRef, ReactNode, MutableRefObject } from 'react';

export interface TabBarCallbacks {
  onHomePress?: () => void;
  onExchange?: () => void;
}

interface TabBarContextValue {
  register: (cb: TabBarCallbacks) => void;
  unregister: () => void;
  callbacksRef: MutableRefObject<TabBarCallbacks>;
}

const fallbackRef: MutableRefObject<TabBarCallbacks> = { current: {} };

const TabBarContext = createContext<TabBarContextValue>({
  register: () => {},
  unregister: () => {},
  callbacksRef: fallbackRef,
});

export function TabBarProvider({ children }: { children: ReactNode }) {
  const callbacksRef = useRef<TabBarCallbacks>({});

  const register = useCallback((cb: TabBarCallbacks) => {
    callbacksRef.current = cb;
  }, []);

  const unregister = useCallback(() => {
    callbacksRef.current = {};
  }, []);

  return (
    <TabBarContext.Provider value={{ register, unregister, callbacksRef }}>
      {children}
    </TabBarContext.Provider>
  );
}

export function useTabBar() {
  return useContext(TabBarContext);
}
