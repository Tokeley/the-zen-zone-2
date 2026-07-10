'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { usePomodoro } from '@/src/lib/pomodoro';

type PomodoroContextValue = ReturnType<typeof usePomodoro> & {
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
};

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

export function usePomodoroContext(): PomodoroContextValue {
  const ctx = useContext(PomodoroContext);
  if (!ctx) {
    throw new Error('usePomodoroContext must be used within a PomodoroProvider');
  }
  return ctx;
}

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const timer = usePomodoro();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);
  const togglePanel = useCallback(() => setIsPanelOpen((v) => !v), []);

  return (
    <PomodoroContext.Provider value={{ ...timer, isPanelOpen, openPanel, closePanel, togglePanel }}>
      {children}
    </PomodoroContext.Provider>
  );
}
