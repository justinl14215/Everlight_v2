import { useEffect, useRef } from 'react';
import { narratorLine, type StoryLine } from './story-voices';

export function useNarrator(onError: (message: string) => void, portal: 'dm' | 'player') {
  const audioRef = useRef<HTMLAudioElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => () => {
    requestRef.current?.abort();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  async function speakNarration(input: string | StoryLine[]) {
    const player = audioRef.current;
    const lines = (typeof input === 'string' ? [narratorLine(input)] : input)
      .filter(line => line.text.trim());
    if (!player || !lines.length) return;
    const audio = player;

    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    audio.pause();
    audio.onended = null;
    onError('');

    async function playLine(index: number) {
      const line = lines[index];
      if (!line || request.signal.aborted) return;
      try {
        const response = await fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-everlight-portal': portal },
          body: JSON.stringify({ action: 'narrationAudio', ...line }),
          signal: request.signal,
        });
        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || 'Narration audio is unavailable.');
        }
        const clip = await response.blob();
        if (request.signal.aborted || audioRef.current !== audio) return;
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = URL.createObjectURL(clip);
        audio.src = urlRef.current;
        audio.hidden = false;
        audio.onended = () => { void playLine(index + 1); };
        try {
          await audio.play();
        } catch (error) {
          if (!(error instanceof DOMException && error.name === 'NotAllowedError')) throw error;
          // Mobile browsers can require a tap on the visible audio controls.
        }
      } catch (error) {
        if (!request.signal.aborted) {
          onError(error instanceof Error ? error.message : 'Narration audio is unavailable.');
        }
      }
    }

    await playLine(0);
  }

  return { audioRef, speakNarration };
}
