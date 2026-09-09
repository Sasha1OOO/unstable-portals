import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { initialState, labReducer, type LabEvent, type LabState } from '../domain/reducer';

interface LabContextValue {
  state: LabState;
  dispatch: (event: LabEvent) => void;
}

const LabContext = createContext<LabContextValue | null>(null);

export function LabProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(labReducer, undefined, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <LabContext.Provider value={value}>{children}</LabContext.Provider>;
}

export function useLab(): LabContextValue {
  const ctx = useContext(LabContext);
  if (!ctx) throw new Error('useLab должен вызываться внутри <LabProvider>');
  return ctx;
}
