import Block, { type BlockOwnProps, type EventListType } from '../../core/Block';
import type { FieldProps } from '../../components';
import { AuthController } from '../../controllers';
import { Routes } from '../../router';
import { getErrorText, isValidatable, pickStrings, showStatus, submitForm, type FormValues } from '../../utils/form';
import template from './auth.hbs?raw';
import './auth.pcss';

interface AuthPageProps extends BlockOwnProps {
  title: string;
  formName: string;
  fields: FieldProps[];
  submitText: string;
  linkText: string;
  linkHref: string;
  /** Отправка на сервер; при ошибке бросает Error с текстом для пользователя */
  onSubmit: (values: FormValues) => Promise<void>;
}

class AuthPage extends Block<AuthPageProps> {
  protected template = template;

  private isSubmitting = false;

  protected events: EventListType = {
    submit: (event: Event) =>
      submitForm(event, this.children.filter(isValidatable), (values) => this.send(values)),
  };

  private async send(values: FormValues): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    showStatus(this.refs.status, '');

    try {
      await this.props.onSubmit(values);
    } catch (error) {
      showStatus(this.refs.status, getErrorText(error));
    } finally {
      this.isSubmitting = false;
    }
  }
}

const SIGN_UP_FIELDS = ['first_name', 'second_name', 'login', 'email', 'password', 'phone'] as const;

export class LoginPage extends AuthPage {
  constructor() {
    super({
      title: 'Вход',
      formName: 'login',
      submitText: 'Войти',
      linkText: 'Нет аккаунта?',
      linkHref: Routes.Register,
      onSubmit: (values) => AuthController.signIn(pickStrings(values, ['login', 'password'])),
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
      linkHref: Routes.Login,
      onSubmit: (values) => AuthController.signUp(pickStrings(values, SIGN_UP_FIELDS)),
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
