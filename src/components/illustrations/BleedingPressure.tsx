import { useId } from "react";

// Hand-drawn line style: gray currentColor for the body, amber (#FFB020)
// only on the part that matters — the hand pressing the dressing, with the
// arrow leading straight into it to show firm, direct pressure.
export function BleedingPressure() {
  const titleId = useId();
  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-labelledby={titleId}
      className="h-full w-full text-muted-foreground"
    >
      <title id={titleId}>Mano presionando con firmeza un apósito sobre la herida del antebrazo</title>
      <path d="M18,138 C40,116 78,80 112,46" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M34,150 C54,128 90,94 124,60" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M18,138 Q26,146 34,150" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M112,46 Q120,50 124,60" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <rect
        x="54"
        y="81"
        width="40"
        height="20"
        rx="7"
        transform="rotate(-40 74 91)"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <ellipse cx="74" cy="91" rx="17" ry="12" transform="rotate(-40 74 91)" fill="none" stroke="#FFB020" strokeWidth="2.4" />
      <g stroke="#FFB020" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="48" y1="54" x2="65" y2="78" />
        <path d="M55,66 L65,78 L69,66" />
      </g>
    </svg>
  );
}
