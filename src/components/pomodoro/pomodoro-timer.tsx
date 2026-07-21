'use client';

import { usePomodoro, PomodoroPhase } from '@/src/lib/pomodoro';
import { usePomodoroContext } from './pomodoro-provider';

const TEXT_SHADOW = '0 1px 8px rgba(0,0,0,0.85), 0 0 20px rgba(0,0,0,0.5)';
const TEXT_SHADOW_SM = '0 1px 6px rgba(0,0,0,0.8)';

export function PomodoroTimer() {
  const timer = usePomodoroContext();

  const isExpanded = timer.isPanelOpen;
  const handleToggle = timer.togglePanel;

  const showMini = timer.isActive && !isExpanded;

  return (
    <div className="fixed bottom-6 right-6 z-20">
      <div className="relative z-30 flex items-center gap-2">
        {/* Mini countdown — visible when panel is closed and timer is running */}
        {showMini && (
          <span
            className="text-2xl font-normal tabular-nums text-white"
            style={{ textShadow: TEXT_SHADOW_SM }}
          >
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

      {/* Expandable panel — pointer-events-none on overlay so mixer controls stay clickable */}
      <div
        className={`fixed inset-0 flex items-center justify-center pointer-events-none ${
          isExpanded ? 'visible' : 'invisible'
        }`}
      >
        <TimerPanel timer={timer} isVisible={isExpanded} />
      </div>
    </div>
  );
}

// ─── Timer panel ──────────────────────────────────────────────────────────────

type Timer = ReturnType<typeof usePomodoro>;

function TimerPanel({ timer, isVisible }: { timer: Timer; isVisible: boolean }) {
  const subtitle = phaseLabel(timer.phase);
  const fade =
    'transition-opacity duration-300 ease-out ' + (isVisible ? 'opacity-100' : 'opacity-0');

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-8">
      <span
        className={`text-sm font-light tracking-widest uppercase text-white/90 ${fade}`}
        style={{ textShadow: TEXT_SHADOW_SM }}
      >
        {subtitle}
      </span>

      <span
        className={`text-7xl font-normal tabular-nums text-white ${fade}`}
        style={{ textShadow: TEXT_SHADOW }}
      >
        {formatTime(timer.timeRemaining)}
      </span>

      <div className={`flex items-center gap-5 ${fade}`}>
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`h-[18px] w-[18px] rounded-full transition-colors duration-300 shadow-[0_1px_8px_rgba(0,0,0,0.9),0_0_12px_rgba(0,0,0,0.65)] ${
              i < timer.darkenedCount
                ? 'bg-white'
                : 'border border-white/50 bg-white/25'
            }`}
          />
        ))}
      </div>

      <button
        onClick={() => {
          if (timer.status === 'idle') timer.start();
          else if (timer.status === 'running') timer.pause();
          else timer.resume();
        }}
        className="mt-1.5 w-44 rounded-full border border-white/20 bg-black/40 py-3.5 text-center text-sm font-light tracking-widest uppercase text-white backdrop-blur-md transition-[background-color] duration-150 hover:bg-black/55 [transform:translateZ(0)]"
        style={{ textShadow: TEXT_SHADOW_SM }}
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
