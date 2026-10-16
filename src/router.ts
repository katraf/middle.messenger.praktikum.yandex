import type Block from './core/Block';
import {
  ChatsPage,
  LoginPage,
  NavigationPage,
  NotFoundPage,
  ProfilePage,
  RegisterPage,
  ServerErrorPage,
} from './pages';

type PageConstructor = new () => Block<object>;

const routes: Record<string, PageConstructor> = {
  '/': NavigationPage,
  '/login': LoginPage,
  '/sign-up': RegisterPage,
  '/messenger': ChatsPage,
  '/settings': ProfilePage,
  '/404': NotFoundPage,
  '/500': ServerErrorPage,
};

const normalizePath = (path: string): string => (path.length > 1 ? path.replace(/\/+$/, '') : path);

/** Создаёт страницу по адресу; неизвестный адрес — страница 404 */
export const resolvePage = (path: string): Block<object> => {
  const Page = routes[normalizePath(path)] ?? NotFoundPage;
  return new Page();
};
