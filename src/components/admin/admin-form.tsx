'use client';

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import Map, { Marker, MapLayerMouseEvent } from 'react-map-gl';
import { filterGroups, type SceneTag } from '@/src/data/textures';
import 'mapbox-gl/dist/mapbox-gl.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UploadStep =
  | 'idle'
  | 'uploading-video'
  | 'uploading-audio'
  | 'uploading-thumbnail'
  | 'saving-scene'
  | 'done'
  | 'error';

interface UploadProgress {
  video: 'pending' | 'uploading' | 'done' | 'skipped';
  audio: 'pending' | 'uploading' | 'done';
  thumbnail: 'pending' | 'uploading' | 'done' | 'skipped';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSceneId(): string {
  return crypto.randomUUID();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function uploadFile(
  sceneId: string,
  fileType: 'video' | 'audio' | 'thumbnail',
  file: File,
): Promise<string> {
  const fd = new FormData();
  fd.append('sceneId', sceneId);
  fd.append('fileType', fileType);
  fd.append('file', file);

  const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Upload failed');
  return json.publicUrl as string;
}

// ---------------------------------------------------------------------------
// LocationPicker sub-component
// ---------------------------------------------------------------------------

interface LocationPickerProps {
  lat: string;
  lng: string;
  disabled?: boolean;
  onSelect: (lat: string, lng: string) => void;
}

function LocationPicker({ lat, lng, disabled, onSelect }: LocationPickerProps) {
  const hasPin = lat !== '' && lng !== '';
  const pinLat = hasPin ? parseFloat(lat) : null;
  const pinLng = hasPin ? parseFloat(lng) : null;

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (disabled) return;
      const { lat: clickLat, lng: clickLng } = e.lngLat;
      onSelect(clickLat.toFixed(6), clickLng.toFixed(6));
    },
    [disabled, onSelect],
  );

