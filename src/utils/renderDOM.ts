import type Block from '../core/Block';

/** Монтирует блок в контейнер, заменяя всё его содержимое: в DOM остаётся одна страница */
export function render(query: string, block: Block<object>): Element {
  const root = document.querySelector(query);

  if (!root) {
    throw new Error(`Root element "${query}" not found`);
  }

  const element = block.element();
  if (element) {
    root.replaceChildren(element);
  }

  return root;
}
