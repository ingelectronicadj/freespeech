<template>
	<v-btn
		raised
		tile
		class="mx-auto saac-tile-btn"
		:class="{
			'is-sentence-tile': inSentenceComponent,
			'is-collection-tile': isNavigationTile && tileData.navigation !== 'home',
			'is-back-home-tile': isNavigationTile && tileData.navigation === 'home',
			['tile-img-' + (tileImageSize || 'medium')]: true
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
				<div class="tile-visual-slot" aria-hidden="true">
					<img
						v-if="resolvedImage && !imgFailed"
						:height="pictogramPx"
						:width="pictogramPx"
						alt=""
						aria-hidden="true"
						class="tile-pictogram-img"
						:src="resolvedImage"
						@error="imgFailed = true"
					>
					<div
						v-else
						class="tile-pictogram-fallback"
						aria-hidden="true"
					>
						<span>{{ fallbackBadgeText }}</span>
					</div>
				</div>
			</v-row>
			<v-row justify="center">
				<v-card-text
					align="center"
					justify="center"
					class="pa-1"
				>
					<h3 class="tile-label">{{ displayTileName }}</h3>
					<svg
						v-if="editMode"
						id="drag-handle"
						class="drag-handle"
						aria-hidden="true"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						style="margin-top: 6px; margin-bottom: -6px;"
					>
						<polyline points="5 9 2 12 5 15" />
						<polyline points="9 5 12 2 15 5" />
						<polyline points="15 19 12 22 9 19" />
						<polyline points="19 9 22 12 19 15" />
						<line x1="2" y1="12" x2="22" y2="12" />
						<line x1="12" y1="2" x2="12" y2="22" />
					</svg>
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
	data () {
		return {
			imgFailed: false,
			imgLoaded: false
		};
	},
	computed: {
		...mapState('settings', ['sentenceMode', 'tileImageSize']),
		...mapGetters({
			editMode: 'tilePad/editMode',
			locale: 'settings/locale',
			displayTapCount: 'settings/displayTapCount',
			tileTapsCount: 'tilePad/tileTapsCount',
		}),
		pictogramPx () {
			const size = this.tileImageSize || 'medium';
			if (size === 'large') return 64;
			if (size === 'xlarge') return 80;
			return 48;
		},
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
		fallbackBadgeText () {
			const label = String(this.displayTileName || '').trim();
			if (!label) return 'AAC';
			if (label.length <= 3) return label.toUpperCase();
			return label.slice(0, 2).toUpperCase();
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
	watch: {
		resolvedImage () {
			this.imgFailed = false;
			this.imgLoaded = false;
		}
	},
	methods: {
		...mapActions('tilePad', [
			'toggleEditDialogVisibility',
			'setCurrentTileBeingEdited',
			'createNewTile',
			'logTileTap'
		]),
		notifyParentTileTap (spokenText) {
			if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
				window.parent.postMessage({
					type: 'FREESPEECH_SAAC_MESSAGE',
					action: 'tileTap',
					text: String(spokenText || this.displayTileName || '').trim(),
					name: this.displayTileName
				}, '*');
			}
		},
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
					this.notifyParentTileTap(this.localeTileData.text);
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
				this.notifyParentTileTap(this.localeTileData.text);
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
	min-height: 118px !important;
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
	font-size: 0.7rem;
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
.tile-visual-slot {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 48px;
}
.tile-pictogram-img {
	width: 48px;
	height: 48px;
	object-fit: contain;
	display: block;
}
.tile-pictogram-fallback {
	width: 44px;
	height: 44px;
	border-radius: 11px;
	background: rgba(15, 23, 42, 0.07);
	border: 1.5px solid rgba(15, 23, 42, 0.16);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 0.92rem;
	font-weight: 800;
	color: #0f172a;
	letter-spacing: 0.02em;
}
.tile-label {
	font-size: 0.96rem;
	font-weight: 700;
	line-height: 1.25;
	color: #0f172a;
	word-break: break-word;
	white-space: normal;
	margin: 0;
}
.saac-tile-btn.is-sentence-tile {
	min-height: 72px !important;
	border-radius: 10px !important;
}
.saac-tile-btn.is-sentence-tile .tile-visual-slot {
	height: 32px;
}
.saac-tile-btn.is-sentence-tile .tile-pictogram-img {
	width: 32px !important;
	height: 32px !important;
}
.saac-tile-btn.is-sentence-tile .tile-pictogram-fallback {
	width: 30px;
	height: 30px;
	font-size: 0.72rem;
}
.saac-tile-btn.is-sentence-tile .tile-label {
	font-size: 0.8rem;
}
@media (max-width: 640px) {
	.saac-tile-btn {
		min-height: 94px !important;
		border-radius: 11px !important;
	}
	.tile-visual-slot {
		height: 38px;
	}
	.saac-tile-btn .tile-pictogram-img {
		width: 38px !important;
		height: 38px !important;
	}
	.saac-tile-btn .tile-pictogram-fallback {
		width: 36px;
		height: 36px;
		font-size: 0.8rem;
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
		min-height: 62px !important;
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

.saac-tile-btn.tile-img-large {
	min-height: 140px !important;
}
.saac-tile-btn.tile-img-xlarge {
	min-height: 164px !important;
}
.saac-tile-btn.tile-img-large .tile-label {
	font-size: 1.02rem;
}
.saac-tile-btn.tile-img-xlarge .tile-label {
	font-size: 1.1rem;
}
@media (max-width: 640px) {
	.saac-tile-btn.tile-img-large .tile-pictogram-img {
		width: 48px !important;
		height: 48px !important;
	}
	.saac-tile-btn.tile-img-xlarge .tile-pictogram-img {
		width: 56px !important;
		height: 56px !important;
	}
}
</style>
