'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak';
export type PomodoroStatus = 'idle' | 'running' | 'paused';

interface Section {
  phase: PomodoroPhase;
  durationSeconds: number;
}

const CYCLE: Section[] = [
  { phase: 'work', durationSeconds: 25 * 60 },
  { phase: 'shortBreak', durationSeconds: 5 * 60 },
  { phase: 'work', durationSeconds: 25 * 60 },
  { phase: 'shortBreak', durationSeconds: 5 * 60 },
  { phase: 'work', durationSeconds: 25 * 60 },
  { phase: 'shortBreak', durationSeconds: 5 * 60 },
  { phase: 'work', durationSeconds: 25 * 60 },
  { phase: 'longBreak', durationSeconds: 20 * 60 },
];

/** Number of darkened circles (0–4) for a given section index. */
export function darkenedCircles(sectionIndex: number): number {
  return Math.ceil((sectionIndex + 1) / 2);
}

/** Synthesise a soft two-tone chime using the Web Audio API. */
function playChime() {
  try {
    const ctx = new AudioContext();

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(880, now, 0.6);
    playTone(1100, now + 0.25, 0.6);

    // Close the temporary context after the chime finishes.
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // Web Audio not available (e.g. SSR); silently ignore.
  }
}

export function usePomodoro() {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(CYCLE[0].durationSeconds);
  const [status, setStatus] = useState<PomodoroStatus>('idle');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSection = CYCLE[sectionIndex];
  const phase = currentSection.phase;

  const clearTick = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Tick down every second while running.
  useEffect(() => {
    if (status !== 'running') return;

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Section complete — stop ticking, play chime, advance.
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          playChime();

          const nextIndex = (sectionIndex + 1) % CYCLE.length;
          // Use a microtask so we don't call setState inside setState.
          Promise.resolve().then(() => {
            setSectionIndex(nextIndex);
            setTimeRemaining(CYCLE[nextIndex].durationSeconds);
            setStatus('idle');
          });

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTick;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, sectionIndex]);

  const start = useCallback(() => {
    setStatus('running');
  }, []);

  const pause = useCallback(() => {
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    setStatus('running');
  }, []);

  const reset = useCallback(() => {
    clearTick();
    setSectionIndex(0);
    setTimeRemaining(CYCLE[0].durationSeconds);
    setStatus('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    sectionIndex,
    phase,
    timeRemaining,
    status,
    /** Number of progress circles that should be filled (0–4). */
    darkenedCount: darkenedCircles(sectionIndex),
    isActive: status !== 'idle' || timeRemaining !== CYCLE[sectionIndex].durationSeconds,
    start,
    pause,
    resume,
    reset,
  };
}
