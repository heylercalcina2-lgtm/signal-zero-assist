import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Activity,
  Bell,
  Compass,
  Download,
  Droplet,
  Flame,
  Flashlight,
  Languages,
  Move,
  Settings,
  Sparkles,
  Users,
  Wind,
  Zap,
  ClipboardList,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { AppFooter } from "@/components/AppFooter";
import { useInstallPrompt } from "@/lib/pwa";
import { useOnlineStatus } from "@/lib/connectivity";
import { useTorch, useWhistle } from "@/lib/tools";
import { ProtocolSearch } from "@/components/ProtocolSearch";
import { AiWelcomeModal } from "@/components/AiWelcomeModal";
import { useAiModelStatus } from "@/lib/aiDownload";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SEÑAL CERO — Asistente de emergencias sin internet" },
      {
        name: "description",
        content:
          "Guías de primeros auxilios paso a paso que funcionan sin señal: hemorragia, atragantamiento, RCP y más.",
      },
      { property: "og:title", content: "SEÑAL CERO — Asistente de emergencias sin internet" },
      {
        property: "og:description",
        content: "Protocolos de primeros auxilios offline, en español e inglés.",
      },
    ],
  }),
  component: Home,
});

const CARDS = [
  { key: "hemorragia", icon: Droplet, to: "hemorragia" },
  { key: "atragantamiento", icon: Wind, to: "atragantamiento" },
  { key: "rcp", icon: Activity, to: "rcp" },
  { key: "atrapada", icon: Users, to: "atrapada" },
  { key: "quemadura", icon: Flame, to: "quemadura" },
  { key: "convulsion", icon: Zap, to: "convulsion" },
  { key: "recuperacion", icon: Move, to: "recuperacion" },
] as const;

function Home() {
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();
  const torch = useTorch();
  const whistle = useWhistle();
  const online = useOnlineStatus();
  const { canInstall, promptInstall } = useInstallPrompt();
  const { cached: aiCached } = useAiModelStatus();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pb-32 pt-6">
      <AiWelcomeModal />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div
          className={`flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-sm font-semibold tracking-wide ${online ? "text-muted-foreground" : "text-confirm"}`}
        >
          <span className="relative flex h-2.5 w-2.5">
            {!online && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-confirm opacity-60" />
            )}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${online ? "bg-muted-foreground" : "bg-confirm"}`} />
          </span>
          {online ? t.statusBadgeOnline : t.statusBadge}
        </div>
        {aiCached === true && (
          <div className="flex items-center gap-1.5 rounded-2xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t.aiActiveBadge}
          </div>
        )}
        {canInstall && (
          <button
            type="button"
            onClick={promptInstall}
            className="flex items-center gap-2 rounded-2xl border border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
          >
            <Download className="h-4 w-4" />
            {t.install}
          </button>
        )}
      </div>

      <h1 className="mt-5 text-center text-2xl font-bold tracking-[0.2em]">{t.appName}</h1>

      <ProtocolSearch />

      <Link
        to="/triaje"
        className="mt-3 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 text-sm font-semibold text-muted-foreground active:bg-secondary"
      >
        <Compass className="h-4 w-4" />
        {t.triageCta}
      </Link>

      <div className="flex justify-center py-8">
        <motion.button
          type="button"
          onClick={() => navigate({ to: "/rcp" })}
          className="relative flex h-52 w-52 items-center justify-center rounded-full text-primary-foreground"
          style={{ background: "var(--gradient-sos)", boxShadow: "var(--shadow-sos)" }}
          whileTap={{ scale: 0.96 }}
        >
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-primary"
            animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="flex flex-col items-center">
            <span className="text-4xl font-black tracking-widest">{t.sos}</span>
            <span className="mt-1 text-xs font-semibold opacity-80">{t.cprMode}</span>
          </span>
        </motion.button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CARDS.map(({ key, icon: Icon, to }, i) => {
          const label = t.cards[key as keyof typeof t.cards];
          const content = (
            <>
              <Icon className="h-7 w-7 text-primary" />
              <span className="text-base font-semibold leading-tight">{label}</span>
            </>
          );
          // An odd card count leaves the last one alone in its row — span
          // both columns instead of leaving a lopsided half-empty row.
          const isLast = i === CARDS.length - 1;
          const cls = `flex min-h-[96px] flex-col items-start justify-between rounded-2xl border border-border bg-card p-4 text-left transition-colors active:bg-secondary ${isLast ? "col-span-2" : ""}`;
          return to ? (
            <Link key={key} to="/protocolo/$id" params={{ id: to }} className={cls}>
              {content}
            </Link>
          ) : (
            <div key={key} className={`${cls} opacity-50`}>
              {content}
            </div>
          );
        })}
      </div>

      <Link
        to="/informe"
        className="mt-3 flex min-h-[72px] items-center justify-center gap-3 rounded-2xl border border-border bg-card text-base font-semibold active:bg-secondary"
      >
        <ClipboardList className="h-6 w-6 text-primary" />
        {t.report}
      </Link>

      <div className={`mt-6 grid gap-3 ${torch.supported ? "grid-cols-4" : "grid-cols-3"}`}>
        {torch.supported && (
          <ActionButton
            active={torch.on}
            onClick={torch.toggle}
            icon={<Flashlight className="h-6 w-6" />}
            label={t.flashlight}
          />
        )}
        <ActionButton
          active={whistle.on}
          onClick={whistle.toggle}
          icon={<Bell className="h-6 w-6" />}
          label={t.whistle}
        />
        <ActionButton
          active={false}
          onClick={() => setLang(lang === "es" ? "en" : "es")}
          icon={<Languages className="h-6 w-6" />}
          label={`${t.language} · ${lang.toUpperCase()}`}
        />
        <ActionButton
          active={false}
          onClick={() => navigate({ to: "/ajustes" })}
          icon={<Settings className="h-6 w-6" />}
          label={t.settings}
        />
      </div>

      <AppFooter />
    </main>
  );
}

function ActionButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-2xl border px-2 text-xs font-semibold transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground active:bg-secondary"
      }`}
    >
      {icon}
      <span className="text-center leading-tight">{label}</span>
    </button>
  );
}
