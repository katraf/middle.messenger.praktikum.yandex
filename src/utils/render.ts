/**
 * Вставляет HTML-строку шаблона в контейнер одной операцией.
 * Используем DocumentFragment вместо innerHTML.
 */
export const render = (selector: string, html: string): void => {
  const root = document.querySelector(selector);

  if (!root) {
    throw new Error(`Root element "${selector}" not found`);
  }

  const fragment = document.createRange().createContextualFragment(html);
  root.replaceChildren(fragment);
};
