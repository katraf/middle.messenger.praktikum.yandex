import Router from './core/Router';

export const Routes = {
  Login: '/',
  Register: '/sign-up',
  Messenger: '/messenger',
  Settings: '/settings',
  NotFound: '/404',
  ServerError: '/500',
} as const;

export const router = new Router('#app');
