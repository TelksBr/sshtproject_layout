type ConfigListener = () => void;
type EventType = 'config' | 'ip' | 'networkChange';

class ConfigManager {
  private listeners: Map<EventType, ConfigListener[]> = new Map();
  private static instance: ConfigManager;

  private constructor() {
    this.listeners.set('config', []);
    this.listeners.set('ip', []);
    this.listeners.set('networkChange', []);
  }

  static getInstance() {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  addListener(event: EventType, listener: ConfigListener) {
    const listeners = this.listeners.get(event) || [];
    listeners.push(listener);
    this.listeners.set(event, listeners);
    return () => this.removeListener(event, listener);
  }

  removeListener(event: EventType, listener: ConfigListener) {
    const listeners = this.listeners.get(event) || [];
    this.listeners.set(event, listeners.filter(l => l !== listener));
  }

  notifyListeners(event: EventType) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(listener => listener());
  }
}

export const configManager = ConfigManager.getInstance();
