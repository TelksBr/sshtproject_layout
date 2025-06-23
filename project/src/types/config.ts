// types/config.ts
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
