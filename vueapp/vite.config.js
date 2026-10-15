import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

export default defineConfig({
	plugins: [
		vue(),
		vuetify({ autoImport: true }),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
		extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
	},
	server: {
		port: 8080,
		host: '0.0.0.0',
	},
	build: {
		chunkSizeWarningLimit: 800,
	},
	test: {
		environment: 'jsdom',
		globals: true,
		css: false,
		server: {
			deps: {
				inline: ['vuetify'],
			},
		},
	},
});
