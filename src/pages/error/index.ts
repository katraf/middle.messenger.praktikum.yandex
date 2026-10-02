import './error.pcss';
import template from './error.hbs?raw';
import { createPage } from '../../utils/template';

export const notFoundPage = createPage(template, {
  code: '404',
  text: 'Такой страницы нет',
});

export const serverErrorPage = createPage(template, {
  code: '500',
  text: 'Сервер не отвечает. Мы уже чиним',
});
