import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, md } from 'vuetify/iconsets/md';

export default createVuetify({
	theme: {
		defaultTheme: 'light',
		themes: {
			light: {
				dark: false,
				colors: {
					background: '#F1F5F9',
					surface: '#FFFFFF',
					primary: '#0F766E',
					secondary: '#0284C7',
					success: '#15803D',
					warning: '#D97706',
					error: '#DC2626',
					info: '#2563EB'
				}
			}
		}
	},
	icons: {
		defaultSet: 'md',
		aliases,
		sets: {
			md
		}
	}
});
