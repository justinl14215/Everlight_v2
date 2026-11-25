'use client';

import { useEffect, useState } from 'react';

export function SceneArt({ day, checkpoint, hero }: { day: number; checkpoint: number; hero: string }) {
  const [image, setImage] = useState('');

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
        if (response.status === 401) return;
      } catch {
        if (controller.signal.aborted) return;
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

  if (!image) return null;
  // The URL is a local blob fetched through the authenticated player session.
  return <img src={image} alt={`The current Everlight scene from ${hero}’s perspective`}
    style={{ width:'100%', height:'auto', borderRadius:12, marginBlock:10 }} />;
}
