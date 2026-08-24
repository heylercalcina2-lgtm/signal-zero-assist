import { useLang } from "@/lib/i18n";

export function AppFooter() {
  const { t } = useLang();
  return (
    <p className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-background/90 px-4 pb-3 pt-2 text-center text-xs text-muted-foreground backdrop-blur">
      {t.disclaimer}
    </p>
  );
}
