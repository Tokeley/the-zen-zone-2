import { Metadata } from 'next';

import { AdminDashboard } from '@/src/components/admin/admin-dashboard';
import { SignOutButton } from '@/src/components/admin/sign-out-button';
import { getAdminSceneList } from '@/src/lib/supabase';

export const metadata: Metadata = {
  title: 'Admin — The Zen Zone',
  description: 'Add and manage scenes for The Zen Zone',
};

export default async function AdminPage() {
  const scenes = await getAdminSceneList();

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <h1 className="text-sm font-light tracking-widest uppercase text-foreground">
            Admin
          </h1>
          <div className="flex items-center gap-6">
            <a
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to Map
            </a>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <AdminDashboard scenes={scenes} />
      </div>
    </main>
  );
}
