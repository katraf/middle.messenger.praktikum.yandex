import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Block from './Block';
import Router from './Router';

/** Сколько раз страница каждого вида была удалена роутером */
const destroyed: Record<string, number> = {};

/** Тестовые страницы: корень с классом page-<name> */
const createPage = (name: string) =>
  class extends Block {
    protected template = `<main class="page-${name}">${name}</main>`;

    public destroy(): void {
      super.destroy();
      destroyed[name] = (destroyed[name] ?? 0) + 1;
    }
  };

const LoginPage = createPage('login');
const ChatsPage = createPage('chats');
const SettingsPage = createPage('settings');
const NotFoundPage = createPage('404');

const root = (): Element => document.querySelector('#app') as Element;
const renderedPages = (): string[] => Array.from(root().children, (element) => element.className);

/** Router — синглтон; для каждого теста нужен новый экземпляр */
const resetRouter = (): void => {
  (Router as unknown as { instance: Router | null }).instance = null;
};

describe('Router', () => {
  let isAuthorized: boolean;
  /** Сколько раз роутер обработал переход (проверка доступа вызывается на каждый) */
  let guardCalls: number;
  let router: Router;

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    window.history.replaceState({}, '', '/');
    isAuthorized = true;
    guardCalls = 0;
    Object.keys(destroyed).forEach((name) => delete destroyed[name]);

    resetRouter();
    router = new Router('#app')
      .use('/', LoginPage, 'guest')
      .use('/messenger', ChatsPage, 'private')
      .use('/settings', SettingsPage, 'private')
      .use('/404', NotFoundPage)
      .setNotFound('/404')
      .setGuard((access) => {
        guardCalls += 1;
        if (access === 'private' && !isAuthorized) {
          return '/';
        }
        if (access === 'guest' && isAuthorized) {
          return '/messenger';
        }
        return null;
      });
  });

  afterEach(() => {
    router.stop();
    resetRouter();
  });

  it('является синглтоном', () => {
    expect(new Router('#other')).toBe(router);
  });

  it('use() возвращает роутер для цепочки вызовов', () => {
    expect(router.use('/500', NotFoundPage)).toBe(router);
  });

  it('start() показывает страницу по текущему адресу', () => {
    window.history.replaceState({}, '', '/settings');

    router.start();

    expect(renderedPages()).toEqual(['page-settings']);
  });

  it('go() меняет адрес, добавляет запись в историю и показывает страницу', () => {
    router.start();
    const historyLength = window.history.length;

    router.go('/settings');

    expect(window.location.pathname).toBe('/settings');
    expect(window.history.length).toBe(historyLength + 1);
    expect(renderedPages()).toEqual(['page-settings']);
  });

  it('при переходе удаляет прошлую страницу из DOM', () => {
    router.start();
    router.go('/settings');

    expect(renderedPages()).toEqual(['page-settings']);
    expect(document.querySelector('.page-chats')).toBeNull();
    expect(destroyed.chats).toBe(1);
  });

  it('повторный переход на тот же адрес не пересоздаёт страницу', () => {
    router.start();
    const page = root().firstElementChild;

    router.go('/messenger');

    expect(root().firstElementChild).toBe(page);
    expect(destroyed.chats).toBeUndefined();
  });

  it('реагирует на кнопки «Назад»/«Вперёд» (popstate)', () => {
    router.start();
    router.go('/settings');

    window.history.replaceState({}, '', '/messenger');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(renderedPages()).toEqual(['page-chats']);
  });

  it('stop() отключает реакцию на «Назад»/«Вперёд»', () => {
    router.start();
    router.go('/settings');
    router.stop();

    window.history.replaceState({}, '', '/messenger');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(renderedPages()).toEqual(['page-settings']);
  });

  it('повторный start() не дублирует подписку на popstate', () => {
    router.start();
    router.start();
    guardCalls = 0;

    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(guardCalls).toBe(1);
  });

  it('back() и forward() вызывают методы истории браузера', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const forward = vi.spyOn(window.history, 'forward').mockImplementation(() => {});

    router.back();
    router.forward();

    expect(back).toHaveBeenCalledTimes(1);
    expect(forward).toHaveBeenCalledTimes(1);
    back.mockRestore();
    forward.mockRestore();
  });

  it('показывает 404 для неизвестного адреса, не меняя его', () => {
    window.history.replaceState({}, '', '/unknown');

    router.start();

    expect(window.location.pathname).toBe('/unknown');
    expect(renderedPages()).toEqual(['page-404']);
  });

  it('не различает адрес со слешем на конце', () => {
    window.history.replaceState({}, '', '/settings/');

    router.start();

    expect(renderedPages()).toEqual(['page-settings']);
  });

  describe('параметры адреса', () => {
    it('setQueryParam() меняет адрес без новой записи в истории и без перерисовки', () => {
      router.start();
      const page = root().firstElementChild;
      const historyLength = window.history.length;

      router.setQueryParam('chat', '12');

      expect(window.location.pathname + window.location.search).toBe('/messenger?chat=12');
      expect(router.getQueryParam('chat')).toBe('12');
      expect(window.history.length).toBe(historyLength);
      expect(root().firstElementChild).toBe(page);
    });

    it('null удаляет параметр', () => {
      window.history.replaceState({}, '', '/messenger?chat=12');

      router.setQueryParam('chat', null);

      expect(window.location.search).toBe('');
      expect(router.getQueryParam('chat')).toBeNull();
    });

    it('страница выбирается по пути, параметры не мешают', () => {
      window.history.replaceState({}, '', '/settings?tab=password');

      router.start();

      expect(renderedPages()).toEqual(['page-settings']);
    });
  });

  describe('проверка авторизации', () => {
    it('неавторизованного отправляет на вход без новой записи в истории', () => {
      isAuthorized = false;
      window.history.replaceState({}, '', '/settings');
      const historyLength = window.history.length;

      router.start();

      expect(window.location.pathname).toBe('/');
      expect(window.history.length).toBe(historyLength);
      expect(renderedPages()).toEqual(['page-login']);
    });

    it('авторизованного со страницы входа отправляет в чаты', () => {
      router.start();

      expect(window.location.pathname).toBe('/messenger');
      expect(renderedPages()).toEqual(['page-chats']);
    });

    it('публичные страницы доступны всем', () => {
      isAuthorized = false;
      window.history.replaceState({}, '', '/404');

      router.start();

      expect(renderedPages()).toEqual(['page-404']);
    });
  });
});
