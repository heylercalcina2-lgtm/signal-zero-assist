import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Download, Trash2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { AppFooter } from "@/components/AppFooter";
import { useAiDownload, AI_TOTAL_MB } from "@/lib/aiDownload";
import { useOnlineStatus } from "@/lib/connectivity";

export const Route = createFileRoute("/ajustes")({
  head: () => ({
    meta: [{ title: "Ajustes | SEÑAL CERO" }, { name: "description", content: "Preferencias y descargas opcionales." }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useLang();
  const { cached, downloading, percent, failed, start, remove } = useAiDownload();
  const online = useOnlineStatus();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pb-28 pt-6">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-border bg-card"
          aria-label={t.back}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t.settings}</span>
        <div className="w-[72px]" />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">{t.settingsHint}</p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-primary">{t.aiSectionTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.aiSectionHint}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t.aiRobustnessNote}</p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-base font-semibold">{t.aiStatusLabel}</span>
          {cached === null ? (
            <span className="text-sm text-muted-foreground">…</span>
          ) : cached ? (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-confirm">
              <Check className="h-4 w-4" />
              {t.aiDownloaded}
            </span>
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">{t.aiPending}</span>
          )}
        </div>

        {downloading && (
          <div className="mt-4">
            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-150"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {t.aiDownloading} {percent}%
            </p>
          </div>
        )}

        {failed && <p className="mt-3 text-sm text-destructive">{t.aiDownloadFailed}</p>}

        {!online && cached !== true && <p className="mt-3 text-xs text-muted-foreground">{t.aiRequiresOnline}</p>}

        <div className="mt-4 flex gap-3">
          {cached !== true ? (
            <button
              type="button"
              onClick={start}
              disabled={downloading || !online}
              className="flex min-h-[72px] flex-1 items-center justify-center gap-3 rounded-2xl bg-primary text-base font-bold text-primary-foreground disabled:opacity-50 active:opacity-90"
            >
              <Download className="h-5 w-5" />
              {failed ? t.aiRetry : t.aiDownloadButton(AI_TOTAL_MB)}
            </button>
          ) : (
            <button
              type="button"
              onClick={remove}
              className="flex min-h-[72px] flex-1 items-center justify-center gap-3 rounded-2xl border border-border bg-card text-base font-semibold text-foreground active:bg-secondary"
            >
              <Trash2 className="h-5 w-5" />
              {t.aiDelete}
            </button>
          )}
        </div>
      </div>

      <AppFooter />
    </main>
  );
}
