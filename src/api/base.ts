import { HTTPTransport } from '../core/HTTPTransport';

export const API_URL: string = 'https://ya-praktikum.tech/api/v2';

export const RESOURCES_URL = `${API_URL}/resources`;

/** Транспорт с префиксом раздела API: createTransport('/auth').get('/user') → GET {API_URL}/auth/user */
export const createTransport = (path: string): HTTPTransport => new HTTPTransport(`${API_URL}${path}`);

/** Полный адрес картинки из ответа API (avatar: "/abc/file.png") */
export const getResourceUrl = (path: string | null | undefined): string =>
  path ? `${RESOURCES_URL}${path}` : '';
