import { describe, it, expect, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { createRouter, createMemoryHistory } from 'vue-router';
import Tile from '@/components/TilePad/Tile.vue';
import settings from '@/store/modules/settings';
import tilePad from '@/store/modules/tilePad';
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

const sentenceModePropsData = {
	name: 'Test Key Board Tile',
	text: ' ',
	accent: 'mint',
	image: 'https://img.icons8.com/officexs/64/000000/keyboard.png',
	navigation: 'keyboard',
	id: 11,
};

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

	return shallowMount(Tile, {
		global: {
			plugins: [store, router],
			stubs: {
				'v-btn': { template: '<button><slot /></button>' },
				'v-container': { template: '<div><slot /></div>' },
				'v-row': { template: '<div><slot /></div>' },
				'v-card-text': { template: '<div><slot /></div>' },
				'v-img': { template: '<img />' },
			}
		},
		props: {
			tileData: {
				name: 'Test',
				text: 'Test Tile',
				accent: 'peach',
				image: 'https://img.icons8.com/officexs/64/000000/cancel-2.png',
				id: 0
			},
			tilePage: 'home',
			inSentenceComponent: false,
			sentenceIndex: null
		}
	});
}

describe('Tile.vue', () => {
	let wrapper;

	beforeEach(() => {
		wrapper = getWrapper();
	});

	it('emits speakText event when clicked', async () => {
		wrapper.vm.tileClickedEvent();
		await wrapper.vm.$nextTick();
		const emitted = wrapper.emitted('speakText');
		expect(emitted.length).toBe(1);
		expect(emitted[0].length).toBe(1);
		expect(emitted[0][0]).toBe('Test Tile');
	});

	it('has a tileData object', () => {
		expect(typeof wrapper.vm.tileData).toBe('object');
	});

	it('sets tile color based on accent string', () => {
		expect(wrapper.vm.cardColor).toBe('#FFB7B2');
	});

	it('Keyboard tile opens on click', async () => {
		await wrapper.setProps({ tileData: sentenceModePropsData });
		wrapper.vm.tileClickedEvent();
		await new Promise(resolve => setTimeout(resolve, 20));
		expect(wrapper.vm.$route.params.layout).toBe(sentenceModePropsData.navigation);
	});

	it('drag handle is not visible', async () => {
		expect(wrapper.find('#drag-handle').exists()).toBe(false);
	});
});

describe('Tile.vue (edit mode)', () => {
	let wrapper;

	beforeEach(async () => {
		wrapper = getWrapper();
		wrapper.vm.$store.commit('tilePad/SET_EDIT_MODE', true);
		await wrapper.vm.$nextTick();
	});

	it('opens edit dialog when clicked', async () => {
		wrapper.vm.tileClickedEvent();
		expect(wrapper.vm.$store.state.tilePad.currentTileBeingEdited.name).toBe('Test');
		expect(wrapper.vm.$store.state.tilePad.editDialogVisibility).toBe(true);
	});

	it('drag handle is visible', async () => {
		expect(wrapper.find('#drag-handle').exists()).toBe(true);
	});

	it('new tile is shown', async () => {
		wrapper.vm.$store.state.tilePad.editDialogVisibility = false;
		await wrapper.setProps({ newTile: true });
		wrapper.vm.tileClickedEvent();
		await wrapper.vm.$nextTick();

		expect(wrapper.vm.$store.state.tilePad.currentTileBeingEdited.newTile).toBe(true);
		expect(wrapper.vm.$store.state.tilePad.editDialogVisibility).toBe(true);
	});
});
