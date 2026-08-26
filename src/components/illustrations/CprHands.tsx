import { useId } from "react";

// Hand-drawn line style: gray currentColor for the body, amber (#FFB020)
// only on the part that matters — the clasped hands centered on the lower
// sternum, with the arrow leading straight out of them to make the
// compression point and direction unambiguous.
export function CprHands() {
  const titleId = useId();
  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-labelledby={titleId}
      className="h-full w-full text-muted-foreground"
    >
      <title id={titleId}>Manos entrelazadas sobre el centro del pecho, comprimiendo hacia abajo</title>
      <path
        d="M32,50 C32,26 54,14 80,14 C106,14 128,26 128,50"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32,50 L38,140" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M128,50 L122,140" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M64,16 Q80,26 96,16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="54" y="74" width="52" height="30" rx="15" fill="none" stroke="#FFB020" strokeWidth="2.4" />
      <line x1="66" y1="83" x2="94" y2="83" stroke="#FFB020" strokeWidth="2" strokeLinecap="round" />
      <line x1="66" y1="95" x2="94" y2="95" stroke="#FFB020" strokeWidth="2" strokeLinecap="round" />
      <g stroke="#FFB020" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="80" y1="108" x2="80" y2="130" />
        <path d="M70,120 L80,134 L90,120" />
      </g>
    </svg>
  );
}
