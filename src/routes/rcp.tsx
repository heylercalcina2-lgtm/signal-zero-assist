import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect } from "react";
import { Square } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { AppFooter } from "@/components/AppFooter";
import { useMetronome } from "@/lib/metronome";
import { useSession } from "@/lib/engine";
import { useWakeLock } from "@/lib/wakeLock";

export const Route = createFileRoute("/rcp")({
  head: () => ({
    meta: [
      { title: "Modo RCP — Metrónomo 110 bpm | SEÑAL CERO" },
      {
        name: "description",
        content: "Guía visual de compresiones a 110 por minuto con contador, funciona sin internet.",
      },
      { property: "og:title", content: "Modo RCP — Metrónomo 110 bpm | SEÑAL CERO" },
      {
        property: "og:description",
        content: "Ritmo de compresiones a 110 bpm con contador offline.",
      },
    ],
  }),
  component: CprMode,
});

function CprMode() {
  const { t } = useLang();
  const navigate = useNavigate();
  const session = useSession();
  const { count, beatPulse, secondsPerBeat } = useMetronome(true);

  useWakeLock(true);

  useEffect(() => {
    session.startCpr();
    // Solo al entrar al Modo RCP.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    session.setCompressions(count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const stop = () => {
    session.stopCpr();
    navigate({ to: "/" });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center px-5 pb-28 pt-8">
      <span className="rounded-2xl border border-border bg-card px-4 py-2 text-sm font-semibold tracking-widest text-primary">
        {t.cprMode} · {t.bpm}
      </span>

      <div className="flex flex-1 items-center justify-center">
        <div className="relative flex h-64 w-64 items-center justify-center">
          {/* key={beatPulse}: cada compresión relanza esta animación desde cero,
              así que el pulso visual queda exactamente sincronizado con el
              click de audio programado en useMetronome (en vez de depender de
              una animación de duración fija que puede desalinearse). */}
          <motion.span
            key={`ring-${beatPulse}`}
            className="absolute inset-0 rounded-full border-[6px] border-primary"
            initial={{ scale: 1, opacity: 0.9 }}
            animate={{ scale: 1.12, opacity: 0 }}
            transition={{ duration: secondsPerBeat * 0.95, ease: "easeOut" }}
          />
          <motion.span
            key={`fill-${beatPulse}`}
            className="absolute inset-6 rounded-full bg-primary/15"
            initial={{ scale: 1 }}
            animate={{ scale: 0.88 }}
            transition={{ duration: secondsPerBeat * 0.5, ease: "easeOut", repeat: 1, repeatType: "reverse" }}
          />
          <div className="relative text-center">
            <p className="text-6xl font-black tabular-nums">{count}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">{t.compressions}</p>
          </div>
        </div>
      </div>

      <div className="mt-auto w-full space-y-3">
        <button
          type="button"
          onClick={stop}
          className="flex min-h-[80px] w-full items-center justify-center gap-3 rounded-2xl bg-primary text-xl font-bold text-primary-foreground active:opacity-90"
        >
          <Square className="h-6 w-6" />
          {t.stop}
        </button>
      </div>

      <AppFooter />
    </main>
  );
}
