'use client';

import { AboutContent } from './about-content';
import { ContactContent } from './contact-content';
import { PlaceholderBox } from './placeholder-box';

interface SidePanelProps {
  content: 'about' | 'contact' | null;
  onClose: () => void;
}

export function SidePanel({ content, onClose }: SidePanelProps) {
  return (
    <div
      className={`fixed inset-y-0 right-0 z-30 w-full border-l border-border bg-background shadow-xl ease-out max-[1439px]:transition-none min-[1440px]:w-1/3 min-[1440px]:max-w-[480px] min-[1440px]:transition-transform min-[1440px]:duration-300 ${
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

      {/* Pinned title, matching the close button's top-4/h-10 band so it stays
          at a fixed vertical position instead of scrolling away with the body.
          pointer-events-none because this row spans the full panel width and
          would otherwise sit on top of (and swallow clicks on) the close button. */}
      <div className="pointer-events-none absolute inset-x-0 top-4 flex h-10 items-center justify-center">
        {content && (
          <PlaceholderBox
            label={content === 'about' ? 'Title: About' : 'Title: Contact'}
            className="h-full w-40"
          />
        )}
      </div>

      <div className="h-full overflow-y-auto pt-16">
        {content === 'about' && <AboutContent />}
        {content === 'contact' && <ContactContent />}
      </div>
    </div>
  );
}
