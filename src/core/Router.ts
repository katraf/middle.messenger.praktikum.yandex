import Route, { type BlockClass, type RouteAccess } from './Route';

/** Возвращает путь для перенаправления или null, если на маршрут можно зайти */
export type RouteGuard = (access: RouteAccess) => string | null;

const normalizePath = (path: string): string => (path.length > 1 ? path.replace(/\/+$/, '') : path);

export default class Router {
  private static instance: Router | null = null;

  private routes: Route[] = [];

  private history: History = window.history;

  private currentRoute: Route | null = null;

  private rootQuery = '';

  private notFoundPath: string | null = null;

  private guard: RouteGuard | null = null;

  /** Кнопки «Назад» и «Вперёд» браузера */
  private handlePopState = (): void => {
    this.onRoute(window.location.pathname);
  };

  constructor(rootQuery: string) {
    if (Router.instance) {
      return Router.instance;
    }

    this.rootQuery = rootQuery;
    Router.instance = this;
  }

  use(pathname: string, block: BlockClass, access: RouteAccess = 'public'): this {
    const route = new Route(pathname, block, { rootQuery: this.rootQuery, access });

    this.routes.push(route);

    return this;
  }

  /** Маршрут, который показывается для неизвестного адреса (адрес в строке не меняется) */
  setNotFound(pathname: string): this {
    this.notFoundPath = pathname;
    return this;
  }

  /** Проверка доступа перед показом страницы */
  setGuard(guard: RouteGuard): this {
    this.guard = guard;
    return this;
  }

  start(): void {
    // addEventListener, а не window.onpopstate: не затираем чужие обработчики,
    // а повторный start() не добавит второй подписки
    window.removeEventListener('popstate', this.handlePopState);
    window.addEventListener('popstate', this.handlePopState);

    this.onRoute(window.location.pathname);
  }

  /** Перестать реагировать на историю браузера (нужно, например, в тестах) */
  stop(): void {
    window.removeEventListener('popstate', this.handlePopState);
  }

  go(pathname: string): void {
    this.history.pushState({}, '', pathname);
    this.onRoute(pathname);
  }

  /** Переход без новой записи в истории — для редиректов, чтобы «Назад» не возвращал на них */
  replace(pathname: string): void {
    this.history.replaceState({}, '', pathname);
    this.onRoute(pathname);
  }

  /** Параметр из адреса: /messenger?chat=12 → getQueryParam('chat') === '12' */
  getQueryParam(name: string): string | null {
    return new URLSearchParams(window.location.search).get(name);
  }

  /**
   * Меняет параметр адреса без новой записи в истории и без перерисовки страницы.
   * null удаляет параметр. Так состояние страницы переживает F5.
   */
  setQueryParam(name: string, value: string | null): void {
    const url = new URL(window.location.href);

    if (value === null) {
      url.searchParams.delete(name);
    } else {
      url.searchParams.set(name, value);
    }

    if (url.href !== window.location.href) {
      this.history.replaceState(this.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }

  back(): void {
    this.history.back();
  }

  forward(): void {
    this.history.forward();
  }

  getRoute(pathname: string): Route | undefined {
    const path = normalizePath(pathname);
    const route = this.routes.find((item) => item.match(path));

    if (route || !this.notFoundPath) {
      return route;
    }

    return this.routes.find((item) => item.match(this.notFoundPath as string));
  }

  private onRoute(pathname: string): void {
    const route = this.getRoute(pathname);
    if (!route) {
      return;
    }

    const redirect = this.guard?.(route.access);
    if (redirect && !route.match(redirect)) {
      this.replace(redirect);
      return;
    }

    if (this.currentRoute && this.currentRoute !== route) {
      this.currentRoute.leave();
    }

    this.currentRoute = route;
    route.render();
  }
}
