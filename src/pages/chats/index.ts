import './chats.pcss';
import template from './chats.hbs?raw';
import { createPage } from '../../utils/template';
import { chats, messages } from '../../mocks/chats';

export const chatsPage = createPage(template, {
  chats,
  messages,
  activeChat: 'Вадим',
});
