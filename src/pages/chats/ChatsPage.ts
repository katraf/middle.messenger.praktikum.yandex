import Block, { type BlockOwnProps, type EventListType } from '../../core/Block';
import { getResourceUrl } from '../../api';
import type { ChatItemProps } from '../../components';
import { ChatController } from '../../controllers';
import { store, type AppState, type Chat, type ChatUser } from '../../models';
import { Routes } from '../../router';
import { formatChatTime } from '../../utils/formatDate';
import { getErrorText, pickStrings, showStatus, submitForm, type FormValues } from '../../utils/form';
import { validate } from '../../utils/validation';
import template from './chats.hbs?raw';
import './chats.pcss';

interface MemberView {
  name: string;
  login: string;
  isMe: boolean;
  onRemove: () => void;
}

interface ChatsPageProps extends BlockOwnProps {
  chats: Omit<ChatItemProps, keyof BlockOwnProps>[];
  activeChat: { title: string; avatarSrc: string; canDelete: boolean } | null;
  members: MemberView[];
  isMembersOpen: boolean;
  searchQuery: string;
  settingsHref: string;
  onDeleteChat: () => void;
}

export class ChatsPage extends Block<ChatsPageProps> {
  protected template = template;

  private unsubscribe: (() => void) | null = null;

  private formHandlers: Record<string, (values: FormValues, form: HTMLFormElement) => Promise<void>> = {
    search: (values) => this.search(values),
    'create-chat': (values) => this.createChat(values),
    'add-user': (values) => this.addUser(values),
    message: (values, form) => this.sendMessage(values, form),
  };

  protected events: EventListType = {
    submit: (event: Event) =>
      submitForm(event, [], (values, form) => this.formHandlers[form.name]?.(values, form)),
    click: (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('[data-action="toggle-members"]')) {
        this.setProps({ isMembersOpen: !this.props.isMembersOpen });
      }
    },
  };

  constructor() {
    super({
      chats: [],
      activeChat: null,
      members: [],
      isMembersOpen: false,
      searchQuery: '',
      settingsHref: Routes.Settings,
      onDeleteChat: () => {
        void this.deleteChat();
      },
    });

    this.props = { ...this.props, ...this.mapStateToProps(store.getState()) };

    // Список чатов загружается один раз при открытии страницы
    ChatController.fetchChats().catch((error) => showStatus(this.refs.sidebarStatus, getErrorText(error)));
  }

  protected componentDidMount(): void {
    this.unsubscribe = store.subscribe(() => this.setProps(this.mapStateToProps(store.getState())));
  }

  protected componentWillUnmount(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private mapStateToProps(state: Readonly<AppState>): Partial<ChatsPageProps> {
    const me = state.user;
    const active = state.chats.find((chat) => chat.id === state.activeChatId);

    return {
      chats: state.chats.map((chat) => this.toChatItem(chat, state)),
      activeChat: active
        ? {
          title: active.title,
          avatarSrc: getResourceUrl(active.avatar),
          // Удалить чат может только создатель
          canDelete: active.created_by === me?.id,
        }
        : null,
      members: state.activeChatUsers.map((user) => this.toMember(user, me?.id)),
    };
  }

  private toChatItem(chat: Chat, state: Readonly<AppState>): ChatItemProps {
    const last = chat.last_message;

    return {
      id: chat.id,
      title: chat.title,
      href: Routes.Messenger,
      avatarSrc: getResourceUrl(chat.avatar),
      preview: last ? last.content : 'Нет сообщений',
      time: last ? formatChatTime(last.time) : '',
      unread: chat.unread_count,
      isOwn: Boolean(last && state.user && last.user.login === state.user.login),
      isActive: chat.id === state.activeChatId,
      onSelect: (chatId) => this.selectChat(chatId),
    };
  }

  private toMember(user: ChatUser, myId: number | undefined): MemberView {
    const fullName = `${user.first_name} ${user.second_name}`;

    return {
      name: user.display_name || fullName,
      login: user.login,
      isMe: user.id === myId,
      onRemove: () => this.removeUser(user.id),
    };
  }

  private selectChat(chatId: number): void {
    if (store.getState().activeChatId === chatId) {
      return;
    }

    ChatController.selectChat(chatId).catch((error) => showStatus(this.refs.membersStatus, getErrorText(error)));
  }

  /** Поиск по названию: GET /chats?title=... */
  private async search(values: FormValues): Promise<void> {
    const { title } = pickStrings(values, ['title']);
    const searchQuery = title.trim();

    try {
      await ChatController.fetchChats(searchQuery ? { title: searchQuery } : {});
      this.setProps({ searchQuery });
    } catch (error) {
      showStatus(this.refs.sidebarStatus, getErrorText(error));
    }
  }

  private async createChat(values: FormValues): Promise<void> {
    const { title } = pickStrings(values, ['title']);

    if (validate('required', title)) {
      showStatus(this.refs.sidebarStatus, 'Введите название чата');
      return;
    }

    try {
      this.setProps({ searchQuery: '' });
      await ChatController.createChat(title.trim());
    } catch (error) {
      showStatus(this.refs.sidebarStatus, getErrorText(error));
    }
  }

  private async addUser(values: FormValues): Promise<void> {
    const { activeChatId } = store.getState();
    const { login } = pickStrings(values, ['login']);

    if (!activeChatId) {
      return;
    }

    const error = validate('login', login.trim());
    if (error) {
      showStatus(this.refs.membersStatus, error);
      return;
    }

    try {
      await ChatController.addUser(activeChatId, login.trim());
      showStatus(this.refs.membersStatus, `Пользователь ${login.trim()} добавлен`, 'success');
    } catch (addError) {
      showStatus(this.refs.membersStatus, getErrorText(addError));
    }
  }

  private async removeUser(userId: number): Promise<void> {
    const { activeChatId } = store.getState();

    if (!activeChatId) {
      return;
    }

    try {
      await ChatController.removeUser(activeChatId, userId);
      showStatus(this.refs.membersStatus, 'Пользователь удалён из чата', 'success');
    } catch (error) {
      showStatus(this.refs.membersStatus, getErrorText(error));
    }
  }

  private async deleteChat(): Promise<void> {
    const { activeChatId, chats } = store.getState();
    const chat = chats.find((item) => item.id === activeChatId);

    if (!chat || !window.confirm(`Удалить чат «${chat.title}»? Это действие нельзя отменить.`)) {
      return;
    }

    try {
      await ChatController.deleteChat(chat.id);
      this.setProps({ isMembersOpen: false });
      showStatus(this.refs.sidebarStatus, `Чат «${chat.title}» удалён`, 'success');
    } catch (error) {
      showStatus(this.refs.membersStatus, getErrorText(error));
    }
  }

  /** Отправка сообщений появится вместе с WebSocket; пока только проверка и вывод в консоль */
  private async sendMessage(values: FormValues, form: HTMLFormElement): Promise<void> {
    const { message } = pickStrings(values, ['message']);

    if (validate('message', message)) {
      return;
    }

    form.reset();
  }
}
