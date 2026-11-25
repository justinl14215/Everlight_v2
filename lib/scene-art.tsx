'use client';

import { useEffect, useState } from 'react';

export function SceneArt({ day, checkpoint, hero }: { day: number; checkpoint: number; hero: string }) {
  const [image, setImage] = useState('');
  const [status, setStatus] = useState('Loading scene artwork…');
  const [isAction, setIsAction] = useState(false);

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
          const kind = response.headers.get('X-Everlight-Art');
          if (kind !== 'fallback' || !imageUrl) {
            const blob = await response.blob();
            if (controller.signal.aborted) return;
            if (imageUrl) URL.revokeObjectURL(imageUrl);
            imageUrl = URL.createObjectURL(blob);
            setImage(imageUrl);
            setIsAction(kind === 'action');
          } else {
            await response.body?.cancel();
          }
          if (kind !== 'fallback') return;
        } else if (!controller.signal.aborted) {
          if (response.status === 401) {
            setStatus('Rejoin the adventure to see your artwork.');
            return;
          }
          setStatus(response.status === 404
            ? 'Your artwork will appear here when it’s ready. You can keep playing.'
            : 'Artwork is temporarily unavailable. You can keep playing.');
        }
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
  return <figure style={{margin:'10px 0'}}>
    <img src={image} alt={isAction ? `An illustration of ${hero}’s last choice` : `The current Everlight scene from ${hero}’s perspective`}
      style={{ width:'100%', height:'auto', borderRadius:12 }} />
    {isAction && <figcaption className="small">Your last choice</figcaption>}
  </figure>;
}
