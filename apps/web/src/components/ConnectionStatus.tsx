import React from 'react';
import { useRealTime } from '@/context/RealTimeContext';
import { Icon } from './UI';

export const ConnectionStatus: React.FC = () => {
  const { isConnected } = useRealTime();

  // Don't show anything if connected (via WebSocket, SSE, or polling)
  if (isConnected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white dark:bg-surface-dark rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 border border-red-200 dark:border-red-800">
      <Icon name="wifi_off" className="text-red-500" />
      <span className="text-sm text-text-secondary">Disconnected</span>
    </div>
  );
};

