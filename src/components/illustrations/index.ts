import type { ComponentType } from "react";
import { RecoveryPosition } from "./RecoveryPosition";
import { CprHands } from "./CprHands";
import { ChokingHeimlich } from "./ChokingHeimlich";
import { BleedingPressure } from "./BleedingPressure";

// Registry keyed by the "ilustracion" string a protocol step can declare in
// protocols.json. Only add an entry here once the matching component
// actually exists — the step viewer looks up by key and renders nothing if
// there's no match.
export const illustrations: Record<string, ComponentType> = {
  recoveryPosition: RecoveryPosition,
  cprHands: CprHands,
  chokingHeimlich: ChokingHeimlich,
  bleedingPressure: BleedingPressure,
};
