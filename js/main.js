/**
 * Main Application Entry Point
 * Maintained by ARCHITECT-AGENT
 */

import { state } from './state.js';
import { updateI18nDOM } from './i18n.js';
import { initUI } from './ui/dom.js';

document.addEventListener('DOMContentLoaded', () => {
    updateI18nDOM();
    initUI(state);
});
