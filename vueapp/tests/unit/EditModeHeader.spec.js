import { describe, it, expect, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import EditModeHeader from '@/components/EditModeHeader/EditModeHeader.vue';
import tilePad from '@/store/modules/tilePad';

function getWrapper () {
	const store = createStore({
		modules: {
			tilePad: {
				...tilePad,
				state: () => JSON.parse(JSON.stringify(tilePad.state))
			}
		},
	});
	return shallowMount(EditModeHeader, {
		global: {
			plugins: [store],
			mocks: {
				$t: () => 'Save Changes',
			},
			stubs: {
				'v-card': { template: '<div><slot /></div>' },
				'v-card-title': { template: '<div><slot /></div>' },
				'v-container': { template: '<div><slot /></div>' },
				'v-spacer': { template: '<span />' },
				'v-btn': { template: '<button><slot /></button>' },
				'v-icon': { template: '<span><slot /></span>' },
			}
		},
	});
}

describe('EditModeHeader.vue', () => {
	let wrapper;

	beforeEach(() => {
		wrapper = getWrapper();
		wrapper.vm.$store.commit('tilePad/SET_EDIT_MODE', true);
	});

	it('Save changes button exits edit mode', async () => {
		const button = wrapper.find('#exitEditModeButton');
		expect(button.exists()).toBe(true);
		await button.trigger('click');
		expect(wrapper.vm.$store.state.tilePad.editMode).toBe(false);
	});
});
