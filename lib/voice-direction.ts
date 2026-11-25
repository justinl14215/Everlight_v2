import type { Speaker } from './story-voices';

const performance: Record<Speaker, string> = {
  narrator: 'Tell the story warmly to a family gathered close. Use relaxed, conversational phrasing, with a brief beat after a discovery. Let mystery come from curiosity rather than a theatrical whisper.',
  dawnshield: 'Sound like a steady guardian reassuring his team. Use a relaxed, grounded delivery. Be decisive about danger and gentle when speaking to Pip or a child.',
  astra: 'Sound warm and observant, as if sharing something you just noticed. Ease into discoveries and give the important detail a little space.',
  violet: 'Sound quietly curious and lightly playful. Let questions rise naturally. Keep the voice clear and close, without whispering or exaggerating the vampire character.',
  taylor: 'Sound bright and sincerely curious. Keep the words clear, with room after each short thought or question. Avoid a forced high pitch or a baby voice.',
  pip: 'Sound like a friendly messenger talking from a half-open door. Start a little tentative when greeting strangers, then relax as they welcome you. Give a small, natural pause before an important clue. Avoid cartoon squeaks, owl noises, and exaggerated excitement.',
  keeper: 'Sound kind and practical, like someone asking trusted neighbors for help. Let concern come through quietly and leave room for an answer.',
  maribel: 'Sound composed, with a small hesitation when admitting a mistake. Speak plainly and let sincerity come through without melodrama.',
  orin: 'Sound thoughtful and restrained. Take a small breath before a vulnerable question. Let the warmth return gradually without a booming villain voice.',
};

export function speechInstructions(speaker: Speaker): string {
  return [
    'Read the supplied words as written, without adding greetings, commentary, or sound effects.',
    'Address a person, with natural contractions, conversational emphasis, and clear, relaxed articulation.',
    'Vary cadence with meaning. Keep pauses brief and avoid an announcer cadence, exaggerated emotion, or long silence at either end.',
    performance[speaker],
  ].join(' ');
}
