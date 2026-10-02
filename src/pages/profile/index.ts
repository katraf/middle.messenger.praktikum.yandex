import './profile.pcss';
import template from './profile.hbs?raw';
import { createPage } from '../../utils/template';
import { user } from '../../mocks/user';

export const profilePage = createPage(template, {
  user,
  profileFields: [
    { label: 'Почта', name: 'email', type: 'email', value: user.email },
    { label: 'Логин', name: 'login', value: user.login },
    { label: 'Имя', name: 'first_name', value: user.first_name },
    { label: 'Фамилия', name: 'second_name', value: user.second_name },
    { label: 'Имя в чате', name: 'display_name', value: user.display_name },
    { label: 'Телефон', name: 'phone', type: 'tel', value: user.phone },
  ],
  passwordFields: [
    { label: 'Старый пароль', name: 'old_password', type: 'password', autocomplete: 'current-password' },
    { label: 'Новый пароль', name: 'new_password', type: 'password', autocomplete: 'new-password' },
  ],
});
