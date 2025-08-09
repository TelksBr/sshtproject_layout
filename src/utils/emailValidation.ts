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
      error: 'Email é obrigatório'
    };
  }

  const trimmedEmail = email.trim();

  // Verificar comprimento mínimo
  if (trimmedEmail.length < 5) {
    return {
      isValid: false,
      error: 'Email muito curto'
    };
  }

  // Verificar comprimento máximo
  if (trimmedEmail.length > 100) {
    return {
      isValid: false,
      error: 'Email muito longo (máximo 100 caracteres)'
    };
  }

  // Regex mais robusta para validação de email
  const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Formato de email inválido'
    };
  }

  // Verificar se não tem caracteres especiais problemáticos
  const emailParts = trimmedEmail.split('@');
  
  if (emailParts.length !== 2) {
    return {
      isValid: false,
      error: 'Email deve conter apenas um @'
    };
  }

  const [localPart, domainPart] = emailParts;

  // Validar parte local (antes do @)
  if (localPart.length === 0 || localPart.length > 64) {
    return {
      isValid: false,
      error: 'Parte local do email inválida'
    };
  }

  // Validar domínio
  if (domainPart.length === 0 || domainPart.length > 63) {
    return {
      isValid: false,
      error: 'Domínio do email inválido'
    };
  }

  // Verificar se domínio tem pelo menos um ponto
  if (!domainPart.includes('.')) {
    return {
      isValid: false,
      error: 'Domínio deve conter pelo menos um ponto'
    };
  }

  // Verificar se não começa ou termina com pontos ou hífens
  if (localPart.startsWith('.') || localPart.endsWith('.') || 
      domainPart.startsWith('.') || domainPart.endsWith('.') ||
      domainPart.startsWith('-') || domainPart.endsWith('-')) {
    return {
      isValid: false,
      error: 'Email não pode começar ou terminar com . ou -'
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
