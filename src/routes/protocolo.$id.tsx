import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ArrowLeft, Check, Volume2 } from "lucide-react";
import protocols from "@/data/protocols.json";
import { useLang } from "@/lib/i18n";
import { AppFooter } from "@/components/AppFooter";

type Paso = { id: number; texto: string; textEn: string; segundosTimer: number };
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

  const protocolo = (protocols as Protocolo[]).find((p) => p.id === id);

  if (!protocolo) {
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

  const pasos = protocolo.pasos;
  const paso = pasos[index]!;
  const texto = lang === "es" ? paso.texto : paso.textEn;
  const isLast = index === pasos.length - 1;

  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = lang === "es" ? "es-ES" : "en-US";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  };

  const next = () => {
    if (isLast) navigate({ to: "/" });
    else setIndex((i) => i + 1);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pb-28 pt-6">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card"
          aria-label={t.back}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {lang === "es" ? protocolo.titulo : protocolo.titleEn}
        </span>
        <div className="w-12" />
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
          <motion.p
            key={paso.id}
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -48 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="py-8 text-3xl font-semibold leading-snug"
          >
            {texto}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-auto space-y-3">
        <button
          type="button"
          onClick={speak}
          className="flex min-h-[72px] w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card text-lg font-semibold active:bg-secondary"
        >
          <Volume2 className="h-6 w-6 text-primary" />
          {t.read}
        </button>
        <button
          type="button"
          onClick={next}
          className="flex min-h-[80px] w-full items-center justify-center gap-3 rounded-2xl bg-confirm text-xl font-bold text-confirm-foreground active:opacity-90"
        >
          <Check className="h-7 w-7" />
          {isLast ? t.finish : t.nextStep}
        </button>
        <p className="pb-2 text-center text-xs text-muted-foreground">
          {t.source}: {protocolo.fuente}
        </p>
      </div>

      <AppFooter />
    </main>
  );
}
