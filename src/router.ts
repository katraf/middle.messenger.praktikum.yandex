import { navigationPage } from './pages/navigation';
import { loginPage } from './pages/login';
import { registerPage } from './pages/register';
import { chatsPage } from './pages/chats';
import { profilePage } from './pages/profile';
import { notFoundPage, serverErrorPage } from './pages/error';

type PageRenderer = () => string;

export const routes: Record<string, PageRenderer> = {
  '/': navigationPage,
  '/login': loginPage,
  '/sign-up': registerPage,
  '/messenger': chatsPage,
  '/settings': profilePage,
  '/404': notFoundPage,
  '/500': serverErrorPage,
};

const normalizePath = (path: string): string =>
  path.length > 1 ? path.replace(/\/+$/, '') : path;

export const resolvePage = (path: string): string => {
  const renderPage = routes[normalizePath(path)] ?? notFoundPage;
  return renderPage();
};
