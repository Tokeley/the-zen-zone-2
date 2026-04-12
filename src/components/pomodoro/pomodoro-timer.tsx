'use client';

import { useState } from 'react';
import { usePomodoro, PomodoroPhase } from '@/src/lib/pomodoro';

interface PomodoroTimerProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function PomodoroTimer({ isOpen, onToggle }: PomodoroTimerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const timer = usePomodoro();

  const isExpanded = isOpen !== undefined ? isOpen : internalOpen;
  const handleToggle = onToggle ?? (() => setInternalOpen((v) => !v));

  const showMini = timer.isActive && !isExpanded;

  return (
    <div className="fixed bottom-6 right-6 z-20">
      <div className="flex items-center gap-2">
        {/* Mini countdown — visible when panel is closed and timer is running */}
        {showMini && (
          <span className="text-sm font-light tabular-nums text-white/80">
            {formatTime(timer.timeRemaining)}
          </span>
        )}

        {/* Clock icon button */}
        <button
          onClick={handleToggle}
          className={`flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-md transition-colors ${
            isExpanded
              ? 'border-white/40 bg-white/20 text-white'
              : 'border-white/20 bg-black/30 text-white hover:bg-black/40'
          }`}
          aria-label={isExpanded ? 'Hide timer' : 'Show timer'}
        >
          <ClockIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Expandable panel */}
      <div
        className={`fixed bottom-[88px] left-6 right-6 flex min-h-[221px] flex-col justify-center rounded-lg border border-white/20 bg-black/30 p-5 transition-[opacity,transform] duration-300 ease-out sm:absolute sm:bottom-16 sm:left-auto sm:right-0 sm:min-w-[320px] md:min-w-[360px] ${
          isExpanded
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0'
        }`}
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <TimerPanel timer={timer} />
      </div>
    </div>
  );
}

// ─── Timer panel ──────────────────────────────────────────────────────────────

type Timer = ReturnType<typeof usePomodoro>;

function TimerPanel({ timer }: { timer: Timer }) {
  const subtitle = phaseLabel(timer.phase);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Phase subtitle */}
      <span className="text-xs tracking-widest uppercase text-white/60">
        {subtitle}
      </span>

      {/* Large countdown */}
      <span className="text-5xl font-light tabular-nums text-white">
        {formatTime(timer.timeRemaining)}
      </span>

      {/* Progress circles */}
      <div className="flex items-center gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-full transition-colors duration-300 ${
              i < timer.darkenedCount
                ? 'bg-white'
                : 'border border-white/30 bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Action button */}
      <button
        onClick={() => {
          if (timer.status === 'idle') timer.start();
          else if (timer.status === 'running') timer.pause();
          else timer.resume();
        }}
        className="mt-1 rounded-full border border-white/20 bg-white/10 px-8 py-2 text-xs font-light tracking-widest uppercase text-white transition-colors hover:bg-white/20"
      >
        {timer.status === 'idle'
          ? 'Start'
          : timer.status === 'running'
          ? 'Pause'
          : 'Resume'}
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function phaseLabel(phase: PomodoroPhase): string {
  switch (phase) {
    case 'work':
      return 'Work';
    case 'shortBreak':
      return 'Rest';
    case 'longBreak':
      return 'Long Rest';
  }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
