import { HTTPError } from '../core/HTTPTransport';
import { resetStore } from '../models';
import { router, Routes } from '../router';
import { DEFAULT_ERROR_TEXT, logError, UserError } from '../utils/UserError';

/**
 * Белый список: известные ответы API и их текст для пользователя.
 * Текст reason с сервера на экран напрямую не выводится — в нём могут быть
 * внутренние подробности (названия полей БД, стек, служебные сообщения).
 */
const KNOWN_REASONS: Record<string, string> = {
  'Login or password is incorrect': 'Неверный логин или пароль',
  'Login already exists': 'Такой логин уже занят',
  'Email already exists': 'Эта почта уже зарегистрирована',
  'Password is incorrect': 'Старый пароль указан неверно',
  'Cookie is not valid': 'Сессия истекла, войдите снова',
};

/** Если reason неизвестен — общий текст по коду ответа */
const STATUS_TEXTS: Record<number, string> = {
  400: 'Проверьте введённые данные',
  401: 'Сессия истекла, войдите снова',
  403: 'Недостаточно прав для этого действия',
  404: 'Не найдено',
  409: 'Такие данные уже используются',
  413: 'Файл слишком большой',
  429: 'Слишком много запросов. Подождите немного',
};

const SERVER_ERROR_TEXT = 'Сервер временно недоступен. Попробуйте позже';

/** Текст ошибки, безопасный для показа пользователю */
export const toMessage = (error: unknown): string => {
  logError('API', error);

  if (error instanceof UserError) {
    return error.message;
  }
  if (!(error instanceof HTTPError)) {
    return DEFAULT_ERROR_TEXT;
  }
  // Статус 0 — нет ответа; тексты этих ошибок пишет сам HTTPTransport, а не сервер
  if (error.status === 0) {
    return error.message;
  }
  if (KNOWN_REASONS[error.message]) {
    return KNOWN_REASONS[error.message];
  }
  if (error.status >= 500) {
    return SERVER_ERROR_TEXT;
  }

  return STATUS_TEXTS[error.status] ?? DEFAULT_ERROR_TEXT;
};

/**
 * Общая обработка ошибок запросов:
 * 401 — сессия закончилась, отправляем на вход; 5xx — страница 500.
 * Возвращает ошибку с безопасным текстом для показа в форме.
 */
export const handleApiError = (error: unknown): UserError => {
  if (error instanceof HTTPError) {
    if (error.status === 401) {
      resetStore();
      router.go(Routes.Login);
    } else if (error.status >= 500) {
      router.go(Routes.ServerError);
    }
  }

  return new UserError(toMessage(error));
};
