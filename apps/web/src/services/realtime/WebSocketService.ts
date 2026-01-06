import { env } from '@hosipatal/env/web';

export type WebSocketMessage = {
  type: string;
  payload: any;
  timestamp: number;
};

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type MessageHandler = (message: WebSocketMessage) => void;
type StatusHandler = (status: WebSocketStatus) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private messageHandlers = new Set<MessageHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private status: WebSocketStatus = 'disconnected';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isProduction: boolean;

  constructor(url?: string) {
    // Use environment variable or construct from server URL
    const wsUrl = url || env.VITE_WS_URL || 
      (env.VITE_SERVER_URL ? env.VITE_SERVER_URL.replace('http', 'ws') + '/ws' : 'ws://localhost:3000/ws');
    this.url = wsUrl;
    
    // Detect if we're in production (HTTPS/WSS) - WebSocket not supported on Vercel serverless
    this.isProduction = wsUrl.startsWith('wss://') || wsUrl.includes('vercel.app');
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    // Skip WebSocket in production (Vercel serverless doesn't support it)
    if (this.isProduction) {
      this.setStatus('disconnected');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.setStatus('connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        // Only log errors in development
        if (!this.isProduction) {
          console.error('WebSocket error:', error);
        }
        this.setStatus('error');
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        this.stopHeartbeat();
        if (!this.isProduction) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      if (!this.isProduction) {
        console.error('Failed to create WebSocket connection:', error);
      }
      this.setStatus('error');
      if (!this.isProduction) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  /**
   * Send message through WebSocket
   */
  send(type: string, payload: any): void {
    if (this.isProduction) {
      return; // Silently skip in production
    }
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: Date.now(),
      };
      this.ws.send(JSON.stringify(message));
    } else {
      if (!this.isProduction) {
        console.warn('WebSocket is not connected. Message not sent:', type);
      }
    }
  }

  /**
   * Subscribe to messages
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  /**
   * Get current connection status
   */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  private setStatus(status: WebSocketStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.statusHandlers.forEach(handler => handler(status));
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    // Handle heartbeat
    if (message.type === 'ping') {
      this.send('pong', {});
      return;
    }

    this.messageHandlers.forEach(handler => handler(message));
  }

  private scheduleReconnect(): void {
    if (this.isProduction) {
      return; // Don't reconnect in production
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (!this.isProduction) {
        console.error('Max reconnection attempts reached');
      }
      return;
    }

    if (this.reconnectTimer) {
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send('ping', {});
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();

