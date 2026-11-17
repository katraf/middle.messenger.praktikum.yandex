import { describe, expect, it } from 'vitest';
import { Message } from './Message';

const XSS = '<img src=x onerror="window.__xss = true"><script>window.__xss = true</script>';

describe('Message', () => {
  it('выводит текст, время и автора', () => {
    const element = new Message({ text: 'Привет', time: '14:05', author: 'Тестер' }).element() as Element;

    expect(element.querySelector('.message__text')?.textContent).toBe('Привет');
    expect(element.querySelector('.message__time')?.textContent).toBe('14:05');
    expect(element.querySelector('.message__author')?.textContent).toBe('Тестер');
  });

  it('свои сообщения помечены модификатором и без автора', () => {
    const element = new Message({ text: 'Моё', time: '14:05', isOwn: true }).element() as Element;

    expect(element.classList.contains('message--own')).toBe(true);
    expect(element.querySelector('.message__author')).toBeNull();
  });

  it('защищает от XSS: HTML в тексте и имени автора выводится как текст', () => {
    const element = new Message({ text: XSS, time: '14:05', author: XSS }).element() as Element;
    document.body.replaceChildren(element);

    expect(element.querySelector('img')).toBeNull();
    expect(element.querySelector('script')).toBeNull();
    expect(element.querySelector('.message__text')?.textContent).toBe(XSS);
    expect(element.querySelector('.message__author')?.textContent).toBe(XSS);
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined();
  });

  it('кавычки в данных не выходят за пределы атрибута', () => {
    const element = new Message({ text: 'x', time: '14:05', datetime: '" onmouseover="alert(1)' }).element() as Element;
    const time = element.querySelector('time') as Element;

    expect(time.getAttribute('onmouseover')).toBeNull();
    expect(time.getAttribute('datetime')).toBe('" onmouseover="alert(1)');
  });
});
