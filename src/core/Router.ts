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
    // Кнопки «Назад» и «Вперёд» браузера
    window.onpopstate = () => {
      this.onRoute(window.location.pathname);
    };

    this.onRoute(window.location.pathname);
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
