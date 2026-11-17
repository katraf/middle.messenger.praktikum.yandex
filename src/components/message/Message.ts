import Block, { type BlockOwnProps } from '../../core/Block';
import template from './message.hbs?raw';
import './message.pcss';

export interface MessageProps extends BlockOwnProps {
  text: string;
  /** Время для показа, например «14:05» */
  time: string;
  /** Исходная дата в ISO для атрибута datetime */
  datetime?: string;
  /** Имя автора — только у чужих сообщений */
  author?: string;
  isOwn?: boolean;
}

export class Message extends Block<MessageProps> {
  static componentName = 'Message';

  protected template = template;
}
