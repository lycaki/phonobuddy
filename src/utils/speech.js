// Web Speech API - en-GB voice for phonics
const PHONEME_PRONUNCIATION = {
  s:"sss", a:"ah", t:"t", p:"p", i:"ih", n:"nnn", m:"mmm", d:"d",
  g:"g", o:"oh", c:"k", k:"k", ck:"k", e:"eh", u:"uh", r:"rrr",
  h:"h", b:"b", f:"fff", ff:"fff", l:"lll", ll:"lll", ss:"sss"
};

export function speak(text, rate = 0.85) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate;
  u.lang = "en-GB";
  const voices = window.speechSynthesis.getVoices();
  const gbVoice = voices.find(v => v.lang.startsWith("en-GB"));
  if (gbVoice) u.voice = gbVoice;
  window.speechSynthesis.speak(u);
}

export function speakPhoneme(phonemeId, customAudioUrl = null) {
  if (customAudioUrl) {
    const audio = new Audio(customAudioUrl);
    audio.play().catch(() => {});
    return;
  }
  speak(PHONEME_PRONUNCIATION[phonemeId] || phonemeId, 0.6);
}
