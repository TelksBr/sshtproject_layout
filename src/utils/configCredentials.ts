import type { ConfigCategory, ConfigItem } from '../types/config';

export type CredentialField = 'username' | 'password' | 'uuid';

function flagValue(value: unknown): boolean | undefined {
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  return undefined;
}

function hasBakedValue(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isV2RayMode(mode?: string): boolean {
  return (mode || '').toLowerCase().startsWith('v2ray');
}

/**
 * Campos que o usuário precisa preencher.
 * Config com credencial já embutida (`requires_* = false` ou `auth` preenchido)
 * não mostra nem valida o campo.
 */
export function configRequiresField(
  config: ConfigItem | null | undefined,
  field: CredentialField
): boolean {
  if (!config) return field !== 'uuid';

  const flag =
    field === 'username'
      ? flagValue(config.requires_username)
      : field === 'password'
        ? flagValue(config.requires_password)
        : flagValue(config.requires_uuid);

  if (flag === false) return false;
  if (flag === true) return true;

  const auth = config.auth || {};
  if (field === 'username' && (hasBakedValue(auth.username) || hasBakedValue(config.username))) {
    return false;
  }
  if (field === 'password' && (hasBakedValue(auth.password) || hasBakedValue(config.password))) {
    return false;
  }
  if (
    field === 'uuid' &&
    (hasBakedValue(auth.v2ray_uuid) || hasBakedValue(auth.uuid) || hasBakedValue(config.uuid))
  ) {
    return false;
  }

  return field === 'uuid' ? isV2RayMode(config.mode) : !isV2RayMode(config.mode);
}

export function mergeCredentialHints(config: ConfigItem, catalog: ConfigCategory[]): ConfigItem {
  const hasFlags =
    config.requires_username !== undefined ||
    config.requires_password !== undefined ||
    config.requires_uuid !== undefined;
  if (hasFlags) return config;

  for (const category of catalog) {
    const item = category.items?.find((entry) => Number(entry.id) === Number(config.id));
    if (!item) continue;
    if (
      item.requires_username === undefined &&
      item.requires_password === undefined &&
      item.requires_uuid === undefined &&
      !item.auth
    ) {
      continue;
    }
    return {
      ...config,
      requires_username: item.requires_username,
      requires_password: item.requires_password,
      requires_uuid: item.requires_uuid,
      auth: config.auth || item.auth,
    };
  }

  return config;
}

export function getVisibleCredentialFields(config: ConfigItem | null | undefined): {
  username: boolean;
  password: boolean;
  uuid: boolean;
} {
  return {
    username: configRequiresField(config, 'username'),
    password: configRequiresField(config, 'password'),
    uuid: configRequiresField(config, 'uuid'),
  };
}
