'use client';

interface SidePanelProps {
  content: 'about' | 'contact' | null;
  onClose: () => void;
}

export function SidePanel({ content, onClose }: SidePanelProps) {
  return (
    <div
      className={`fixed inset-y-0 right-0 z-30 w-full border-l border-border bg-background shadow-xl transition-transform duration-300 ease-out sm:w-1/3 ${
        content ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Positioned to land exactly where the nav's hamburger/X sits (top-4 right-6, z-20),
          so it reads as the same X taking over once the panel slides on top of it. */}
      <button
        onClick={onClose}
        className="absolute top-4 right-6 flex h-10 items-center px-2"
        aria-label="Close panel"
      >
        <div className="relative h-6 w-6">
          <span className="absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-foreground" />
          <span className="absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-foreground" />
        </div>
      </button>

      <div className="p-8">
        <p className="text-sm font-light tracking-widest uppercase text-foreground">
          {content === 'about' ? 'About' : content === 'contact' ? 'Contact' : ''}
        </p>
      </div>
    </div>
  );
}
