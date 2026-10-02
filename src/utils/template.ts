import Handlebars from 'handlebars';

/**
 * Компилирует шаблон один раз и возвращает функцию рендера страницы.
 */
export const createPage = <TContext extends object>(
  source: string,
  context: TContext,
): (() => string) => {
  const template = Handlebars.compile<TContext>(source);
  return () => template(context);
};
