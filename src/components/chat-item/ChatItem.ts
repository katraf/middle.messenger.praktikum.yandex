import Block, { type BlockOwnProps } from '../../core/Block';
import type { Chat } from '../../models';
import template from './chat-item.hbs?raw';
import './chat-item.pcss';

export interface ChatItemProps extends BlockOwnProps, Chat {}

export class ChatItem extends Block<ChatItemProps> {
  static componentName = 'ChatItem';

  protected template = template;
}
