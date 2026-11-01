import { Store } from '../core/Store';
import type { Chat, ChatUser } from './chat';
import type { User } from './user';

export interface AppState {
  /** null — пользователь не авторизован */
  user: User | null;
  chats: Chat[];
  activeChatId: number | null;
  activeChatUsers: ChatUser[];
}

const initialState: AppState = {
  user: null,
  chats: [],
  activeChatId: null,
  activeChatUsers: [],
};

export const store = new Store<AppState>(initialState);

/** Сброс состояния после выхода или истёкшей сессии */
export const resetStore = (): void => store.set(initialState);
