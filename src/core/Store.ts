type Listener = () => void;

/** Хранилище состояния приложения с подпиской на изменения */
export class Store<State extends object> {
  private state: State;

  private listeners = new Set<Listener>();

  constructor(initialState: State) {
    this.state = initialState;
  }

  public getState(): Readonly<State> {
    return this.state;
  }

  public set(nextState: Partial<State>): void {
    this.state = { ...this.state, ...nextState };
    // Копия: подписчик может отписаться и подписаться снова во время рассылки
    [...this.listeners].forEach((listener) => listener());
  }

  /** Возвращает функцию отписки */
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
