import './styles/index.pcss';
import { registerComponents } from './utils/registerComponents';
import { render } from './utils/render';
import { handleForms } from './utils/handleForms';
import { resolvePage } from './router';

registerComponents();
render('#app', resolvePage(window.location.pathname));
handleForms();
