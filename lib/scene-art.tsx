'use client';

import { useEffect, useState } from 'react';

export function SceneArt({ day, checkpoint, hero }: { day: number; checkpoint: number; hero: string }) {
  const [image, setImage] = useState('');
  const [status, setStatus] = useState('Loading scene artwork…');

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let imageUrl: string | undefined;

    async function load() {
      try {
        const response = await fetch(`/api/game?view=player&art=1&day=${day}&checkpoint=${checkpoint}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const blob = await response.blob();
          if (controller.signal.aborted) return;
          imageUrl = URL.createObjectURL(blob);
          setImage(imageUrl);
          return;
        }
        if (controller.signal.aborted) return;
        if (response.status === 401) {
          setStatus('Rejoin the adventure to see your artwork.');
          return;
        }
        setStatus(response.status === 404
          ? 'Your artwork will appear here when it’s ready. You can keep playing.'
          : 'Artwork is temporarily unavailable. You can keep playing.');

      } catch {
        if (controller.signal.aborted) return;
        setStatus('Artwork is temporarily unavailable. You can keep playing.');
      }
      if (!controller.signal.aborted) timer = setTimeout(load, 15_000);
    }

    void load();
    return () => {
      controller.abort();
      clearTimeout(timer);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [day, checkpoint]);

  if (!image) return <p className="small" role="status">{status}</p>;
  // The URL is a local blob fetched through the authenticated player session.
  return <img src={image} alt={`The current Everlight scene from ${hero}’s perspective`}
    style={{ width:'100%', height:'auto', borderRadius:12, marginBlock:10 }} />;
}
