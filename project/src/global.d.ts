interface Window {
  DtGetStatusBarHeight?: {
    execute: () => number;
  };
  DtGetNavigationBarHeight?: {
    execute: () => number;
  };
  DtGetAppConfig?: {
    execute: (label: string) => string | null;
  };
  DtGetLocalConfigVersion?: {
    execute: () => string | null;
  };
  DtExecuteDialogConfig?: {
    execute: () => void;
  };
  DtShowLoggerDialog?: {
    execute: () => void;
  };
  DtGetDefaultConfig?: {
    execute: () => any;
  };
  DtUsername?: {
    get: () => string;
    set: (username: string) => void;
  };
  DtPassword?: {
    get: () => string;
    set: (password: string) => void;
  };
  DtUuid?: {
    get: () => string;
    set: (uuid: string) => void;
  };
  DtGetVpnState?: {
    execute: () => string | null;
  };
  DtExecuteVpnStart?: {
    execute: () => void;
  };
  DtExecuteVpnStop?: {
    execute: () => void;
  };
  DtGetNetworkDownloadBytes?: {
    execute: () => number;
  };
  DtGetNetworkUploadBytes?: {
    execute: () => number;
  };
  DtGetLocalIP?: {
    execute: () => string | null;
  };
  DtStartCheckUser?: {
    execute: () => void;
  };
  DtCleanApp?: {
    execute: () => boolean;
  };
  DtIgnoreBatteryOptimizations?: {
    execute: () => boolean;
  };
  DtStartApnActivity?: {
    execute: () => void;
  };
  DtStartRadioInfoActivity?: {
    execute: () => void;
  };
  DtStartAppUpdate?: {
    execute: () => void;
  };
  DtStartWebViewActivity?: {
    execute: (url: string) => void;
  };
  DtAirplaneState?: {
    execute: () => string;
  };
  DtAirplaneActivate?: {
    execute: () => void;
  };
  DtAirplaneDeactivate?: {
    execute: () => void;
  };
}
