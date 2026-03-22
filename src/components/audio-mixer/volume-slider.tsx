'use client';

import { useCallback } from 'react';

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  variant?: 'default' | 'glass';
}

export function VolumeSlider({ value, onChange, disabled = false, variant = 'default' }: VolumeSliderProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseInt(e.target.value, 10));
    },
    [onChange]
  );

  const isGlass = variant === 'glass';

  return (
    <div className="relative h-1.5 w-full">
      {/* Track background */}
      <div className={`absolute inset-0 rounded-full ${
        isGlass 
          ? (disabled ? 'bg-white/10' : 'bg-white/20') 
          : (disabled ? 'bg-muted' : 'bg-border')
      }`} />
      
      {/* Filled track */}
      <div
        className={`absolute left-0 top-0 h-full rounded-full transition-colors ${
          isGlass
            ? (disabled ? 'bg-white/20' : 'bg-white/60')
            : (disabled ? 'bg-muted-foreground/30' : 'bg-accent')
        }`}
        style={{ width: `${value}%` }}
      />
      
      {/* Input */}
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      />
    </div>
  );
}
