import { readFile, mkdir, rename, writeFile, stat } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { createClient } from '@supabase/supabase-js';
import { heroSpeakers, hasSharedStory, sharedStory } from '../lib/story-voices.ts';

for (const file of ['.env.local', '.env']) {
  try { process.loadEnvFile(file); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}

const { values } = parseArgs({ options: {
  watch: { type: 'boolean' }, remote: { type: 'boolean' }, 'dry-run': { type: 'boolean' },
  day: { type: 'string' }, checkpoint: { type: 'string' },
} });
const env = process.env;
const bucket = 'everlight-scene-art';
const characters = {
  justin: 'Dawnshield, the broad Black bearded half-giant guardian. Frame what he notices while keeping watch over his team.',
  q: 'Q’Astra, the Black Lightweaver in cream and gold. Frame what her ribbon of soft golden magic illuminates.',
  harmony: 'Violet, the young Black vampire heroine in the violet cloak. Frame the small details she notices while listening.',
  taylor: 'Taylor, the young Black Star Guardian with a star lantern. Use a low camera and make the scene clear and welcoming.',
};

if (Boolean(values.day) !== Boolean(values.checkpoint) || (values.watch && values.day)) {
  throw new Error('Use --watch, or give both --day and --checkpoint for a single scene.');
}
const db = values.remote && !(values['dry-run'] && values.day)
  ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false}})
  : null;

async function currentScene() {
  if (values.day) return {day:Number(values.day), checkpoint:Number(values.checkpoint)};
  if (!db) {
    return JSON.parse(await readFile('everlight.local.json','utf8').catch(error => {
      if (error.code === 'ENOENT') return '{"day":1,"checkpoint":1}';
      throw error;
    }));
  }
  const {data,error} = await db.from('everlight_campaign').select('state').eq('id','main').single();
  if (error) throw new Error(error.message);
  return data.state;
}

async function exists(key) {
  if (!db) return stat('.everlight-art/'+key).then(()=>true,error=>{
    if (error.code === 'ENOENT') return false;
    throw error;
  });
  const {data} = await db.storage.from(bucket).exists(key);
  return data;
}

async function save(key, image) {
  if (db) {
    const {error} = await db.storage.from(bucket).upload(key,image,{contentType:'image/webp',upsert:true});
    if (error) throw new Error(error.message);
    return;
  }
  await mkdir('.everlight-art',{recursive:true});
  const path='.everlight-art/'+key;
  const temporary=path+'.'+process.pid+'.tmp';
  await writeFile(temporary,image);
  await rename(temporary,path);
}

async function generate(hero, prompt) {
  const form = new FormData();
  form.set('model',env.OPENAI_IMAGE_MODEL || 'gpt-image-1.5');
  form.set('prompt',prompt);
  form.set('size','1536x1024');
  form.set('quality','medium');
  form.set('output_format','webp');
  form.set('image[]',new Blob([await readFile('assets/scene-art/'+hero+'.webp')],{type:'image/webp'}),hero+'.webp');
  const response=await fetch('https://api.openai.com/v1/images/edits',{
    method:'POST', headers:{Authorization:'Bearer '+env.OPENAI_API_KEY}, body:form,
    signal:AbortSignal.timeout(240_000),
  });
  const result=await response.json();
  if (!response.ok || !result.data?.[0]?.b64_json) {
    throw new Error(result.error?.message || 'Image generation failed ('+response.status+').');
  }
  return Buffer.from(result.data[0].b64_json,'base64');
}

let previousIdle;
async function run() {
  const {day,checkpoint}=await currentScene();
  if (!Number.isInteger(day) || !Number.isInteger(checkpoint) || day<1 || checkpoint<1) {
    throw new Error('Expected a positive integer day and checkpoint.');
  }
  const prefix='day-'+day+'-checkpoint-'+checkpoint;
  if (!hasSharedStory(day,checkpoint) || (day<=2 && checkpoint===4)) {
    if (previousIdle!==prefix) console.log(prefix+': no generation needed.');
    previousIdle=prefix;
    return;
  }
  const scene=sharedStory(day,checkpoint).map(line=>line.text).join(' ');
  for (const hero of Object.keys(characters)) {
    const key=prefix+'-'+hero+'.webp';
    const prompt='Create one landscape Everlight storybook illustration. Match the reference hero’s face, age, costume, and painterly style. The reference is for character design only. Illustrate this exact scene: '+scene+' Your featured hero: '+characters[hero]+' Family-friendly fantasy. Do not preview later events, add letters or captions, or carry over the reference scene unless the current scene calls for it.';
    if (values['dry-run']) {
      console.log(JSON.stringify({key,voice:heroSpeakers[hero],prompt}));
      continue;
    }
    if (await exists(key)) continue;
    await save(key,await generate(hero,prompt));
    console.log('Saved '+key);
  }
}

if (!values['dry-run'] && !env.OPENAI_API_KEY) throw new Error('Set the server-side OPENAI_API_KEY before generating.');
if (db && !values['dry-run']) {
  const {data,error}=await db.storage.getBucket(bucket);
  if (error || !data || data.public) throw new Error('Create the private '+bucket+' bucket before enabling remote generation.');
}
do {
  try { await run(); }
  catch (error) {
    if (!values.watch) throw error;
    console.error(error.message);
  }
  if (values.watch) await delay(30_000);
} while (values.watch);
