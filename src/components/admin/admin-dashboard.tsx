'use client';

import { useState } from 'react';

import { AdminForm } from '@/src/components/admin/admin-form';
import { SceneList } from '@/src/components/admin/scene-list';
import type { AdminSceneListItem } from '@/src/lib/supabase';

type AdminTab = 'add' | 'manage';

interface AdminDashboardProps {
  scenes: AdminSceneListItem[];
}

export function AdminDashboard({ scenes }: AdminDashboardProps) {
  const [tab, setTab] = useState<AdminTab>('add');

  return (
    <>
      <div className="mb-12 flex gap-2 border-b border-border pb-4">
        {(
          [
            ['add', 'Add Scene'],
            ['manage', 'Manage Scenes'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full border px-4 py-1.5 text-xs font-light tracking-wider uppercase transition-all duration-150 ${
              tab === id
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-muted-foreground hover:border-accent/40 hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'add' ? (
        <section>
          <div className="mb-10">
            <h2 className="text-2xl font-light tracking-wide text-foreground">
              Add New Scene
            </h2>
            <div className="mt-3 h-px w-12 bg-accent" />
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Upload a silent video loop and a separate lossless audio file (WAV or FLAC).
              The app plays video muted and loops audio via Web Audio for seamless playback.
              A thumbnail is captured from the first frame automatically.
            </p>
          </div>
          <AdminForm />
        </section>
      ) : (
        <section>
          <div className="mb-10">
            <h2 className="text-2xl font-light tracking-wide text-foreground">
              Manage Scenes
            </h2>
            <div className="mt-3 h-px w-12 bg-accent" />
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {scenes.length} scene{scenes.length === 1 ? '' : 's'} on the map. Deleting removes
              the database entry and all scene files from storage.
            </p>
          </div>
          <SceneList scenes={scenes} />
        </section>
      )}
    </>
  );
}
