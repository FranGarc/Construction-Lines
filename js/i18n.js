/**
 * Internationalization (i18n) Module
 * Maintained by ARCHITECT-AGENT
 */

import { CONFIG } from './config.js';

let currentLang = localStorage.getItem(CONFIG.STORAGE_KEYS.LANG) || 'en';

export function getLanguage() {
    return currentLang;
}

export function setLanguage(lang) {
    if (CONFIG.TRANSLATIONS[lang]) {
        currentLang = lang;
        localStorage.setItem(CONFIG.STORAGE_KEYS.LANG, lang);
    }
}

export function t(key) {
    const translations = CONFIG.TRANSLATIONS;
    return (translations[currentLang] && translations[currentLang][key]) ||
           (translations['en'] && translations['en'][key]) ||
           key;
}

export function updateI18nDOM() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translated = t(key);
        if (translated) {
            element.textContent = translated;
        }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        const translated = t(key);
        if (translated) {
            element.title = translated;
        }
    });
}
