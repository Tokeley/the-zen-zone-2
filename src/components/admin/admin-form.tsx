'use client';

import { useState } from 'react';

interface FormData {
  title: string;
  description: string;
  lat: string;
  lng: string;
  videoUrl: string;
  audioUrl: string;
  thumbnailUrl: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  lat: '',
  lng: '',
  videoUrl: '',
  audioUrl: '',
  thumbnailUrl: '',
};

export function AdminForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    // Validate coordinates
    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setSubmitMessage({ type: 'error', text: 'Latitude must be between -90 and 90' });
      setIsSubmitting(false);
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      setSubmitMessage({ type: 'error', text: 'Longitude must be between -180 and 180' });
      setIsSubmitting(false);
      return;
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real app, this would save to a database
    console.log('[v0] Scene data submitted:', {
      ...formData,
      lat,
      lng,
      id: formData.title.toLowerCase().replace(/\s+/g, '-'),
    });

    setSubmitMessage({ type: 'success', text: 'Scene created successfully! (Demo mode - not persisted)' });
    setFormData(initialFormData);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-xs font-light tracking-wider uppercase text-muted-foreground mb-2">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
          placeholder="e.g., Tokyo Rain"
          className="w-full border-b border-border bg-transparent pb-2 text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none transition-colors"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-xs font-light tracking-wider uppercase text-muted-foreground mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          rows={3}
          placeholder="A brief description of the scene..."
          className="w-full resize-none border-b border-border bg-transparent pb-2 text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none transition-colors"
        />
      </div>

      {/* Coordinates */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="lat" className="block text-xs font-light tracking-wider uppercase text-muted-foreground mb-2">
            Latitude
          </label>
          <input
            type="number"
            id="lat"
            name="lat"
            value={formData.lat}
            onChange={handleInputChange}
            required
            step="any"
            placeholder="e.g., 35.6595"
            className="w-full border-b border-border bg-transparent pb-2 text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label htmlFor="lng" className="block text-xs font-light tracking-wider uppercase text-muted-foreground mb-2">
            Longitude
          </label>
          <input
            type="number"
            id="lng"
            name="lng"
            value={formData.lng}
            onChange={handleInputChange}
            required
            step="any"
            placeholder="e.g., 139.7004"
            className="w-full border-b border-border bg-transparent pb-2 text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="h-px w-full bg-border" />

      {/* Video URL */}
      <div>
        <label htmlFor="videoUrl" className="block text-xs font-light tracking-wider uppercase text-muted-foreground mb-2">
          Video URL
        </label>
        <input
          type="url"
          id="videoUrl"
          name="videoUrl"
          value={formData.videoUrl}
          onChange={handleInputChange}
          required
          placeholder="https://example.com/video.mp4"
          className="w-full border-b border-border bg-transparent pb-2 text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none transition-colors"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Direct link to an MP4 video file
        </p>
      </div>

      {/* Audio URL */}
      <div>
        <label htmlFor="audioUrl" className="block text-xs font-light tracking-wider uppercase text-muted-foreground mb-2">
          Audio URL
        </label>
        <input
          type="url"
          id="audioUrl"
          name="audioUrl"
          value={formData.audioUrl}
          onChange={handleInputChange}
          required
          placeholder="https://example.com/audio.mp3"
          className="w-full border-b border-border bg-transparent pb-2 text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none transition-colors"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Direct link to an MP3 audio file
        </p>
      </div>

      {/* Thumbnail URL */}
      <div>
        <label htmlFor="thumbnailUrl" className="block text-xs font-light tracking-wider uppercase text-muted-foreground mb-2">
          Thumbnail URL
        </label>
        <input
          type="url"
          id="thumbnailUrl"
          name="thumbnailUrl"
          value={formData.thumbnailUrl}
          onChange={handleInputChange}
          required
          placeholder="https://example.com/thumbnail.jpg"
          className="w-full border-b border-border bg-transparent pb-2 text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none transition-colors"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Scene preview image (recommended: 800x600px)
        </p>
      </div>

      {/* Submit Message */}
      {submitMessage && (
        <div
          className={`rounded-sm border px-4 py-3 text-sm ${
            submitMessage.type === 'success'
              ? 'border-accent/30 bg-accent/10 text-accent'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {submitMessage.text}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="group relative flex items-center gap-3 rounded-full border border-foreground bg-foreground px-8 py-3 text-sm font-light tracking-wider uppercase text-primary-foreground transition-all hover:bg-transparent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Creating...</span>
          </>
        ) : (
          <span>Create Scene</span>
        )}
      </button>
    </form>
  );
}
