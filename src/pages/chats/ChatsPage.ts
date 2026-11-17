import Block, { type BlockOwnProps, type EventListType } from '../../core/Block';
import { getResourceUrl } from '../../api';
import type { ChatItemProps, MessageProps } from '../../components';
import { ChatController, MessagesController } from '../../controllers';
import { store, type AppState, type Chat, type ChatMessage, type ChatUser } from '../../models';
import { router, Routes } from '../../router';
import { formatChatTime, formatMessageDay, formatMessageTime } from '../../utils/formatDate';
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

type MessageView = Omit<MessageProps, keyof BlockOwnProps>;

interface MessageGroup {
  day: string;
  messages: MessageView[];
}

/** Параметр адреса с открытым чатом: /messenger?chat=12 */
const CHAT_PARAM = 'chat';

const FEED_PLACEHOLDERS: Record<AppState['messagesStatus'], string> = {
  idle: '',
  connecting: 'Подключаемся к чату…',
  ready: 'Сообщений пока нет — напишите первым',
  error: 'Сообщения не загрузились',
};

/** Насколько близко к низу ленты считаем, что пользователь «внизу» и её можно докрутить */
const STICK_TO_BOTTOM = 40;

interface ChatsPageProps extends BlockOwnProps {
  chats: Omit<ChatItemProps, keyof BlockOwnProps>[];
  activeChat: { title: string; avatarSrc: string; canDelete: boolean } | null;
  members: MemberView[];
  messageGroups: MessageGroup[];
  hasMoreMessages: boolean;
  feedPlaceholder: string;
  /** Плашка о проблемах со связью над лентой */
  connectionNotice: string;
  canRetry: boolean;
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
      if (target?.closest('[data-action="load-older"]')) {
        this.loadOlder();
      }
      if (target?.closest('[data-action="reconnect"]')) {
        MessagesController.reconnect();
      }
    },
  };

  constructor() {
    super({
      chats: [],
      activeChat: null,
      members: [],
      messageGroups: [],
      hasMoreMessages: false,
      feedPlaceholder: '',
      connectionNotice: '',
      canRetry: false,
      isMembersOpen: false,
      searchQuery: '',
      settingsHref: Routes.Settings,
      onDeleteChat: () => {
        void this.deleteChat();
      },
    });

    this.props = { ...this.props, ...this.mapStateToProps(store.getState()) };

    // Список чатов загружается один раз при открытии страницы; после F5 открываем чат из адреса.
    // Параметр читаем сразу: пока чаты грузятся, адрес синхронизируется с ещё пустым состоянием
    const chatFromUrl = Number(router.getQueryParam(CHAT_PARAM));
    ChatController.fetchChats()
      .then(() => this.restoreChat(chatFromUrl))
      .catch((error) => showStatus(this.refs.sidebarStatus, getErrorText(error)));
  }

  protected componentDidMount(): void {
    this.unsubscribe = store.subscribe(() => {
      const state = store.getState();
      this.syncChatToUrl(state.activeChatId);
      this.setProps(this.mapStateToProps(state));
    });
  }

  private restoreChat(chatId: number): void {
    const { chats, activeChatId } = store.getState();

    // Нет в адресе, уже открыт, удалён или пользователя из него исключили
    if (!chatId || activeChatId !== null || !chats.some((chat) => chat.id === chatId)) {
      return;
    }

    this.selectChat(chatId);
  }

  private syncChatToUrl(activeChatId: number | null): void {
    router.setQueryParam(CHAT_PARAM, activeChatId === null ? null : String(activeChatId));
  }

  protected componentWillUnmount(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  /**
   * Страница перерисовывается целиком на каждое новое сообщение,
   * поэтому сохраняем недописанный текст, фокус и положение прокрутки ленты.
   */
  protected render(): void {
    const input = this.refs.messageInput;
    const draft = input instanceof HTMLInputElement ? input.value : '';
    const hadFocus = Boolean(input) && document.activeElement === input;

    const oldFeed = this.refs.feed;
    const distanceFromBottom = oldFeed ? oldFeed.scrollHeight - oldFeed.scrollTop : 0;
    const wasAtBottom = !oldFeed || distanceFromBottom - oldFeed.clientHeight < STICK_TO_BOTTOM;

    super.render();

    const newInput = this.refs.messageInput;
    if (newInput instanceof HTMLInputElement) {
      newInput.value = draft;
      if (hadFocus) {
        newInput.focus();
      }
    }

    const feed = this.refs.feed;
    if (feed) {
      // Внизу — докручиваем к новому сообщению; иначе (подгрузка истории) — остаёмся на месте
      feed.scrollTop = wasAtBottom ? feed.scrollHeight : feed.scrollHeight - distanceFromBottom;
    }
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
      messageGroups: this.groupMessages(state),
      hasMoreMessages: state.hasMoreMessages,
      feedPlaceholder: FEED_PLACEHOLDERS[state.messagesStatus],
      ...this.getConnectionNotice(state),
    };
  }

  /** Сообщения уже на экране, а связь пропала — говорим об этом над лентой */
  private getConnectionNotice(state: Readonly<AppState>): Pick<ChatsPageProps, 'connectionNotice' | 'canRetry'> {
    if (state.messagesStatus === 'error') {
      return { connectionNotice: 'Нет связи с чатом. Новые сообщения не приходят.', canRetry: true };
    }
    if (state.messagesStatus === 'connecting' && state.messages.length > 0) {
      return { connectionNotice: 'Связь с чатом прервалась, переподключаемся…', canRetry: false };
    }
    return { connectionNotice: '', canRetry: false };
  }

  /** Сообщения по дням: [{ day: 'Сегодня', messages: [...] }] */
  private groupMessages(state: Readonly<AppState>): MessageGroup[] {
    return state.messages.reduce<MessageGroup[]>((groups, message) => {
      const day = formatMessageDay(message.time);
      const view = this.toMessage(message, state);
      const last = groups[groups.length - 1];

      if (last && last.day === day) {
        last.messages.push(view);
      } else {
        groups.push({ day, messages: [view] });
      }
      return groups;
    }, []);
  }

  private toMessage(message: ChatMessage, state: Readonly<AppState>): MessageView {
    const isOwn = message.user_id === state.user?.id;
    const author = isOwn ? undefined : state.activeChatUsers.find((user) => user.id === message.user_id);
    const authorName = author ? author.display_name || `${author.first_name} ${author.second_name}` : '';

    let text = message.content;
    if (message.type === 'file') {
      text = `Файл: ${message.file?.filename ?? message.content}`;
    } else if (message.type === 'sticker') {
      text = 'Стикер';
    }

    return {
      text,
      time: formatMessageTime(message.time),
      datetime: message.time,
      author: authorName,
      isOwn,
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

    ChatController.selectChat(chatId).catch((error) => showStatus(this.refs.composerStatus, getErrorText(error)));
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

  /** Отправка через WebSocket; сообщение появится в ленте, когда сервер разошлёт его участникам */
  private async sendMessage(values: FormValues, form: HTMLFormElement): Promise<void> {
    const { message } = pickStrings(values, ['message']);

    if (validate('message', message)) {
      return;
    }

    try {
      MessagesController.send(message.trim());
      form.reset();
      showStatus(this.refs.composerStatus, '');
    } catch (error) {
      showStatus(this.refs.composerStatus, getErrorText(error));
    }
  }

  private loadOlder(): void {
    try {
      MessagesController.loadOlder();
    } catch (error) {
      showStatus(this.refs.composerStatus, getErrorText(error));
    }
  }
}
