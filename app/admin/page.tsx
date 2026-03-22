import { Metadata } from 'next';
import { AdminForm } from '@/src/components/admin/admin-form';

export const metadata: Metadata = {
  title: 'Admin — The Zen Zone',
  description: 'Add new scenes to The Zen Zone',
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <h1 className="text-sm font-light tracking-widest uppercase text-foreground">
            Admin
          </h1>
          <a
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to Map
          </a>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-12">
          <h2 className="text-2xl font-light tracking-wide text-foreground">
            Add New Scene
          </h2>
          <div className="mt-3 h-px w-12 bg-accent" />
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Create a new ambient scene by filling out the form below. All fields are required.
          </p>
        </div>

        <AdminForm />
      </div>
    </main>
  );
}
