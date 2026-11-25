'use client';

import { useState } from 'react';

export type CharacterCard = {
  id: string;
  name: string;
  kind: 'Hero' | 'NPC';
  role: string;
  image?: string;
  status: string;
  condition: string;
  feeling: string;
  detail: string;
};

type PlayerId = 'justin' | 'q' | 'harmony' | 'taylor';
type PartyMember = { id: PlayerId; name: string; character: string; className: string; joined: boolean; hp: number; maxHp: number; defense: number };
type StoryChoice = { label: string; action: string; dialogue: string };
export function makeCharacterCards(input: {
  viewerId: PlayerId;
  day: number;
  checkpoint: number;
  party: PartyMember[];
  choices: Partial<Record<PlayerId, StoryChoice>>;
  progress: { phase: 'choosing' | 'acting'; activePlayerId?: PlayerId; action?: StoryChoice };
  enemies: { name: string; hp: number; maxHp: number; defense: number; active: boolean }[];
}): CharacterCard[] {
  const { viewerId, day, checkpoint, party, choices, progress, enemies } = input;
  const portrait: Record<PlayerId, string> = { justin: '/characters/dawnshield.png', q: '/characters/q-astra.png', harmony: '/characters/violet.png', taylor: '/characters/taylor.png' };
  const heroes: CharacterCard[] = party.map((member) => {
    const isActive = progress.phase === 'acting' && progress.activePlayerId === member.id;
    const choice = choices[member.id];
    const status = isActive ? `Leading: ${progress.action?.label ?? 'the team action'}` : choice ? `Chosen: ${choice.label}` : member.joined ? 'Choosing a move' : 'Waiting to join';
    return { id: `hero-${member.id}`, name: member.character || member.name, kind: 'Hero', role: member.className || 'Everlight hero', image: portrait[member.id], status, condition: `${member.hp}/${member.maxHp} HP · ${member.hp > 0 ? 'ready for the adventure' : 'needs help' } · Defense ${member.defense}`, feeling: member.id === viewerId ? 'This is your hero.' : 'A trusted member of your family team, ready to work together.', detail: member.joined ? 'Traveling with the party.' : 'Has not joined the phone adventure yet.' };
  });
  const viewerChoice = choices[viewerId];
  const choiceText = `${viewerChoice?.label ?? ''} ${viewerChoice?.action ?? ''}`.toLowerCase();
  const pipFeeling = !viewerChoice ? 'Curious and a little cautious; Pip is waiting to see how you respond.' : /welcome|hello|friend|invite|safe|help|kind/.test(choiceText) ? 'Pip seems reassured by your welcome and is beginning to trust you.' : /danger|check|ask|clue|listen|look/.test(choiceText) ? 'Pip is watchful, but appreciates that you are paying attention.' : 'Pip is still cautious, but hopes the heroes can help.';
  const npcs: CharacterCard[] = [];
  if (day === 1) npcs.push({ id: 'mayor', name: 'Mayor Brindle', kind: 'NPC', role: 'Mayor of the Forgotten Village', image: '/characters/mayor-brindle.png', status: checkpoint <= 1 ? 'Waiting in the town square for help with the stopped clock.' : 'Keeping the village calm while the heroes investigate.', condition: 'Safe; concerned about the festival and the missing time.', feeling: 'Hopeful and grateful that you are helping the village.', detail: 'Asked the heroes to find out why the clock stopped.' });
  if (day >= 1 && (day > 1 || checkpoint >= 3)) npcs.push({ id: 'pip', name: 'Pip', kind: 'NPC', role: 'Owl courier', image: '/characters/pip.png', status: 'Carrying the Keeper’s sealed clue and waiting for the heroes’ questions.', condition: 'Safe, alert, and a little ruffled from the journey.', feeling: pipFeeling, detail: 'A small owl courier sent with the first clue. Pip has noticed the red star seal and the archive records.' });
  if (day >= 1 && (day >= 2 || checkpoint >= 5)) npcs.push({ id: 'maribel', name: 'Royal Steward Maribel Thorn', kind: 'NPC', role: 'Royal Steward', image: '/characters/maribel-thorn.png', status: day >= 3 ? 'Waiting beside the archive cabinet in the Hall of Winter Wonders.' : 'Her red star seal is on the packet; the party is following the clue.', condition: day >= 3 ? 'Worried and guarded; willing to speak.' : 'Not yet met by the party.', feeling: 'Guarded, but she seems more frightened than hostile.', detail: 'Pip identified her seal. Her part in the missing records is still being uncovered.' });
  if (day >= 3 && day < 4) npcs.push({ id: 'keeper', name: 'The missing Keeper', kind: 'NPC', role: 'A figure from Everlight’s erased history', status: 'Absent; the heroes are gathering memories and records about them.', condition: 'Their present whereabouts are unknown.', feeling: 'The story has not yet shown how they feel toward you.', detail: 'The Keeper’s name and history are being pieced together from clues.' });
  if (day >= 4 && checkpoint >= 2) npcs.push({ id: 'orin', name: 'Orin Vale', kind: 'NPC', role: 'The original Keeper of the Festival', status: 'Listening to the heroes and waiting to hear whether they will make room for him.', condition: 'The shadow has lifted; he is wary and hurt, but safe to speak with.', feeling: 'Wary and sorrowful, but open to a sincere welcome from you.', detail: 'Orin was excluded from the feast and became the Hollow King. He can be welcomed back, helped to repair the harm, or challenged.' });
  const encounters: CharacterCard[] = enemies.map((enemy, index) => ({ id: `enemy-${index}-${enemy.name}`, name: enemy.name, kind: 'NPC', role: 'Current encounter', status: enemy.active ? 'In the scene with the party.' : 'No longer an active threat.', condition: `${enemy.hp}/${enemy.maxHp} HP · Defense ${enemy.defense}`, feeling: enemy.active ? 'Hostile or frightened; the party may still look for a peaceful way through.' : 'No longer acting against the party.', detail: 'Encounter status refreshes as the DM updates the scene.' }));
  return [...heroes, ...npcs, ...encounters];
}

