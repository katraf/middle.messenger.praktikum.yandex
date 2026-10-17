import Handlebars, { type HelperOptions } from 'handlebars';
import type Block from './Block';
import type { BlockOwnProps } from './Block';

export interface ComponentConstructor {
  componentName: string;
  new (props: any): Block<object>;
}

let uniqueId = 0;

export const registerComponent = (Component: ComponentConstructor): void => {
  Handlebars.registerHelper(Component.componentName, function (this: unknown, ...args: unknown[]) {
    const options = args[args.length - 1] as HelperOptions;
    const context = args.length > 1 && typeof args[0] === 'object' ? args[0] : {};
    const props: Record<string, unknown> = { ...context, ...options.hash };

    const component = new Component(props);
    const getElement = (): Element => {
      const element = component.element();
      if (!element) {
        throw new Error(`Component ${Component.componentName} has no root element`);
      }
      return element;
    };
    const id = String(++uniqueId);
    const root = options.data.root as BlockOwnProps;

    if (typeof props.ref === 'string') {
      (root.__refs ??= {})[props.ref] = getElement();
    }

    (root.__children ??= []).push({
      component,
      embed(fragment: DocumentFragment) {
        const placeholder = fragment.querySelector(`[data-component-id="${id}"]`);

        if (!placeholder) {
          throw new Error(`Can't find placeholder for component ${Component.componentName}`);
        }

        placeholder.replaceWith(getElement());
      },
    });

    return new Handlebars.SafeString(`<div data-component-id="${id}"></div>`);
  });
};
