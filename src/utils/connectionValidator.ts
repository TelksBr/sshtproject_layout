// Validador específico para conexões VPN
import { ConfigItem } from '../types/config';
import { validateUsername, validatePassword, validateUUID, validateConfigSelection } from './validators';

export interface ConnectionValidationResult {
  isValid: boolean;
  error?: string;
  missingFields?: string[];
}

export function validateConnectionForm(config: ConfigItem | null, username: string, password: string, uuid: string): ConnectionValidationResult {
  // Validar se há configuração selecionada
  const configValidation = validateConfigSelection(config);
  if (!configValidation.isValid) {
    return configValidation;
  }

  const missingFields: string[] = [];
  const isV2Ray = config!.mode?.toLowerCase().startsWith('v2ray');

  if (isV2Ray) {
    // Para V2Ray, validar UUID
    if (!config!.auth?.v2ray_uuid && !uuid) {
      const uuidValidation = validateUUID(uuid);
      if (!uuidValidation.isValid) {
        return { isValid: false, error: uuidValidation.error, missingFields: ['uuid'] };
      }
    }
  } else {
    // Para SSH/Proxy, validar username e password
    if (!config!.auth?.username && !username) {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.isValid) {
        missingFields.push('username');
      }
    }

    if (!config!.auth?.password && !password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        missingFields.push('password');
      }
    }

    if (missingFields.length > 0) {
      return {
        isValid: false,
        error: `Campos obrigatórios: ${missingFields.join(', ')}`,
        missingFields
      };
    }
  }

  return { isValid: true };
}