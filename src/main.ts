import './styles/index.pcss';
import { registerComponents } from './utils/registerComponents';
import { resolvePage } from './router';

registerComponents();

const root = document.querySelector('#app');

if (!root) {
  throw new Error('Root element #app not found');
}

const page = resolvePage(window.location.pathname).element();

if (page) {
  root.replaceChildren(page);
}
