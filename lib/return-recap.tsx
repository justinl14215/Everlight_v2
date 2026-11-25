'use client';

import { useEffect, useRef, useState } from 'react';
import type { PlayerId, RecapUpdate } from './game';
import { heroSpeakers, type Speaker, type StoryLine } from './story-voices';

const INACTIVITY_MS = 60 * 60 * 1000;
const SAVE_INTERVAL_MS = 15 * 1000;

type ReturnRecapProps = {
  playerId: PlayerId;
  hero: string;
  place: string;
  day: number;
  checkpoint: number;
  scene: StoryLine[];
  lastUpdate: string;
  history: RecapUpdate[];
  nextAction: string;
  readAloud: (lines: StoryLine[], take?: 'baseline') => void;
};

export function ReturnRecap({
  playerId, hero, place, day, checkpoint, scene, lastUpdate, history, nextAction, readAloud,
}: ReturnRecapProps) {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<{ sceneKey: string; speaker: Speaker } | null>(null);

  const latest = useRef({ day, checkpoint, updateId: history.at(-1)?.id ?? 0 });
  const [returnFrom, setReturnFrom] = useState<typeof latest.current | null>(null);

  useEffect(() => {
    latest.current = { day, checkpoint, updateId: history.at(-1)?.id ?? 0 };
  }, [day, checkpoint, history]);

  useEffect(() => {
    const key = `everlight:last-play:${playerId}`;
    let lastActive = 0;
    let lastSaved = 0;
    let lastSeen: typeof latest.current | null = null;
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
      lastActive = typeof saved === 'number' ? saved : saved?.at ?? 0;
      lastSeen = typeof saved?.seen?.updateId === 'number' ? saved.seen : null;
      lastSaved = lastActive;
    } catch {
      // Keep tracking in this tab when browser storage is unavailable.
    }

    function saveActivity() {
      if (!lastActive) return;
      try {
        localStorage.setItem(key, JSON.stringify({ at: lastActive, seen: lastSeen }));
        lastSaved = lastActive;
      } catch {
        // A blocked preference store should not interrupt the adventure.
      }
    }

    function markReturn() {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (lastActive > 0 && now - lastActive >= INACTIVITY_MS) {
        setReturnFrom(lastSeen);
        setOpen(true);
      }
      const position = latest.current;
      const moved = lastSeen?.day !== position.day || lastSeen?.checkpoint !== position.checkpoint ||
        lastSeen?.updateId !== position.updateId;
      lastSeen = position;
      lastActive = now;
      if (moved || !lastSaved || now - lastSaved >= SAVE_INTERVAL_MS || now < lastSaved) saveActivity();
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') markReturn();
      else saveActivity();
    }

    markReturn();
    window.addEventListener('pointerdown', markReturn);
    window.addEventListener('keydown', markReturn);
    window.addEventListener('scroll', markReturn, { passive: true, capture: true });
    window.addEventListener('focus', markReturn);
    window.addEventListener('pageshow', markReturn);
    window.addEventListener('pagehide', saveActivity);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      saveActivity();
      window.removeEventListener('pointerdown', markReturn);
      window.removeEventListener('keydown', markReturn);
      window.removeEventListener('scroll', markReturn, true);
      window.removeEventListener('focus', markReturn);
      window.removeEventListener('pageshow', markReturn);
      window.removeEventListener('pagehide', saveActivity);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [playerId]);

  if (!open) {
    return <button type="button" className="quiet" onClick={() => setOpen(true)}>Story recap</button>;
  }

  const storyLocation = `You’re in ${place} at checkpoint ${checkpoint}.`;
  const sceneText = scene.map(line => line.text).join(' ');
  const heroSpeaker = heroSpeakers[playerId];
  const sceneSpeakers = [...new Set(scene.map(line => line.speaker))].filter(speaker => speaker !== 'narrator');
  const choices: Speaker[] = [...new Set<Speaker>([...sceneSpeakers, heroSpeaker, 'narrator'])];
  const sceneKey = `${day}-${checkpoint}`;
  const speaker = selection?.sceneKey === sceneKey && choices.includes(selection.speaker)
    ? selection.speaker
    : sceneSpeakers.at(-1) ?? heroSpeaker;
  const names: Record<Speaker, string> = {
    narrator: 'Narrator',
    dawnshield: 'Dawnshield',
    astra: 'Q’Astra',
    violet: 'Violet',
    taylor: 'Taylor',
    pip: 'Pip',
    keeper: 'The Keeper',
    maribel: 'Maribel Thorn',
    orin: day < 4 ? 'A voice from the invitation' : checkpoint === 1 && day === 4 ? 'The crowned shadow' : 'Orin Vale',
  };
  const missed = returnFrom ? history.filter(update => update.id > returnFrom.updateId) : [];
  const changedCheckpoint = returnFrom && (day !== returnFrom.day || checkpoint !== returnFrom.checkpoint);
  const recent = missed.slice(-3).map(update => update.text);
  const older = returnFrom && recent.length && history[0]?.id > returnFrom.updateId + 1;
  const updates = recent.length
    ? [...(missed.length > recent.length || older ? ['Here are the latest updates.'] : []), ...recent]
    : returnFrom
      ? [changedCheckpoint
        ? `The party moved from day ${returnFrom.day}, checkpoint ${returnFrom.checkpoint}, to this scene.`
        : 'The party is still at the checkpoint where you left off.']
      : [];
  const partyUpdate = updates.length ? ['While you were away.', ...updates] : [lastUpdate];
  const recap = speaker === 'narrator'
    ? [`Welcome back, ${hero}.`, storyLocation, ...partyUpdate, sceneText, nextAction]
    : [
      speaker === heroSpeaker ? 'Let me catch up before we go on.' : `Welcome back, ${hero}. Here’s where we left off.`,
      `We’re in ${place}.`, ...partyUpdate, sceneText, nextAction,
    ];

  const recapLine = { speaker, text: recap.filter(Boolean).join(' ') };
  return (
    <section className="notice" aria-labelledby="return-recap-title">
      <h3 id="return-recap-title">Welcome back, {hero}</h3>
      <div aria-live="polite">
        <p>{storyLocation}</p>
        {updates.length > 0
          ? <div><strong>While you were away</strong><ul>{updates.map((update, i) => <li key={i}>{update}</li>)}</ul></div>
          : lastUpdate && <p><strong>Last party update</strong><br />{lastUpdate}</p>}
        <p><strong>Current scene</strong><br />{sceneText}</p>
        <p>{nextAction}</p>
      </div>
      <label htmlFor="recap-speaker">Who gives the recap?</label>
      <select id="recap-speaker" value={speaker} onChange={event => {
        const choice = choices.find(item => item === event.target.value);
        if (choice) setSelection({ sceneKey, speaker: choice });
      }}>
        {choices.map(choice =>
          <option key={choice} value={choice}>{choice === heroSpeaker ? `My hero · ${hero}` : names[choice]}</option>
        )}
      </select>
      <div className="row">
        <button type="button" onClick={() => readAloud([recapLine])}>Hear the recap</button>
        {process.env.NODE_ENV === 'development' && speaker === 'pip' &&
          <button type="button" onClick={() => readAloud([recapLine], 'baseline')}>Compare original Pip delivery</button>}
        <button type="button" className="primary" onClick={() => setOpen(false)}>Continue adventure</button>
      </div>
    </section>
  );
}
