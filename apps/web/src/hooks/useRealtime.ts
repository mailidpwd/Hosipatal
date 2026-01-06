import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useSSE } from './useSSE';
import { pollingService } from '@/services/realtime/PollingService';

type RealtimeConfig = {
  useWebSocket?: boolean;
  useSSE?: boolean;
  usePolling?: boolean;
  pollingInterval?: number;
  eventTypes?: string[];
};

/**
 * Unified hook for real-time data updates
 * Automatically falls back to polling if WebSocket/SSE unavailable
 */
export function useRealtime(
  dataKey: string,
  fetchFn: () => Promise<void>,
  config: RealtimeConfig = {}
) {
  const {
    useWebSocket: enableWS = true,
    useSSE: enableSSE = true,
    usePolling: enablePolling = true,
    pollingInterval = 5000,
    eventTypes = ['update', 'notification'],
  } = config;

  const [isActive, setIsActive] = useState(false);
  const ws = useWebSocket(enableWS);
  const sse = useSSE('update', enableSSE);

  // Set up WebSocket message handler
  useEffect(() => {
    if (enableWS && ws.isConnected) {
      ws.onMessage((message) => {
        if (eventTypes.includes(message.type) || message.type === dataKey) {
          fetchFn();
        }
      });
    }
  }, [enableWS, ws.isConnected, dataKey, eventTypes, fetchFn]);

  // Set up SSE event handler
  useEffect(() => {
    if (enableSSE && sse.isConnected) {
      sse.onEvent((event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === dataKey || eventTypes.includes(data.type)) {
            fetchFn();
          }
        } catch {
          // If not JSON, just refresh
          fetchFn();
        }
      });
    }
  }, [enableSSE, sse.isConnected, dataKey, eventTypes, fetchFn]);

  // Set up polling as fallback
  useEffect(() => {
    if (enablePolling) {
      // Use polling if WebSocket and SSE are not connected
      const shouldPoll = !ws.isConnected && !sse.isConnected;

      if (shouldPoll) {
        pollingService.start(dataKey, fetchFn, pollingInterval);
        setIsActive(true);
      } else {
        pollingService.stop(dataKey);
        setIsActive(false);
      }
    }

    return () => {
      pollingService.stop(dataKey);
    };
  }, [enablePolling, ws.isConnected, sse.isConnected, dataKey, fetchFn, pollingInterval]);

  // Subscribe to polling status
  useEffect(() => {
    const unsubscribe = pollingService.onStatusChange((active) => {
      setIsActive(active);
    });

    return unsubscribe;
  }, []);

  const refresh = useCallback(() => {
    fetchFn();
  }, [fetchFn]);

  return {
    isActive: isActive || ws.isConnected || sse.isConnected,
    wsStatus: ws.status,
    sseStatus: sse.status,
    refresh,
    connect: () => {
      ws.connect();
      sse.connect();
    },
    disconnect: () => {
      ws.disconnect();
      sse.disconnect();
      pollingService.stop(dataKey);
    },
  };
}