  return (
    <div>
      <p className="block text-xs font-light tracking-wider uppercase text-muted-foreground mb-2">
        Location <span className="normal-case">(click map to pin)</span>
      </p>
      <div
        className={`relative overflow-hidden rounded-lg border border-border ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-crosshair'}`}
        style={{ height: 280 }}
      >
        <Map
          initialViewState={{ longitude: 0, latitude: 20, zoom: 1.2 }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          onClick={handleClick}
          dragRotate={false}
          attributionControl={false}
        >
          {hasPin && pinLat !== null && pinLng !== null && (
            <Marker latitude={pinLat} longitude={pinLng} anchor="bottom">
              <PinIcon />
            </Marker>
          )}
        </Map>

        {!hasPin && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="rounded-full bg-background/70 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
              Click anywhere to place pin
            </p>
          </div>
        )}
      </div>

      {hasPin && (
        <div className="mt-2 flex items-center justify-between">
          <p className="font-mono text-xs text-muted-foreground">
            {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
          </p>
          {!disabled && (
            <button
              type="button"
              onClick={() => onSelect('', '')}
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors underline underline-offset-2"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FileDropZone sub-component
// ---------------------------------------------------------------------------

interface FileDropZoneProps {
  label: string;
  accept: string;
  hint: string;
  file: File | null;
  disabled?: boolean;
  onFile: (file: File) => void;
}

function FileDropZone({ label, accept, hint, file, disabled, onFile }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const dropped = e.dataTransfer.files[0];
      if (dropped) onFile(dropped);
    },
    [disabled, onFile],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) onFile(selected);
    },
    [onFile],
  );

  return (
    <div>
      <label className="block text-xs font-light tracking-wider uppercase text-muted-foreground mb-2">
        {label}
      </label>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Upload ${label}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          disabled
            ? 'cursor-not-allowed opacity-50 border-border'
            : isDragging
            ? 'cursor-copy border-accent bg-accent/5'
            : file
            ? 'cursor-pointer border-accent/50 bg-accent/5'
            : 'cursor-pointer border-border hover:border-accent/40 hover:bg-muted/30'
        }`}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <CheckCircleIcon className="h-5 w-5 text-accent shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-sm text-foreground truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(file.size)}</p>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onFile(file); }}
                className="ml-auto text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors shrink-0"
              >
                Change
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <UploadIcon className="mx-auto h-7 w-7 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Drop file or{' '}
              <span className="text-accent underline underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-muted-foreground/50">{hint}</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={handleChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upload progress indicator
// ---------------------------------------------------------------------------

function UploadProgressDisplay({ progress, step }: { progress: UploadProgress; step: UploadStep }) {
  const steps = [
    { key: 'video', label: 'Video', state: progress.video },
    { key: 'audio', label: 'Audio', state: progress.audio },
    { key: 'thumbnail', label: 'Thumbnail', state: progress.thumbnail },
    { key: 'scene', label: 'Scene', state: step === 'saving-scene' ? 'uploading' : step === 'done' ? 'done' : 'pending' },
  ] as const;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
      {steps.map((s) => (
        <div key={s.key} className="flex items-center gap-3">
          <div className="w-20 shrink-0 text-xs font-light tracking-wider text-muted-foreground uppercase">
            {s.label}
          </div>
          <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
            {s.state === 'done' || s.state === 'skipped' ? (
              <div className="h-full w-full bg-accent rounded-full" />
            ) : s.state === 'uploading' ? (
              <div className="h-full w-1/3 bg-accent/60 rounded-full animate-pulse" />
            ) : (
              <div className="h-full w-0" />
            )}
          </div>
          <div className="w-16 shrink-0 text-right">
            {s.state === 'done' ? (
              <span className="text-xs text-accent">Done</span>
            ) : s.state === 'skipped' ? (
              <span className="text-xs text-muted-foreground/50">Skipped</span>
            ) : s.state === 'uploading' ? (
              <span className="text-xs text-muted-foreground animate-pulse">Uploading</span>
            ) : (
              <span className="text-xs text-muted-foreground/30">Waiting</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main AdminForm
// ---------------------------------------------------------------------------

export function AdminForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [tags, setTags] = useState<Set<SceneTag>>(new Set());

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [step, setStep] = useState<UploadStep>('idle');
  const [progress, setProgress] = useState<UploadProgress>({
    video: 'pending',
    audio: 'pending',
    thumbnail: 'pending',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [createdSceneId, setCreatedSceneId] = useState('');

  const isUploading = step !== 'idle' && step !== 'done' && step !== 'error';

  const toggleTag = (tag: SceneTag) => {
    setTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setErrorMessage('Latitude must be between -90 and 90');
      setStep('error');
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setErrorMessage('Longitude must be between -180 and 180');
      setStep('error');
      return;
    }
    if (!audioFile) {
      setErrorMessage('An audio file is required');
      setStep('error');
      return;
    }

    setStep('uploading-video');
    setProgress({ video: 'pending', audio: 'pending', thumbnail: 'pending' });
    setErrorMessage('');

    const sceneId = generateSceneId();
    let videoUrl = '';
    let audioUrl = '';
    let thumbnailUrl = '';

    try {
      // Upload video
      if (videoFile) {
        setProgress((p) => ({ ...p, video: 'uploading' }));
        videoUrl = await uploadFile(sceneId, 'video', videoFile);
        setProgress((p) => ({ ...p, video: 'done' }));
      } else {
        setProgress((p) => ({ ...p, video: 'skipped' }));
      }

      // Upload audio
      setStep('uploading-audio');
      setProgress((p) => ({ ...p, audio: 'uploading' }));
      audioUrl = await uploadFile(sceneId, 'audio', audioFile);
      setProgress((p) => ({ ...p, audio: 'done' }));

      // Upload thumbnail
      setStep('uploading-thumbnail');
      if (thumbnailFile) {
        setProgress((p) => ({ ...p, thumbnail: 'uploading' }));
        thumbnailUrl = await uploadFile(sceneId, 'thumbnail', thumbnailFile);
        setProgress((p) => ({ ...p, thumbnail: 'done' }));
      } else {
        setProgress((p) => ({ ...p, thumbnail: 'skipped' }));
      }

      // Save scene to Supabase
      setStep('saving-scene');
      const res = await fetch('/api/admin/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sceneId,
          title,
          description,
          lat: latNum,
          lng: lngNum,
          videoUrl,
          audioUrl,
          thumbnailUrl: thumbnailUrl || null,
          tags: [...tags],
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Failed to save scene');
      }

      setCreatedSceneId(sceneId);
      setStep('done');

      // Reset form
      setTitle('');
      setDescription('');
      setLat('');
      setLng('');
      setTags(new Set());
      setVideoFile(null);
      setAudioFile(null);
      setThumbnailFile(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
      setStep('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">

      {/* Basic info */}
      <section className="space-y-8">
        <div>
          <label htmlFor="title" className="block text-xs font-light tracking-wider uppercase text-muted-foreground mb-2">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isUploading}
            placeholder="e.g., Tokyo Rain"
            className="w-full border-b border-border bg-transparent pb-2 text-foreground placeholder:text-muted-foreground/40 focus:border-accent focus:outline-none transition-colors disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-xs font-light tracking-wider uppercase text-muted-foreground mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            disabled={isUploading}
            placeholder="A brief description of the scene..."
            className="w-full resize-none border-b border-border bg-transparent pb-2 text-foreground placeholder:text-muted-foreground/40 focus:border-accent focus:outline-none transition-colors disabled:opacity-50"
          />
        </div>

        <LocationPicker
          lat={lat}
          lng={lng}
          disabled={isUploading}
          onSelect={(newLat, newLng) => { setLat(newLat); setLng(newLng); }}
        />
      </section>

      <div className="h-px w-full bg-border" />

      {/* Tags */}
      <section>
        <p className="text-xs font-light tracking-wider uppercase text-muted-foreground mb-4">Tags</p>
        <div className="space-y-3">
          {filterGroups.map((group) => (
            <div key={group.label} className="flex items-start gap-3">
              <span className="w-24 shrink-0 pt-0.5 text-xs font-light tracking-wider text-muted-foreground/60 uppercase">
                {group.label}
              </span>
              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag) => {
                  const active = tags.has(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      disabled={isUploading}
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-3 py-1 text-xs font-light transition-all duration-150 disabled:opacity-50 ${
                        active
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-muted-foreground hover:border-accent/40 hover:text-foreground'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="h-px w-full bg-border" />

      {/* File uploads */}
      <section className="space-y-6">
        <p className="text-xs font-light tracking-wider uppercase text-muted-foreground">Files</p>

        <FileDropZone
          label="Video"
          accept="video/mp4,video/webm,video/quicktime"
          hint="MP4 recommended · max ~500 MB"
          file={videoFile}
          disabled={isUploading}
          onFile={setVideoFile}
        />

        <FileDropZone
          label="Audio *"
          accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg"
          hint="MP3 recommended · ambient scene audio"
          file={audioFile}
          disabled={isUploading}
          onFile={setAudioFile}
        />

        <FileDropZone
          label="Thumbnail"
          accept="image/jpeg,image/webp,image/png"
          hint="JPG or WebP · 800 × 600 px recommended"
          file={thumbnailFile}
          disabled={isUploading}
          onFile={setThumbnailFile}
        />
      </section>

      {/* Progress / status */}
      {step !== 'idle' && (
        <div className="space-y-4">
          <UploadProgressDisplay progress={progress} step={step} />

          {step === 'done' && (
            <div className="rounded-sm border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
              Scene <span className="font-mono">{createdSceneId}</span> created and live on the map.
            </div>
          )}

          {step === 'error' && (
            <div className="rounded-sm border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isUploading || !audioFile || !title || !description || !lat || !lng}
        className="group flex items-center gap-3 rounded-full border border-foreground bg-foreground px-8 py-3 text-sm font-light tracking-wider uppercase text-background transition-all hover:bg-transparent hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Uploading...</span>
          </>
        ) : (
          <span>Create Scene</span>
        )}
      </button>

      {step === 'error' && (
        <button
          type="button"
          onClick={() => setStep('idle')}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Try again
        </button>
      )}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-8 w-8 text-accent drop-shadow-lg"
      style={{ marginBottom: -2 }}
    >
      <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.003 3.5-4.697 3.5-8.327a8.25 8.25 0 00-16.5 0c0 3.63 1.556 6.324 3.5 8.327a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  );
}
