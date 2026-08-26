import { useEffect, useState } from "react";

export function useOnlineStatus() {
  // The HTML is prerendered at build time (no `navigator`), so the first
  // client render MUST match that same fixed value or React throws a
  // hydration mismatch — which would trip on exactly the case this app
  // cares about most: a user opening it while already offline. The real
  // value is read only after mount, inside the effect.
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}
