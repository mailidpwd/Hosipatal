import { env } from '@hosipatal/env/web';

export type SSEStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type EventHandler = (event: MessageEvent) => void;
type StatusHandler = (status: SSEStatus) => void;

export class SSEService {
  private eventSource: EventSource | null = null;
  private url: string;
  private eventHandlers = new Map<string, Set<EventHandler>>();
  private statusHandlers = new Set<StatusHandler>();
  private status: SSEStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private isProduction: boolean;

  constructor(url?: string) {
    const sseUrl = url || env.VITE_SSE_URL || 
      (env.VITE_SERVER_URL ? env.VITE_SERVER_URL + '/sse' : 'http://localhost:3000/sse');
    this.url = sseUrl;
    
    // Detect if we're in production (HTTPS) - SSE not supported on Vercel serverless
    this.isProduction = sseUrl.startsWith('https://') || sseUrl.includes('vercel.app');
  }

  /**
   * Connect to SSE server
   */
  connect(): void {
    // Skip SSE in production (Vercel serverless doesn't support it)
    if (this.isProduction) {
      this.setStatus('disconnected');
      return;
    }

    if (this.eventSource?.readyState === EventSource.OPEN) {
      return;
    }

    this.setStatus('connecting');

    try {
      this.eventSource = new EventSource(this.url);

      this.eventSource.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
      };

      this.eventSource.onerror = (error) => {
        // Only log errors in development
        if (!this.isProduction) {
          console.error('SSE error:', error);
        }
        this.setStatus('error');
        
        // EventSource automatically reconnects, but we track attempts
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.disconnect();
            this.setStatus('disconnected');
          }
        }
      };

      // Handle all events
      this.eventSource.onmessage = (event) => {
        this.handleEvent('message', event);
      };

      // Handle custom events
      this.eventSource.addEventListener('notification', (event: any) => {
        this.handleEvent('notification', event);
      });

      this.eventSource.addEventListener('appointment', (event: any) => {
        this.handleEvent('appointment', event);
      });

      this.eventSource.addEventListener('vitals', (event: any) => {
        this.handleEvent('vitals', event);
      });
    } catch (error) {
      if (!this.isProduction) {
        console.error('Failed to create SSE connection:', error);
      }
      this.setStatus('error');
    }
  }

  /**
   * Disconnect from SSE server
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.setStatus('disconnected');
  }

  /**
   * Subscribe to specific event type
   */
  onEvent(eventType: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
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
  getStatus(): SSEStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected' && 
           this.eventSource?.readyState === EventSource.OPEN;
  }

  private setStatus(status: SSEStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.statusHandlers.forEach(handler => handler(status));
    }
  }

  private handleEvent(eventType: string, event: MessageEvent): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }

    // Also call generic message handlers
    const messageHandlers = this.eventHandlers.get('message');
    if (messageHandlers) {
      messageHandlers.forEach(handler => handler(event));
    }
  }
}

// Singleton instance
export const sseService = new SSEService();

