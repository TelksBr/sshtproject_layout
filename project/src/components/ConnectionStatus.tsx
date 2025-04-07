import React from 'react';
import { Wifi, WifiOff, Loader, AlertCircle, ShieldAlert } from 'lucide-react';
import { CONNECTION_STATES, ConnectionState } from '../utils/connectionStates';
import { translateText } from '../utils/i18n';
import { Tooltip } from './Tooltip';

interface ConnectionStatusProps {
  state: ConnectionState;
}

const StatusIcons = {
  'wifi': Wifi,
  'wifi-off': WifiOff,
  'loader': Loader,
  'alert-circle': AlertCircle,
  'shield-alert': ShieldAlert
};

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  const config = CONNECTION_STATES[state];
  const Icon = StatusIcons[config.icon];

  return (
    <Tooltip content={translateText(config.statusText)}>
      <div className="flex items-center gap-2 bg-[#6205D5]/10 px-3 py-1 rounded-full">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        <span className="text-[#b0a8ff] text-sm font-medium">
          {translateText(config.statusText)}
        </span>
        <Icon className={`w-4 h-4 ${config.icon === 'loader' ? 'animate-spin' : ''} ${config.color}`} />
      </div>
    </Tooltip>
  );
}