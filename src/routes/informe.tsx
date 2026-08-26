import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowLeft, Check, Share2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { AppFooter } from "@/components/AppFooter";
import { useSession } from "@/lib/engine";

export const Route = createFileRoute("/informe")({
  head: () => ({
    meta: [
      { title: "Informe para el paramédico | SEÑAL CERO" },
      {
        name: "description",
        content:
          "Resumen de lo ocurrido y de la asistencia brindada, listo para compartir con el personal de emergencias.",
      },
      { property: "og:title", content: "Informe para el paramédico | SEÑAL CERO" },
      {
        property: "og:description",
        content: "Resumen offline de la asistencia brindada, listo para compartir.",
      },
    ],
  }),
  component: ReportPage,
});

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(startMs: number, endMs: number, minutesLabel: string) {
  const minutes = Math.max(0, Math.round((endMs - startMs) / 60000));
  return `${minutes} ${minutesLabel}`;
}

function ReportPage() {
  const { t, lang } = useLang();
  const { protocol, cpr } = useSession();
  const [shared, setShared] = useState(false);

  const hasData = !!protocol || !!cpr;
  const now = Date.now();

  const rows: [string, string][] = [];
  if (protocol) {
    rows.push([t.reportStart, formatTime(protocol.startedAt)]);
    rows.push([
      t.reportDuration,
      formatDuration(protocol.startedAt, protocol.finishedAt ?? now, t.minutesShort),
    ]);
    rows.push([
      t.reportProtocol,
      lang === "es" ? protocol.titulo : protocol.titleEn,
    ]);
    rows.push([t.reportSteps, t.stepOf(protocol.stepsCompleted, protocol.totalSteps)]);
  }
  if (cpr) {
    rows.push([
      t.reportCpr,
      `${cpr.compressions} ${t.compressions} · ${t.bpm}`,
    ]);
  }

  const plainText = [
    `${t.appName} — ${t.report}`,
    "",
    ...(hasData ? rows.map(([k, v]) => `${k}: ${v}`) : [t.reportNone]),
  ].join("\n");

  const share = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: `${t.appName} — ${t.report}`, text: plainText });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(plainText);
      }
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      /* cancelado por la persona usuaria */
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
        <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {t.report}
        </span>
        <div className="w-[72px] shrink-0" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mt-6 space-y-3"
      >
        {hasData ? (
          <Section title={t.reportSummary} rows={rows} />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-base font-semibold">{t.reportNone}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t.reportNoneHint}</p>
          </div>
        )}
      </motion.div>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={share}
          className={`flex min-h-[80px] w-full items-center justify-center gap-3 rounded-2xl text-xl font-bold transition-colors ${
            shared
              ? "bg-confirm text-confirm-foreground"
              : "bg-primary text-primary-foreground active:opacity-90"
          }`}
        >
          {shared ? <Check className="h-7 w-7" /> : <Share2 className="h-6 w-6" />}
          {shared ? t.reportShared : t.reportShare}
        </button>
        <p className="pb-2 text-center text-xs text-muted-foreground">{t.reportHint}</p>
      </div>

      <AppFooter />
    </main>
  );
}

function Section({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-primary">{title}</h2>
      <dl className="mt-3 space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className="text-right text-base font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
