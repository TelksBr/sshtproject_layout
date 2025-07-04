// types/config.ts

/**
 * Representa as credenciais de autenticação de uma configuração.
 */
export interface ConfigAuth {
  username?: string;
  password?: string;
  v2ray_uuid?: string;
}

/**
 * Representa um item de configuração individual.
 */
export interface ConfigItem {
  id: number;
  name: string;
  description: string;
  mode: string;
  sorter: number;
  icon: string;
  type?: string;
  auth?: ConfigAuth;
  // Permite extensibilidade para campos dinâmicos
  [key: string]: any;
}

/**
 * Representa uma categoria de configurações.
 */
export interface ConfigCategory {
  id: number;
  name: string;
  sorter: number;
  color: string;
  items: ConfigItem[];
}
