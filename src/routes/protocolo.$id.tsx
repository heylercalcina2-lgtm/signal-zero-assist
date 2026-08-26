import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Repeat, Volume2, VolumeX } from "lucide-react";
import protocols from "@/data/protocols.json";
import { useLang } from "@/lib/i18n";
import { AppFooter } from "@/components/AppFooter";
import { useSpeech } from "@/lib/speech";
import { useSession } from "@/lib/engine";
import { useWakeLock } from "@/lib/wakeLock";
import { illustrations } from "@/components/illustrations";

type Paso = { id: number; texto: string; textEn: string; segundosTimer: number; ilustracion?: string };
type Protocolo = {
  id: string;
  titulo: string;
  titleEn: string;
  fuente: string;
  pasos: Paso[];
};

export const Route = createFileRoute("/protocolo/$id")({
  head: ({ params }) => {
    const p = (protocols as Protocolo[]).find((x) => x.id === params.id);
    const title = p ? `${p.titulo} — Protocolo paso a paso | SEÑAL CERO` : "Protocolo | SEÑAL CERO";
    const description = p
      ? `Guía offline paso a paso para ${p.titulo.toLowerCase()}, en español e inglés.`
      : "Protocolo de primeros auxilios offline.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProtocolPage,
});

function ProtocolPage() {
  const { id } = Route.useParams();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [autoRead, setAutoRead] = useState(false);
  const { speak, supported: speechSupported } = useSpeech(lang);
  const session = useSession();

  const protocolo = (protocols as Protocolo[]).find((p) => p.id === id);
  const pasos = protocolo?.pasos ?? [];
  const paso = pasos[index];
  const texto = paso ? (lang === "es" ? paso.texto : paso.textEn) : "";
  const Illustration = paso?.ilustracion ? illustrations[paso.ilustracion] : undefined;

  useWakeLock(!!protocolo);

  useEffect(() => {
    if (!protocolo) return;
    session.startProtocol(protocolo.id, protocolo.titulo, protocolo.titleEn, protocolo.pasos.length);
    setIndex(0);
    // Solo al entrar a un protocolo nuevo — avanzar pasos no debe reiniciar la sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!protocolo || !autoRead) return;
    speak(texto);
    // Se lee de nuevo solo cuando cambia el paso o se activa auto-lectura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, autoRead, protocolo]);

  if (!protocolo || !paso) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
        <p className="text-center text-xl">{t.notFound}</p>
        <Link
          to="/"
          className="flex min-h-[72px] w-full max-w-sm items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground"
        >
          {t.back}
        </Link>
      </main>
    );
  }

  const isLast = index === pasos.length - 1;

  const next = () => {
    if (isLast) {
      session.setStepsCompleted(pasos.length);
      session.finishProtocol();
      navigate({ to: "/" });
    } else {
      const nextIndex = index + 1;
      session.setStepsCompleted(nextIndex);
      setIndex(nextIndex);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pb-28 pt-6">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border border-border bg-card"
          aria-label={t.back}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="min-w-0 flex-1 px-2 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {lang === "es" ? protocolo.titulo : protocolo.titleEn}
        </span>
        <div className="w-[72px] shrink-0" />
      </div>

      <div className="mt-6 flex gap-1.5">
        {pasos.map((p, i) => (
          <span
            key={p.id}
            className={`h-1.5 flex-1 rounded-full ${i <= index ? "bg-primary" : "bg-secondary"}`}
          />
        ))}
      </div>

      <p className="mt-4 text-sm font-semibold text-primary">
        {t.stepOf(index + 1, pasos.length)}
      </p>

      <div className="flex flex-1 items-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={paso.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="w-full min-w-0 py-8"
          >
            {Illustration && (
              <div className="mx-auto mb-4 h-[180px] w-[180px] max-h-[200px]">
                <Illustration />
              </div>
            )}
            <p className="break-words text-3xl font-semibold leading-snug">{texto}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-auto space-y-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setAutoRead((v) => !v)}
            aria-pressed={autoRead}
            aria-label={t.autoReadHint}
            className={`flex min-h-[72px] w-[88px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border text-xs font-semibold transition-colors ${
              autoRead
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground active:bg-secondary"
            }`}
          >
            <Repeat className="h-5 w-5" />
            {t.autoRead}
          </button>
          <button
            type="button"
            onClick={() => speak(texto)}
            disabled={!speechSupported}
            title={speechSupported ? undefined : t.voiceUnavailable}
            className="flex min-h-[72px] flex-1 items-center justify-center gap-3 rounded-2xl border border-border bg-card text-lg font-semibold active:bg-secondary disabled:opacity-40"
          >
            {speechSupported ? (
              <Volume2 className="h-6 w-6 text-primary" />
            ) : (
              <VolumeX className="h-6 w-6 text-muted-foreground" />
            )}
            {t.read}
          </button>
        </div>
        <button
          type="button"
          onClick={next}
          className="flex min-h-[80px] w-full items-center justify-center gap-3 rounded-2xl bg-confirm text-xl font-bold text-confirm-foreground active:opacity-90"
        >
          <Check className="h-7 w-7" />
          {isLast ? t.finish : t.nextStep}
        </button>
        <p className="pb-10 text-center text-xs text-muted-foreground">
          {t.source}: {protocolo.fuente}
        </p>
      </div>

      <AppFooter />
    </main>
  );
}
