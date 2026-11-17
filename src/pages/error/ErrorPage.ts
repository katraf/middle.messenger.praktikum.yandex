import Block, { type BlockOwnProps } from '../../core/Block';
import { Routes } from '../../router';
import template from './error.hbs?raw';
import './error.pcss';

interface ErrorPageProps extends BlockOwnProps {
  code: string;
  text: string;
  backHref?: string;
}

class ErrorPage extends Block<ErrorPageProps> {
  protected template = template;
}

export class NotFoundPage extends ErrorPage {
  constructor() {
    super({ code: '404', text: 'Такой страницы нет', backHref: Routes.Messenger });
  }
}

export class ServerErrorPage extends ErrorPage {
  constructor() {
    super({ code: '500', text: 'Сервер не отвечает. Мы уже чиним', backHref: Routes.Messenger });
  }
}
