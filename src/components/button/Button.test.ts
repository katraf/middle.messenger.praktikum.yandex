import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('выводит текст и по умолчанию имеет type="button"', () => {
    const element = new Button({ text: 'Отправить' }).element() as HTMLButtonElement;

    expect(element.tagName).toBe('BUTTON');
    expect(element.textContent).toBe('Отправить');
    expect(element.type).toBe('button');
  });

  it('может быть кнопкой отправки формы', () => {
    const element = new Button({ text: 'Войти', type: 'submit' }).element() as HTMLButtonElement;

    expect(element.type).toBe('submit');
  });

  it('добавляет класс варианта', () => {
    const element = new Button({ text: 'Выйти', variant: 'danger' }).element() as HTMLButtonElement;

    expect(element.classList.contains('button--danger')).toBe(true);
  });

  it('вызывает onClick при клике', () => {
    const onClick = vi.fn();
    const element = new Button({ text: 'Удалить', onClick }).element() as HTMLButtonElement;

    element.click();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
  });

  it('setProps обновляет текст', () => {
    const button = new Button({ text: 'Сохранить' });
    document.body.replaceChildren(button.element() as Element);

    button.setProps({ text: 'Сохранено' });

    expect(document.body.textContent).toBe('Сохранено');
  });
});
