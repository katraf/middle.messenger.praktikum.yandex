import Block, { type BlockOwnProps, type EventListType } from '../../core/Block';
import template from './chat-item.hbs?raw';
import './chat-item.pcss';

/** Данные для отображения чата в списке */
export interface ChatItemProps extends BlockOwnProps {
  id: number;
  title: string;
  href: string;
  avatarSrc: string;
  preview: string;
  time: string;
  unread: number;
  isOwn: boolean;
  isActive: boolean;
  onSelect: (chatId: number) => void;
}

export class ChatItem extends Block<ChatItemProps> {
  static componentName = 'ChatItem';

  protected template = template;

  protected events: EventListType = {
    click: (event: Event) => {
      event.preventDefault();
      this.props.onSelect(this.props.id);
    },
  };
}
