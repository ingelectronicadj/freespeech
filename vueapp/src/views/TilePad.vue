<template>
	<div class="tilepad-page">
		<Sentence
			v-if="sentenceMode && !editMode"
			:tile-pad-to-display="sentenceTiles"
			@clear-sentence="sentenceTiles = []"
			@speak-sentence="speakSentence"
			@remove-from-sentence="sentenceTiles.splice($event, 1)"
		/>
		<edit-mode-header v-if="editMode" />

		<!-- Barra de Colecciones de palabras y buscador rápido -->
		<nav
			id="collectionsBar"
			class="collections-nav-bar px-3 pt-2 pb-1"
			:aria-label="collectionsBarLabel"
		>
			<div class="collections-nav-inner">
				<button
					v-if="currentTilePadPage !== 'home' && !searchQuery"
					type="button"
					class="collection-back-btn"
					@click="$router.push({ name: 'tilePad' })"
				>
					<span class="nav-css-ico nav-ico-back" aria-hidden="true" />
					<span>{{ backToMainLabel }}</span>
				</button>

				<span class="collections-title-label">{{ collectionsBarLabel }}</span>

				<div class="collections-pills" role="group">
					<button
						v-for="col in collectionTabs"
						:key="col.key"
						type="button"
						class="collection-pill-btn"
						:class="{ 'is-active': !searchQuery && currentTilePadPage === col.key }"
						:aria-current="!searchQuery && currentTilePadPage === col.key ? 'page' : undefined"
						@click="selectCollectionTab(col.key)"
					>
						<span class="nav-css-ico" :class="col.iconClass" aria-hidden="true" />
						<span>{{ col.label }}</span>
					</button>
				</div>

				<div class="collections-search-wrap">
					<svg class="search-svg-ico" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="8" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
					<input
						id="boardQuickSearchInput"
						v-model.trim="searchQuery"
						type="search"
						class="collections-search-input"
						:placeholder="searchPlaceholderLabel"
						:aria-label="searchPlaceholderLabel"
					>
					<button
						v-if="searchQuery"
						type="button"
						class="collections-search-clear"
						:aria-label="searchClearLabel"
						@click="searchQuery = ''"
					>
						&times;
					</button>
				</div>
			</div>
		</nav>

		<v-container
			fluid
			class="tilepad-grid-wrapper pb-10 pt-2 px-3"
		>
			<p
				v-if="visibleTiles.length === 0 && searchQuery"
				class="search-empty-state"
				role="status"
			>
				{{ searchEmptyLabel }}
			</p>
			<div
				ref="tileGrid"
				class="tilePadContainer saac-responsive-grid"
			>
				<div
					v-if="editMode && !searchQuery"
					id="newTile"
					class="d-flex child-flex tile-col"
				>
					<Tile
						:new-tile="true"
						:tile-page="currentTilePadPage"
					/>
				</div>
				<div
					v-for="(tile, tileIndex) in visibleTiles"
					:key="tile._searchKey || (tile.id !== undefined ? tile.id : tileIndex)"
					class="d-flex child-flex tile-col"
				>
					<Tile
						:tile-data="tile"
						:tile-page="currentTilePadPage"
						@speak-text="speakText"
						@add-to-sentence="sentenceTiles.push($event)"
					/>
				</div>
			</div>
		</v-container>
	</div>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex';
import Sortable from 'sortablejs';

import TileData from '../../../build.json';
import Tile from '@/components/TilePad/Tile.vue';
import Sentence from '@/components/Sentence/Sentence.vue';
import EditModeHeader from '@/components/EditModeHeader/EditModeHeader.vue';

