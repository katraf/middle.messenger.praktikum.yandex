import type Block from './Block';
import { isEqual } from '../utils/isEqual';
import { render } from '../utils/renderDOM';

export type BlockClass = new () => Block<object>;

/**
 * public — доступна всем, private — только авторизованным,
 * guest — только неавторизованным (вход и регистрация)
 */
export type RouteAccess = 'public' | 'private' | 'guest';

interface RouteProps {
  rootQuery: string;
  access: RouteAccess;
}

export default class Route {
  private pathname: string;

  private blockClass: BlockClass;

  private block: Block<object> | null = null;

  private props: RouteProps;

  constructor(pathname: string, view: BlockClass, props: RouteProps) {
    this.pathname = pathname;
    this.blockClass = view;
    this.props = props;
  }

  get access(): RouteAccess {
    return this.props.access;
  }

  /** Страница полностью удаляется из DOM, обработчики и подписки снимаются */
  leave(): void {
    if (this.block) {
      this.block.destroy();
      this.block = null;
    }
  }

  match(pathname: string): boolean {
    return isEqual(pathname, this.pathname);
  }

  render(): void {
    if (this.block) {
      return;
    }

    this.block = new this.blockClass();
    render(this.props.rootQuery, this.block);
  }
}
