'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AdminSceneListItem } from '@/src/lib/supabase';

interface SceneListProps {
  scenes: AdminSceneListItem[];
}

export function SceneList({ scenes: initialScenes }: SceneListProps) {
  const router = useRouter();
  const [scenes, setScenes] = useState(initialScenes);
  const [pendingDelete, setPendingDelete] = useState<AdminSceneListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setScenes(initialScenes);
  }, [initialScenes]);

  const handleDelete = async () => {
    if (!pendingDelete) return;

    setIsDeleting(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/scenes/${pendingDelete.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Delete failed');

      setScenes((prev) => prev.filter((s) => s.id !== pendingDelete.id));
      setPendingDelete(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  if (scenes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground leading-relaxed">
        No scenes yet. Switch to Add Scene to create one.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-border">
        {scenes.map((scene) => (
          <li key={scene.id} className="flex items-center gap-4 py-5 first:pt-0 last:pb-0">
            <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
              {scene.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={scene.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground/50">
                  —
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">{scene.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Added {format(new Date(scene.createdAt), 'MMM d, yyyy')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setError('');
                setPendingDelete(scene);
              }}
              className="shrink-0 text-xs font-light tracking-wider uppercase text-muted-foreground transition-colors hover:text-destructive"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDelete(null);
        }}
      >
        <DialogContent showCloseButton={!isDeleting}>
          <DialogHeader>
            <DialogTitle className="font-light tracking-wide">
              Delete &ldquo;{pendingDelete?.title}&rdquo;?
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              This removes the scene from the map and deletes its video, audio, and thumbnail
              files from storage.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setPendingDelete(null)}
              className="rounded-full border border-border px-5 py-2 text-xs font-light tracking-wider uppercase text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="rounded-full border border-destructive/30 bg-destructive/10 px-5 py-2 text-xs font-light tracking-wider uppercase text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
