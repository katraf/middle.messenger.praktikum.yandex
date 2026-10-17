import Block, { type BlockOwnProps } from '../../core/Block';
import type { Message as MessageData } from '../../models';
import template from './message.hbs?raw';
import './message.pcss';

export interface MessageProps extends BlockOwnProps, MessageData {}

export class Message extends Block<MessageProps> {
  static componentName = 'Message';

  protected template = template;
}
