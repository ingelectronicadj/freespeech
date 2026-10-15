import { describe, it, expect, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import Sentence from '@/components/Sentence/Sentence.vue';
import Tile from '@/components/TilePad/Tile.vue';
import i18n from '@/i18n';

const tilePadToDisplay = [
	{
		name: 'No',
		text: 'No',
		accent: 'peach',
		image: 'https://img.icons8.com/officexs/64/000000/cancel-2.png',
		id: 0,
		messages: {
			de: {
				name: 'Nein',
				text: 'nein'
			}
		}
	},
	{
		name: 'Little',
		text: 'Little',
		image: 'https://img.icons8.com/officexs/64/000000/cursor.png',
		id: 1,
		accent: 'white',
		messages: {
			de: {
				name: 'Klein',
				text: 'klein'
			}
		}
	},
	{
		name: 'Off',
		text: 'Off',
		image: 'https://img.icons8.com/officexs/64/000000/disclaimer.png',
		id: 2,
		accent: 'white',
		messages: {
			de: {
				name: 'Aus',
				text: 'aus'
			}
		}
	},
];

function getWrapper () {
	return shallowMount(Sentence, {
		props: {
			tilePadToDisplay
		},
		global: {
			plugins: [i18n],
			stubs: {
				'v-card': { template: '<div><slot /></div>' },
				'v-card-title': { template: '<div><slot /></div>' },
				'v-card-text': { template: '<div><slot /></div>' },
				'v-row': { template: '<div><slot /></div>' },
				'v-col': { template: '<div><slot /></div>' },
				'v-btn': { template: '<button><slot /></button>' },
				'v-icon': { template: '<span><slot /></span>' },
				'v-spacer': { template: '<span />' },
				'v-divider': { template: '<hr />' },
				'v-container': { template: '<div><slot /></div>' },
			}
		}
	});
}

describe('Sentence.vue', () => {
	let wrapper;

	beforeEach(() => {
		wrapper = getWrapper();
	});

	it('Amount of tiles match tiles shown and tiles are populated', async () => {
		const tiles = wrapper.findAllComponents(Tile);
		expect(tiles.length).toBe(3);
	});

	it('builds plain text sentence from selected tiles for copying', () => {
		expect(wrapper.vm.constructedText).toBe('No Little Off');
		const preview = wrapper.find('#sentenceTextOutput');
		expect(preview.exists()).toBe(true);
		expect(preview.text()).toContain('No Little Off');
	});

	it('copies constructed sentence text and emits copySentence event', async () => {
		await wrapper.vm.copySentence();
		const emitted = wrapper.emitted('copySentence');
		expect(emitted).toBeTruthy();
		expect(emitted[0][0]).toBe('No Little Off');
		expect(wrapper.vm.feedbackMessage).toBe('Message copied to clipboard!');
	});

	it('emits insertSentence and posts message to host window when inserting', async () => {
		wrapper.vm.insertSentenceInHost();
		const emitted = wrapper.emitted('insertSentence');
		expect(emitted).toBeTruthy();
		expect(emitted[0][0]).toBe('No Little Off');
		expect(wrapper.vm.feedbackMessage).toBe('Message inserted into active field!');
	});
});