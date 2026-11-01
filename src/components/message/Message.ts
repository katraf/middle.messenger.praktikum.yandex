import Block, { type BlockOwnProps } from '../../core/Block';
import template from './message.hbs?raw';
import './message.pcss';

export interface MessageProps extends BlockOwnProps {
  text: string;
  time: string;
  isOwn?: boolean;
}

export class Message extends Block<MessageProps> {
  static componentName = 'Message';

  protected template = template;
}
