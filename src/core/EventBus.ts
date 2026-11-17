type Handler<Args extends unknown[]> = (...args: Args) => void;

/**
 * Простая шина событий с типизацией: EventBus<{ message: [string] }>
 * гарантирует, что on('message', cb) и emit('message', ...) согласованы.
 */
export class EventBus<Events extends Record<string, unknown[]>> {
  private listeners: { [K in keyof Events]?: Set<Handler<Events[K]>> } = {};

  on<K extends keyof Events>(event: K, callback: Handler<Events[K]>): void {
    (this.listeners[event] ??= new Set()).add(callback);
  }

  off<K extends keyof Events>(event: K, callback: Handler<Events[K]>): void {
    this.listeners[event]?.delete(callback);
  }

  emit<K extends keyof Events>(event: K, ...args: Events[K]): void {
    // Копия: обработчик может отписаться во время рассылки
    [...(this.listeners[event] ?? [])].forEach((callback) => callback(...args));
  }

  protected removeAllListeners(): void {
    this.listeners = {};
  }
}