export default {
	name: 'TilePad',
	components: {
		Tile,
		Sentence,
		EditModeHeader
	},
	data () {
		return {
			tileData: TileData,
			sentenceTiles: [],
			sortableInstance: null,
			searchQuery: ''
		};
	},
	computed: {
		...mapState('settings', ['sentenceMode']),
		...mapState('tilePad', ['editMode']),
		...mapGetters({
			selectedVoiceIndex: 'settings/selectedVoiceIndex',
			customTilePadOption: 'settings/customTilePad',
			customTilePadData: 'tilePad/customTilePadData',
			voices: 'settings/voices',
			locale: 'settings/locale'
		}),
		collectionsBarLabel () {
			return typeof this.$t === 'function' ? this.$t('collections.barLabel') : 'Word collections:';
		},
		backToMainLabel () {
			return typeof this.$t === 'function' ? this.$t('collections.backToMain') : 'Back to main board';
		},
		searchPlaceholderLabel () {
			return typeof this.$t === 'function' ? this.$t('collections.searchPlaceholder') : 'Search word across board...';
		},
		searchClearLabel () {
			return typeof this.$t === 'function' ? this.$t('collections.searchClear') : 'Clear search';
		},
		searchEmptyLabel () {
			return typeof this.$t === 'function' ? this.$t('collections.searchEmpty') : 'No matching tiles found.';
		},
		collectionTabs () {
			const tr = (key, fallback) => (typeof this.$t === 'function' ? this.$t(key) : fallback);
			return [
				{ key: 'home', iconClass: 'nav-ico-grid', label: tr('collections.home', 'Principal') },
				{ key: '1', iconClass: 'nav-ico-folder', label: tr('collections.feelings', 'Sentir y Emociones') },
				{ key: '2', iconClass: 'nav-ico-folder', label: tr('collections.study', 'Estudio') },
				{ key: '3', iconClass: 'nav-ico-folder', label: tr('collections.hygiene', 'Aseo personal') },
				{ key: '4', iconClass: 'nav-ico-folder', label: tr('collections.food', 'Comida') },
				{ key: '5', iconClass: 'nav-ico-folder', label: tr('collections.actions', 'Acciones') },
				{ key: '6', iconClass: 'nav-ico-folder', label: tr('collections.phrases', 'Frases hechas') },
				{ key: '7', iconClass: 'nav-ico-folder', label: tr('collections.animals', 'Animales') },
				{ key: '8', iconClass: 'nav-ico-folder', label: tr('collections.places', 'Lugares') },
				{ key: '9', iconClass: 'nav-ico-folder', label: tr('collections.colors', 'Colores') },
				{ key: '10', iconClass: 'nav-ico-folder', label: tr('collections.body', 'Cuerpo') },
				{ key: 'numbers', iconClass: 'nav-ico-folder', label: tr('collections.numbers', 'Números y Tiempo') },
				{ key: 'keyboard', iconClass: 'nav-ico-folder', label: tr('collections.keyboard', 'Teclado ABC') },
			];
		},
		allBoardsDictionary () {
			if (
				!this.customTilePadData ||
				(Object.entries(this.customTilePadData).length === 0 &&
					this.customTilePadData.constructor === Object) ||
				this.customTilePadData._v !== this.tileData._v
			) {
				this.setCustomTilePadData(JSON.parse(JSON.stringify(this.tileData)));
			} else if (
				this.customTilePadData['1'] &&
				Array.isArray(this.customTilePadData['1'].tileData) &&
				this.customTilePadData['1'].tileData.length > 15 &&
				this.customTilePadData['1'].tileData[1] &&
				this.customTilePadData['1'].tileData[1].name === ''
			) {
				const updated = JSON.parse(JSON.stringify(this.customTilePadData));
				updated['1'] = JSON.parse(JSON.stringify(this.tileData['1']));
				this.setCustomTilePadData(updated);
			}

			return (this.customTilePadOption && Object.keys(this.customTilePadData).length > 0)
				? this.customTilePadData
				: this.tileData;
		},
		tilePadToDisplay () {
			const tilePadTiles = this.allBoardsDictionary;
			const routeParam = this.$route && this.$route.params ? this.$route.params.layout : undefined;
			if (typeof routeParam === 'undefined' || !tilePadTiles[routeParam]) {
				return tilePadTiles.home || { tileData: [] };
			} else {
				return tilePadTiles[routeParam];
			}
		},
		visibleTiles () {
			const query = String(this.searchQuery || '').trim().toLowerCase();
			if (query) {
				const boards = this.allBoardsDictionary || {};
				const results = [];
				const seenNames = new Set();
				Object.keys(boards).forEach(boardKey => {
					const arr = (boards[boardKey] && Array.isArray(boards[boardKey].tileData)) ? boards[boardKey].tileData : [];
					arr.forEach((tile, idx) => {
						if (!tile || tile.navigation) return;
						const nameEs = tile.messages && (tile.messages.es || tile.messages.sp) ? (tile.messages.es || tile.messages.sp).name || '' : '';
						const nameDe = tile.messages && tile.messages.de ? tile.messages.de.name || '' : '';
						const baseName = String(tile.name || '');
						const baseText = String(tile.text || '');
						const haystack = `${baseName} ${baseText} ${nameEs} ${nameDe}`.toLowerCase();
						if (haystack.includes(query)) {
							const dedupKey = `${baseName}-${nameEs}`.toLowerCase();
							if (!seenNames.has(dedupKey)) {
								seenNames.add(dedupKey);
								results.push({
									...tile,
									_searchKey: `${boardKey}-${tile.id || idx}`
								});
							}
						}
					});
				});
				return results;
			}

			const list = (this.tilePadToDisplay && Array.isArray(this.tilePadToDisplay.tileData))
				? this.tilePadToDisplay.tileData
				: [];
			if (this.editMode) {
				return list;
			}
			return list.filter(tile => {
				if (!tile) return false;
				return Boolean(
					(tile.name && String(tile.name).trim()) ||
					(tile.text && String(tile.text).trim()) ||
					(tile.navigation && String(tile.navigation).trim())
				);
			});
		},
		currentTilePadPage () {
			const routeParam = this.$route && this.$route.params ? this.$route.params.layout : undefined;
			if (typeof routeParam === 'undefined') {
				return 'home';
			} else {
				return routeParam;
			}
		}
	},
	watch: {
		editMode (enabled) {
			if (this.sortableInstance) {
				this.sortableInstance.option('disabled', !enabled);
			}
		}
	},
	mounted () {
		this.initSortable();
		if (typeof window !== 'undefined') {
			window.addEventListener('message', this.handleHostCommand);
		}
	},
	beforeUnmount () {
		if (this.sortableInstance) {
			this.sortableInstance.destroy();
			this.sortableInstance = null;
		}
		if (typeof window !== 'undefined') {
			window.removeEventListener('message', this.handleHostCommand);
		}
	},
	methods: {
		...mapActions({
			setCustomTilePadData: 'tilePad/setCustomTilePadData',
			moveTile: 'tilePad/moveTile',
			logTileTap: 'tilePad/logTileTap',
		}),
		handleHostCommand (event) {
			const data = event && event.data;
			if (!data || data.type !== 'FREESPEECH_HOST_COMMAND') return;
			if (data.command === 'clearSentence') {
				this.sentenceTiles = [];
			} else if (data.command === 'backspaceSentence' && this.sentenceTiles.length > 0) {
				this.sentenceTiles.pop();
			} else if (data.command === 'speakSentence' && this.sentenceTiles.length > 0) {
				this.speakSentence();
			}
		},
		selectCollectionTab (key) {
			this.searchQuery = '';
			this.navigateToCollection(key);
		},
		navigateToCollection (key) {
			if (key === 'home') {
				this.$router.push({ name: 'tilePad' });
			} else {
				this.$router.push({
					name: 'tilePadWithRoute',
					params: { layout: key }
				});
			}
		},
		initSortable () {
			const gridEl = this.$refs.tileGrid && (this.$refs.tileGrid.$el || this.$refs.tileGrid);
			if (!gridEl || typeof Sortable === 'undefined') {
				return;
			}
			this.sortableInstance = Sortable.create(gridEl, {
				disabled: !this.editMode,
				handle: '.drag-handle',
				draggable: '.tile-col',
				onEnd: (evt) => {
					if (evt.oldDraggableIndex !== undefined && evt.newDraggableIndex !== undefined && evt.oldDraggableIndex !== evt.newDraggableIndex) {
						this.moveTile({
							page: this.currentTilePadPage,
							fromIndex: evt.oldDraggableIndex,
							toIndex: evt.newDraggableIndex
						});
					}
				}
			});
		},
		speakText (textToSpeak) {
			if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
				return;
			}
			window.speechSynthesis.cancel();
			const speechSynthesisUtterance = new SpeechSynthesisUtterance(textToSpeak);
			if (this.voices && this.selectedVoiceIndex !== null && this.voices[this.selectedVoiceIndex]) {
				speechSynthesisUtterance.voice = this.voices[this.selectedVoiceIndex];
			}
			window.speechSynthesis.speak(speechSynthesisUtterance);
		},
		speakSentence () {
			const textToSpeak = this.sentenceTiles.map(tile => tile.text).join(' ');
			this.speakText(textToSpeak);
			this.logTaps();
		},
		logTaps () {
			this.sentenceTiles.forEach(tile => {
				this.logTileTap(tile.id);
			});
		}
	}
};
</script>
<style scoped>
.tilepad-page {
	background-color: #f1f5f9;
	min-height: calc(100vh - 56px);
}
.tilepad-grid-wrapper {
	text-align: center;
	max-width: 1400px;
	margin: 0 auto;
}
.saac-responsive-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 8px;
}
@media (min-width: 350px) {
	.saac-responsive-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}
}
@media (min-width: 600px) {
	.saac-responsive-grid {
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 10px;
	}
}
@media (min-width: 840px) {
	.saac-responsive-grid {
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 12px;
	}
}
@media (min-width: 1120px) {
	.saac-responsive-grid {
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 12px;
	}
}
.collections-nav-bar {
	max-width: 1400px;
	margin: 0 auto;
}
.collections-nav-inner {
	background: #ffffff;
	border: 2px solid #cbd5e1;
	border-radius: 12px;
	padding: 8px 12px;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
	box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}
