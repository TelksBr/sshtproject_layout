/**
 * Tipos para objetos de bridge nativos (window.Dt*) usados como fallback
 * quando o SDK não está disponível. A API principal vem do dtunnel-sdk.
 */
declare global {
  interface Window {
    DtReloadApp?: { execute: () => void };
    DtExitApp?: { execute: () => void };
    DtCloseApp?: { execute: () => void };
    DtStorage?: { save: (k: string, v: string) => void; load: (k: string) => string | null; remove: (k: string) => void; clear: () => void; keys: () => string[] };
    DtClipboard?: { copy: (t: string) => void; paste: () => string | null };
  }
}

export {};
