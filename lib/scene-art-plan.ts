import { createHash } from 'node:crypto';
import type { CampaignState, PlayerId } from './game';

type ArtState = Pick<CampaignState, 'day' | 'checkpoint'> & Partial<Pick<CampaignState, 'storyChoices'>>;

export function sceneArtPlan(state: ArtState, playerId: PlayerId) {
  const { day, checkpoint } = state;
  const fallbackKey = `day-${day}-checkpoint-${checkpoint}-${playerId}.webp`;
  const bundled = day <= 2 && checkpoint === 4;

  let previous: { day: number; checkpoint: number; action: string } | undefined;
  for (const [key, players] of Object.entries(state.storyChoices ?? {})) {
    if (!/^\d+-\d+$/.test(key)) continue;
    const [choiceDay, choiceCheckpoint] = key.split('-').map(Number);
    if (choiceDay < 1 || choiceCheckpoint < 1 || choiceDay > day ||
        (choiceDay === day && choiceCheckpoint >= checkpoint)) continue;
    if (previous && (choiceDay < previous.day ||
        (choiceDay === previous.day && choiceCheckpoint <= previous.checkpoint))) continue;
    const choice = players?.[playerId];
    const text = choice?.action || choice?.label;
    if (typeof text !== 'string' || !text.trim()) continue;
    const action = text.replace(/[\s\u0000-\u001f]+/g, ' ').trim().slice(0, 220);
    previous = { day: choiceDay, checkpoint: choiceCheckpoint, action };
  }
  if (!previous) return { key: fallbackKey, fallbackKey, bundled, previous };

  const signature = createHash('sha256').update(JSON.stringify(previous)).digest('hex').slice(0, 16);
  return { key: `day-${previous.day}-checkpoint-${previous.checkpoint}-${playerId}-action-${signature}.webp`, fallbackKey, bundled, previous };
}
