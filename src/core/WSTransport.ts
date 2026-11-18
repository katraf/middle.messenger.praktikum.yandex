import { EventBus } from './EventBus';

export const WSEvents = {
  Open: 'open',
  Message: 'message',
  Close: 'close',
  Error: 'error',
} as const;

type WSEventMap = {
  open: [];
  message: [unknown];
  close: [CloseEvent];
  error: [Event];
};

/** Сервер закрывает соединение без активности, поэтому шлём ping */
const DEFAULT_PING_INTERVAL = 30000;

/**
 * Обёртка над WebSocket: JSON в обе стороны, ping для поддержания соединения,
 * события open / message / close / error.
 */
export class WSTransport extends EventBus<WSEventMap> {
  private url: string;

  private pingInterval: number;

  private socket: WebSocket | null = null;

  private pingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(url: string, pingInterval = DEFAULT_PING_INTERVAL) {
    super();
    this.url = url;
    this.pingInterval = pingInterval;
  }

  get isOpen(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /** Резолвится, когда соединение открыто; реджектится, если открыть не удалось */
  connect(): Promise<void> {
    if (this.socket) {
      return Promise.reject(new Error('Соединение уже открыто'));
    }

    const socket = new WebSocket(this.url);
    this.socket = socket;

    return new Promise<void>((resolve, reject) => {
      socket.addEventListener('open', () => {
        this.startPing();
        this.emit(WSEvents.Open);
        resolve();
      });

      socket.addEventListener('error', (event) => {
        this.emit(WSEvents.Error, event);
        reject(new Error('Не удалось подключиться к чату'));
      });

      socket.addEventListener('close', (event) => {
        this.stopPing();
        this.socket = null;
        this.emit(WSEvents.Close, event);
      });

      socket.addEventListener('message', (event: MessageEvent) => this.handleMessage(event));
    });
  }

  send(data: object): void {
    if (!this.socket || !this.isOpen) {
      throw new Error('Нет соединения с чатом');
    }

    this.socket.send(JSON.stringify(data));
  }

  close(code = 1000, reason = ''): void {
    this.stopPing();
    this.socket?.close(code, reason);
    this.socket = null;
  }

  private handleMessage(event: MessageEvent): void {
    let data: unknown;

    try {
      data = JSON.parse(String(event.data));
    } catch {
      return;
    }

    const isPong = typeof data === 'object' && data !== null && (data as { type?: unknown }).type === 'pong';
    if (!isPong) {
      this.emit(WSEvents.Message, data);
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.isOpen) {
        this.send({ type: 'ping' });
      }
    }, this.pingInterval);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}
