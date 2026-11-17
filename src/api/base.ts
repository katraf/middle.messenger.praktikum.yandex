import { HTTPTransport } from '../core/HTTPTransport';

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'https://ya-praktikum.tech/api/v2';

export const RESOURCES_URL = `${API_URL}/resources`;

/** https://ya-praktikum.tech/api/v2 → wss://ya-praktikum.tech/ws */
export const WS_URL = API_URL.replace(/^http/, 'ws').replace(/\/api\/v2\/?$/, '/ws');

/** Транспорт с префиксом раздела API: createTransport('/auth').get('/user') → GET {API_URL}/auth/user */
export const createTransport = (path: string): HTTPTransport => new HTTPTransport(`${API_URL}${path}`);

/** Путь к файлу на сервере: /abc-123/file_name.png — без схем, «..» и спецсимволов */
const SAFE_RESOURCE_PATH = /^(\/[\w.-]+)+$/;

/**
 * Полный адрес картинки из ответа API (avatar: "/abc/file.png").
 * Путь приходит с сервера, поэтому проверяем его: подмена на javascript:,
 * чужой домен или выход из каталога через «..» дают пустую строку.
 */
export const getResourceUrl = (path: string | null | undefined): string => {
  if (!path || !SAFE_RESOURCE_PATH.test(path) || path.split('/').includes('..')) {
    return '';
  }
  return `${RESOURCES_URL}${path}`;
};
