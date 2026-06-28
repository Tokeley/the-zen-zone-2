/**
 * Captures the first frame of a local video file as a JPEG thumbnail.
 * Runs entirely in the browser — no server-side transcoding required.
 */
export function extractVideoThumbnail(videoFile: File, maxWidth = 800): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(videoFile);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Could not load video for thumbnail'));
    };

    video.onseeked = () => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) {
        cleanup();
        reject(new Error('Video has no dimensions'));
        return;
      }

      const scale = Math.min(1, maxWidth / w);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        cleanup();
        reject(new Error('Could not create canvas'));
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          cleanup();
          if (!blob) {
            reject(new Error('Could not encode thumbnail'));
            return;
          }
          resolve(new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.85,
      );
    };

    video.onloadedmetadata = () => {
      video.currentTime = 0;
    };

    video.src = url;
  });
}
