<template>
	<div>
		<Sentence
			v-if="sentenceMode && !editMode"
			:tile-pad-to-display="sentenceTiles"
			@clear-sentence="sentenceTiles = []"
			@speak-sentence="speakSentence"
			@remove-from-sentence="sentenceTiles.splice($event, 1)"
		/>
		<edit-mode-header v-if="editMode" />
		<v-container
			fluid
			class="grey lighten-5 pb-10"
			style="text-align: center;"
		>
			<v-row
				ref="tileGrid"
				dense
				class="tilePadContainer"
			>
				<v-col
					v-if="editMode"
					id="newTile"
					cols="3"
					sm="2"
					md="1"
					class="d-flex child-flex"
					style="padding: 4px"
				>
					<Tile
						:new-tile="true"
						:tile-page="currentTilePadPage"
					/>
				</v-col>
				<v-col
					v-for="(tile, tileIndex) in tilePadToDisplay.tileData"
					:key="tile.id !== undefined ? tile.id : tileIndex"
					cols="3"
					sm="2"
					md="1"
					class="d-flex child-flex tile-col"
					style="padding: 4px"
				>
					<Tile
						:tile-data="tile"
						:tile-page="currentTilePadPage"
						@speak-text="speakText"
						@add-to-sentence="sentenceTiles.push($event)"
					/>
				</v-col>
			</v-row>
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
		tilePadToDisplay () {
			if (
				!this.customTilePadData ||
				(Object.entries(this.customTilePadData).length === 0 &&
					this.customTilePadData.constructor === Object)
			) {
				this.setCustomTilePadData(JSON.parse(JSON.stringify(this.tileData)));
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
