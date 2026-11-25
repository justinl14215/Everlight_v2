'use client';

import { useEffect, useState } from 'react';

const INACTIVITY_MS = 60 * 60 * 1000;
const SAVE_INTERVAL_MS = 15 * 1000;

type ReturnRecapProps = {
  playerId: string;
  hero: string;
  place: string;
  checkpoint: number;
  scene: string;
  lastUpdate: string;
  nextAction: string;
  readAloud: (text: string) => void;
};

export function ReturnRecap({
  playerId, hero, place, checkpoint, scene, lastUpdate, nextAction, readAloud,
}: ReturnRecapProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const key = `everlight:last-play:${playerId}`;
    let lastActive = 0;
    let lastSaved = 0;
    try {
      lastActive = Number(localStorage.getItem(key)) || 0;
      lastSaved = lastActive;
    } catch {
      // Keep tracking in this tab when browser storage is unavailable.
    }

    function saveActivity() {
      if (!lastActive) return;
      try {
        localStorage.setItem(key, String(lastActive));
        lastSaved = lastActive;
      } catch {
        // A blocked preference store should not interrupt the adventure.
      }
    }

    function markReturn() {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (lastActive > 0 && now - lastActive >= INACTIVITY_MS) setOpen(true);
      lastActive = now;
      if (!lastSaved || now - lastSaved >= SAVE_INTERVAL_MS || now < lastSaved) saveActivity();
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
  const recap = [`Welcome back, ${hero}.`, storyLocation, lastUpdate, scene, nextAction]
    .filter(Boolean).join(' ');

  return (
    <section className="notice" aria-labelledby="return-recap-title">
      <h3 id="return-recap-title">Welcome back, {hero}</h3>
      <div aria-live="polite">
        <p>{storyLocation}</p>
        {lastUpdate && <p><strong>Last party update</strong><br />{lastUpdate}</p>}
        <p><strong>Current scene</strong><br />{scene}</p>
        <p>{nextAction}</p>
      </div>
      <div className="row">
        <button type="button" onClick={() => readAloud(recap)}>Hear the recap</button>
        <button type="button" className="primary" onClick={() => setOpen(false)}>Continue adventure</button>
      </div>
    </section>
  );
}
