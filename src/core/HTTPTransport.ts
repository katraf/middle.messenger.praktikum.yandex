import { isPlainObject, queryString } from '../utils/queryString';

export const METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const;

type Method = (typeof METHODS)[keyof typeof METHODS];

export interface RequestOptions {
  /** Для GET — параметры query string, для остальных методов — тело запроса */
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

/** Ошибка ответа сервера: статус и текст причины из поля reason */
export class HTTPError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HTTPError';
    this.status = status;
  }
}

const DEFAULT_TIMEOUT = 10000;

const parseResponse = (xhr: XMLHttpRequest): unknown => {
  const contentType = xhr.getResponseHeader('Content-Type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(xhr.responseText);
    } catch {
      return xhr.responseText;
    }
  }

  return xhr.responseText;
};

const getErrorReason = (response: unknown, fallback: string): string => {
  if (isPlainObject(response) && typeof response.reason === 'string') {
    return response.reason;
  }
  return typeof response === 'string' && response ? response : fallback;
};

/**
 * Обёртка над XMLHttpRequest на промисах.
 * Куки сессии отправляются с каждым запросом (withCredentials).
 */
export class HTTPTransport {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  get = <R = unknown>(url: string, options: RequestOptions = {}): Promise<R> =>
    this.request<R>(url, METHODS.GET, options);

  post = <R = unknown>(url: string, options: RequestOptions = {}): Promise<R> =>
    this.request<R>(url, METHODS.POST, options);

  put = <R = unknown>(url: string, options: RequestOptions = {}): Promise<R> =>
    this.request<R>(url, METHODS.PUT, options);

  delete = <R = unknown>(url: string, options: RequestOptions = {}): Promise<R> =>
    this.request<R>(url, METHODS.DELETE, options);

  private request<R>(url: string, method: Method, options: RequestOptions): Promise<R> {
    const { data, headers = {}, timeout = DEFAULT_TIMEOUT } = options;
    const isGet = method === METHODS.GET;
    const query = isGet && isPlainObject(data) ? queryString(data) : '';
    const fullUrl = `${this.baseUrl}${url}${query ? `?${query}` : ''}`;

    return new Promise<R>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, fullUrl);
      xhr.withCredentials = true;
      xhr.timeout = timeout;

      const isFormData = data instanceof FormData;
      const hasBody = !isGet && data !== undefined;

      // Для FormData заголовок с boundary браузер выставит сам
      if (hasBody && !isFormData) {
        xhr.setRequestHeader('Content-Type', 'application/json');
      }
      Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));

      xhr.onload = () => {
        const response = parseResponse(xhr);

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(response as R);
        } else {
          reject(new HTTPError(xhr.status, getErrorReason(response, `Ошибка ${xhr.status}`)));
        }
      };
      xhr.onerror = () => reject(new HTTPError(0, 'Нет соединения с сервером'));
      xhr.ontimeout = () => reject(new HTTPError(0, 'Сервер не ответил вовремя'));
      xhr.onabort = () => reject(new HTTPError(0, 'Запрос отменён'));

      if (!hasBody) {
        xhr.send();
      } else {
        xhr.send(isFormData ? data : JSON.stringify(data));
      }
    });
  }
}
