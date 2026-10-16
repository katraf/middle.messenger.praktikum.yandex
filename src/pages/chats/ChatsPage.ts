import Block, { type BlockOwnProps, type EventListType } from '../../core/Block';
import { ChatController } from '../../controllers';
import type { Chat, Message } from '../../models';
import { submitForm, type FormValues } from '../../utils/form';
import { validate } from '../../utils/validation';
import template from './chats.hbs?raw';
import './chats.pcss';

interface ChatsPageProps extends BlockOwnProps {
  chats: Chat[];
  activeChat?: Chat;
  messages: Message[];
}

export class ChatsPage extends Block<ChatsPageProps> {
  protected template = template;

  protected events: EventListType = {
    submit: (event: Event) => submitForm(event, [], (values, form) => this.handleSubmit(values, form)),
  };

  constructor() {
    super({
      chats: ChatController.getChats(),
      activeChat: ChatController.getActiveChat(),
      messages: ChatController.getMessages(),
    });
  }

  private handleSubmit(values: FormValues, form: HTMLFormElement): void {
    if (form.name !== 'message') {
      return;
    }

    const text = String(values.message ?? '');
    if (validate('message', text)) {
      return;
    }

    // Новый массив сообщений → setProps видит изменение и перерисовывает ленту
    this.setProps({ messages: ChatController.sendMessage(text) });
  }
}
