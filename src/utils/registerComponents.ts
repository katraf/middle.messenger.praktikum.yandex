import Handlebars from 'handlebars';
import * as components from '../components';

export const registerComponents = (): void => {
  Object.entries(components).forEach(([name, template]) => {
    Handlebars.registerPartial(name, template);
  });
};
