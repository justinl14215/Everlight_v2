export function speakNarration(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const speech = window.speechSynthesis;
  speech.cancel();

  const voices = speech.getVoices();
  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en-us"));
  const voice =
    englishVoices.find((item) => /natural|neural/i.test(item.name)) ??
    englishVoices.find((item) => /aria|jenny|ava|samantha/i.test(item.name)) ??
    englishVoices.find((item) => /google us english|microsoft/i.test(item.name)) ??
    englishVoices[0] ??
    voices.find((item) => item.lang.toLowerCase().startsWith("en-"));

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  if (voice) utterance.voice = voice;
  utterance.rate = 0.92;
  utterance.pitch = 1.02;
  utterance.volume = 1;

  speech.speak(utterance);
}
