// Motor de lógica de SEÑAL CERO: estado de sesión en memoria (se pierde al
// recargar a propósito — no hay backend ni almacenamiento persistente).
//
// Registra qué protocolo se usó, cuándo empezó, cuántos pasos se completaron
// y, si se usó el Modo RCP, cuántas compresiones se contaron. informe.tsx lee
// este estado para generar el "Informe para emergencias".
import { createContext, useContext, useState, type ReactNode } from "react";

export type ProtocolSession = {
  protocolId: string;
  titulo: string;
  titleEn: string;
  totalSteps: number;
  startedAt: number;
  stepsCompleted: number;
  finishedAt: number | null;
};

export type CprSession = {
  startedAt: number;
  compressions: number;
  endedAt: number | null;
};

type SessionCtxValue = {
  protocol: ProtocolSession | null;
  cpr: CprSession | null;
  startProtocol: (protocolId: string, titulo: string, titleEn: string, totalSteps: number) => void;
  setStepsCompleted: (stepsCompleted: number) => void;
  finishProtocol: () => void;
  startCpr: () => void;
  setCompressions: (count: number) => void;
  stopCpr: () => void;
};

const SessionContext = createContext<SessionCtxValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [protocol, setProtocol] = useState<ProtocolSession | null>(null);
  const [cpr, setCpr] = useState<CprSession | null>(null);

  const value: SessionCtxValue = {
    protocol,
    cpr,
    startProtocol: (protocolId, titulo, titleEn, totalSteps) => {
      setProtocol({
        protocolId,
        titulo,
        titleEn,
        totalSteps,
        startedAt: Date.now(),
        stepsCompleted: 0,
        finishedAt: null,
      });
    },
    setStepsCompleted: (stepsCompleted) => {
      setProtocol((p) => (p ? { ...p, stepsCompleted } : p));
    },
    finishProtocol: () => {
      setProtocol((p) => (p ? { ...p, finishedAt: Date.now() } : p));
    },
    startCpr: () => setCpr({ startedAt: Date.now(), compressions: 0, endedAt: null }),
    setCompressions: (count) => setCpr((c) => (c ? { ...c, compressions: count } : c)),
    stopCpr: () => setCpr((c) => (c ? { ...c, endedAt: Date.now() } : c)),
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
