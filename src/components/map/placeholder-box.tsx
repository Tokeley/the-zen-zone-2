interface PlaceholderBoxProps {
  label: string;
  className?: string;
}

export function PlaceholderBox({ label, className = '' }: PlaceholderBoxProps) {
  return (
    <div
      className={`flex items-center justify-center border border-dashed border-red-500 bg-white p-2 text-center text-xs text-red-500 ${className}`}
    >
      {label}
    </div>
  );
}
