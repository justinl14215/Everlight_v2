import { useEffect, useRef } from 'react';
import { assembleNarration } from './narration-audio';
import { narratorLine, type StoryLine } from './story-voices';

const MAX_CACHE_BYTES = 12 * 1024 * 1024;

export function useNarrator(onError: (message: string) => void, portal: 'dm' | 'player') {
  const audioRef = useRef<HTMLAudioElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const urlRef = useRef<string | null>(null);
  const cacheRef = useRef(new Map<string, Blob>());

  useEffect(() => () => {
    requestRef.current?.abort();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    cacheRef.current.clear();
  }, []);

  async function speakNarration(input: string | StoryLine[], take: 'directed' | 'baseline' = 'directed') {
    const audio = audioRef.current;
    const lines = (typeof input === 'string' ? [narratorLine(input)] : input)
      .filter(line => line.text.trim());
    if (!audio || !lines.length) return;

    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    audio.pause();
    audio.hidden = true;
    onError('');

    const cacheKey = JSON.stringify({ lines, take });
    const cache = cacheRef.current;
    try {
      let recording = cache.get(cacheKey);
      if (!recording) {
        const clips = await Promise.all(lines.map(async line => {
          const response = await fetch('/api/game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-everlight-portal': portal },
            body: JSON.stringify({ action: 'narrationAudio', audioFormat: 'pcm', take, ...line }),
            signal: request.signal,
          });
          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Narration audio is unavailable.');
          }
          return response.arrayBuffer();
        }));
        if (request.signal.aborted || audioRef.current !== audio) return;
        recording = assembleNarration(clips);
        if (recording.size <= MAX_CACHE_BYTES) {
          let cacheBytes = [...cache.values()].reduce((bytes, clip) => bytes + clip.size, recording.size);
          for (const [key, clip] of cache) {
            if (cacheBytes <= MAX_CACHE_BYTES) break;
            cache.delete(key);
            cacheBytes -= clip.size;
          }
          cache.set(cacheKey, recording);
        }
      }

      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(recording);
      audio.src = urlRef.current;
      audio.hidden = false;
      try {
        await audio.play();
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'NotAllowedError')) throw error;
        // Mobile browsers can require a tap on the visible audio controls.
      }
    } catch (error) {
      if (!request.signal.aborted) {
        onError(error instanceof Error ? error.message : 'Narration audio is unavailable.');
        request.abort();
      }
    }
  }

  return { audioRef, speakNarration };
}
