<template>
	<v-btn
		raised
		tile
		class="mx-auto saac-tile-btn"
		:class="{
			'is-sentence-tile': inSentenceComponent,
			'is-collection-tile': isNavigationTile && tileData.navigation !== 'home',
			'is-back-home-tile': isNavigationTile && tileData.navigation === 'home'
		}"
		:color="typeof localeTileData.accent === 'undefined' ? '#FFFFFF' : cardColor"
		:aria-label="accessibleTileLabel"
		style="height: unset"
		@click="tileClickedEvent"
	>
		<v-container
			v-if="newTile"
			justify="center"
			class="pa-2"
		>
			<v-row
				align="center"
				justify="center"
				class="my-1"
			>
				<div class="new-tile-icon-circle" aria-hidden="true">
					+
				</div>
			</v-row>
			<v-row justify="center">
				<v-card-text
					align="center"
					justify="center"
					class="pa-1"
				>
					<h4 class="tile-label new-tile-label">
						{{ newTileLabel }}
					</h4>
				</v-card-text>
			</v-row>
		</v-container>
		<v-container
			v-else
			justify="center"
			class="pa-2 tile-inner-container"
		>
			<!-- Cinta superior distintiva para baldosas que abren colecciones de palabras -->
			<div
				v-if="isNavigationTile"
				class="collection-folder-ribbon"
				:class="{ 'is-back-ribbon': tileData.navigation === 'home' }"
				aria-hidden="true"
			>
				<span v-if="tileData.navigation === 'home'" class="ribbon-content">
					<span class="css-ico css-ico-back" />
					<span>{{ backBadgeLabel }}</span>
				</span>
				<span v-else class="ribbon-content">
					<span class="css-ico css-ico-folder" />
					<span>{{ folderBadgeLabel }}</span>
					<span class="css-ico css-ico-chevron" />
				</span>
			</div>

			<span
				v-if="displayTapCount && !editMode && !isNavigationTile"
				class="taps-count"
				aria-hidden="true"
			>{{ taps }}</span>
			<v-row
				align="center"
				justify="center"
				:class="isNavigationTile ? 'mt-4 mb-1' : 'my-1'"
			>
				<v-img
					v-if="resolvedImage"
					height="52"
					width="52"
					max-height="52"
					max-width="52"
					aspect-ratio="1"
					alt=""
					aria-hidden="true"
					class="tile-pictogram-img"
					:src="resolvedImage"
				/>
			</v-row>
			<v-row justify="center">
				<v-card-text
					align="center"
					justify="center"
					class="pa-1"
				>
					<h3 class="tile-label">{{ displayTileName }}</h3>
					<img
						v-if="editMode"
						id="drag-handle"
						class="drag-handle"
						alt=""
						aria-hidden="true"
						src="https://img.icons8.com/officexs/16/000000/resize-four-directions.png"
						style="padding-top: 6px; margin-bottom: -8px;"
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
		isNavigationTile () {
			return typeof this.tileData.navigation !== 'undefined' && this.tileData.navigation !== '';
		},
		newTileLabel () {
			return typeof this.$t === 'function' ? this.$t('editMode.tile.addNew') : 'Add a New Tile';
		},
		folderBadgeLabel () {
			return typeof this.$t === 'function' ? this.$t('collections.badgeFolder') : 'Collection';
		},
		backBadgeLabel () {
			return typeof this.$t === 'function' ? this.$t('collections.badgeBackHome') : 'Back';
		},
		displayTileName () {
			const rawName = this.localeTileData.name;
			if (this.tileData.navigation === 'home' && (rawName === 'Losas' || rawName === 'Tiles')) {
				return (this.locale === 'es' || this.locale === 'sp') ? 'Inicio' : 'Home';
			}
			return rawName;
		},
		accessibleTileLabel () {
			if (this.newTile) return this.newTileLabel;
			if (this.isNavigationTile) {
				return `${this.displayTileName} (${this.folderBadgeLabel})`;
			}
			return this.displayTileName;
		},
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
				case 'sky':
					return '#BAE6FD';
				case 'sunny':
					return '#FEF08A';
				case 'white':
					return '#FFFFFF';
				default:
					if (typeof this.localeTileData.accent === 'string' && this.localeTileData.accent.startsWith('#')) {
						return this.localeTileData.accent;
					}
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
		resolvedImage () {
			const img = this.localeTileData.image || '';
			if (!img) return '';
			if (img === './assets/motivate.gif') {
				return 'https://img.icons8.com/officexs/64/000000/cancel-2.png';
			}
			if (img.includes('officexs64/')) {
				return img.replace('officexs64/', 'officexs/64/');
			}
			return img;
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
			const keyboardTile = this.isNavigationTile;

			if (this.editMode) {
				const tileDataToEdit = JSON.parse(JSON.stringify(this.tileData));
				tileDataToEdit.page = this.tilePage;
				if (this.newTile) {
					tileDataToEdit.newTile = true;
				} else {
					tileDataToEdit.name = this.displayTileName;
					tileDataToEdit.text = this.localeTileData.text;
					tileDataToEdit.image = this.resolvedImage;
				}
				this.setCurrentTileBeingEdited(tileDataToEdit);
				this.toggleEditDialogVisibility();
			} else if (this.sentenceMode && !keyboardTile) {
				if (this.inSentenceComponent) {
					this.$emit('removeFromSentence', this.sentenceIndex);
				} else {
					this.$emit('speakText', this.localeTileData.text);
					this.$emit('addToSentence', {
						...this.localeTileData,
						image: this.resolvedImage
					});
				}
			} else if (keyboardTile) {
				if (this.tileData.navigation === 'home') {
					this.$router.push({ name: 'tilePad' });
				} else {
					this.$router.push({
						name: 'tilePadWithRoute',
						params: { layout: this.tileData.navigation },
					});
				}
			} else {
				this.$emit('speakText', this.localeTileData.text);
				this.logTileTap(this.localeTileData.id);
			}
		},
	},
};
</script>
<style>
.saac-tile-btn {
	position: relative;
	overflow: hidden;
	width: 100%;
	min-height: 126px !important;
	border-radius: 14px !important;
	border: 2px solid rgba(15, 23, 42, 0.14) !important;
	box-shadow: 0 3px 10px rgba(15, 23, 42, 0.08) !important;
	text-transform: none !important;
	letter-spacing: normal !important;
	white-space: normal !important;
	transition: transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease !important;
	color: #0f172a !important;
}
.saac-tile-btn:hover {
	transform: translateY(-2px);
	box-shadow: 0 6px 16px rgba(15, 23, 42, 0.15) !important;
	border-color: #0f766e !important;
}
.saac-tile-btn:focus-visible {
	outline: 3px solid #f59e0b !important;
	outline-offset: 2px !important;
}
/* Estilo distintivo tipo Carpeta / Colección de palabras */
.saac-tile-btn.is-collection-tile {
	border: 2.5px solid #0284c7 !important;
	box-shadow: 4px 5px 0px #0284c7, 0 6px 14px rgba(2, 132, 199, 0.2) !important;
}
.saac-tile-btn.is-back-home-tile {
	border: 2.5px solid #0f766e !important;
	box-shadow: 4px 5px 0px #0f766e !important;
}
.collection-folder-ribbon {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	background: #0284c7;
	color: #ffffff;
	font-size: 0.72rem;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.03em;
	padding: 3px 8px;
	text-align: center;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.collection-folder-ribbon.is-back-ribbon {
	background: #0f766e;
}
.ribbon-content {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 5px;
}
.css-ico {
	display: inline-block;
	position: relative;
	vertical-align: middle;
}
.css-ico-folder {
	width: 13px;
	height: 10px;
	background: #ffffff;
	border-radius: 1px 2px 2px 2px;
}
.css-ico-folder::before {
	content: "";
	position: absolute;
	top: -2px;
	left: 0;
	width: 6px;
	height: 3px;
	background: #ffffff;
	border-radius: 2px 2px 0 0;
}
.css-ico-chevron {
	width: 6px;
	height: 6px;
	border-top: 2px solid #ffffff;
	border-right: 2px solid #ffffff;
	transform: rotate(45deg);
}
.css-ico-back {
	width: 7px;
	height: 7px;
	border-left: 2px solid #ffffff;
	border-bottom: 2px solid #ffffff;
	transform: rotate(45deg);
}
.tile-label {
	font-size: 0.98rem;
	font-weight: 700;
	line-height: 1.25;
	color: #0f172a;
	word-break: break-word;
	white-space: normal;
	margin: 0;
}
/* Ficha compacta cuando está dentro de la barra de frase */
.saac-tile-btn.is-sentence-tile {
	min-height: 76px !important;
	border-radius: 10px !important;
}
.saac-tile-btn.is-sentence-tile .tile-pictogram-img {
	width: 34px !important;
	height: 34px !important;
	max-width: 34px !important;
	max-height: 34px !important;
}
.saac-tile-btn.is-sentence-tile .tile-label {
	font-size: 0.82rem;
}
@media (max-width: 640px) {
	.saac-tile-btn {
		min-height: 98px !important;
		border-radius: 11px !important;
	}
	.saac-tile-btn .tile-pictogram-img {
		width: 40px !important;
		height: 40px !important;
		max-width: 40px !important;
		max-height: 40px !important;
	}
	.tile-label {
		font-size: 0.84rem;
		line-height: 1.18;
	}
	.collection-folder-ribbon {
		font-size: 0.62rem;
		padding: 2px 5px;
	}
	.saac-tile-btn.is-sentence-tile {
		min-height: 64px !important;
	}
	.saac-tile-btn.is-sentence-tile .tile-pictogram-img {
		width: 28px !important;
		height: 28px !important;
	}
}
.new-tile-icon-circle {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background: #e0f2fe;
	color: #0284c7;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.9rem;
	font-weight: 800;
	border: 2px dashed #0284c7;
}
.new-tile-label {
	color: #0369a1;
}
.taps-count {
	position: absolute;
	bottom: 5px;
	right: 8px;
	background: rgba(15, 23, 42, 0.12);
	border-radius: 999px;
	padding: 1px 6px;
	font-size: 0.72rem;
	font-weight: 700;
}
</style>
