'use client';

interface SidePanelProps {
  content: 'about' | 'contact' | null;
}

export function SidePanel({ content }: SidePanelProps) {
  return (
    <div
      className={`fixed inset-y-0 right-0 z-[15] w-full border-l border-border bg-background shadow-xl transition-transform duration-300 ease-out sm:w-1/3 ${
        content ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-8">
        <p className="text-sm font-light tracking-widest uppercase text-foreground">
          {content === 'about' ? 'About' : content === 'contact' ? 'Contact' : ''}
        </p>
      </div>
    </div>
  );
}
