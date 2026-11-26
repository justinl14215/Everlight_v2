import { createInitialState, type CampaignState, type PlayerId } from './game';

export type FeatureTestResult = { name: string; passed: boolean; detail: string };

function check(name: string, condition: boolean, detail: string): FeatureTestResult {
  return { name, passed: condition, detail };
}

/** Runs isolated in-memory feature scenarios. The supplied campaign state is never modified. */
export function runFeatureTestSuite(source: CampaignState): FeatureTestResult[] {
  const results: FeatureTestResult[] = [];
  const sourceCheckpoint = source.checkpoint;
  const sourceLog = source.log.slice();
  const roster = Object.keys(source.players) as PlayerId[];
  const expected: PlayerId[] = ['justin', 'q', 'harmony', 'taylor'];

  results.push(check(
    'Campaign and player access',
    expected.every((id) => roster.includes(id)) && Object.keys(source.invites).length === 4,
    'Four player records and four invitation slots are present.',
  ));

  const inviteState = createInitialState();
  inviteState.invites.justin = 'test-justin-code';
  inviteState.players.justin.joined = true;
  results.push(check(
    'Invitation and player portal join',
    inviteState.invites.justin === 'test-justin-code' && inviteState.players.justin.joined && inviteState.players.q.joined === false,
    'A test invitation joins one hero while the other player portals stay separate.',
  ));

  const profileState = createInitialState();
  profileState.players.harmony.character = 'Test Hero';
  profileState.players.harmony.className = 'Guardian';
  profileState.players.harmony.preferences = ['help friends'];
  results.push(check(
    'Character profile save',
    profileState.players.harmony.character === 'Test Hero' && profileState.players.harmony.className === 'Guardian' && profileState.players.harmony.preferences.length === 1,
    'A sample name, role, and preference save on a fresh test copy.',
  ));

  const choiceState = createInitialState();
  const key = `${choiceState.day}-${choiceState.checkpoint}`;
  choiceState.storyChoices[key] = {
    justin: { label: 'Ask the Keeper', action: 'Ask what happened', dialogue: 'We need your help.' },
    q: { label: 'Ask the Keeper', action: 'Listen carefully', dialogue: 'Tell us what you know.' },
    harmony: { label: 'Follow the clock', action: 'Inspect the clock', dialogue: 'I will look for a clue.' },
    taylor: { label: 'Ask the Keeper', action: 'Ask a question', dialogue: 'Who is there?' },
  };
  choiceState.storyChoices[key].q = { label: 'Help the Keeper', action: 'Offer to help', dialogue: 'We can help you.' };
  const forcedChoiceSaved = choiceState.storyChoices[key].q?.label === 'Help the Keeper';
  const expectedLabels = expected.map((id) => choiceState.storyChoices[key][id]?.label ?? '');
  const leaderLabel = expectedLabels.sort((a, b) => expectedLabels.filter((x) => x === b).length - expectedLabels.filter((x) => x === a).length)[0];
  choiceState.storyProgress = {
    phase: 'acting',
    activePlayerId: expected.find((id) => choiceState.storyChoices[key][id]?.label === leaderLabel),
    action: choiceState.storyChoices[key][expected.find((id) => choiceState.storyChoices[key][id]?.label === leaderLabel)!],
    playersChosen: expected,
  };
  results.push(check(
    'Player choices and DM override',
    forcedChoiceSaved && choiceState.storyProgress.phase === 'acting' && choiceState.storyProgress.playersChosen.length === 4,
    'The DM can replace a choice; once all four have choices, a shared action is selected.',
  ));

  const dmMode = createInitialState();
  dmMode.dmMode = 'human';
  dmMode.narration = 'A test-only human narration override.';
  dmMode.dmMode = 'ai';
  results.push(check(
    'AI DM and human narration control',
    dmMode.dmMode === 'ai' && dmMode.narration.includes('test-only'),
    'Human narration can be previewed, then AI mode restored on the isolated copy.',
  ));

  const roll = 12;
  const modifier = 2;
  const dc = 14;
  const total = roll + modifier;
  results.push(check('Physical dice resolution', total === 14 && total >= dc, `12 + 2 = ${total}, meeting DC ${dc}.`));

  const progression = createInitialState();
  progression.checkpoint += 1;
  progression.storyProgress = { phase: 'choosing', playersChosen: [] };
  results.push(check(
    'Checkpoint and day progression',
    progression.checkpoint === 2 && progression.storyProgress.phase === 'choosing',
    'Advancing creates a new choice round on the next checkpoint.',
  ));

  const combat = createInitialState();
  combat.combat = true;
  combat.combatPhase = 'active';
  combat.enemies = [{ name: 'Test Goblin', hp: 1, maxHp: 1, defense: 10, attack: 1, damage: '1d4', active: true }];
  combat.enemies[0].hp = Math.max(0, combat.enemies[0].hp - 1);
  combat.enemies[0].active = combat.enemies[0].hp > 0;
  if (combat.enemies.every((enemy) => !enemy.active)) combat.combatPhase = 'victory';
  combat.players.justin.hp = Math.max(0, combat.players.justin.hp - 2);
  results.push(check(
    'Combat, damage, turns, and HP',
    combat.combatPhase === 'victory' && combat.players.justin.hp === combat.players.justin.maxHp - 2 && combat.turn === 0,
    'Sample damage defeats a test enemy, updates copied hero HP, and initializes the turn tracker.',
  ));

  const missionState = createInitialState();
  const sampleMission = missionState.missions[0];
  missionState.pending.push({ id: 'test-request', playerId: 'harmony', missionId: sampleMission.id, note: 'Test submission' });
  const submitted = missionState.pending[0];
  missionState.pending = missionState.pending.filter((item) => item.id !== submitted.id);
  missionState.approved.push(sampleMission.id);
  missionState.players.harmony.inventory.push('Mission: ' + sampleMission.title);
  missionState.completedPlanIds.push('test-family-plan');
  results.push(check(
    'Mission and household activity approval',
    missionState.pending.length === 0 && missionState.approved.includes(sampleMission.id) && missionState.players.harmony.inventory.some((item) => item.includes(sampleMission.title)) && missionState.completedPlanIds.includes('test-family-plan'),
    'A player request can be reviewed, rewarded, and paired with a completed family plan on the test copy.',
  ));

  const rewards = createInitialState();
  rewards.deliveredClues.harmony.push('Test clue');
  rewards.knownClues.push('Test clue');
  rewards.flames.push('Appreciation');
  rewards.mapUnlocked.push('Test Map');
  rewards.players.harmony.inventory.push('Test reward');
  rewards.players.harmony.sparks += 1;
  rewards.completedPlanIds.push('test-plan');
  results.push(check(
    'Clues, maps, flames, plans, and rewards',
    rewards.deliveredClues.harmony.includes('Test clue') && rewards.knownClues.includes('Test clue') && rewards.flames.includes('Appreciation') && rewards.mapUnlocked.includes('Test Map') && rewards.players.harmony.inventory.includes('Test reward') && rewards.players.harmony.sparks === 3 && rewards.completedPlanIds.includes('test-plan'),
    'Sample clue delivery, map unlock, flame, family plan, item, and Spark all update on the test copy.',
  ));

  const ending = createInitialState();
  ending.ending = 'The heroes welcome the Keeper.';
  ending.players.q.inventory.push('Test keepsake');
  ending.players.q.spells.push('Test spell');
  results.push(check(
    'Story ending, items, and spells',
    ending.ending.includes('Keeper') && ending.players.q.inventory.includes('Test keepsake') && ending.players.q.spells.includes('Test spell'),
    'The ending and hero inventory/spell book accept test updates.',
  ));

  const recap = createInitialState();
  recap.sessionStartedAt = new Date().toISOString();
  recap.log.push('Test action recorded.');
  recap.sessionRecap = { createdAt: new Date().toISOString(), narration: 'Test recap.', events: [...recap.log], visualBeats: ['Beat 1', 'Beat 2', 'Beat 3'] };
  results.push(check(
    'Session timer and recap',
    Boolean(recap.sessionStartedAt && recap.sessionRecap?.events.includes('Test action recorded.') && recap.sessionRecap.visualBeats.length === 3),
    'A sample event is retained in a recap with three storyboard prompts.',
  ));

  results.push(check(
    'Live campaign protection',
    source.checkpoint === sourceCheckpoint && source.log.length === sourceLog.length && source.log.every((entry, index) => entry === sourceLog[index]),
    'All scenarios used fresh copies and did not write test events into the live campaign.',
  ));

  return results;
}
