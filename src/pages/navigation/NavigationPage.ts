import Block, { type BlockOwnProps } from '../../core/Block';
import template from './navigation.hbs?raw';
import './navigation.pcss';

interface NavigationPageProps extends BlockOwnProps {
  pages: Array<{ href: string; title: string }>;
}

export class NavigationPage extends Block<NavigationPageProps> {
  protected template = template;

  constructor() {
    super({
      pages: [
        { href: '/login', title: 'Авторизация' },
        { href: '/sign-up', title: 'Регистрация' },
        { href: '/messenger', title: 'Чаты' },
        { href: '/settings', title: 'Настройки профиля' },
        { href: '/404', title: 'Ошибка 404' },
        { href: '/500', title: 'Ошибка 500' },
      ],
    });
  }
}
