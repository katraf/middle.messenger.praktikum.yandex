import './navigation.pcss';
import template from './navigation.hbs?raw';
import { createPage } from '../../utils/template';

export const navigationPage = createPage(template, {
  pages: [
    { href: '/login', title: 'Авторизация' },
    { href: '/sign-up', title: 'Регистрация' },
    { href: '/messenger', title: 'Чаты' },
    { href: '/settings', title: 'Настройки профиля' },
    { href: '/404', title: 'Ошибка 404' },
    { href: '/500', title: 'Ошибка 500' },
  ],
});
