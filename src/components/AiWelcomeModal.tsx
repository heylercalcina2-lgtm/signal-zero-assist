import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAiDownload } from "@/lib/aiDownload";

const SEEN_KEY = "sc-ai-welcome-seen";

// Shown once, ever, on first launch — and only if the AI search isn't
// already downloaded (nothing to offer otherwise). Skippable at every step:
// closing it never blocks anything, and if "Activar" is tapped the download
// keeps running in the background (via the shared store in aiDownload.ts)
// even if this modal is dismissed mid-download.
export function AiWelcomeModal() {
  const { t } = useLang();
  const { cached, downloading, percent, failed, start } = useAiDownload();
  const [dismissed, setDismissed] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(SEEN_KEY)) setDismissed(true);
  }, []);

  // Once the flow has started, keep the modal up through the "finished"
  // confirmation screen even though `cached` flips to true the moment the
  // download completes — otherwise the guard below hides the modal in the
  // same tick the success state would render, and the user never sees
  // "Listo" or gets to dismiss it themselves.
  if (dismissed || (cached !== false && !started)) return null;

  const close = () => {
    localStorage.setItem(SEEN_KEY, "1");
    setDismissed(true);
  };

  const activate = () => {
    setStarted(true);
    start();
  };

  const finished = started && !downloading && !failed;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-6 pt-10 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-widest">{t.aiSectionTitle}</span>
        </div>

        {!started && (
          <>
            <p className="mt-3 text-base leading-relaxed text-foreground">{t.welcomeBody}</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={close}
                className="flex min-h-[72px] flex-1 items-center justify-center rounded-2xl border border-border bg-background text-base font-semibold text-foreground active:bg-secondary"
              >
                {t.welcomeSkip}
              </button>
              <button
                type="button"
                onClick={activate}
                className="flex min-h-[72px] flex-1 items-center justify-center rounded-2xl bg-primary text-base font-bold text-primary-foreground active:opacity-90"
              >
                {t.welcomeActivate}
              </button>
            </div>
          </>
        )}

        {started && downloading && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">{t.welcomeDownloading}</p>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-150"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">{percent}%</p>
          </div>
        )}

        {started && failed && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-destructive">{t.welcomeFailedRetry}</p>
            <button
              type="button"
              onClick={close}
              className="flex min-h-[72px] w-full items-center justify-center rounded-2xl border border-border bg-background text-base font-semibold text-foreground active:bg-secondary"
            >
              {t.welcomeClose}
            </button>
          </div>
        )}

        {finished && (
          <div className="mt-4 space-y-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-confirm">
              <Check className="h-5 w-5" />
              {t.welcomeDone}
            </p>
            <button
              type="button"
              onClick={close}
              className="flex min-h-[72px] w-full items-center justify-center rounded-2xl bg-primary text-base font-bold text-primary-foreground active:opacity-90"
            >
              {t.welcomeClose}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
