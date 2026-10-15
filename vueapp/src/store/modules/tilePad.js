import blankKeyboardTemplate from '../../staticData/blankKeyboardTemplate.json';

function cloneDeep (value) {
	return JSON.parse(JSON.stringify(value));
}

const APP_VERSION = '2.0.0';

const state = {
	customTilePadData: {},
	editMode: false,
	editDialogVisibility: false,
	currentTileBeingEdited: {},
	tileTapsCount: [],
	systemBackupTilePads: []
};

const mutations = {
	SET_CUSTOM_TILE_PAD_DATA (state, value) {
		state.customTilePadData = value;
	},
	TOGGLE_EDIT_MODE (state) {
		state.editMode = !state.editMode;
	},
	TOGGLE_EDIT_DIALOG_VISIBILITY (state) {
		state.editDialogVisibility = !state.editDialogVisibility;
	},
	SET_CURRENT_TILE_BEING_EDITED (state, value) {
		state.currentTileBeingEdited = value;
	},
	SAVE_EDITS_TO_TILE_BEING_EDITED (state, value) {
		state.currentTileBeingEdited[value.key] = value.value;
		if ((value.key === 'name' || value.key === 'text') && state.currentTileBeingEdited.messages) {
			Object.keys(state.currentTileBeingEdited.messages).forEach((langKey) => {
				if (state.currentTileBeingEdited.messages[langKey] && typeof state.currentTileBeingEdited.messages[langKey] === 'object') {
					state.currentTileBeingEdited.messages[langKey][value.key] = value.value;
				}
			});
		}
	},
	SET_TILE_BEING_EDITED (state) {
		const page = state.currentTileBeingEdited.page;
		if (!page || !state.customTilePadData[page]) {
			return;
		}
		const indexOfTileInCustomTilePadData = state.customTilePadData[page].tileData.findIndex(
			tile => tile.id == state.currentTileBeingEdited.id
		);
		if (state.currentTileBeingEdited.navigation !== undefined && state.currentTileBeingEdited.navigation !== '') {
			const navigationDoesNotExist = !Object.keys(state.customTilePadData).includes(state.currentTileBeingEdited.navigation);
			if (navigationDoesNotExist) {
				const blankTemplate = cloneDeep(blankKeyboardTemplate);
				state.customTilePadData[state.currentTileBeingEdited.navigation] = { tileData: blankTemplate };
			}
		}

		if (indexOfTileInCustomTilePadData !== -1) {
			state.customTilePadData[page].tileData.splice(
				indexOfTileInCustomTilePadData,
				1,
				cloneDeep(state.currentTileBeingEdited)
			);
		}
	},
	DELETE_CURRENT_TILE (state) {
		const page = state.currentTileBeingEdited.page;
		if (!page || !state.customTilePadData[page]) {
			return;
		}
		const idx = state.customTilePadData[page].tileData.findIndex(
			tile => tile.id == state.currentTileBeingEdited.id
		);
		if (idx !== -1) {
			state.customTilePadData[page].tileData.splice(idx, 1);
		}
		state.currentTileBeingEdited = {};
	},
	MOVE_TILE (state, { page, fromIndex, toIndex }) {
		if (!page || !state.customTilePadData[page]) {
			return;
		}
		const list = state.customTilePadData[page].tileData;
		if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) {
			return;
		}
		const [movedTile] = list.splice(fromIndex, 1);
		list.splice(toIndex, 0, movedTile);
	},
	SET_EDIT_MODE (state, value) {
		state.editMode = value;
	},
	LOG_TILE_TAP (state, value) {
		const indexOfTile = state.tileTapsCount.findIndex((obj) => obj.id == value);
		if (indexOfTile >= 0) {
			state.tileTapsCount[indexOfTile].taps++;
		} else {
			const tile = {
				id: value,
				taps: 1
			};
			state.tileTapsCount.push(tile);
		}
	},
	CREATE_NEW_TILE (state, value) {
		const page = state.currentTileBeingEdited.page || 'home';
		if (!state.customTilePadData[page]) {
			return;
		}
		let maxid = 0;
		state.customTilePadData[page].tileData.forEach((obj) => {
			if (obj.id > maxid) maxid = obj.id;
		});
		value.id = maxid + 1;
		state.customTilePadData[page].tileData.unshift(value);
		state.currentTileBeingEdited = {};
	},
	SAVE_SYSTEM_BACKUP (state, value) {
		state.systemBackupTilePads.push({
			version: APP_VERSION,
			tilePad: value,
			date: new Date().toLocaleDateString()
		});
	}
};

const actions = {
	setCustomTilePadData: ({ commit }, value) => {
		commit('SET_CUSTOM_TILE_PAD_DATA', value);
	},
	toggleEditMode: ({ commit }) => {
		commit('TOGGLE_EDIT_MODE');
	},
	toggleEditDialogVisibility: ({ commit }) => {
		commit('TOGGLE_EDIT_DIALOG_VISIBILITY');
	},
	setCurrentTileBeingEdited: ({ commit }, value) => {
		commit('SET_CURRENT_TILE_BEING_EDITED', value);
	},
	saveEditsToTileBeingEdited: ({ commit }, value) => {
		commit('SAVE_EDITS_TO_TILE_BEING_EDITED', value);
	},
	saveTileEdit: ({ commit }) => {
		commit('SET_TILE_BEING_EDITED');
	},
	deleteCurrentTile: ({ commit }) => {
		commit('DELETE_CURRENT_TILE');
	},
	createNewTile: ({ commit }, value) => {
		commit('CREATE_NEW_TILE', value);
	},
	moveTile: ({ commit }, payload) => {
		commit('MOVE_TILE', payload);
	},
	setEditMode: ({ commit }, value) => {
		commit('SET_EDIT_MODE', value);
	},
	logTileTap: ({ commit }, value) => {
		commit('LOG_TILE_TAP', value);
	},
	systemSaveBackupOfTilePad: ({ commit, state }) => {
		if (state.systemBackupTilePads.filter(x => x.version === APP_VERSION).length === 0) {
			commit('SAVE_SYSTEM_BACKUP', state.customTilePadData);
		}
	}
};

const getters = {
	customTilePadData: (state) => state.customTilePadData,
	editMode: (state) => state.editMode,
	editDialogVisibility: (state) => state.editDialogVisibility,
	currentTileBeingEdited: (state) => state.currentTileBeingEdited,
	tileTapsCount: (state) => state.tileTapsCount,
};

export default {
	namespaced: true,
	state,
	mutations,
	actions,
	getters
};
