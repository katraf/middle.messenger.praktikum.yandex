import type { Chat, ChatUser } from '../models';
import { createTransport } from './base';

const http = createTransport('/chats');

export interface ChatsQuery {
  offset?: number;
  limit?: number;
  title?: string;
}

export const ChatsAPI = {
  getChats: (query: ChatsQuery = {}) => http.get<Chat[]>('', { data: query }),

  createChat: (title: string) => http.post<{ id: number }>('', { data: { title } }),

  getChatUsers: (chatId: number) => http.get<ChatUser[]>(`/${chatId}/users`),

  addUsers: (chatId: number, users: number[]) => http.put('/users', { data: { chatId, users } }),

  removeUsers: (chatId: number, users: number[]) => http.delete('/users', { data: { chatId, users } }),
};
