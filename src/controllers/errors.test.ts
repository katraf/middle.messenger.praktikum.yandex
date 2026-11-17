import { afterEach, describe, expect, it, vi } from 'vitest';
import { HTTPError } from '../core/HTTPTransport';
import { resetStore, store } from '../models';
import { router } from '../router';
import { UserError } from '../utils/UserError';
import { handleApiError, toMessage } from './errors';

describe('toMessage — что видит пользователь', () => {
  it('известный ответ сервера переводится', () => {
    expect(toMessage(new HTTPError(401, 'Login or password is incorrect'))).toBe('Неверный логин или пароль');
  });

  it('неизвестный текст сервера не показывается — только общий текст по коду', () => {
    const leaky = 'duplicate key value violates unique constraint "users_phone_key"';

    expect(toMessage(new HTTPError(400, leaky))).toBe('Проверьте введённые данные');
    expect(toMessage(new HTTPError(403, 'Forbidden: user 15 is not admin of chat 7'))).toBe('Недостаточно прав для этого действия');
    expect(toMessage(new HTTPError(418, leaky))).toBe('Что-то пошло не так. Попробуйте ещё раз');
  });

  it('ошибки 5xx — без подробностей', () => {
    const message = toMessage(new HTTPError(500, 'TypeError: Cannot read properties of undefined at /app/src/db.js:42'));

    expect(message).toBe('Сервер временно недоступен. Попробуйте позже');
  });

  it('нет ответа (статус 0) — текст пишет сам HTTPTransport, его показываем', () => {
    expect(toMessage(new HTTPError(0, 'Нет соединения с сервером'))).toBe('Нет соединения с сервером');
  });

  it('сбой в коде — общий текст без технических подробностей', () => {
    expect(toMessage(new TypeError("Cannot read properties of undefined (reading 'id')"))).toBe('Что-то пошло не так. Попробуйте ещё раз');
  });

  it('наши ошибки UserError показываются как есть', () => {
    expect(toMessage(new UserError('Пользователь не найден'))).toBe('Пользователь не найден');
  });
});

describe('handleApiError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetStore();
  });

  it('возвращает UserError с безопасным текстом', () => {
    vi.spyOn(router, 'go').mockImplementation(() => {});

    const error = handleApiError(new HTTPError(400, 'internal details'));

    expect(error).toBeInstanceOf(UserError);
    expect(error.message).toBe('Проверьте введённые данные');
  });

  it('401 — сбрасывает состояние и отправляет на вход', () => {
    const go = vi.spyOn(router, 'go').mockImplementation(() => {});
    store.set({ activeChatId: 5 });

    handleApiError(new HTTPError(401, 'Cookie is not valid'));

    expect(go).toHaveBeenCalledWith('/');
    expect(store.getState().activeChatId).toBeNull();
  });

  it('5xx — отправляет на страницу 500', () => {
    const go = vi.spyOn(router, 'go').mockImplementation(() => {});

    handleApiError(new HTTPError(502, 'Bad Gateway'));

    expect(go).toHaveBeenCalledWith('/500');
  });
});
