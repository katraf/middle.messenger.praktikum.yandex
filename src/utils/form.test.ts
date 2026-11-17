import { describe, expect, it } from 'vitest';
import { getErrorText, pickStrings, showStatus } from './form';
import { UserError } from './UserError';

describe('getErrorText', () => {
  it('показывает текст UserError', () => {
    expect(getErrorText(new UserError('Сначала выберите картинку'))).toBe('Сначала выберите картинку');
  });

  it('скрывает текст остальных ошибок', () => {
    expect(getErrorText(new Error('SQL: relation "users" does not exist'))).toBe('Что-то пошло не так. Попробуйте ещё раз');
    expect(getErrorText('строка')).toBe('Что-то пошло не так. Попробуйте ещё раз');
  });
});

describe('showStatus', () => {
  it('выводит текст через textContent — HTML не разбирается', () => {
    const element = document.createElement('p');

    showStatus(element, '<img src=x onerror=alert(1)>');

    expect(element.querySelector('img')).toBeNull();
    expect(element.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(element.classList.contains('form-status--error')).toBe(true);
  });

  it('помечает успешные сообщения', () => {
    const element = document.createElement('p');

    showStatus(element, 'Сохранено', 'success');

    expect(element.classList.contains('form-status--success')).toBe(true);
    expect(element.classList.contains('form-status--error')).toBe(false);
  });
});

describe('pickStrings', () => {
  it('берёт только нужные поля как строки, файл превращается в пустую строку', () => {
    const values = { login: 'tester', password: 'Password123', avatar: new File([''], 'a.png'), extra: 'x' };

    expect(pickStrings(values, ['login', 'avatar'])).toEqual({ login: 'tester', avatar: '' });
  });
});
