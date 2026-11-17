import { describe, expect, it } from 'vitest';
import { validate } from './validation';

describe('validate', () => {
  it.each([
    ['first_name', 'Иван'],
    ['second_name', 'Петров-Водкин'],
    ['login', 'tester_01'],
    ['email', 'tester@example.com'],
    ['password', 'Password123'],
    ['phone', '+70000000001'],
    ['message', 'Привет'],
  ])('%s: «%s» проходит проверку', (field: string, value: string) => {
    expect(validate(field, value)).toBe('');
  });

  it.each([
    ['first_name', 'иван'],
    ['login', '12345'],
    ['login', 'ab'],
    ['email', 'tester@example'],
    ['password', 'password'],
    ['phone', '12-34'],
    ['message', '   '],
  ])('%s: «%s» не проходит проверку', (field: string, value: string) => {
    expect(validate(field, value)).not.toBe('');
  });

  it('для поля без правила ошибки нет', () => {
    expect(validate('unknown_field', '')).toBe('');
  });
});
