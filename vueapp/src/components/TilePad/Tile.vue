<template>
	<v-btn
		raised
		tile
		class="mx-auto"
		:color="typeof localeTileData.accent === 'undefined' ? '#FFFFFFFF' : cardColor"
		:aria-label="newTile ? 'Add a New Tile' : localeTileData.name"
		style="height: unset"
		@click="tileClickedEvent"
	>
		<v-container
			v-if="newTile"
			justify="center"
		>
			<v-row
				align="center"
				justify="center"
			>
				<v-img
					max-height="32"
					max-width="32"
					aspect-ratio="1"
					alt=""
					aria-hidden="true"
					src="https://img.icons8.com/officexs/64/000000/plus-math.png"
				/>
			</v-row>
			<v-row>
				<v-card-text
					align="center"
					justify="center"
				>
					<h4>Add a New Tile</h4>
				</v-card-text>
			</v-row>
		</v-container>
		<v-container
			v-else
			justify="center"
		>
			<span
				v-if="displayTapCount && !editMode"
				class="taps-count"
				aria-hidden="true"
			>{{ taps }}</span>
			<v-row
				align="center"
				justify="center"
			>
				<v-img
					max-height="32"
					max-width="32"
					aspect-ratio="1"
					alt=""
					aria-hidden="true"
					:src="localeTileData.image"
				/>
			</v-row>
			<v-row>
				<v-card-text
					align="center"
					justify="center"
				>
					<h3>{{ localeTileData.name }}</h3>
					<img
						v-if="editMode"
						id="drag-handle"
						class="drag-handle"
						alt=""
						aria-hidden="true"
						src="https://img.icons8.com/officexs/16/000000/resize-four-directions.png"
						style="padding-top: 8px; margin-bottom: -12px;"
					>
				</v-card-text>
			</v-row>
		</v-container>
	</v-btn>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex';

export default {
	name: 'Tile',
	props: {
		tileData: {
			type: Object,
			default () {
				return {
					name: '',
					text: '',
					accent: '',
					image: '',
					id: 0,
					messages: {},
				};
			},
		},
		tilePage: {
			type: String,
			default: '',
		},
		inSentenceComponent: {
			type: Boolean,
			default: false,
		},
		sentenceIndex: {
			type: Number,
			default: null
		},
		newTile: {
			type: Boolean,
			default: false
		}
	},
	emits: ['removeFromSentence', 'speakText', 'addToSentence'],
	computed: {
		...mapState('settings', ['sentenceMode']),
		...mapGetters({
			editMode: 'tilePad/editMode',
			locale: 'settings/locale',
			displayTapCount: 'settings/displayTapCount',
			tileTapsCount: 'tilePad/tileTapsCount',
		}),
		cardColor () {
			switch (this.localeTileData.accent) {
				case 'blush':
					return '#FFB7B2';
				case 'peach':
					return '#FFB7B2';
				case 'pear':
					return '#E2F0CB';
				case 'mint':
					return '#B5EAD7';
				case 'violet':
					return '#C7CEEA';
				case 'white':
					return '#FFFFFF';
				default:
					return '#FFFFFF';
			}
		},
		localeTileData () {
			const messages = this.tileData.messages;
			if (typeof messages !== 'undefined' && messages !== null) {
				const localeKey = (this.locale === 'es' && !messages.es && messages.sp)
					? 'sp'
					: this.locale;
				if (typeof messages[localeKey] === 'object') {
					return {
						...this.tileData,
						...messages[localeKey]
					};
				}
			}
			return this.tileData;
		},
		taps () {
			const indexOfTile = this.tileTapsCount.findIndex(
				(obj) => obj.id == this.tileData.id
			);
			if (indexOfTile == -1) return 0;
			return this.tileTapsCount[indexOfTile].taps;
		},
	},
	methods: {
		...mapActions('tilePad', [
			'toggleEditDialogVisibility',
			'setCurrentTileBeingEdited',
			'createNewTile',
			'logTileTap'
		]),
		tileClickedEvent () {
			const keyboardTile =
				typeof this.tileData.navigation !== 'undefined' &&
				this.tileData.navigation !== '';

			if (this.editMode) {
				const tileDataToEdit = { ...this.tileData, page: this.tilePage };
				if (this.newTile) {
					tileDataToEdit.newTile = true;
				}
				this.setCurrentTileBeingEdited(tileDataToEdit);
				this.toggleEditDialogVisibility();
			} else if (this.sentenceMode && !keyboardTile) {
				if (this.inSentenceComponent) {
					this.$emit('removeFromSentence', this.sentenceIndex);
				} else {
					this.$emit('speakText', this.localeTileData.text);
					this.$emit('addToSentence', this.localeTileData);
				}
			} else if (keyboardTile) {
				this.$router.push({
					name: 'tilePadWithRoute',
					params: { layout: this.tileData.navigation },
				});
			} else {
				this.$emit('speakText', this.localeTileData.text);
				this.logTileTap(this.localeTileData.id);
			}
		},
	},
};
</script>
<style>
.taps-count {
	position: absolute;
	bottom: 3px;
	right: 3px;
}
</style>
