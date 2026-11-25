'use client';

import { useEffect, useState } from 'react';

export function SceneArt({ day, checkpoint, hero }: { day: number; checkpoint: number; hero: string }) {
  const [image, setImage] = useState('');
  const [status, setStatus] = useState('Loading scene artwork…');
  const [isAction, setIsAction] = useState(false);
  const [reload, setReload] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let imageUrl: string | undefined;

    async function load() {
      setStatus('Loading scene artwork.');
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
  }, [day, checkpoint, reload]);

  async function generateScene() {
    setGenerating(true);
    setGenerationError('');
    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-everlight-portal': 'player' },
        body: JSON.stringify({ action: 'generateSceneArt' }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not create the scene illustration.');
      setReload((value) => value + 1);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Could not create the scene illustration.');
    } finally {
      setGenerating(false);
    }
  }

  // The URL is a local blob fetched through the authenticated player session.
  return <div style={{margin:'10px 0'}}>
    {image ? <figure style={{margin:'0 0 10px'}}>
      <img src={image} alt={isAction ? `An illustration of ${hero}'s last choice` : `The current Everlight scene from ${hero}'s perspective`}
        style={{ width:'100%', height:'auto', borderRadius:12 }} />
      {isAction && <figcaption className="small">Your last choice</figcaption>}
    </figure> : <p className="small" role="status">{status}</p>}
    <button type="button" className="quiet" onClick={generateScene} disabled={generating}>
      {generating ? 'Creating scene illustration…' : image ? 'Refresh scene illustration' : 'Generate scene illustration'}
    </button>
    <p className="small" aria-live="polite">{generationError || (generating ? 'Everlight is illustrating the heroes and characters present in this scene.' : '')}</p>
    <p className="small">Uses OpenAI image credits. One image is cached for this scene.</p>
  </div>;
}
