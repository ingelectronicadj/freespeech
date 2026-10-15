import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import sp from './locales/sp.json';
import de from './locales/de.json';

export const messages = {
	en,
	es: sp,
	sp,
	de
};

export default createI18n({
	legacy: false,
	globalInjection: true,
	locale: 'en',
	fallbackLocale: 'en',
	messages
});
