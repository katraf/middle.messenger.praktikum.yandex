import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatsAPI } from '../api';
import { resetStore, store, type Chat, type User } from '../models';
import { MessagesController } from './MessagesController';

class FakeWebSocket extends EventTarget {
  static readonly OPEN = 1;
  static instances: FakeWebSocket[] = [];

  url: string;
  readyState = 0;
  sent: Array<{ type: string; content?: string }> = [];

  constructor(url: string) {
    super();
    this.url = url;
    FakeWebSocket.instances.push(this);
    // Сервер принимает соединение асинхронно, как настоящий
    setTimeout(() => {
      this.readyState = FakeWebSocket.OPEN;
      this.dispatchEvent(new Event('open'));
    });
  }

  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }

  close(): void {
    this.readyState = 3;
    this.dispatchEvent(new CloseEvent('close', { code: 1000, wasClean: true }));
  }

  receive(data: unknown): void {
    this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(data) }));
  }
}

const me: User = {
  id: 1, first_name: 'Тест', second_name: 'Тестов', display_name: null,
  login: 'tester', email: 'tester@example.com', phone: '+70000000001', avatar: null,
};

const chat: Chat = { id: 7, title: 'Тестовый чат', avatar: null, unread_count: 0, created_by: 1, last_message: null };

const message = (id: number, minutes: number, userId = 2) => ({
  id, user_id: userId, chat_id: 7, type: 'message', content: `Сообщение ${id}`,
  time: new Date(Date.UTC(2026, 10, 18, 10, minutes)).toISOString(),
});

const lastSocket = (): FakeWebSocket => FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
/** Дождаться, пока сокет «откроется» и контроллер отправит первый запрос */
const settle = () => new Promise((resolve) => setTimeout(resolve, 10));
const contents = (): string[] => store.getState().messages.map((item) => item.content);

describe('MessagesController', () => {
  let stopWatching: () => void;

  beforeEach(async () => {
    FakeWebSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeWebSocket);
    vi.spyOn(ChatsAPI, 'getToken').mockResolvedValue({ token: 'secret' });
    stopWatching = MessagesController.watch();

    // Открытие чата в Store — контроллер подключается сам
    store.set({ user: me, chats: [chat], activeChatId: chat.id });
    await settle();
  });

  afterEach(() => {
    stopWatching();
    resetStore();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('берёт токен и подключается к сокету чата', () => {
    expect(ChatsAPI.getToken).toHaveBeenCalledWith(7);
    expect(lastSocket().url).toBe('wss://ya-praktikum.tech/ws/chats/1/7/secret');
    expect(store.getState().messagesStatus).toBe('ready');
  });

  it('сразу запрашивает последние сообщения', () => {
    expect(lastSocket().sent).toEqual([{ type: 'get old', content: '0' }]);
  });

  it('историю (от новых к старым) показывает от старых к новым', () => {
    lastSocket().receive([message(3, 3), message(2, 2), message(1, 1)]);

    expect(contents()).toEqual(['Сообщение 1', 'Сообщение 2', 'Сообщение 3']);
    expect(store.getState().hasMoreMessages).toBe(false);
  });

  it('если пришло 20 сообщений, можно загрузить ещё со смещением', () => {
    lastSocket().receive(Array.from({ length: 20 }, (_, index) => message(40 - index, 40 - index)));

    expect(store.getState().hasMoreMessages).toBe(true);

    MessagesController.loadOlder();

    expect(lastSocket().sent.at(-1)).toEqual({ type: 'get old', content: '20' });
  });

  it('новое сообщение добавляется в конец и обновляет превью чата', () => {
    lastSocket().receive([message(1, 1)]);

    lastSocket().receive({ ...message(2, 2, 1), chat_id: undefined, id: '2', user_id: '1' });

    expect(contents()).toEqual(['Сообщение 1', 'Сообщение 2']);
    expect(store.getState().messages[1]).toMatchObject({ id: 2, user_id: 1 });
    expect(store.getState().chats[0].last_message?.content).toBe('Сообщение 2');
    expect(store.getState().chats[0].last_message?.user.login).toBe('tester');
  });

  it('не дублирует сообщения и пропускает служебные', () => {
    lastSocket().receive([message(1, 1)]);
    lastSocket().receive(message(1, 1));
    lastSocket().receive({ type: 'user connected', content: '2' });

    expect(contents()).toEqual(['Сообщение 1']);
  });

  it('send() отправляет текст в сокет', () => {
    MessagesController.send('Привет');

    expect(lastSocket().sent.at(-1)).toEqual({ type: 'message', content: 'Привет' });
  });

  it('при смене чата закрывает старый сокет и подключается к новому', async () => {
    const first = lastSocket();
    const otherChat = { ...chat, id: 8 };
    store.set({ chats: [chat, otherChat], activeChatId: 8 });

    expect(first.readyState).toBe(3);

    await settle();
    expect(lastSocket().url).toBe('wss://ya-praktikum.tech/ws/chats/1/8/secret');
    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  it('при закрытии чата отключается и не подключается снова', async () => {
    const socket = lastSocket();

    store.set({ activeChatId: null });
    await settle();

    expect(socket.readyState).toBe(3);
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it('если токен не получен — статус ошибки', async () => {
    vi.spyOn(ChatsAPI, 'getToken').mockRejectedValue(new Error('network'));

    store.set({ chats: [chat, { ...chat, id: 9 }], activeChatId: 9 });
    await settle();

    expect(store.getState().messagesStatus).toBe('error');
  });

  it('reconnect() подключается к открытому чату заново', async () => {
    const first = lastSocket();

    MessagesController.reconnect();
    await settle();

    expect(first.readyState).toBe(3);
    expect(FakeWebSocket.instances).toHaveLength(2);
    expect(store.getState().messagesStatus).toBe('ready');
  });

  it('при выходе из аккаунта закрывает сокет', () => {
    const socket = lastSocket();

    resetStore();

    expect(socket.readyState).toBe(3);
    expect(() => MessagesController.send('Привет')).toThrow('Нет соединения с чатом');
  });
});
