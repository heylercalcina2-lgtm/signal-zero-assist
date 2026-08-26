import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useSemanticSearch, type SearchOutcome } from "@/lib/search";
import { useAiDownload } from "@/lib/aiDownload";

const DEBOUNCE_MS = 400;

// The offline AI search is front-and-center now, not buried in Ajustes: the
// search box is always visible, and if the model isn't downloaded yet, this
// component offers to activate it right here — progress bar included —
// instead of just linking away. It still never blocks the protocol cards
// below: typing while not downloaded just shows the activation prompt.
export function ProtocolSearch() {
  const { t } = useLang();
  const { ready, buscarProtocolo } = useSemanticSearch();
  const { cached, downloading, percent, failed, start } = useAiDownload();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchOutcome | null>(null);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (!query.trim() || !ready) {
      setResult(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    timerRef.current = window.setTimeout(() => {
      buscarProtocolo(query).then((outcome) => {
        setResult(outcome);
        setSearching(false);
      });
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [query, ready, buscarProtocolo]);

  const top = result?.top[0];
  const alternates = result?.top.slice(1, 3) ?? [];
  const label = (id: string) => t.cards[id as keyof typeof t.cards];
  const hasQuery = query.trim() !== "";
  const available = cached === true;

  return (
    <div className="mt-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
          className="min-h-[56px] w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {cached === false && !downloading && (
        <button
          type="button"
          onClick={start}
          className="mt-2 flex w-full items-center gap-2 rounded-2xl border border-dashed border-primary/50 bg-primary/5 px-3 py-2.5 text-left"
        >
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1 text-xs text-muted-foreground">{t.searchNotDownloaded}</span>
          <span className="shrink-0 text-xs font-bold text-primary">{t.searchActivateNow}</span>
        </button>
      )}

      {downloading && (
        <div className="mt-2 rounded-2xl border border-primary/50 bg-primary/5 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex-1 text-xs text-muted-foreground">{t.aiDownloading}</span>
            <span className="shrink-0 text-xs font-bold text-primary">{percent}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-[width] duration-150" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}

      {failed && !downloading && (
        <p className="mt-2 px-1 text-xs text-destructive">{t.aiDownloadFailed}</p>
      )}

      {hasQuery && available && !ready && (
        <p className="mt-2 px-1 text-xs text-muted-foreground">{t.searchLoadingModel}</p>
      )}

      {hasQuery && ready && searching && <p className="mt-2 px-1 text-xs text-muted-foreground">{t.searchSearching}</p>}

      {hasQuery && ready && !searching && result ? (
        result.confident && top ? (
          <div className="mt-3 space-y-2">
            <Link
              to="/protocolo/$id"
              params={{ id: top.protocolId }}
              className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-2xl bg-primary px-5 text-left text-lg font-bold text-primary-foreground active:opacity-90"
            >
              {label(top.protocolId)}
              <ArrowRight className="h-6 w-6 shrink-0" />
            </Link>
            {alternates.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 px-1">
                <span className="text-xs text-muted-foreground">{t.searchMaybe}</span>
                {alternates.map((a) => (
                  <Link
                    key={a.protocolId}
                    to="/protocolo/$id"
                    params={{ id: a.protocolId }}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground active:bg-secondary"
                  >
                    {label(a.protocolId)}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-3 px-1 text-sm text-muted-foreground">{t.searchUnsure}</p>
        )
      ) : null}
    </div>
  );
}
