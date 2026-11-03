import { message as tr } from '../i18n/messages';
// Utilitário para validação de email
export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateEmail(email: string): EmailValidationResult {
  // Verificar se está vazio
  if (!email || email.trim().length === 0) {
    return {
      isValid: false,
      error: tr("mb155fbd87f")
    };
  }

  const trimmedEmail = email.trim();

  // Verificar comprimento mínimo
  if (trimmedEmail.length < 5) {
    return {
      isValid: false,
      error: tr("ma143deaa1d")
    };
  }

  // Verificar comprimento máximo
  if (trimmedEmail.length > 100) {
    return {
      isValid: false,
      error: tr("m4c5fd1b405")
    };
  }

  // Regex mais robusta para validação de email
  const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      error: tr("m5a7bf599da")
    };
  }

  // Verificar se não tem caracteres especiais problemáticos
  const emailParts = trimmedEmail.split('@');
  
  if (emailParts.length !== 2) {
    return {
      isValid: false,
      error: tr("m141da48335")
    };
  }

  const [localPart, domainPart] = emailParts;

  // Validar parte local (antes do @)
  if (localPart.length === 0 || localPart.length > 64) {
    return {
      isValid: false,
      error: tr("mc6d9dc7fd3")
    };
  }

  // Validar domínio
  if (domainPart.length === 0 || domainPart.length > 63) {
    return {
      isValid: false,
      error: tr("me9d0f9f338")
    };
  }

  // Verificar se domínio tem pelo menos um ponto
  if (!domainPart.includes('.')) {
    return {
      isValid: false,
      error: tr("meb1dff29f4")
    };
  }

  // Verificar se não começa ou termina com pontos ou hífens
  if (localPart.startsWith('.') || localPart.endsWith('.') || 
      domainPart.startsWith('.') || domainPart.endsWith('.') ||
      domainPart.startsWith('-') || domainPart.endsWith('-')) {
    return {
      isValid: false,
      error: tr("m87776e6c48")
    };
  }

  return {
    isValid: true
  };
}

// Função auxiliar para validação rápida
export function isValidEmail(email: string): boolean {
  return validateEmail(email).isValid;
}
