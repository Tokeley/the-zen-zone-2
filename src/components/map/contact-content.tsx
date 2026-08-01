import type { ReactNode } from 'react';
import { PlaceholderBox } from './placeholder-box';

function LabeledField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mx-6 flex flex-col items-start gap-1">
      <PlaceholderBox label={`Label: ${label}`} className="h-6 w-fit whitespace-nowrap" />
      {children}
    </div>
  );
}

export function ContactContent() {
  return (
    <div className="flex min-h-full flex-col justify-between gap-4">
      <LabeledField label="First Name">
        <PlaceholderBox label="First Name" className="h-10 w-full" />
      </LabeledField>
      <LabeledField label="Email">
        <PlaceholderBox label="Email" className="h-10 w-full" />
      </LabeledField>
      <LabeledField label="Type of Message">
        <PlaceholderBox
          label="Type of Message (dropdown: Scene Request / Bug Found / Feature Request / Other)"
          className="h-10 w-full"
        />
      </LabeledField>
      <LabeledField label="Subject">
        <PlaceholderBox label="Subject" className="h-10 w-full" />
      </LabeledField>
      <LabeledField label="Message">
        <PlaceholderBox label="Message" className="h-32 w-full" />
      </LabeledField>
      <PlaceholderBox label="Send" className="h-10 w-32 self-center" />
      <PlaceholderBox label="Clara's Illustration" className="aspect-[9/4] w-full" />
    </div>
  );
}
