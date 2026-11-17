import { beforeAll, describe, expect, it, vi } from 'vitest';
import { registerComponent } from '../../core/registerComponent';
import { Avatar } from '../avatar';
import { ChatItem, type ChatItemProps } from './ChatItem';

const props = (overrides: Partial<ChatItemProps> = {}): ChatItemProps => ({
  id: 7,
  title: 'Тестовый чат',
  href: '/messenger',
  avatarSrc: '',
  preview: 'Последнее сообщение',
  time: '14:05',
  unread: 0,
  isOwn: false,
  isActive: false,
  onSelect: () => {},
  ...overrides,
});

describe('ChatItem', () => {
  beforeAll(() => {
    registerComponent(Avatar);
  });

  it('выводит название, превью, время и счётчик непрочитанных', () => {
    const element = new ChatItem(props({ unread: 3, isOwn: true })).element() as Element;

    expect(element.querySelector('.chat-item__title')?.textContent).toBe('Тестовый чат');
    expect(element.querySelector('.chat-item__preview')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Вы: Последнее сообщение');
    expect(element.querySelector('.chat-item__time')?.textContent).toBe('14:05');
    expect(element.querySelector('.chat-item__badge')?.textContent).toBe('3');
  });

  it('без непрочитанных счётчика нет, активный чат помечен', () => {
    const element = new ChatItem(props({ isActive: true })).element() as Element;

    expect(element.querySelector('.chat-item__badge')).toBeNull();
    expect(element.classList.contains('chat-item--active')).toBe(true);
    expect(element.getAttribute('aria-current')).toBe('true');
  });

  it('клик выбирает чат без перехода по ссылке', () => {
    const onSelect = vi.fn();
    const element = new ChatItem(props({ onSelect })).element() as HTMLElement;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    element.dispatchEvent(event);

    expect(onSelect).toHaveBeenCalledWith(7);
    expect(event.defaultPrevented).toBe(true);
  });

  it('защищает от XSS в названии чата и тексте сообщения', () => {
    const xss = '<img src=x onerror=alert(1)>';
    const element = new ChatItem(props({ title: xss, preview: xss })).element() as Element;

    expect(element.querySelector('img')).toBeNull();
    expect(element.querySelector('.chat-item__title')?.textContent).toBe(xss);
  });
});
