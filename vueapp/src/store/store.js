import { createStore } from 'vuex';
import settingsModule from './modules/settings';
import tilePadModule from './modules/tilePad';

const STORAGE_KEY = 'vuex';

function localStoragePlugin (store) {
	if (typeof window === 'undefined' || !window.localStorage) {
		return;
	}
	try {
		const savedState = window.localStorage.getItem(STORAGE_KEY);
		if (savedState) {
			const parsed = JSON.parse(savedState);
			store.replaceState({
				settings: {
					...store.state.settings,
					...(parsed.settings || {})
				},
				tilePad: {
					...store.state.tilePad,
					...(parsed.tilePad || {})
				}
			});
		}
	} catch {
		// Ignore corrupted storage state
	}

	store.subscribe((_mutation, state) => {
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		} catch {
			// Ignore storage quota errors
		}
	});
}

export function createAppStore (usePersistence = true) {
	return createStore({
		modules: {
			settings: {
				...settingsModule,
				state: () => ({ ...settingsModule.state })
			},
			tilePad: {
				...tilePadModule,
				state: () => JSON.parse(JSON.stringify(tilePadModule.state))
			}
		},
		plugins: usePersistence ? [localStoragePlugin] : []
	});
}

export default createAppStore(true);
