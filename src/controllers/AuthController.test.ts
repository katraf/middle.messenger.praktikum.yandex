import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthAPI } from '../api';
import { HTTPError } from '../core/HTTPTransport';
import { resetStore, store, type User } from '../models';
import { AuthController } from './AuthController';

const user: User = {
  id: 1, first_name: 'Тест', second_name: 'Тестов', display_name: null,
  login: 'tester', email: 'tester@example.com', phone: '+70000000001', avatar: null,
};

describe('AuthController.fetchUser', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetStore();
  });

  it('кладёт пользователя в Store', async () => {
    vi.spyOn(AuthAPI, 'getUser').mockResolvedValue(user);

    await expect(AuthController.fetchUser()).resolves.toEqual(user);
    expect(store.getState().user).toEqual(user);
  });

  it('401 — нет сессии: возвращает null без ошибки', async () => {
    store.set({ user });
    vi.spyOn(AuthAPI, 'getUser').mockRejectedValue(new HTTPError(401, 'Cookie is not valid'));

    await expect(AuthController.fetchUser()).resolves.toBeNull();
    expect(store.getState().user).toBeNull();
  });

  it('нет связи с сервером — пробрасывает ошибку, а не считает пользователя гостем', async () => {
    vi.spyOn(AuthAPI, 'getUser').mockRejectedValue(new HTTPError(0, 'Нет соединения с сервером'));

    await expect(AuthController.fetchUser()).rejects.toMatchObject({ status: 0 });
  });

  it('ошибка сервера 5xx тоже пробрасывается', async () => {
    vi.spyOn(AuthAPI, 'getUser').mockRejectedValue(new HTTPError(503, 'Service Unavailable'));

    await expect(AuthController.fetchUser()).rejects.toMatchObject({ status: 503 });
  });
});
