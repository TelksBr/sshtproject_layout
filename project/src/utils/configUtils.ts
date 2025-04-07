export interface ConfigItem {
  id: string;
  name: string;
  description: string;
  mode: string;
  sorter: number;
  icon: string;
  type?: string;
  auth?: {
    username?: string;
    password?: string;
    v2ray_uuid?: string;
  };
}

export interface ConfigCategory {
  id: number;
  name: string;
  sorter: number;
  color: string;
  items: ConfigItem[];
}

export function getAllConfigs(): ConfigCategory[] {
  if (window?.DtGetConfigs?.execute && typeof window.DtGetConfigs.execute === "function") {
    try {
      const configs = JSON.parse(window.DtGetConfigs.execute());
      // Sort categories and items
      configs.sort((a: ConfigCategory, b: ConfigCategory) => a.sorter - b.sorter);
      configs.forEach((category: ConfigCategory) => {
        category.items.sort((a, b) => a.sorter - b.sorter);
      });
      return configs;
    } catch (e) {
      console.error('Error parsing configs:', e);
      return [];
    }
  }
  return [];
}

export function setActiveConfig(configId: string): boolean {
  if (window?.DtSetConfig?.execute && typeof window.DtSetConfig.execute === "function") {
    try {
      window.DtSetConfig.execute(configId);
      return true;
    } catch (e) {
      console.error('Error setting config:', e);
      return false;
    }
  }
  return false;
}

export function getActiveConfig(): ConfigItem | null {
  if (window?.DtGetDefaultConfig?.execute && typeof window.DtGetDefaultConfig.execute === "function") {
    try {
      const defaultConfig = window.DtGetDefaultConfig.execute();
      if (defaultConfig) {
        return JSON.parse(defaultConfig);
      }
    } catch (e) {
      console.error('Error getting default config:', e);
    }
  }
  return null;
}

export function shouldShowInput(type: 'username' | 'password' | 'uuid'): boolean {
  const config = getActiveConfig();
  if (!config) return true;

  if (config.mode?.toLowerCase().startsWith("v2ray")) {
    if (type === 'uuid') {
      return !config.auth?.v2ray_uuid;
    }
    return false;
  }

  switch (type) {
    case 'username':
      return !config.auth?.username;
    case 'password':
      return !config.auth?.password;
    case 'uuid':
      return false;
    default:
      return true;
  }
}