export function CharacterCards({ characters }: { characters: CharacterCard[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const card = characters.find((character) => character.id === selected);

  return <>
    <button className="quiet" type="button" aria-haspopup="dialog" onClick={() => { setSelected(null); setOpen(true); }}>Characters</button>
    {open && <div className="characterOverlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="characterDialog" role="dialog" aria-modal="true" aria-labelledby="character-dialog-title">
        <div className="characterDialogHead">
          <div><p className="eyebrow">THE COMPANY</p><h2 id="character-dialog-title">{card ? card.name : 'Characters'}</h2></div>
          <button type="button" className="quiet" aria-label="Close characters" onClick={() => setOpen(false)}>Close</button>
        </div>
        {card ? <>
          <button type="button" className="quiet characterBack" onClick={() => setSelected(null)}>← All characters</button>
          <article className="characterDetail">
            {card.image ? <img src={card.image} alt={`${card.name} portrait`} /> : <div className="characterSigil" aria-hidden="true">✦</div>}
            <p className="eyebrow">{card.kind} · {card.role}</p>
            <h3>{card.name}</h3>
            <dl><dt>Right now</dt><dd>{card.status}</dd><dt>Condition</dt><dd>{card.condition}</dd><dt>How they feel toward you</dt><dd>{card.feeling}</dd><dt>Known about them</dt><dd>{card.detail}</dd></dl>
          </article>
        </> : <div className="characterRoster">{characters.map((character) => <button type="button" className="characterRow" key={character.id} onClick={() => setSelected(character.id)}>
          {character.image ? <img src={character.image} alt="" /> : <span className="characterSigil" aria-hidden="true">✦</span>}
          <span><b>{character.name}</b><small>{character.kind} · {character.status}</small></span><span aria-hidden="true">›</span>
        </button>)}</div>}
      </section>
    </div>}
  </>;
}
