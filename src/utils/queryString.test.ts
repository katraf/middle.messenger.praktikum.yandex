import { describe, expect, it } from 'vitest';
import { queryString } from './queryString';

describe('queryString', () => {
  it('склеивает простые значения через &', () => {
    expect(queryString({ a: 1, b: 'x', c: true })).toBe('a=1&b=x&c=true');
  });

  it('кодирует значения', () => {
    expect(queryString({ title: 'Мой чат & друзья' })).toBe('title=%D0%9C%D0%BE%D0%B9%20%D1%87%D0%B0%D1%82%20%26%20%D0%B4%D1%80%D1%83%D0%B7%D1%8C%D1%8F');
  });

  it('разворачивает вложенные объекты и массивы', () => {
    expect(queryString({ key: [1, 2], obj: { a: { b: 2 } } })).toBe('key[0]=1&key[1]=2&obj[a][b]=2');
  });

  it('для пустого объекта возвращает пустую строку', () => {
    expect(queryString({})).toBe('');
  });

  it('бросает ошибку, если передан не объект', () => {
    expect(() => queryString('строка' as unknown as Record<string, unknown>)).toThrow('input must be an object');
  });
});
