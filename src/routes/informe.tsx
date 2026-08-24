import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowLeft, Check, Share2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { AppFooter } from "@/components/AppFooter";

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

const REPORT = {
  es: {
    meta: [
      ["Hora del incidente", "21:34"],
      ["Duración de la asistencia", "12 min"],
      ["Protocolo aplicado", "Hemorragia (6 pasos completados)"],
      ["Modo RCP", "84 compresiones · 110 bpm"],
    ],
    person: [
      ["Edad aproximada", "Adulto, ~40 años"],
      ["Estado de consciencia", "Consciente, responde a la voz"],
      ["Respiración", "Rápida pero regular"],
      ["Sangrado", "Controlado con presión directa"],
    ],
    notes:
      "Herida profunda en antebrazo izquierdo por vidrio. Se aplicó presión directa con paño limpio durante 10 minutos; el sangrado disminuyó. La persona permanece acostada y abrigada. Sin alergias conocidas informadas por acompañantes.",
  },
  en: {
    meta: [
      ["Incident time", "21:34"],
      ["Assistance duration", "12 min"],
      ["Protocol used", "Bleeding (6 steps completed)"],
      ["CPR mode", "84 compressions · 110 bpm"],
    ],
    person: [
      ["Approximate age", "Adult, ~40 years"],
      ["Consciousness", "Conscious, responds to voice"],
      ["Breathing", "Fast but regular"],
      ["Bleeding", "Controlled with direct pressure"],
    ],
    notes:
      "Deep laceration on left forearm caused by glass. Direct pressure applied with a clean cloth for 10 minutes; bleeding decreased. Person is lying down and kept warm. No known allergies reported by bystanders.",
  },
} as const;

function ReportPage() {
  const { t, lang } = useLang();
  const [shared, setShared] = useState(false);
  const data = REPORT[lang];

  const plainText = [
    `${t.appName} — ${t.report}`,
    "",
    ...data.meta.map(([k, v]) => `${k}: ${v}`),
    "",
    ...data.person.map(([k, v]) => `${k}: ${v}`),
    "",
    `${t.reportNotes}: ${data.notes}`,
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
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card"
          aria-label={t.back}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {t.report}
        </span>
        <div className="w-12" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mt-6 space-y-3"
      >
        <Section title={t.reportSummary} rows={data.meta} />
        <Section title={t.reportPerson} rows={data.person} />
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary">
            {t.reportNotes}
          </h2>
          <p className="mt-3 text-base leading-relaxed">{data.notes}</p>
        </div>
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

function Section({ title, rows }: { title: string; rows: readonly (readonly string[])[] }) {
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
