import { ChatsAPI, WS_URL } from '../api';
import { WSEvents, WSTransport } from '../core/WSTransport';
import { store, type Chat, type ChatMessage } from '../models';
import { UserError } from '../utils/UserError';
import { handleApiError } from './errors';

/** Сервер отдаёт историю порциями по 20 сообщений */
const PAGE_SIZE = 20;
const RECONNECT_DELAY = 3000;
const MAX_RECONNECTS = 3;
const MESSAGE_TYPES = new Set(['message', 'file', 'sticker']);

interface Connection {
  chatId: number;
  transport: WSTransport;
}

let connection: Connection | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;

const isChatMessage = (data: unknown): data is ChatMessage =>
  typeof data === 'object' && data !== null && MESSAGE_TYPES.has(String((data as { type?: unknown }).type));

/** В разных ответах id приходят то числами, то строками — приводим к числам */
const normalize = (message: ChatMessage): ChatMessage => ({
  ...message,
  id: Number(message.id),
  user_id: Number(message.user_id),
});

const byTime = (a: ChatMessage, b: ChatMessage): number =>
  new Date(a.time).getTime() - new Date(b.time).getTime() || a.id - b.id;

/** Объединяет сообщения без дублей (по id) и сортирует от старых к новым */
const merge = (current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] => {
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort(byTime);
};

/** Новое сообщение поднимает чат наверх списка и обновляет превью */
const updateChatPreview = (chatId: number, message: ChatMessage): Chat[] => {
  const { chats, user, activeChatUsers } = store.getState();
  const chat = chats.find((item) => item.id === chatId);

  if (!chat) {
    return chats;
  }

  const author = message.user_id === user?.id ? user : activeChatUsers.find((item) => item.id === message.user_id);
  const updated: Chat = {
    ...chat,
    last_message: {
      time: message.time,
      content: message.content,
      user: {
        first_name: author?.first_name ?? '',
        second_name: author?.second_name ?? '',
        avatar: author?.avatar ?? null,
        email: author?.email ?? '',
        login: author?.login ?? '',
        phone: author?.phone ?? '',
      },
    },
  };

  return [updated, ...chats.filter((item) => item.id !== chatId)];
};

const clearReconnect = (): void => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

export const MessagesController = {
  /**
   * Связывает сокет с состоянием приложения: открыт чат — подключаемся,
   * сменился чат, чат удалён или пользователь вышел — отключаемся.
   * Контроллеры чатов и авторизации ничего не знают о сокете. Возвращает функцию остановки.
   */
  watch(): () => void {
    let watchedChatId: number | null = null;

    const onStoreChange = (): void => {
      const { user, activeChatId } = store.getState();
      const chatId = user ? activeChatId : null;

      if (chatId === watchedChatId) {
        return;
      }

      watchedChatId = chatId;
      this.disconnect();

      if (chatId !== null) {
        this.connect(chatId).catch(() => store.set({ messagesStatus: 'error' }));
      }
    };

    // Вернулась сеть, а чат остался без связи — пробуем снова
    const onOnline = (): void => {
      if (store.getState().messagesStatus === 'error') {
        this.reconnect();
      }
    };

    const unsubscribe = store.subscribe(onStoreChange);
    window.addEventListener('online', onOnline);
    onStoreChange();

    return () => {
      unsubscribe();
      window.removeEventListener('online', onOnline);
      this.disconnect();
    };
  },

  /** Повторное подключение к открытому чату (кнопка «Повторить») */
  reconnect(): void {
    const { activeChatId } = store.getState();

    if (activeChatId !== null) {
      this.connect(activeChatId).catch(() => store.set({ messagesStatus: 'error' }));
    }
  },

  /**
   * Подключается к чату: POST /chats/token/{id} → WebSocket → запрос последних сообщений.
   * Одновременно открыт только один сокет — для активного чата.
   */
  async connect(chatId: number, isReconnect = false): Promise<void> {
    this.disconnect();

    if (!isReconnect) {
      reconnectAttempts = 0;
    }

    const { user } = store.getState();
    if (!user) {
      return;
    }

    // При переподключении уже загруженные сообщения не сбрасываем
    store.set(
      isReconnect
        ? { messagesStatus: 'connecting' }
        : { messages: [], hasMoreMessages: false, messagesStatus: 'connecting' },
    );

    let token: string;
    try {
      ({ token } = await ChatsAPI.getToken(chatId));
    } catch (error) {
      store.set({ messagesStatus: 'error' });
      throw handleApiError(error);
    }

    // Пока получали токен, пользователь мог открыть другой чат
    if (store.getState().activeChatId !== chatId) {
      return;
    }

    const transport = new WSTransport(`${WS_URL}/chats/${user.id}/${chatId}/${token}`);
    connection = { chatId, transport };

    transport.on(WSEvents.Message, (data) => this.handleData(chatId, data));
    transport.on(WSEvents.Close, (event) => this.handleClose(chatId, transport, event));

    try {
      await transport.connect();
    } catch (error) {
      store.set({ messagesStatus: 'error' });
      throw error;
    }

    // Пока открывалось соединение, пользователь мог уйти в другой чат
    if (connection?.transport !== transport) {
      return;
    }

    reconnectAttempts = 0;
    store.set({ messagesStatus: 'ready' });
    // Последние 20 сообщений; после переподключения заодно подтянутся пропущенные
    transport.send({ type: 'get old', content: '0' });
  },

  /** Следующая порция истории: offset — сколько сообщений уже загружено */
  loadOlder(): void {
    this.sendToChat({ type: 'get old', content: String(store.getState().messages.length) });
  },

  send(text: string): void {
    this.sendToChat({ type: 'message', content: text });
  },

  sendToChat(data: { type: string; content: string }): void {
    if (!connection?.transport.isOpen) {
      throw new UserError('Нет соединения с чатом');
    }

    connection.transport.send(data);
  },

  disconnect(): void {
    clearReconnect();

    if (connection) {
      const { transport } = connection;
      connection = null;
      transport.close();
    }
  },

  handleData(chatId: number, data: unknown): void {
    if (connection?.chatId !== chatId) {
      return;
    }

    // Ответ на «get old»: массив от новых к старым
    if (Array.isArray(data)) {
      const history = data.filter(isChatMessage).map(normalize);
      store.set({
        messages: merge(store.getState().messages, history),
        hasMoreMessages: history.length === PAGE_SIZE,
      });
      return;
    }

    // Новое сообщение; служебные вроде «user connected» пропускаем
    if (isChatMessage(data)) {
      const message = normalize(data);
      store.set({
        messages: merge(store.getState().messages, [message]),
        chats: updateChatPreview(chatId, message),
      });
    }
  },

  /** Обрыв соединения (не наш close) — до трёх попыток переподключиться, если чат всё ещё открыт */
  handleClose(chatId: number, transport: WSTransport, event: CloseEvent): void {
    if (connection?.transport !== transport) {
      return;
    }

    connection = null;

    if (event.wasClean && event.code === 1000) {
      return;
    }

    if (reconnectAttempts >= MAX_RECONNECTS) {
      store.set({ messagesStatus: 'error' });
      return;
    }

    reconnectAttempts += 1;
    store.set({ messagesStatus: 'connecting' });
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (store.getState().activeChatId === chatId) {
        this.connect(chatId, true).catch(() => store.set({ messagesStatus: 'error' }));
      }
    }, RECONNECT_DELAY);
  },
};

