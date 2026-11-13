// Cromanenos. Todo ocorre no navegador: os ficheiros lense do disco local e
// nunca se envían a ningures (ver a Content-Security-Policy de index.html).
import { initCompositor } from './compositor.js';
import { initUI, api } from './ui.js';
import * as preview from './preview.js';

const canvas = document.getElementById('view');
initCompositor(canvas);
initUI(canvas);
preview.start();

window.__cromanenos = api;
