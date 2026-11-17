import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { router } from '../../router';
import { Link } from './Link';

describe('Link', () => {
  let go: MockInstance<(pathname: string) => void>;

  beforeEach(() => {
    go = vi.spyOn(router, 'go').mockImplementation(() => {});
  });

  afterEach(() => {
    go.mockRestore();
  });

  const renderLink = (): HTMLAnchorElement => {
    const element = new Link({ href: '/settings', text: 'Профиль' }).element() as HTMLAnchorElement;
    document.body.replaceChildren(element);
    return element;
  };

  it('выводит ссылку с адресом и текстом', () => {
    const link = renderLink();

    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/settings');
    expect(link.textContent?.trim()).toBe('Профиль');
  });

  it('переходит через роутер без перезагрузки страницы', () => {
    const link = renderLink();
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(go).toHaveBeenCalledWith('/settings');
  });

  it('не перехватывает Ctrl+клик (открыть в новой вкладке)', () => {
    const link = renderLink();
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    let preventedByLink = true;
    // Запоминаем решение ссылки и сами отменяем переход, чтобы тестовое окружение никуда не уходило
    document.addEventListener('click', (bubbled) => {
      preventedByLink = bubbled.defaultPrevented;
      bubbled.preventDefault();
    }, { once: true });

    link.dispatchEvent(event);

    expect(preventedByLink).toBe(false);
    expect(go).not.toHaveBeenCalled();
  });

  it('с иконкой выводит стрелку и aria-label', () => {
    const element = new Link({ href: '/messenger', text: '', icon: 'back', label: 'Вернуться к чатам' }).element() as HTMLElement;

    expect(element.querySelector('svg')).not.toBeNull();
    expect(element.getAttribute('aria-label')).toBe('Вернуться к чатам');
  });
});
