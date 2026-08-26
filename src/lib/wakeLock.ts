// Mantiene la pantalla encendida mientras se sigue un protocolo o el modo
// RCP. El navegador libera el wake lock automáticamente si la pestaña pierde
// visibilidad, así que lo volvemos a pedir al recuperarla.
import { useEffect, useRef } from "react";

type WakeLockSentinelLike = { release: () => Promise<void> };
type NavigatorWithWakeLock = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
};

export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    if (!active) return;
    const nav = navigator as NavigatorWithWakeLock;
    if (!nav.wakeLock) return;

    let cancelled = false;

    const request = async () => {
      try {
        const lock = await nav.wakeLock!.request("screen");
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        lockRef.current = lock;
      } catch {
        /* denegado por el usuario o por el sistema: no hay más que hacer */
      }
    };

    request();

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !lockRef.current) request();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, [active]);
}
