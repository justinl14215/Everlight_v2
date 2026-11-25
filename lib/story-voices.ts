import type { PlayerId } from './game';

export const voices = {
  narrator: 'fable',
  dawnshield: 'echo',
  astra: 'sage',
  violet: 'shimmer',
  taylor: 'nova',
  pip: 'coral',
  keeper: 'ash',
  maribel: 'ballad',
  orin: 'onyx',
} as const;

export type Speaker = keyof typeof voices;
export type StoryLine = { speaker: Speaker; text: string };

export const heroSpeakers = {
  justin: 'dawnshield',
  q: 'astra',
  harmony: 'violet',
  taylor: 'taylor',
} as const satisfies Record<PlayerId, Speaker>;

export const narratorLine = (text: string): StoryLine => ({ speaker: 'narrator', text });

export const pipAtTheDoor: StoryLine[] = [
  narratorLine('Dawnshield calls through the door.'),
  { speaker: 'dawnshield', text: 'Who is there?' },
  narratorLine('A small owl courier peeks around the edge.'),
  { speaker: 'pip', text: 'I’m Pip. The Keeper sent me with the first clue. What would you like to ask me?' },
];

export const householdBridge: StoryLine[] = [
  narratorLine('Pip holds the packet up to the lantern. A tiny picture of a hearth appears on the wax.'),
  { speaker: 'pip', text: 'Choose one small space your family shares. Help each other put it in order, or tell me about something you already did together. When you come back, tell me who helped and how.' },
];

export const forestSeal: StoryLine[] = [
  narratorLine('Pip turns the packet over so you can see the red star pressed into the wax.'),
  { speaker: 'pip', text: 'That seal belongs to Royal Steward Maribel Thorn. I saw her take records to the archive. She looked worried.' },
];

export const feastEntrance: StoryLine[] = [
  narratorLine('Everlight Castle appears beneath swirling autumn leaves and snow. A crowned shadow steps from the empty chair.'),
  { speaker: 'orin', text: 'You lit their halls, but will you remember the people?' },
];

const campaignScenes: Record<number, StoryLine[][]> = {
  1: [
    [narratorLine('In the Forgotten Village, the clock has stopped five minutes before feast-time. A lantern still burns at the door.'), {speaker:'keeper', text:'Can you help us find out why the clock stopped?'}],
    [narratorLine('The clock gears still turn behind the town hall. A torn ledger page and a red fleck of wax lie beside them.')],
    [narratorLine('A clean footprint leads from the bell tower to a small door. Someone shifts on the other side.')],
    pipAtTheDoor,
    householdBridge,
  ],
  2: [
    [narratorLine('The forest path loops back to the same silver tree. Lanterns glow when two people stand together.')],
    [narratorLine('Shadow Moths swirl around three lanterns marked with a lantern, a hand, and a hearth. How could you light them together?')],
    [narratorLine('The lit lanterns reveal a little door in the silver tree. Someone is waiting on the other side.')],
    pipAtTheDoor,
    forestSeal,
  ],
  3: [
    [narratorLine('Each ornament in the Hall of Winter Wonders reflects a memory. One shows a smiling Keeper whose face was scratched from the portraits.')],
    [narratorLine('Maribel waits beside a locked archive cabinet.'), {speaker:'maribel', text:'I know whose name was removed. Let me see what you found.'}],
    [narratorLine('Two ornaments mimic your movements. One has a crack along its edge.')],
    [narratorLine('A memory shimmers in the glass. The feast was about making room for everyone. A sealed invitation slips from the frame.'), {speaker:'orin', text:'Bring the truth, and leave a place at the table.'}],
  ],
  4: [
    feastEntrance,
    [narratorLine('The Hollow King removes his crown. Beneath it stands Orin Vale, the original Keeper of the Festival.'), {speaker:'orin', text:'Is there still a place for me at your table?'}],
    [narratorLine('The party can invite Orin to the feast, ask what would help repair the harm, or challenge the shadow. What will you choose?')],
    [narratorLine('The flame warms the hall. The family feast can begin whenever everyone is ready.'), {speaker:'orin', text:'Carry this welcome beyond the feast.'}],
  ],
  5: [
    [narratorLine('At the crossroads, three townsfolk recall kind things the heroes did. A sealed chest waits beside them.')],
    [narratorLine('A voice from the chest asks: What grows when shared and fades when hoarded?')],
    [narratorLine('The five flames shine together. Each hero gets to choose one act of kindness they will carry home.')],
  ],
};

const betweenDays = [narratorLine('Pause here while the DM prepares the next part of the adventure.')];

export function sharedStory(day: number, checkpoint: number): StoryLine[] {
  return campaignScenes[day]?.[checkpoint - 1] ?? betweenDays;
}

export function hasSharedStory(day: number, checkpoint: number): boolean {
  return Boolean(campaignScenes[day]?.[checkpoint - 1]);
}
