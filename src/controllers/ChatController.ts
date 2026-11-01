import { ChatsAPI, type ChatsQuery } from '../api';
import { store } from '../models';
import { handleApiError } from './errors';
import { UserController } from './UserController';

/** Методы бросают Error с текстом для показа в форме */
export const ChatController = {
  async fetchChats(query: ChatsQuery = {}): Promise<void> {
    try {
      const chats = await ChatsAPI.getChats(query);
      store.set({ chats });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async createChat(title: string): Promise<void> {
    let chatId: number;

    try {
      ({ id: chatId } = await ChatsAPI.createChat(title));
    } catch (error) {
      throw new Error(handleApiError(error));
    }

    await this.fetchChats();
    await this.selectChat(chatId);
  },

  /** Удалить чат может только его создатель */
  async deleteChat(chatId: number): Promise<void> {
    try {
      await ChatsAPI.deleteChat(chatId);
    } catch (error) {
      throw new Error(handleApiError(error));
    }

    const { chats, activeChatId } = store.getState();
    store.set({
      chats: chats.filter((chat) => chat.id !== chatId),
      ...(activeChatId === chatId ? { activeChatId: null, activeChatUsers: [] } : {}),
    });
  },

  async selectChat(chatId: number): Promise<void> {
    store.set({ activeChatId: chatId, activeChatUsers: [] });
    await this.fetchChatUsers(chatId);
  },

  async fetchChatUsers(chatId: number): Promise<void> {
    try {
      const activeChatUsers = await ChatsAPI.getChatUsers(chatId);
      // Пока ждали ответ, пользователь мог открыть другой чат
      if (store.getState().activeChatId === chatId) {
        store.set({ activeChatUsers });
      }
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async addUser(chatId: number, login: string): Promise<void> {
    const user = await UserController.findByLogin(login);

    if (!user) {
      throw new Error(`Пользователь с логином «${login}» не найден`);
    }

    try {
      await ChatsAPI.addUsers(chatId, [user.id]);
    } catch (error) {
      throw new Error(handleApiError(error));
    }

    await this.fetchChatUsers(chatId);
  },

  async removeUser(chatId: number, userId: number): Promise<void> {
    try {
      await ChatsAPI.removeUsers(chatId, [userId]);
    } catch (error) {
      throw new Error(handleApiError(error));
    }

    await this.fetchChatUsers(chatId);
  },
};
