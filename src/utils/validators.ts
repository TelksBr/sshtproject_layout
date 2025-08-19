// Validadores centralizados
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateUsername(username: string): ValidationResult {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: 'Usuário é obrigatório' };
  }
  
  if (username.trim().length < 3) {
    return { isValid: false, error: 'Usuário deve ter pelo menos 3 caracteres' };
  }
  
  return { isValid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password || password.trim().length === 0) {
    return { isValid: false, error: 'Senha é obrigatória' };
  }
  
  if (password.trim().length < 4) {
    return { isValid: false, error: 'Senha deve ter pelo menos 4 caracteres' };
  }
  
  return { isValid: true };
}

export function validateUUID(uuid: string): ValidationResult {
  if (!uuid || uuid.trim().length === 0) {
    return { isValid: false, error: 'UUID é obrigatório' };
  }
  
  // Regex para UUID v4
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(uuid.trim())) {
    return { isValid: false, error: 'UUID inválido' };
  }
  
  return { isValid: true };
}

export function validateConfigSelection(config: any): ValidationResult {
  if (!config) {
    return { isValid: false, error: 'Selecione uma configuração' };
  }
  
  if (!config.id) {
    return { isValid: false, error: 'Configuração inválida' };
  }
  
  return { isValid: true };
}