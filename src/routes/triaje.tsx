import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import triageTree from "@/data/triage.json";
import { useLang, type Lang } from "@/lib/i18n";
import { AppFooter } from "@/components/AppFooter";
import { useSpeech } from "@/lib/speech";

type TriageOption = { texto: string; textEn: string; siguiente: string };
type TriageQuestionNode = { pregunta: string; questionEn: string; opciones: TriageOption[] };
// A result node can carry optional follow-up questions (e.g. recovery
// position surfaces "¿Está atrapada?" / "¿Tuvo convulsión?" afterward)
// instead of gating the primary, always-correct action behind them.
type TriageResultNode = { resultado: string; urgente?: boolean; seguimiento?: TriageOption[] };
type TriageNode = TriageQuestionNode | TriageResultNode;
type TriageTree = { fuente: string; fuenteEn: string; inicio: string; nodos: Record<string, TriageNode> };

const tree = triageTree as TriageTree;

function isQuestion(node: TriageNode): node is TriageQuestionNode {
  return "opciones" in node;
}

export const Route = createFileRoute("/triaje")({
  head: () => ({
    meta: [
      { title: "Guía paso a paso | SEÑAL CERO" },
      {
        name: "description",
        content: "Responde preguntas simples de sí o no y te llevamos al protocolo correcto, sin internet.",
      },
    ],
  }),
  component: TriagePage,
});

function TriagePage() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { speak, supported: speechSupported } = useSpeech(lang);
  const [path, setPath] = useState<string[]>([tree.inicio]);

  const currentId = path[path.length - 1];
  const currentNode = currentId ? tree.nodos[currentId] : undefined;

  const goToProtocol = (protocolId: string) => {
    if (protocolId === "rcp") navigate({ to: "/rcp" });
    else navigate({ to: "/protocolo/$id", params: { id: protocolId } });
  };

  // A result node marked "urgente" (only RCP today) skips the confirmation
  // screen entirely and drops the user straight into the actionable
  // page — every second spent on an extra tap matters there.
  const select = (option: TriageOption) => {
    const nextNode = tree.nodos[option.siguiente];
    if (nextNode && !isQuestion(nextNode) && nextNode.urgente) {
      goToProtocol(nextNode.resultado);
      return;
    }
    setPath((p) => [...p, option.siguiente]);
  };

  const goBack = () => setPath((p) => (p.length > 1 ? p.slice(0, -1) : p));
  const restart = () => setPath([tree.inicio]);

  if (!currentNode) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
        <p className="text-center text-xl">{t.triageNotFound}</p>
        <Link
          to="/"
          className="flex min-h-[72px] w-full max-w-sm items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground"
        >
          {t.back}
        </Link>
      </main>
    );
  }

  const questionNumber = path.filter((id) => {
    const n = tree.nodos[id];
    return n && isQuestion(n);
  }).length;

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
        <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {isQuestion(currentNode) ? t.triageQuestionOf(questionNumber) : t.triageTitle}
        </span>
        <div className="w-[72px] shrink-0" />
      </div>

      {path.length > 1 && (
        <button
          type="button"
          onClick={goBack}
          className="mt-4 self-start text-sm font-semibold text-primary active:opacity-70"
        >
          ‹ {t.triageBack}
        </button>
      )}

      <AnimatePresence mode="wait">
        {isQuestion(currentNode) ? (
          <motion.div
            key={currentId}
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -48 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="flex flex-1 flex-col"
          >
            <div className="flex flex-1 items-center">
              <div className="w-full">
                <p className="py-4 text-3xl font-semibold leading-snug">
                  {lang === "es" ? currentNode.pregunta : currentNode.questionEn}
                </p>
                <button
                  type="button"
                  onClick={() => speak(lang === "es" ? currentNode.pregunta : currentNode.questionEn)}
                  disabled={!speechSupported}
                  aria-label={t.triageRead}
                  className="flex h-[56px] w-[56px] items-center justify-center rounded-2xl border border-border bg-card active:bg-secondary disabled:opacity-40"
                >
                  {speechSupported ? (
                    <Volume2 className="h-5 w-5 text-primary" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-auto space-y-3 pt-6">
              {currentNode.opciones.map((option) => (
                <button
                  key={option.siguiente + option.texto}
                  type="button"
                  onClick={() => select(option)}
                  className="flex min-h-[72px] w-full items-center justify-center rounded-2xl border border-border bg-card px-5 text-xl font-bold text-foreground active:bg-secondary"
                >
                  {lang === "es" ? option.texto : option.textEn}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={currentId}
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -48 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="flex flex-1 flex-col"
          >
            {currentNode.resultado === "no_determinado" ? (
              <ResultUnknown t={t} restart={restart} />
            ) : (
              <ResultProtocol
                t={t}
                lang={lang}
                protocolId={currentNode.resultado}
                seguimiento={currentNode.seguimiento}
                onGo={() => goToProtocol(currentNode.resultado)}
                onFollowUp={select}
                restart={restart}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="pb-2 pt-6 text-center text-xs text-muted-foreground">
        {t.source}: {lang === "es" ? tree.fuente : tree.fuenteEn}
      </p>

      <AppFooter />
    </main>
  );
}

type T = ReturnType<typeof useLang>["t"];

function ResultProtocol({
  t,
  lang,
  protocolId,
  seguimiento,
  onGo,
  onFollowUp,
  restart,
}: {
  t: T;
  lang: Lang;
  protocolId: string;
  seguimiento: TriageOption[] | undefined;
  onGo: () => void;
  onFollowUp: (option: TriageOption) => void;
  restart: () => void;
}) {
  const label = t.cards[protocolId as keyof typeof t.cards];
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-base font-semibold text-muted-foreground">{t.triageResultIntro}</p>
        <p className="text-3xl font-bold">{label}</p>
      </div>

      {seguimiento && seguimiento.length > 0 && (
        <div className="space-y-2 pb-2">
          <p className="text-center text-xs font-semibold text-muted-foreground">{t.triageFollowUpIntro}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {seguimiento.map((option) => (
              <button
                key={option.siguiente}
                type="button"
                onClick={() => onFollowUp(option)}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground active:bg-secondary"
              >
                {lang === "es" ? option.texto : option.textEn}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto space-y-3 pt-6">
        <button
          type="button"
          onClick={onGo}
          className="flex min-h-[80px] w-full items-center justify-center gap-3 rounded-2xl bg-confirm text-xl font-bold text-confirm-foreground active:opacity-90"
        >
          {t.triageGoToProtocol}
        </button>
        <button
          type="button"
          onClick={restart}
          className="w-full text-center text-sm font-semibold text-muted-foreground active:opacity-70"
        >
          {t.triageRestart}
        </button>
      </div>
    </>
  );
}

function ResultUnknown({ t, restart }: { t: T; restart: () => void }) {
  const ids = Object.keys(t.cards) as (keyof typeof t.cards)[];
  return (
    <>
      <div className="flex-1 py-4">
        <p className="text-2xl font-bold">{t.triageUnknownTitle}</p>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{t.triageUnknownBody}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {ids.map((id) => (
            <Link
              key={id}
              to="/protocolo/$id"
              params={{ id }}
              className="flex min-h-[72px] items-center justify-center rounded-2xl border border-border bg-card px-3 text-center text-base font-semibold active:bg-secondary"
            >
              {t.cards[id]}
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={restart}
          className="w-full text-center text-sm font-semibold text-muted-foreground active:opacity-70"
        >
          {t.triageRestart}
        </button>
      </div>
    </>
  );
}
