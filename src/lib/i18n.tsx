import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "es" | "en";

export const i18n = {
  es: {
    appName: "SEÑAL CERO",
    statusBadge: "SIN SEÑAL — activo",
    sos: "SOS",
    sosHint: "Mantener para alerta",
    cards: {
      hemorragia: "Hemorragia",
      atragantamiento: "Atragantamiento",
      rcp: "RCP",
      atrapada: "Persona atrapada",
      quemadura: "Quemadura",
      convulsion: "Convulsión",
    },
    flashlight: "Linterna",
    whistle: "Silbato",
    language: "Idioma",
    disclaimer: "Esto no reemplaza llamar a emergencias",
    stepOf: (a: number, b: number) => `Paso ${a} de ${b}`,
    nextStep: "Hecho, siguiente",
    finish: "Terminar",
    read: "Leer paso",
    back: "Volver",
    source: "Fuente",
    cprMode: "Modo RCP",
    compressions: "compresiones",
    stop: "Detener",
    bpm: "110 por minuto",
    startCpr: "Iniciar modo RCP",
    notFound: "Protocolo no disponible sin conexión",
    on: "encendido",
    off: "apagado",
    report: "Informe para el paramédico",
    reportShort: "Informe",
    reportSummary: "Resumen del incidente",
    reportPerson: "Estado de la persona",
    reportNotes: "Notas",
    reportShare: "Compartir informe",
    reportShared: "Informe copiado",
    reportHint: "Datos de ejemplo. Muéstralo o léelo al personal de emergencias.",
  },
  en: {
    appName: "SEÑAL CERO",
    statusBadge: "NO SIGNAL — active",
    sos: "SOS",
    sosHint: "Hold to alert",
    cards: {
      hemorragia: "Bleeding",
      atragantamiento: "Choking",
      rcp: "CPR",
      atrapada: "Trapped person",
      quemadura: "Burn",
      convulsion: "Seizure",
    },
    flashlight: "Flashlight",
    whistle: "Whistle",
    language: "Language",
    disclaimer: "This does not replace calling emergency services",
    stepOf: (a: number, b: number) => `Step ${a} of ${b}`,
    nextStep: "Done, next",
    finish: "Finish",
    read: "Read step",
    back: "Back",
    source: "Source",
    cprMode: "CPR Mode",
    compressions: "compressions",
    stop: "Stop",
    bpm: "110 per minute",
    startCpr: "Start CPR mode",
    notFound: "Protocol not available offline",
    on: "on",
    off: "off",
    report: "Report for paramedics",
    reportShort: "Report",
    reportSummary: "Incident summary",
    reportPerson: "Person's condition",
    reportNotes: "Notes",
    reportShare: "Share report",
    reportShared: "Report copied",
    reportHint: "Sample data. Show it or read it to emergency responders.",
  },
} as const;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (typeof i18n)["es"] };

const LangContext = createContext<Ctx>({ lang: "es", setLang: () => {}, t: i18n.es });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const saved = localStorage.getItem("sc-lang");
    if (saved === "es" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("sc-lang", l);
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t: i18n[lang] as (typeof i18n)["es"] }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
