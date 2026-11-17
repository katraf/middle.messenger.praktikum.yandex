import { AuthAPI } from '../api';
import { HTTPError } from '../core/HTTPTransport';
import { resetStore, store, type SignInData, type SignUpData, type User } from '../models';
import { router, Routes } from '../router';
import { UserError } from '../utils/UserError';
import { toMessage } from './errors';

export const AuthController = {
  /**
   * Проверка сессии: загружает пользователя или сбрасывает его в null.
   * 401 — просто нет сессии. Сетевая ошибка или 5xx пробрасываются дальше:
   * это не «не авторизован», а «сервер недоступен».
   */
  async fetchUser(): Promise<User | null> {
    try {
      const user = await AuthAPI.getUser();
      store.set({ user });
      return user;
    } catch (error) {
      store.set({ user: null });

      if (error instanceof HTTPError && error.status === 401) {
        return null;
      }
      throw error;
    }
  },

  /** Бросает UserError с текстом для формы, если войти не удалось */
  async signIn(data: SignInData): Promise<void> {
    try {
      await AuthAPI.signIn(data);
    } catch (error) {
      // Сессия уже есть (например, вход в другой вкладке) — просто продолжаем
      const alreadyIn = error instanceof HTTPError && error.message === 'User already in system';
      if (!alreadyIn) {
        throw new UserError(toMessage(error));
      }
    }

    await this.fetchUser();
    router.go(Routes.Messenger);
  },

  async signUp(data: SignUpData): Promise<void> {
    try {
      await AuthAPI.signUp(data);
    } catch (error) {
      throw new UserError(toMessage(error));
    }

    // После регистрации сервер сразу авторизует пользователя
    await this.fetchUser();
    router.go(Routes.Messenger);
  },

  /**
   * Состояние очищается только после того, как сервер завершил сессию.
   * При ошибке бросает UserError с текстом для пользователя, пользователь остаётся в системе.
   */
  async logout(): Promise<void> {
    try {
      await AuthAPI.logout();
    } catch (error) {
      // 401 — сессии на сервере уже нет, выход фактически состоялся
      const sessionGone = error instanceof HTTPError && error.status === 401;
      if (!sessionGone) {
        throw new UserError(`Не удалось выйти: ${toMessage(error)}`);
      }
    }

    resetStore();
    router.go(Routes.Login);
  },
};
