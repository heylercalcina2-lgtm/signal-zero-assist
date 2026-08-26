// Linterna (torch de la cámara trasera) y silbato (tono de emergencia).
import { useEffect, useRef, useState } from "react";

type TorchCapableTrack = MediaStreamTrack & {
  getCapabilities?: () => MediaTrackCapabilities & { torch?: boolean };
};

export function useTorch() {
  // Optimista al montar: no hay forma de saber si el dispositivo tiene flash
  // sin pedir permiso de cámara primero. Si falla o no hay capacidad "torch",
  // pasamos a false y el botón se oculta en vez de quedar roto.
  const [supported, setSupported] = useState(true);
  const [on, setOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<TorchCapableTrack | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
    }
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggle = async () => {
    if (!supported) return;
    if (on) {
      try {
        await trackRef.current?.applyConstraints({ advanced: [{ torch: false } as MediaTrackConstraintSet] });
      } catch {
        /* se apaga igual al detener el stream */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      trackRef.current = null;
      setOn(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      const track = stream.getVideoTracks()[0] as TorchCapableTrack | undefined;
      const capabilities = track?.getCapabilities?.();
      if (!track || !capabilities || !("torch" in capabilities)) {
        stream.getTracks().forEach((t) => t.stop());
        setSupported(false);
        return;
      }
      await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] });
      streamRef.current = stream;
      trackRef.current = track;
      setOn(true);
    } catch {
      setSupported(false);
      setOn(false);
    }
  };

  return { supported, on, toggle };
}

export function useWhistle() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  const playBeep = (ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(3000, ctx.currentTime);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.setValueAtTime(0.5, ctx.currentTime + 0.28);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

  const stop = () => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setOn(false);
  };

  const toggle = () => {
    if (on) {
      stop();
      return;
    }
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    playBeep(ctx);
    intervalRef.current = window.setInterval(() => playBeep(ctx), 500);
    setOn(true);
  };

  useEffect(() => stop, []);

  return { on, toggle };
}
