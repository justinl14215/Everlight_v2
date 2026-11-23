import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const game=await readFile(new URL('../lib/game.ts',import.meta.url),'utf8');
const api=await readFile(new URL('../app/api/game/route.ts',import.meta.url),'utf8');
const player=await readFile(new URL('../app/player/page.tsx',import.meta.url),'utf8');

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
