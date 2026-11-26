import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const game=await readFile(new URL('../lib/game.ts',import.meta.url),'utf8');
const api=await readFile(new URL('../app/api/game/route.ts',import.meta.url),'utf8');
const player=await readFile(new URL('../app/player/page.tsx',import.meta.url),'utf8');
const testLab=await readFile(new URL('../lib/feature-checks.ts',import.meta.url),'utf8');
const testLabPage=await readFile(new URL('../app/test-lab/page.tsx',import.meta.url),'utf8');
const dmPage=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');

test('campaign contains five sessions and a complete five-flame track',()=>{
  for(const title of ['The Forgotten Village','Forest of Tangled Stars','Hall of Winter Wonders','Thanksgiving Grand Feast','The Kingdom Reborn'])assert.ok(game.includes(title),`missing ${title}`);
  for(const value of ['Appreciation','Generosity','Togetherness','Thankfulness','Giving Back'])assert.ok(game.includes(value),`missing ${value}`);
});
test('campaign data contains exactly 32 household mission entries',()=>{
  const section=game.split('const missionRows:')[1]?.split('export const missions:')[0]??'';
  assert.equal((section.match(/\[\d+,'/g)||[]).length,32);
});
test('kid-safe mode and clue fallback safeguards are present',()=>{
  for(const guard of ['adult handles','ladders','knives','hot food','You can always take a break'])assert.ok((game+api+player).toLowerCase().includes(guard.toLowerCase()),`missing ${guard}`);
  assert.match(player,/clue checks never block/i);
});
test('server API includes signed sessions, private player reads, and DM-only writes',()=>{
  for(const token of ['createHmac','timingSafeEqual','httpOnly:true','playerView','if(!dm)return deny()','SUPABASE_SERVICE_ROLE_KEY','OPENAI_API_KEY','humanOverride','PLAYER_COOKIE'])assert.ok(api.includes(token),`missing ${token}`);
});
test('all four human heroes and family-week constraints are represented',()=>{
  for(const id of ['justin','q','harmony','taylor'])assert.ok(game.includes(`${id}:{id:'${id}'`),`missing ${id}`);
  for(const phrase of ['Groceries and shopping','Friendsgiving dinner','Teresa’s volunteer bag packing','Frisco / Plano plans','Optional Friday epilogue','Daily reading'])assert.ok(game.includes(phrase),`missing ${phrase}`);
  assert.ok(player.includes('30-SECOND SPOILER-FREE INVITATION'));
  assert.ok(player.includes('SpeechRecognition'));
});

test('DM Test Lab covers sandbox simulations and read-only AI previews',()=>{
  for(const token of ['Campaign and player access','Invitation and player portal join','Character profile save','Player choices and DM override','AI DM and human narration control','Physical dice resolution','Checkpoint and day progression','Combat, damage, turns, and HP','Mission and household activity approval','Clues, maps, flames, plans, and rewards','Story ending, items, and spells','Session timer and recap','Live campaign protection'])assert.ok(testLab.includes(token),`missing test scenario ${token}`);
  for(const token of ['runFeatureTestSuite','testStoryForecast','testSceneArt','narrationAudio','checkOpenAI','NOT CANON'])assert.ok(testLabPage.includes(token),`missing Test Lab control ${token}`);
  assert.ok(dmPage.includes('href="/test-lab"'));
});

test('story and scene-art previews are DM-only and do not persist campaign changes',()=>{
  const storyStart=api.indexOf("if(body.action==='testStoryForecast')");
  const artStart=api.indexOf("if(body.action==='testSceneArt')");
  const sceneEnd=api.indexOf("if(body.action==='generateSceneArt')",artStart);
  assert.ok(storyStart>=0&&artStart>storyStart&&sceneEnd>artStart);
  const previewHandlers=api.slice(storyStart,sceneEnd);
  assert.match(previewHandlers,/if\(!dm\)return deny\(\)/);
  assert.doesNotMatch(previewHandlers,/saveState\(|addLog\(/);
  assert.match(previewHandlers,/SIMULATION ONLY — NOT CANON/);
});

test('DM flow previews are read-only and connect current choices, roll, and combat state to narration',async()=>{
  const api=await readFile(new URL('../app/api/game/route.ts',import.meta.url),'utf8');
  const flow=await readFile(new URL('../lib/dm-flow.ts',import.meta.url),'utf8');
  assert.match(api,/Current party choices and actions:/);
  assert.match(api,/Latest authoritative roll:/);
  assert.match(api,/Combat tracker: \$\{battleState\}/);
  assert.match(flow,/getCurrentCheckpointCheck/);
});

test('checkpoint skips require confirmation and preserve unresolved choices',async()=>{
  const api=await readFile(new URL('../app/api/game/route.ts',import.meta.url),'utf8');
  const page=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');
  assert.match(api,/if\(!body\.skip\)return bad\('Confirm that you want to skip this checkpoint\.'/);
  assert.match(api,/canSkipCheckpoint\(s\)/);
  assert.match(page,/Skip this checkpoint without resolving party choices\?/);
  assert.match(api,/DM skipped story checkpoint/);
});

test('AI narration provenance keeps AI mode active and human edits switch to human mode',async()=>{
  const api=await readFile(new URL('../app/api/game/route.ts',import.meta.url),'utf8');
  const page=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');
  assert.match(api,/const fromAi=body\.narrationSource==='ai';s\.dmMode=fromAi\?'ai':'human'/);
  assert.match(api,/DM used the AI narration and advanced the checkpoint/);
  assert.match(page,/setNarrationSource\('ai'\)/);
  assert.match(page,/setNarrationSource\('human'\)/);
});

test('DM checkpoint and ledger show the current story and separate earlier session events',async()=>{
  const page=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');
  assert.match(page,/Current story checkpoint/);
  assert.doesNotMatch(page,/Most heroes asked for the Keeper; Violet chose the clock/);
  assert.match(page,/Earlier campaign events/);
  assert.match(page,/getCurrentCheckpointChoices/);
});

test('defeated enemies clear when advancing from battle aftermath',async()=>{
  const api=await readFile(new URL('../app/api/game/route.ts',import.meta.url),'utf8');
  assert.match(api,/if\(s\.combatPhase==='aftermath'\)\{s\.enemies=\[\];s\.combat=false;s\.combatPhase='inactive'/);
});
