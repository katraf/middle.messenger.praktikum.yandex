import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WSEvents, WSTransport } from './WSTransport';

/** Подмена WebSocket: открытие, входящие сообщения и закрытие управляются из теста */
class FakeWebSocket extends EventTarget {
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  static last: FakeWebSocket | null = null;

  url: string;
  readyState = 0;
  sent: string[] = [];

  constructor(url: string) {
    super();
    this.url = url;
    FakeWebSocket.last = this;
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(code = 1000): void {
    this.serverClose(code, true);
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.dispatchEvent(new Event('open'));
  }

  receive(data: unknown): void {
    this.dispatchEvent(new MessageEvent('message', { data: typeof data === 'string' ? data : JSON.stringify(data) }));
  }

  fail(): void {
    this.dispatchEvent(new Event('error'));
  }

  serverClose(code: number, wasClean: boolean): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.dispatchEvent(new CloseEvent('close', { code, wasClean }));
  }
}

const socket = (): FakeWebSocket => FakeWebSocket.last as FakeWebSocket;
const sent = (): unknown[] => socket().sent.map((data) => JSON.parse(data));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('WSTransport', () => {
  beforeEach(() => {
    FakeWebSocket.last = null;
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('подключается по адресу и резолвит connect() после open', async () => {
    const transport = new WSTransport('wss://test/ws/chats/1/2/token');
    const connected = transport.connect();

    expect(socket().url).toBe('wss://test/ws/chats/1/2/token');
    socket().open();

    await expect(connected).resolves.toBeUndefined();
    expect(transport.isOpen).toBe(true);
    transport.close();
  });

  it('реджектит connect(), если соединение не открылось', async () => {
    const transport = new WSTransport('wss://test');
    const connected = transport.connect();

    socket().fail();

    await expect(connected).rejects.toThrow('Не удалось подключиться к чату');
  });

  it('send() отправляет данные в JSON', async () => {
    const transport = new WSTransport('wss://test');
    const connected = transport.connect();
    socket().open();
    await connected;

    transport.send({ type: 'message', content: 'Привет' });

    expect(sent()).toEqual([{ type: 'message', content: 'Привет' }]);
    transport.close();
  });

  it('send() без открытого соединения бросает ошибку', () => {
    const transport = new WSTransport('wss://test');

    expect(() => transport.send({ type: 'message', content: '' })).toThrow('Нет соединения с чатом');
  });

  it('разбирает входящий JSON и пропускает pong и не-JSON', async () => {
    const transport = new WSTransport('wss://test');
    const onMessage = vi.fn();
    transport.on(WSEvents.Message, onMessage);
    const connected = transport.connect();
    socket().open();
    await connected;

    socket().receive({ type: 'pong' });
    socket().receive('not json');
    socket().receive({ id: 1, type: 'message', content: 'Привет' });

    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith({ id: 1, type: 'message', content: 'Привет' });
    transport.close();
  });

  it('периодически отправляет ping', async () => {
    const transport = new WSTransport('wss://test', 10);
    const connected = transport.connect();
    socket().open();
    await connected;

    await wait(35);

    expect(sent().length).toBeGreaterThanOrEqual(2);
    expect(sent().every((data) => JSON.stringify(data) === '{"type":"ping"}')).toBe(true);
    transport.close();
  });

  it('после закрытия перестаёт слать ping и сообщает о close', async () => {
    const transport = new WSTransport('wss://test', 10);
    const onClose = vi.fn();
    transport.on(WSEvents.Close, onClose);
    const connected = transport.connect();
    socket().open();
    await connected;
    const fake = socket();

    fake.serverClose(1006, false);
    const countAfterClose = fake.sent.length;
    await wait(30);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0]).toMatchObject({ code: 1006, wasClean: false });
    expect(fake.sent.length).toBe(countAfterClose);
    expect(transport.isOpen).toBe(false);
  });
});
