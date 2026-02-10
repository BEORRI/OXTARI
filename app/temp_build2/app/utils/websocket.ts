/**
 * WebSocket utility with automatic reconnection logic
 * Provides robust WebSocket connections with exponential backoff retry
 */

export interface WebSocketConfig {
  url: string;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  reconnectDecay?: number;
  heartbeatInterval?: number;
  onOpen?: () => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onReconnect?: (attempt: number) => void;
  onMaxReconnectAttemptsReached?: () => void;
}

export class ReconnectingWebSocket {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig & {
    maxReconnectAttempts: number;
    reconnectInterval: number;
    maxReconnectInterval: number;
    reconnectDecay: number;
    heartbeatInterval: number;
  };
  private reconnectAttempts = 0;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private heartbeatTimeoutId: NodeJS.Timeout | null = null;
  private isManualClose = false;
  private isConnecting = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      maxReconnectAttempts: 10,
      reconnectInterval: 1000,
      maxReconnectInterval: 30000,
      reconnectDecay: 1.5,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  public connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    this.isManualClose = false;

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  public disconnect(): void {
    this.isManualClose = true;
    this.clearTimeouts();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
  }

  public send(data: string | ArrayBuffer | Blob): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(data);
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    }
    return false;
  }

  public getReadyState(): number {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }

  public isConnected(): boolean {
    return this.ws ? this.ws.readyState === WebSocket.OPEN : false;
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = (event) => {
      console.log('WebSocket connected:', this.config.url);
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.config.onOpen?.();
    };

    this.ws.onmessage = (event) => {
      this.config.onMessage?.(event);
      this.resetHeartbeat();
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.isConnecting = false;
      this.clearTimeouts();
      this.config.onClose?.(event);

      if (!this.isManualClose) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      this.isConnecting = false;
      this.config.onError?.(event);
    };
  }

  private handleReconnect(): void {
    if (this.isManualClose || this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.config.onMaxReconnectAttemptsReached?.();
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(this.config.reconnectDecay, this.reconnectAttempts - 1),
      this.config.maxReconnectInterval
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    
    this.config.onReconnect?.(this.reconnectAttempts);

    this.reconnectTimeoutId = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimeoutId = setTimeout(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
        this.startHeartbeat();
      }
    }, this.config.heartbeatInterval);
  }

  private resetHeartbeat(): void {
    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId);
      this.startHeartbeat();
    }
  }

  private clearTimeouts(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId);
      this.heartbeatTimeoutId = null;
    }
  }
}

/**
 * Hook for using WebSocket with automatic reconnection in React components
 */
export const useWebSocket = (config: WebSocketConfig) => {
  const wsRef = React.useRef<ReconnectingWebSocket | null>(null);

  React.useEffect(() => {
    wsRef.current = new ReconnectingWebSocket(config);
    wsRef.current.connect();

    return () => {
      wsRef.current?.disconnect();
    };
  }, [config.url]);

  const send = React.useCallback((data: string | ArrayBuffer | Blob) => {
    return wsRef.current?.send(data) || false;
  }, []);

  const isConnected = React.useCallback(() => {
    return wsRef.current?.isConnected() || false;
  }, []);

  return {
    send,
    isConnected,
    readyState: wsRef.current?.getReadyState() || WebSocket.CLOSED,
  };
};

// Import React for the hook
import React from 'react';
