import { useId } from "react";

// Hand-drawn line style: gray currentColor for the body, amber (#FFB020)
// only on the part that matters — the fist above the navel and the
// inward-and-upward thrust direction.
export function ChokingHeimlich() {
  const titleId = useId();
  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-labelledby={titleId}
      className="h-full w-full text-muted-foreground"
    >
      <title id={titleId}>Rescatista por detrás con el puño sobre el abdomen, comprimiendo hacia adentro y arriba</title>
      <circle cx="80" cy="24" r="13" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path
        d="M44,64 C44,46 60,40 80,40 C100,40 116,46 116,64"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M44,64 L48,148" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M116,64 L112,148" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M36,60 C22,76 24,100 62,112" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M124,60 C138,76 136,100 98,112" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="80" cy="112" r="15" fill="none" stroke="#FFB020" strokeWidth="2.4" />
      <g stroke="#FFB020" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="80" y1="97" x2="65" y2="68" />
        <path d="M58,78 L65,68 L76,73" />
      </g>
    </svg>
  );
}
