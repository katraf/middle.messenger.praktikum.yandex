import Block, { type BlockOwnProps } from '../../core/Block';
import { Routes } from '../../router';
import template from './error.hbs?raw';
import './error.pcss';

interface ErrorPageProps extends BlockOwnProps {
  code: string;
  text: string;
  backHref: string;
  backText: string;
  /** Обычная ссылка с перезагрузкой: приложение заново проверит сессию и связь с сервером */
  reload?: boolean;
}

class ErrorPage extends Block<ErrorPageProps> {
  protected template = template;
}

export class NotFoundPage extends ErrorPage {
  constructor() {
    super({ code: '404', text: 'Такой страницы нет', backHref: Routes.Messenger, backText: 'Назад к чатам' });
  }
}

export class ServerErrorPage extends ErrorPage {
  constructor() {
    super({
      code: '500',
      text: 'Сервер не отвечает. Мы уже чиним',
      backHref: Routes.Messenger,
      backText: 'Попробовать снова',
      reload: true,
    });
  }
}
