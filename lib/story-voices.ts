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
  narratorLine('The small doorway sits quiet beneath its lantern. A breeze stirs the leaves along the path, and for a moment even the distant sounds of the village seem to fade. Dawnshield calls through the door.'),
  { speaker: 'dawnshield', text: 'Who is there?' },
  narratorLine('A soft shuffle answers. A small owl courier peeks around the edge, feathers ruffled from the journey, while the lantern paints a warm line across the threshold.'),
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
    [narratorLine('Late morning light rests on the rooftops of the Forgotten Village. Market sellers are folding their awnings, neighbors carry covered dishes toward the hall, and a single bell rings through the silver dust. The village clock has stopped at five minutes before feast-time; one lantern still burns beside the town hall door.'), {speaker:'keeper', text:'Can you help us find out why the clock stopped?'}],
    [narratorLine('Inside the town hall, the air smells of candle wax and old wood. The gears keep turning with a steady click, though the clock hands do not move. Beside the mechanism lie a torn ledger page and a red fleck of wax.') ],
    [narratorLine('A clean footprint crosses the dusty stones from the bell tower to a small door. Wind brushes the tower bell, making it tremble without ringing. From the other side of the door comes a quiet shuffle.') ],
    pipAtTheDoor,
    householdBridge,
  ],
  2: [
    [narratorLine('Twilight settles between the silver trees. The path bends and brings you back to the same trunk, while lanterns glow softly whenever two companions stand together. Somewhere in the brush, leaves rustle and an owl calls once.') ],
    [narratorLine('Three lanterns hang above the path, their light fluttering as Shadow Moths circle like scraps of moving night. Each lantern bears a sign: a lantern, a hand, and a hearth. The forest waits in a hush. How could you light them together?')],
    [narratorLine('The lit lanterns reveal a little door in the silver tree. Someone is waiting on the other side.')],
    pipAtTheDoor,
    forestSeal,
  ],
  3: [
    [narratorLine('Early evening lamps shimmer across the Hall of Winter Wonders. Attendants quietly prepare the room, but no music plays. Every ornament reflects a memory; one shows a smiling Keeper whose face has been scratched from the portrait.') ],
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
    [narratorLine('Friday morning light reaches the village crossroads. Shopkeepers lift their shutters as neighbors trade greetings; three townsfolk pause to recall kind things the heroes did. Beside them waits a small sealed chest.') ],
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
