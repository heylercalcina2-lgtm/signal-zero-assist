// Lectura en voz alta 100% offline: SpeechSynthesis solo con voces
// localService === true. Las voces "de red" (algunos navegadores exponen
// voces en la nube) requieren internet para sintetizar, así que se excluyen
// por completo — preferimos no hablar antes que fallar en modo avión.
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

function pickOfflineVoice(voices: SpeechSynthesisVoice[], lang: Lang): SpeechSynthesisVoice | null {
  const offline = voices.filter((v) => v.localService === true);
  if (offline.length === 0) return null;
  const prefix = lang === "es" ? "es" : "en";
  return offline.find((v) => v.lang.toLowerCase().startsWith(prefix)) ?? offline[0]!;
}

export function useSpeech(lang: Lang) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    // Chrome/Edge/Firefox cargan la lista de voces de forma asíncrona la
    // primera vez; sin este listener getVoices() puede devolver [] al montar.
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const voice = pickOfflineVoice(voices, lang);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !voice) return false;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    return true;
  };

  const stop = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  };

  return { speak, stop, supported: voice !== null };
}
