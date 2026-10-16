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

		<!-- Barra de Colecciones de palabras y ubicación actual -->
		<nav
			id="collectionsBar"
			class="collections-nav-bar px-4 pt-3 pb-1"
			:aria-label="collectionsBarLabel"
		>
			<div class="collections-nav-inner">
				<button
					v-if="currentTilePadPage !== 'home'"
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
						:class="{ 'is-active': currentTilePadPage === col.key }"
						:aria-current="currentTilePadPage === col.key ? 'page' : undefined"
						@click="navigateToCollection(col.key)"
					>
						<span class="nav-css-ico" :class="col.iconClass" aria-hidden="true" />
						<span>{{ col.label }}</span>
					</button>
				</div>
			</div>
		</nav>

		<v-container
			fluid
			class="tilepad-grid-wrapper pb-10 pt-2 px-3"
		>
			<div
				ref="tileGrid"
				class="tilePadContainer saac-responsive-grid"
			>
				<div
					v-if="editMode"
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
					:key="tile.id !== undefined ? tile.id : tileIndex"
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
		}),
		collectionsBarLabel () {
			return typeof this.$t === 'function' ? this.$t('collections.barLabel') : 'Word collections:';
		},
		backToMainLabel () {
			return typeof this.$t === 'function' ? this.$t('collections.backToMain') : 'Back to main board';
		},
		collectionTabs () {
			const tr = (key, fallback) => (typeof this.$t === 'function' ? this.$t(key) : fallback);
			return [
				{ key: 'home', iconClass: 'nav-ico-grid', label: tr('collections.home', 'Principal') },
				{ key: '1', iconClass: 'nav-ico-folder', label: tr('collections.feelings', 'Sentir y Emociones') },
				{ key: 'numbers', iconClass: 'nav-ico-folder', label: tr('collections.numbers', 'Números y Tiempo') },
				{ key: 'keyboard', iconClass: 'nav-ico-folder', label: tr('collections.keyboard', 'Teclado ABC') },
			];
		},
		tilePadToDisplay () {
			if (
				!this.customTilePadData ||
				(Object.entries(this.customTilePadData).length === 0 &&
					this.customTilePadData.constructor === Object)
			) {
				this.setCustomTilePadData(JSON.parse(JSON.stringify(this.tileData)));
			} else if (
				this.customTilePadData['1'] &&
				Array.isArray(this.customTilePadData['1'].tileData) &&
				this.customTilePadData['1'].tileData.length > 15 &&
				this.customTilePadData['1'].tileData[1] &&
				this.customTilePadData['1'].tileData[1].name === ''
			) {
				// Actualizar tablero '1' (Sentir) si tenía las 59 celdas en blanco heredadas en localStorage
				const updated = JSON.parse(JSON.stringify(this.customTilePadData));
				updated['1'] = JSON.parse(JSON.stringify(this.tileData['1']));
				this.setCustomTilePadData(updated);
			}

			const tilePadTiles = (this.customTilePadOption && Object.keys(this.customTilePadData).length > 0)
				? this.customTilePadData
				: this.tileData;
			const routeParam = this.$route && this.$route.params ? this.$route.params.layout : undefined;
			if (typeof routeParam === 'undefined' || !tilePadTiles[routeParam]) {
				return tilePadTiles.home || { tileData: [] };
			} else {
				return tilePadTiles[routeParam];
			}
		},
		visibleTiles () {
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
	},
	beforeUnmount () {
		if (this.sortableInstance) {
			this.sortableInstance.destroy();
			this.sortableInstance = null;
		}
	},
	methods: {
		...mapActions({
			setCustomTilePadData: 'tilePad/setCustomTilePadData',
			moveTile: 'tilePad/moveTile',
			logTileTap: 'tilePad/logTileTap',
		}),
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
	min-height: calc(100vh - 64px);
}
.tilepad-grid-wrapper {
	text-align: center;
	max-width: 1400px;
	margin: 0 auto;
}
/* Cuadrícula progresiva para teléfonos (2-3 col), tablets (4-5 col) y escritorio (6 col) */
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
	padding: 8px 14px;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
	box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}
.collections-title-label {
	font-size: 0.85rem;
	font-weight: 800;
	color: #334155;
}
.collections-pills {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}
@media (max-width: 640px) {
	.collections-nav-bar {
		padding-left: 8px !important;
		padding-right: 8px !important;
		padding-top: 6px !important;
	}
	.collections-nav-inner {
		padding: 6px 10px;
		flex-wrap: nowrap;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}
	.collections-title-label {
		display: none;
	}
	.collections-pills {
		flex-wrap: nowrap;
	}
	.collection-pill-btn, .collection-back-btn {
		white-space: nowrap;
		padding: 5px 11px;
		font-size: 0.8rem;
	}
}
.collection-pill-btn {
	background: #f1f5f9;
	color: #0f172a;
	border: 2px solid #cbd5e1;
	border-radius: 999px;
	padding: 6px 14px;
	font-size: 0.88rem;
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
	padding: 6px 14px;
	font-size: 0.88rem;
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
