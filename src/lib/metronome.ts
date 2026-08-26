// Metrónomo de RCP a 110 bpm.
//
// setInterval por sí solo deriva: el timer de JS no es preciso y acumula
// error. En vez de usarlo para marcar el ritmo, usamos el patrón estándar de
// "scheduling por lookahead" (la técnica de Chris Wilson, "A Tale of Two
// Clocks"): un setInterval de baja precisión SOLO decide cuándo mirar el
// reloj, pero el instante real de cada click se calcula y programa contra
// audioContext.currentTime, que es de precisión de muestra de audio y nunca
// deriva. Cada click se agenda con antelación (SCHEDULE_AHEAD_TIME) contra
// ese reloj real, así que aunque el setInterval llegue tarde, el audio sigue
// sonando exactamente a tiempo.
import { useEffect, useRef, useState } from "react";

export const BPM = 110;
const SECONDS_PER_BEAT = 60 / BPM;
const SCHEDULE_AHEAD_TIME = 0.1; // segundos de anticipación al programar clicks
const LOOKAHEAD_MS = 25; // frecuencia del "vigilante" setInterval

type AudioContextCtor = typeof AudioContext;

export function useMetronome(running: boolean) {
  const [count, setCount] = useState(0);
  // Se incrementa exactamente en cada beat programado; úsalo como `key` en
  // una animación para que el pulso visual quede perfectamente sincronizado
  // con el click de audio, en vez de depender de una animación CSS de
  // duración fija que puede desincronizarse con el tiempo.
  const [beatPulse, setBeatPulse] = useState(0);

  const countRef = useRef(0);
  const nextNoteTimeRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    if (!running) return;

    const Ctor: AudioContextCtor | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    audioCtxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    nextNoteTimeRef.current = ctx.currentTime + 0.05;

    const scheduleClick = (time: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(1000, time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.5, time + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.07);
    };

    const scheduler = () => {
      while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_TIME) {
        const beatTime = nextNoteTimeRef.current;
        scheduleClick(beatTime);

        const delayMs = Math.max(0, (beatTime - ctx.currentTime) * 1000);
        const timeoutId = window.setTimeout(() => {
          countRef.current += 1;
          setCount(countRef.current);
          setBeatPulse((p) => p + 1);
          if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(30);
        }, delayMs);
        timeoutsRef.current.push(timeoutId);

        nextNoteTimeRef.current += SECONDS_PER_BEAT;
      }
    };

    scheduler();
    intervalRef.current = window.setInterval(scheduler, LOOKAHEAD_MS);

    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = [];
      ctx.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, [running]);

  return { count, beatPulse, secondsPerBeat: SECONDS_PER_BEAT };
}
