import { describe, expect, it, vi } from 'vitest';
import { EventBus } from './EventBus';

type Events = { message: [string, number]; ready: [] };

describe('EventBus', () => {
  it('вызывает подписчиков с аргументами события', () => {
    const bus = new EventBus<Events>();
    const handler = vi.fn();
    bus.on('message', handler);

    bus.emit('message', 'текст', 1);

    expect(handler).toHaveBeenCalledWith('текст', 1);
  });

  it('off() отписывает обработчик', () => {
    const bus = new EventBus<Events>();
    const handler = vi.fn();
    bus.on('ready', handler);
    bus.off('ready', handler);

    bus.emit('ready');

    expect(handler).not.toHaveBeenCalled();
  });

  it('событие без подписчиков ничего не ломает', () => {
    const bus = new EventBus<Events>();

    expect(() => bus.emit('ready')).not.toThrow();
  });

  it('обработчик может отписаться во время рассылки', () => {
    const bus = new EventBus<Events>();
    const second = vi.fn();
    const first = vi.fn(() => bus.off('ready', first));
    bus.on('ready', first);
    bus.on('ready', second);

    bus.emit('ready');
    bus.emit('ready');

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
  });
});
