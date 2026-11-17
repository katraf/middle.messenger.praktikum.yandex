/**
 * Ошибка, текст которой можно показать пользователю.
 * Создаётся только в нашем коде с заранее написанным текстом.
 * Любая другая ошибка (ответ сервера, сбой в коде) на экран как есть не попадает.
 */
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserError';
  }
}

export const DEFAULT_ERROR_TEXT = 'Что-то пошло не так. Попробуйте ещё раз';

/** Подробности — только в консоль и только при разработке */
export const logError = (context: string, error: unknown): void => {
  if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
    console.error(`[${context}]`, error);
  }
};
