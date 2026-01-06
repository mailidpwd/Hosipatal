import { useEffect, useState, useCallback, useRef } from 'react';
import { webSocketService, type WebSocketMessage, type WebSocketStatus } from '@/services/realtime/WebSocketService';

export function useWebSocket(autoConnect = true) {
  const [status, setStatus] = useState<WebSocketStatus>(webSocketService.getStatus());
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const messageHandlerRef = useRef<((message: WebSocketMessage) => void) | null>(null);

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribeStatus = webSocketService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Subscribe to messages
    const unsubscribeMessage = webSocketService.onMessage((message) => {
      setLastMessage(message);
      if (messageHandlerRef.current) {
        messageHandlerRef.current(message);
      }
    });

    // Auto-connect if enabled
    if (autoConnect && status === 'disconnected') {
      webSocketService.connect();
    }

    return () => {
      unsubscribeStatus();
      unsubscribeMessage();
    };
  }, [autoConnect, status]);

  const send = useCallback((type: string, payload: any) => {
    webSocketService.send(type, payload);
  }, []);

  const connect = useCallback(() => {
    webSocketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  const onMessage = useCallback((handler: (message: WebSocketMessage) => void) => {
    messageHandlerRef.current = handler;
  }, []);

  return {
    status,
    lastMessage,
    send,
    connect,
    disconnect,
    onMessage,
    isConnected: webSocketService.isConnected(),
  };
}

