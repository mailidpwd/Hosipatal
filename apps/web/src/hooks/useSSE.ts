import { useEffect, useState, useCallback, useRef } from 'react';
import { sseService, type SSEStatus } from '@/services/realtime/SSEService';

export function useSSE(eventType: string, autoConnect = true) {
  const [status, setStatus] = useState<SSEStatus>(sseService.getStatus());
  const [lastEvent, setLastEvent] = useState<MessageEvent | null>(null);
  const eventHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribeStatus = sseService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Subscribe to specific event type
    const unsubscribeEvent = sseService.onEvent(eventType, (event) => {
      setLastEvent(event);
      if (eventHandlerRef.current) {
        eventHandlerRef.current(event);
      }
    });

    // Auto-connect if enabled
    if (autoConnect && status === 'disconnected') {
      sseService.connect();
    }

    return () => {
      unsubscribeStatus();
      unsubscribeEvent();
    };
  }, [autoConnect, status, eventType]);

  const connect = useCallback(() => {
    sseService.connect();
  }, []);

  const disconnect = useCallback(() => {
    sseService.disconnect();
  }, []);

  const onEvent = useCallback((handler: (event: MessageEvent) => void) => {
    eventHandlerRef.current = handler;
  }, []);

  return {
    status,
    lastEvent,
    connect,
    disconnect,
    onEvent,
    isConnected: sseService.isConnected(),
  };
}

