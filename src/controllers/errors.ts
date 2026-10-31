import { HTTPError } from '../core/HTTPTransport';
import { store } from '../models';
import { router, Routes } from '../router';

/** Частые ответы API — на русском, остальные показываем как есть */
const REASONS: Record<string, string> = {
  'Login or password is incorrect': 'Неверный логин или пароль',
  'Login already exists': 'Такой логин уже занят',
  'Email already exists': 'Эта почта уже зарегистрирована',
  'Password is incorrect': 'Старый пароль указан неверно',
  'Cookie is not valid': 'Сессия истекла, войдите снова',
};

export const toMessage = (error: unknown): string => {
  if (error instanceof HTTPError) {
    return REASONS[error.message] ?? error.message;
  }
  return 'Что-то пошло не так. Попробуйте ещё раз';
};

/**
 * Общая обработка ошибок запросов:
 * 401 — сессия закончилась, отправляем на вход; 5xx — страница 500.
 * Возвращает текст ошибки для показа в форме.
 */
export const handleApiError = (error: unknown): string => {
  if (error instanceof HTTPError) {
    if (error.status === 401) {
      store.set({ user: null, chats: [], activeChatId: null, activeChatUsers: [] });
      router.go(Routes.Login);
    } else if (error.status >= 500) {
      router.go(Routes.ServerError);
    }
  }

  return toMessage(error);
};
