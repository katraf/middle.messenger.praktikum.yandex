import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Block, { type BlockOwnProps, type EventListType } from './Block';
import { registerComponent } from './registerComponent';

interface CounterProps extends BlockOwnProps {
  count: number;
  label?: string;
  onIncrement?: () => void;
}

class Counter extends Block<CounterProps> {
  static componentName = 'TestCounter';

  mounted = 0;

  unmounted = 0;

  protected template = '<button class="counter" type="button">{{label}}: {{count}}</button>';

  protected events: EventListType = {
    click: () => this.props.onIncrement?.(),
  };

  protected componentDidMount(): void {
    this.mounted += 1;
  }

  protected componentWillUnmount(): void {
    this.unmounted += 1;
  }
}

interface PanelProps extends BlockOwnProps {
  title: string;
}

class Panel extends Block<PanelProps> {
  protected template = `
    <section class="panel">
      <h2 ref="title">{{title}}</h2>
      {{{ TestCounter count=3 label="Вложенный" ref="counter" }}}
    </section>
  `;

  getRefs(): Record<string, Element> {
    return this.refs;
  }
}

describe('Block', () => {
  beforeAll(() => {
    registerComponent(Counter);
  });

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('создаёт элемент по шаблону и props', () => {
    const element = new Counter({ count: 1, label: 'Кликов' }).element();

    expect(element?.tagName).toBe('BUTTON');
    expect(element?.textContent).toBe('Кликов: 1');
  });

  it('экранирует текст из props', () => {
    const element = new Counter({ count: 0, label: '<b>жирный</b>' }).element();

    expect(element?.querySelector('b')).toBeNull();
    expect(element?.textContent).toBe('<b>жирный</b>: 0');
  });

  it('setProps перерисовывает компонент и заменяет элемент в DOM', () => {
    const counter = new Counter({ count: 1, label: 'Кликов' });
    document.body.append(counter.element() as Element);

    counter.setProps({ count: 2 });

    expect(document.body.children).toHaveLength(1);
    expect(document.body.textContent).toBe('Кликов: 2');
  });

  it('навешивает события на корневой элемент и сохраняет их после перерисовки', () => {
    const onIncrement = vi.fn();
    const counter = new Counter({ count: 0, onIncrement });
    document.body.append(counter.element() as Element);

    (counter.element() as HTMLElement).click();
    counter.setProps({ count: 1 });
    (counter.element() as HTMLElement).click();

    expect(onIncrement).toHaveBeenCalledTimes(2);
  });

  it('вызывает componentDidMount после рендера и componentWillUnmount перед перерисовкой', () => {
    const counter = new Counter({ count: 0 });
    counter.element();

    expect(counter.mounted).toBe(1);
    expect(counter.unmounted).toBe(0);

    counter.setProps({ count: 1 });

    expect(counter.mounted).toBe(2);
    expect(counter.unmounted).toBe(1);
  });

  it('destroy() снимает обработчики и удаляет элемент из DOM', () => {
    const onIncrement = vi.fn();
    const counter = new Counter({ count: 0, onIncrement });
    const element = counter.element() as HTMLElement;
    document.body.append(element);

    counter.destroy();
    element.click();

    expect(document.body.children).toHaveLength(0);
    expect(counter.unmounted).toBe(1);
    expect(onIncrement).not.toHaveBeenCalled();
  });

  it('встраивает вложенные компоненты и собирает refs', () => {
    const panel = new Panel({ title: 'Панель' });
    const element = panel.element() as Element;
    const refs = panel.getRefs();

    expect(element.querySelector('.counter')?.textContent).toBe('Вложенный: 3');
    expect(element.querySelector('[data-component-id]')).toBeNull();
    expect(refs.title.textContent).toBe('Панель');
    expect(refs.counter).toBe(element.querySelector('.counter'));
    expect(element.querySelector('[ref]')).toBeNull();
  });
});
