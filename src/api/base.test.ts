import { describe, expect, it } from 'vitest';
import { getResourceUrl, WS_URL } from './base';

describe('getResourceUrl', () => {
  it('собирает адрес картинки из пути API', () => {
    expect(getResourceUrl('/3f2c-a1/avatar_1.png')).toBe('https://ya-praktikum.tech/api/v2/resources/3f2c-a1/avatar_1.png');
  });

  it('для пустого значения возвращает пустую строку', () => {
    expect(getResourceUrl(null)).toBe('');
    expect(getResourceUrl(undefined)).toBe('');
    expect(getResourceUrl('')).toBe('');
  });

  it.each([
    'javascript:alert(1)',
    '//evil.example/a.png',
    '/a/../../secret',
    '/a.png" onerror="alert(1)',
    '/<script>.png',
    'https://evil.example/a.png',
  ])('отбрасывает подозрительный путь %s', (path: string) => {
    expect(getResourceUrl(path)).toBe('');
  });
});

describe('WS_URL', () => {
  it('строится из адреса API', () => {
    expect(WS_URL).toBe('wss://ya-praktikum.tech/ws');
  });
});
