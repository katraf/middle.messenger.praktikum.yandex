import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { registerComponent } from '../../core/registerComponent';
import { Input } from '../input';
import { Field } from './Field';

const setup = (props: ConstructorParameters<typeof Field>[0]) => {
  const field = new Field(props);
  document.body.replaceChildren(field.element() as Element);
  return field;
};

const input = (): HTMLInputElement => document.querySelector('input') as HTMLInputElement;
const error = (): string => document.querySelector('.field__error')?.textContent ?? '';

describe('Field', () => {
  beforeAll(() => {
    registerComponent(Input);
  });

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('выводит подпись, name и значение', () => {
    setup({ name: 'login', label: 'Логин', value: 'tester_01' });

    expect(document.querySelector('.field__label')?.textContent).toBe('Логин');
    expect(input().name).toBe('login');
    expect(input().value).toBe('tester_01');
  });

  it('показывает ошибку при потере фокуса, если значение не проходит проверку', () => {
    setup({ name: 'login', label: 'Логин' });

    input().value = '12';
    input().dispatchEvent(new FocusEvent('blur'));

    expect(error()).toBe('От 3 до 20 символов: латиница, цифры, - и _');
  });

  it('сохраняет введённое значение после перерисовки с ошибкой', () => {
    setup({ name: 'email', label: 'Почта' });

    input().value = 'not-an-email';
    input().dispatchEvent(new FocusEvent('blur'));

    expect(input().value).toBe('not-an-email');
    expect(error()).not.toBe('');
  });

  it('validate() возвращает true и убирает ошибку для корректного значения', () => {
    const field = setup({ name: 'login', label: 'Логин' });
    input().value = '1';
    expect(field.validate()).toBe(false);

    input().value = 'tester_01';

    expect(field.validate()).toBe(true);
    expect(error()).toBe('');
  });

  it('использует явно заданное правило вместо правила по name', () => {
    const field = setup({ name: 'nickname', label: 'Ник', rule: 'required' });

    input().value = '   ';

    expect(field.validate()).toBe(false);
    expect(error()).toBe('Заполните поле');
  });

  it('clear() очищает значение и ошибку', () => {
    const field = setup({ name: 'password', label: 'Пароль', type: 'password' });
    input().value = 'short';
    field.validate();

    field.clear();

    expect(input().value).toBe('');
    expect(error()).toBe('');
  });
});
