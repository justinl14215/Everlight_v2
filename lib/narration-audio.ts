const SAMPLE_RATE = 24_000;
const BYTES_PER_SAMPLE = 2;
const PAUSE_BYTES = Math.round(SAMPLE_RATE * 0.12) * BYTES_PER_SAMPLE;

export function assembleNarration(clips: ArrayBuffer[]): Blob {
  if (!clips.length || clips.some(clip => !clip.byteLength || clip.byteLength % BYTES_PER_SAMPLE)) {
    throw new Error('The narrator returned incomplete audio.');
  }

  const dataSize = clips.reduce((size, clip) => size + clip.byteLength, 0)
    + PAUSE_BYTES * (clips.length - 1);
  // OpenAI supplies 24 kHz, mono, signed 16-bit little-endian PCM.
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  view.setUint32(0, 0x52494646); // RIFF
  view.setUint32(4, dataSize + 36, true);
  view.setUint32(8, 0x57415645); // WAVE
  view.setUint32(12, 0x666d7420); // fmt
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * BYTES_PER_SAMPLE, true);
  view.setUint16(32, BYTES_PER_SAMPLE, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461); // data
  view.setUint32(40, dataSize, true);

  const parts: ArrayBuffer[] = [header, clips[0]];
  const pause = new ArrayBuffer(PAUSE_BYTES);
  for (const clip of clips.slice(1)) parts.push(pause, clip);
  return new Blob(parts, { type: 'audio/wav' });
}
