import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router';
import TilePad from './views/TilePad.vue';
import About from './views/About.vue';
import Settings from './views/Settings.vue';

export const routes = [
	{
		path: '/layout/:layout',
		name: 'tilePadWithRoute',
		component: TilePad,
		props: true
	},
	{
		path: '/',
		name: 'tilePad',
		component: TilePad
	},
	{
		path: '/acerca-de',
		name: 'about',
		component: About
	},
	{ path: '/about', redirect: '/acerca-de' },
	{
		path: '/ajustes',
		name: 'settings',
		component: Settings
	},
	{ path: '/settings', redirect: '/ajustes' }
];

export function createAppRouter (history = createWebHistory()) {
	return createRouter({
		history,
		routes
	});
}

const isTest = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test';
export default createAppRouter(isTest ? createMemoryHistory() : createWebHistory());
