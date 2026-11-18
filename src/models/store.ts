import { Store } from '../core/Store';
import type { Chat, ChatUser } from './chat';
import type { ChatMessage } from './message';
import type { User } from './user';

export interface AppState {
  /** null — пользователь не авторизован */
  user: User | null;
  chats: Chat[];
  activeChatId: number | null;
  activeChatUsers: ChatUser[];
  /** Сообщения открытого чата, от старых к новым */
  messages: ChatMessage[];
  /** На сервере есть сообщения старше загруженных */
  hasMoreMessages: boolean;
  messagesStatus: 'idle' | 'connecting' | 'ready' | 'error';
}

const initialState: AppState = {
  user: null,
  chats: [],
  activeChatId: null,
  activeChatUsers: [],
  messages: [],
  hasMoreMessages: false,
  messagesStatus: 'idle',
};

export const store = new Store<AppState>(initialState);

/** Сброс состояния после выхода или истёкшей сессии */
export const resetStore = (): void => store.set(initialState);
