import { useId } from "react";

// Hand-drawn line style: gray currentColor for the body, amber (#FFB020)
// only on the part that matters — the hand supporting the cheek, which is
// what keeps the head tilted back and the airway open.
export function RecoveryPosition() {
  const titleId = useId();
  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-labelledby={titleId}
      className="h-full w-full text-muted-foreground"
    >
      <title id={titleId}>Persona de costado en posición de recuperación, cabeza apoyada sobre su mano</title>
      <circle cx="38" cy="38" r="15" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path
        d="M52,50 Q82,58 110,88"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M44,64 Q74,76 100,100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M110,88 L100,100" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M96,98 L82,128" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M106,94 L136,108 L118,140"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M56,52 L40,42 L23,50"
        fill="none"
        stroke="#FFB020"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="18" cy="53" rx="7" ry="5" transform="rotate(-10 18 53)" fill="none" stroke="#FFB020" strokeWidth="2.4" />
    </svg>
  );
}
