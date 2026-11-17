import { UserAPI } from '../api';
import { store, type PasswordData, type ProfileData, type User } from '../models';
import { handleApiError } from './errors';

/** Методы бросают Error с текстом для показа в форме */
export const UserController = {
  async updateProfile(data: ProfileData): Promise<void> {
    try {
      const user = await UserAPI.updateProfile(data);
      store.set({ user });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async updateAvatar(data: FormData): Promise<void> {
    try {
      const user = await UserAPI.updateAvatar(data);
      store.set({ user });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async changePassword(data: PasswordData): Promise<void> {
    try {
      await UserAPI.updatePassword(data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /** Ищет пользователя с точно таким логином */
  async findByLogin(login: string): Promise<User | undefined> {
    try {
      const users = await UserAPI.search(login);
      return users.find((user) => user.login === login);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};
