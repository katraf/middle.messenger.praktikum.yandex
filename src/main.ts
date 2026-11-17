import './styles/index.pcss';
import { AuthController, MessagesController } from './controllers';
import { store } from './models';
import {
  ChatsPage,
  LoginPage,
  NotFoundPage,
  ProfilePage,
  RegisterPage,
  ServerErrorPage,
} from './pages';
import { router, Routes } from './router';
import { registerComponents } from './utils/registerComponents';

registerComponents();

router
  .use(Routes.Login, LoginPage, 'guest')
  .use(Routes.Register, RegisterPage, 'guest')
  .use(Routes.Messenger, ChatsPage, 'private')
  .use(Routes.Settings, ProfilePage, 'private')
  .use(Routes.NotFound, NotFoundPage)
  .use(Routes.ServerError, ServerErrorPage)
  .setNotFound(Routes.NotFound)
  // Неавторизованных — на вход, авторизованных со входа и регистрации — в чаты
  .setGuard((access) => {
    const isAuthorized = Boolean(store.getState().user);

    if (access === 'private' && !isAuthorized) {
      return Routes.Login;
    }
    if (access === 'guest' && isAuthorized) {
      return Routes.Messenger;
    }
    return null;
  });

// Сокет открытого чата следует за состоянием приложения
MessagesController.watch();

// Сначала узнаём, есть ли сессия (GET /auth/user), затем показываем страницу.
// Если сервер недоступен — честно показываем страницу 500, а не форму входа.
AuthController.fetchUser()
  .catch(() => window.history.replaceState({}, '', Routes.ServerError))
  .finally(() => router.start());
