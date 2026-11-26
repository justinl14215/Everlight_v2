import type { CampaignState, PlayerId } from './game';

export function getCurrentCheckpointChoices(state: CampaignState) {
  return state.storyChoices?.[`${state.day}-${state.checkpoint}`] ?? {};
}

export function getCurrentCheckpointCheck(state: CampaignState) {
  const check = state.lastCheck;
  if (!check || state.lastCheckDay !== state.day || state.lastCheckCheckpoint == null) return null;
  return state.lastCheckCheckpoint >= state.checkpoint - 1 ? check : null;
}

export function canSkipCheckpoint(state: CampaignState): { allowed: boolean; reason?: string } {
  const choices = getCurrentCheckpointChoices(state);
  if (state.storyProgress.phase === 'acting') {
    return { allowed: false, reason: 'Resolve or replace the active party action before skipping this checkpoint.' };
  }
  if (Object.keys(choices).length) {
    return { allowed: false, reason: 'Resolve or replace the submitted party choices before skipping this checkpoint.' };
  }
  if (state.combatPhase === 'active' || state.combatPhase === 'victory') {
    return { allowed: false, reason: 'Resolve the active encounter before skipping this checkpoint.' };
  }
  return { allowed: true };
}

export function checkpointChoiceSummary(state: CampaignState): string[] {
  const choices = getCurrentCheckpointChoices(state);
  return (['justin', 'q', 'harmony', 'taylor'] as PlayerId[])
    .filter(id => choices[id])
    .map(id => `${state.players[id].character || state.players[id].name}: ${choices[id]!.label}`);
}
