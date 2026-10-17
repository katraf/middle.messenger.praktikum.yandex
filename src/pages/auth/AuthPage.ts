import Block, { type BlockOwnProps, type EventListType } from '../../core/Block';
import type { FieldProps } from '../../components';
import { AuthController } from '../../controllers';
import { isValidatable, submitForm, type FormValues } from '../../utils/form';
import template from './auth.hbs?raw';
import './auth.pcss';

interface AuthPageProps extends BlockOwnProps {
  title: string;
  formName: string;
  fields: FieldProps[];
  submitText: string;
  linkText: string;
  linkHref: string;
  onSubmit: (values: FormValues) => void;
}

class AuthPage extends Block<AuthPageProps> {
  protected template = template;

  protected events: EventListType = {
    submit: (event: Event) =>
      submitForm(event, this.children.filter(isValidatable), this.props.onSubmit),
  };
}

export class LoginPage extends AuthPage {
  constructor() {
    super({
      title: 'Вход',
      formName: 'login',
      submitText: 'Войти',
      linkText: 'Нет аккаунта?',
      linkHref: '/sign-up',
      onSubmit: AuthController.signIn,
      fields: [
        { label: 'Логин', name: 'login', autocomplete: 'username' },
        { label: 'Пароль', name: 'password', type: 'password', autocomplete: 'current-password' },
      ],
    });
  }
}

export class RegisterPage extends AuthPage {
  constructor() {
    super({
      title: 'Регистрация',
      formName: 'registration',
      submitText: 'Зарегистрироваться',
      linkText: 'Войти',
      linkHref: '/login',
      onSubmit: AuthController.signUp,
      fields: [
        { label: 'Почта', name: 'email', type: 'email', autocomplete: 'email' },
        { label: 'Логин', name: 'login', autocomplete: 'username' },
        { label: 'Имя', name: 'first_name', autocomplete: 'given-name' },
        { label: 'Фамилия', name: 'second_name', autocomplete: 'family-name' },
        { label: 'Телефон', name: 'phone', type: 'tel', autocomplete: 'tel' },
        { label: 'Пароль', name: 'password', type: 'password', autocomplete: 'new-password' },
      ],
    });
  }
}
