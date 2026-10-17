import Block, { type BlockOwnProps } from '../../core/Block';
import template from './error.hbs?raw';
import './error.pcss';

interface ErrorPageProps extends BlockOwnProps {
  code: string;
  text: string;
}

class ErrorPage extends Block<ErrorPageProps> {
  protected template = template;
}

export class NotFoundPage extends ErrorPage {
  constructor() {
    super({ code: '404', text: 'Такой страницы нет' });
  }
}

export class ServerErrorPage extends ErrorPage {
  constructor() {
    super({ code: '500', text: 'Сервер не отвечает. Мы уже чиним' });
  }
}
