// ❌ Removido: Suporte a window.Dt* (dtunnelBridge)

/**
 * Abstração para Clipboard via SDK DTunnel
 * Fornece interface unificada para copiar/colar, usando SDK quando disponível
 */

/**
 * Copia texto para o clipboard
 * ✅ Usa: navigator.clipboard → document.execCommand legacy
 * ❌ Removido: window.DtClipboard (SDK DTunnel)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // 1️⃣ Tenta navigator.clipboard (moderno, mais seguro)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // 2️⃣ Fallback: document.execCommand (legado)
    return copyToClipboardLegacy(text);
  } catch (error) {
    console.error('Erro ao copiar para clipboard:', error);
    return copyToClipboardLegacy(text); // fallback final
  }
}

/**
 * Implementação legada de copy (document.execCommand)
 */
function copyToClipboardLegacy(text: string): boolean {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);

    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    return successful;
  } catch (error) {
    console.error('Falha no clipboard legado:', error);
    return false;
  }
}

/**
 * Tenta ler clipboard (se permissões permitirem)
 * ✅ Usa: navigator.clipboard (moderno)
 * ❌ Removido: window.DtClipboard (SDK DTunnel)
 */
export async function readFromClipboard(): Promise<string | null> {
  try {
    // Tenta navigator.clipboard (moderno)
    if (navigator.clipboard && window.isSecureContext) {
      return await navigator.clipboard.readText();
    }

    console.warn('Clipboard leitura não disponível no contexto atual');
    return null;
  } catch (error) {
    console.error('Erro ao ler clipboard:', error);
    return null;
  }
}

/**
 * Status de disponibilidade do clipboard
 * ✅ Verifica: navigator.clipboard
 */
export function isClipboardAvailable(): boolean {
  return navigator.clipboard !== undefined && window.isSecureContext;
}
