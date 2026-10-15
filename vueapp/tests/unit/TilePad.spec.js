import { describe, it, expect, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { createRouter, createMemoryHistory } from 'vue-router';
import tilePad from '@/store/modules/tilePad';
import settings from '@/store/modules/settings';
import TilePad from '@/views/TilePad.vue';

const routes = [
	{
		path: '/',
		name: 'tilePad',
		component: TilePad
	},
	{
		path: '/layout/:layout',
		name: 'tilePadWithRoute',
		component: TilePad,
		props: true
	}
];

function getWrapper () {
	const store = createStore({
		modules: {
			tilePad: {
				...tilePad,
				state: () => JSON.parse(JSON.stringify(tilePad.state))
			},
			settings: {
				...settings,
				state: () => ({ ...settings.state })
			}
		},
	});
	const router = createRouter({
		history: createMemoryHistory(),
		routes
	});

	return shallowMount(TilePad, {
		global: {
			plugins: [store, router],
			stubs: {
				'v-container': { template: '<div><slot /></div>' },
				'v-row': { template: '<div><slot /></div>' },
				'v-col': { template: '<div><slot /></div>' },
			}
		}
	});
}

describe('TilePad.vue', () => {
	let wrapper;

	beforeEach(() => {
		wrapper = getWrapper();
	});

	it('new tile is showing in edit mode only', async () => {
		wrapper.vm.$store.commit('tilePad/SET_EDIT_MODE', false);
		await wrapper.vm.$nextTick();
		const newTileNotDuringEditMode = wrapper.find('#newTile');
		expect(newTileNotDuringEditMode.exists()).toBe(false);

		wrapper.vm.$store.commit('tilePad/SET_EDIT_MODE', true);
		await wrapper.vm.$nextTick();
		const newTileDuringEditMode = wrapper.find('#newTile');
		expect(newTileDuringEditMode.exists()).toBe(true);
	});
});
