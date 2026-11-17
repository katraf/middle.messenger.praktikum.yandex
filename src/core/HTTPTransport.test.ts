import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HTTPError, HTTPTransport } from './HTTPTransport';

/** Подмена XMLHttpRequest: запоминает запрос и позволяет «ответить» из теста */
class FakeXHR {
  static last: FakeXHR | null = null;

  method = '';
  url = '';
  body: unknown = undefined;
  headers: Record<string, string> = {};
  withCredentials = false;
  timeout = 0;
  status = 0;
  responseText = '';
  responseHeaders: Record<string, string> = {};

  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onabort: (() => void) | null = null;

  constructor() {
    FakeXHR.last = this;
  }

  open(method: string, url: string): void {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string): void {
    this.headers[name] = value;
  }

  getResponseHeader(name: string): string | null {
    return this.responseHeaders[name] ?? null;
  }

  send(body?: unknown): void {
    this.body = body;
  }

  respond(status: number, body: unknown, contentType = 'application/json'): void {
    this.status = status;
    this.responseHeaders['Content-Type'] = contentType;
    this.responseText = typeof body === 'string' ? body : JSON.stringify(body);
    this.onload?.();
  }
}

type Method = 'get' | 'post' | 'put' | 'delete';

const request = (): FakeXHR => {
  if (!FakeXHR.last) {
    throw new Error('Запрос не был отправлен');
  }
  return FakeXHR.last;
};

describe('HTTPTransport', () => {
  let http: HTTPTransport;

  beforeEach(() => {
    FakeXHR.last = null;
    vi.stubGlobal('XMLHttpRequest', FakeXHR);
    http = new HTTPTransport('https://api.test/v2/chats');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('методы и адрес', () => {
    it.each(['get', 'post', 'put', 'delete'] as const)('%s отправляет запрос нужным методом', (method: Method) => {
      void http[method]('/users');

      expect(request().method).toBe(method.toUpperCase());
      expect(request().url).toBe('https://api.test/v2/chats/users');
    });

    it('всегда отправляет куки (withCredentials)', () => {
      void http.get('');

      expect(request().withCredentials).toBe(true);
    });
  });

  describe('GET', () => {
    it('переводит data в query string', () => {
      void http.get('', { data: { offset: 0, limit: 10, title: 'Мой чат' } });

      expect(request().url).toBe('https://api.test/v2/chats?offset=0&limit=10&title=%D0%9C%D0%BE%D0%B9%20%D1%87%D0%B0%D1%82');
    });

    it('кодирует вложенные объекты и массивы', () => {
      void http.get('', { data: { a: { b: 1 }, list: [1, 2] } });

      expect(request().url).toBe('https://api.test/v2/chats?a[b]=1&list[0]=1&list[1]=2');
    });

    it('не добавляет «?» без данных и не отправляет тело', () => {
      void http.get('', { data: {} });

      expect(request().url).toBe('https://api.test/v2/chats');
      expect(request().body).toBeUndefined();
    });
  });

  describe('тело запроса', () => {
    it.each(['post', 'put', 'delete'] as const)('%s отправляет объект как JSON', (method: Method) => {
      void http[method]('/users', { data: { chatId: 1, users: [2] } });

      expect(request().headers['Content-Type']).toBe('application/json');
      expect(request().body).toBe('{"chatId":1,"users":[2]}');
    });

    it('отправляет FormData как есть, без Content-Type', () => {
      const formData = new FormData();
      formData.append('avatar', new Blob(['x']), 'avatar.png');

      void http.put('/profile/avatar', { data: formData });

      expect(request().body).toBe(formData);
      expect(request().headers['Content-Type']).toBeUndefined();
    });

    it('добавляет переданные заголовки', () => {
      void http.post('', { data: {}, headers: { 'X-Test': '1' } });

      expect(request().headers['X-Test']).toBe('1');
    });

    it('без data отправляет запрос без тела', () => {
      void http.post('/logout');

      expect(request().body).toBeUndefined();
      expect(request().headers['Content-Type']).toBeUndefined();
    });
  });

  describe('ответ', () => {
    it('разбирает JSON', async () => {
      const promise = http.get<{ id: number }>('/1');
      request().respond(200, { id: 1 });

      await expect(promise).resolves.toEqual({ id: 1 });
    });

    it('возвращает текст, если ответ не JSON', async () => {
      const promise = http.post('/logout');
      request().respond(200, 'OK', 'text/plain');

      await expect(promise).resolves.toBe('OK');
    });

    it('отклоняет промис с HTTPError и текстом из reason', async () => {
      const promise = http.post('/signin');
      request().respond(401, { reason: 'Login or password is incorrect' });

      await expect(promise).rejects.toBeInstanceOf(HTTPError);
      await expect(promise).rejects.toMatchObject({ status: 401, message: 'Login or password is incorrect' });
    });

    it('сообщает о сетевой ошибке со статусом 0', async () => {
      const promise = http.get('');
      request().onerror?.();

      await expect(promise).rejects.toMatchObject({ status: 0, message: 'Нет соединения с сервером' });
    });

    it('сообщает о таймауте', async () => {
      const promise = http.get('', { timeout: 100 });
      expect(request().timeout).toBe(100);
      request().ontimeout?.();

      await expect(promise).rejects.toMatchObject({ status: 0, message: 'Сервер не ответил вовремя' });
    });
  });
});