.collections-title-label {
	font-size: 0.84rem;
	font-weight: 800;
	color: #334155;
}
.collections-pills {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}
.collections-search-wrap {
	position: relative;
	display: flex;
	align-items: center;
	margin-left: auto;
	min-width: 180px;
	flex: 1 1 180px;
	max-width: 280px;
}
.search-svg-ico {
	position: absolute;
	left: 9px;
	color: #64748b;
	pointer-events: none;
}
.collections-search-input {
	width: 100%;
	padding: 5px 26px 5px 28px;
	border: 1.5px solid #cbd5e1;
	border-radius: 999px;
	background: #f8fafc;
	font-size: 0.82rem;
	font-weight: 600;
	color: #0f172a;
}
.collections-search-input:focus {
	outline: 2px solid #0284c7;
	background: #ffffff;
}
.collections-search-clear {
	position: absolute;
	right: 7px;
	background: #e2e8f0;
	color: #0f172a;
	border: 0;
	border-radius: 50%;
	width: 18px;
	height: 18px;
	font-size: 13px;
	line-height: 1;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
}
.search-empty-state {
	background: #ffffff;
	border: 1px dashed #94a3b8;
	border-radius: 10px;
	padding: 16px;
	color: #475569;
	font-weight: 600;
	margin-bottom: 12px;
}
@media (max-width: 640px) {
	.collections-nav-bar {
		padding-left: 8px !important;
		padding-right: 8px !important;
		padding-top: 6px !important;
	}
	.collections-nav-inner {
		padding: 6px 10px;
		gap: 6px;
	}
	.collections-title-label {
		display: none;
	}
	.collections-pills {
		display: flex;
		flex-wrap: nowrap;
		overflow-x: auto;
		width: 100%;
		padding-bottom: 2px;
		-webkit-overflow-scrolling: touch;
	}
	.collection-pill-btn, .collection-back-btn {
		white-space: nowrap;
		padding: 5px 10px;
		font-size: 0.78rem;
	}
	.collections-search-wrap {
		max-width: 100%;
		width: 100%;
		flex: 1 1 100%;
	}
}
.collection-pill-btn {
	background: #f1f5f9;
	color: #0f172a;
	border: 2px solid #cbd5e1;
	border-radius: 999px;
	padding: 5px 12px;
	font-size: 0.84rem;
	font-weight: 700;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	transition: all 0.15s ease;
}
.collection-pill-btn:hover {
	border-color: #0284c7;
	background: #e0f2fe;
}
.collection-pill-btn.is-active {
	background: #0284c7;
	color: #ffffff;
	border-color: #0369a1;
}
.collection-back-btn {
	background: #0f766e;
	color: #ffffff;
	border: 2px solid #0f766e;
	border-radius: 8px;
	padding: 5px 12px;
	font-size: 0.84rem;
	font-weight: 800;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 6px;
}
.collection-back-btn:hover {
	background: #115e59;
}
.nav-css-ico {
	display: inline-block;
	position: relative;
	vertical-align: middle;
}
.nav-ico-back {
	width: 8px;
	height: 8px;
	border-left: 2.2px solid currentColor;
	border-bottom: 2.2px solid currentColor;
	transform: rotate(45deg);
}
.nav-ico-folder {
	width: 14px;
	height: 10px;
	background: currentColor;
	border-radius: 1px 2px 2px 2px;
	opacity: 0.85;
}
.nav-ico-folder::before {
	content: "";
	position: absolute;
	top: -2px;
	left: 0;
	width: 6px;
	height: 3px;
	background: currentColor;
	border-radius: 2px 2px 0 0;
}
.nav-ico-grid {
	width: 12px;
	height: 12px;
	border: 2px solid currentColor;
	border-radius: 2px;
}
.nav-ico-grid::before {
	content: "";
	position: absolute;
	inset: 2px;
	background: currentColor;
	opacity: 0.4;
}
.collection-pill-btn:focus-visible,
.collection-back-btn:focus-visible {
	outline: 3px solid #f59e0b;
	outline-offset: 2px;
}
</style>
