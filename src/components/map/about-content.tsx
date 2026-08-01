import { PlaceholderBox } from './placeholder-box';

export function AboutContent() {
  return (
    <div className="flex min-h-full flex-col gap-6">
      {[1, 2, 3].map((n) => (
        <div key={n} className="mx-6">
          <PlaceholderBox
            label={`Paragraph ${n} (narrow, side panel)`}
            className="aspect-[3/2] w-full max-[1439px]:hidden"
          />
          <PlaceholderBox
            label={`Paragraph ${n} (wide, full screen)`}
            className="aspect-[18/5] w-full min-[1440px]:hidden"
          />
        </div>
      ))}
      <PlaceholderBox label="Clara's Illustration" className="mt-auto aspect-[9/4] w-full" />
    </div>
  );
}
