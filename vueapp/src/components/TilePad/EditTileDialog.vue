<template>
	<v-dialog
		:model-value="editDialogVisibility"
		persistent
		max-width="720px"
		scrollable
	>
		<v-card class="edit-tile-card" theme="light">
			<v-card-title class="edit-dialog-header d-flex align-center justify-space-between px-5 py-3">
				<span class="dialog-title-text">
					<v-icon class="mr-2" aria-hidden="true">{{ currentTileBeingEdited.newTile ? 'add_circle' : 'edit' }}</v-icon>
					{{ currentTileBeingEdited.newTile ? $t('editMode.tile.addNew') : $t('editMode.tile.title') }}
				</span>
				<v-btn
					icon
					variant="text"
					color="white"
					:aria-label="$t('editMode.tile.buttonClose')"
					@click="toggleEditDialogVisibility"
				>
					<v-icon aria-hidden="true">close</v-icon>
				</v-btn>
			</v-card-title>

			<v-card-text class="px-5 py-4">
				<!-- Vista previa en vivo de la baldosa -->
				<div class="preview-section mb-5">
					<div class="preview-label mb-2">{{ $t('editMode.tile.preview') }}</div>
					<div class="d-flex align-center justify-center flex-wrap" style="gap: 16px;">
						<div
							class="live-tile-preview"
							:style="{ backgroundColor: previewBgColor }"
						>
							<img
								v-if="activeValues.image"
								:src="activeValues.image"
								alt=""
								class="preview-img"
							>
							<div class="preview-name">
								{{ activeValues.name || ($t('editMode.tile.name')) }}
							</div>
						</div>
						<v-btn
							color="primary"
							variant="tonal"
							class="text-none font-weight-bold"
							:disabled="!activeValues.text && !activeValues.name"
							@click="testSpeakPreview"
						>
							<v-icon class="mr-2" aria-hidden="true">volume_up</v-icon>
							{{ $t('editMode.tile.testSpeak') }}
						</v-btn>
					</div>
				</div>

				<v-form
					id="editTileForm"
					ref="form"
					v-model="valid"
				>
					<v-row dense>
						<v-col cols="12" sm="6">
							<v-text-field
								:model-value="activeValues.name"
								:label="$t('editMode.tile.name')"
								variant="outlined"
								density="comfortable"
								:rules="[rules.required]"
								@update:model-value="update('name', $event)"
							/>
						</v-col>

						<v-col cols="12" sm="6">
							<v-text-field
								:model-value="activeValues.text"
								:label="$t('editMode.tile.textToSpeak')"
								variant="outlined"
								density="comfortable"
								:rules="[rules.required]"
								@update:model-value="update('text', $event)"
							/>
						</v-col>

						<!-- Selector visual de color de categoría CAA -->
						<v-col cols="12" class="mb-3">
							<div class="section-subtitle mb-2">
								{{ $t('editMode.tile.accentColor') }}
							</div>
							<div class="color-swatch-grid" role="radiogroup" :aria-label="$t('editMode.tile.accentColor')">
								<button
									v-for="swatch in colorSwatches"
									:key="swatch.key"
									type="button"
									class="color-swatch-btn"
									:class="{ 'is-selected': (activeValues.accent || 'white') === swatch.key }"
									:style="{ backgroundColor: swatch.hex }"
									:aria-pressed="(activeValues.accent || 'white') === swatch.key"
									@click="update('accent', swatch.key)"
								>
									<span class="swatch-check" aria-hidden="true">
										{{ (activeValues.accent || 'white') === swatch.key ? '✓' : '' }}
									</span>
									<span class="swatch-label">{{ $t('editMode.tile.colors.' + swatch.key) }}</span>
								</button>
							</div>
						</v-col>

						<!-- Selector visual de pictogramas + Buscador ARASAAC + Subir imagen -->
						<v-col cols="12" class="mb-3">
							<div class="section-subtitle mb-2">
								{{ $t('editMode.tile.iconCatalog') }}
							</div>

							<!-- Buscador de pictogramas ARASAAC -->
							<div class="d-flex align-center mb-3" style="gap: 8px;">
								<v-text-field
									v-model="arasaacQuery"
									:placeholder="$t('editMode.tile.searchArasaac')"
									variant="outlined"
									density="compact"
									hide-details
									@keyup.enter="searchArasaacPictograms"
								/>
								<v-btn
									color="primary"
									class="text-none font-weight-bold"
									:loading="arasaacLoading"
									@click="searchArasaacPictograms"
								>
									<v-icon class="mr-1" aria-hidden="true">search</v-icon>
									{{ $t('editMode.tile.searchBtn') }}
								</v-btn>
								<v-btn
									color="secondary"
									variant="outlined"
									class="text-none font-weight-bold"
									@click="$refs.localImageInput.click()"
								>
									<v-icon class="mr-1" aria-hidden="true">upload</v-icon>
									{{ $t('editMode.tile.uploadImage') }}
								</v-btn>
								<input
									ref="localImageInput"
									type="file"
									accept="image/*"
									style="display: none"
									@change="handleLocalImageUpload"
								>
							</div>

							<!-- Resultados de ARASAAC o galería rápida de pictogramas -->
							<div class="pictogram-picker-grid">
								<button
									v-for="(pic, idx) in displayedPictograms"
									:key="idx"
									type="button"
									class="pictogram-option-btn"
									:class="{ 'is-selected': activeValues.image === pic.url }"
									:title="pic.label"
									:aria-label="pic.label"
									@click="selectPictogram(pic)"
								>
									<img :src="pic.url" :alt="pic.label" loading="lazy">
									<span>{{ pic.label }}</span>
								</button>
							</div>

							<v-text-field
								class="mt-3"
								:model-value="activeValues.image"
								:label="$t('editMode.tile.imageUrl')"
								variant="outlined"
								density="compact"
								hide-details
								@update:model-value="update('image', $event)"
							/>
						</v-col>

						<!-- Navegación a otro tablero -->
						<v-col cols="12" class="mt-2">
							<div class="section-subtitle mb-1">
								{{ $t('editMode.tile.navigation') }}
							</div>
							<v-text-field
								:model-value="activeValues.navigation"
								:label="$t('editMode.tile.navigationLabel')"
								variant="outlined"
								density="compact"
								hide-details
								@update:model-value="update('navigation', $event)"
							/>
						</v-col>
					</v-row>
				</v-form>
			</v-card-text>

			<v-card-actions class="px-5 py-3 edit-dialog-footer">
				<v-btn
					v-if="!currentTileBeingEdited.newTile"
					color="error"
					variant="tonal"
					class="text-none font-weight-bold"
					@click="removeTile"
				>
					<v-icon class="mr-1" aria-hidden="true">delete</v-icon>
					{{ $t('editMode.tile.buttonDelete') }}
				</v-btn>
				<v-spacer />
				<v-btn
					variant="outlined"
					color="grey-darken-3"
					class="text-none font-weight-bold mr-2"
					@click="toggleEditDialogVisibility"
				>
					{{ $t('editMode.tile.buttonClose') }}
				</v-btn>
				<v-btn
					color="primary"
					variant="flat"
					class="text-none font-weight-bold px-5"
					@click="saveCurrentEdit"
				>
					<v-icon class="mr-1" aria-hidden="true">check</v-icon>
					{{ $t('editMode.tile.buttonSave') }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

const QUICK_PICTOGRAMS = [
	{ label: 'Sí / Aceptar', url: 'https://img.icons8.com/officexs/64/000000/checked.png' },
	{ label: 'No / Cancelar', url: 'https://img.icons8.com/officexs/64/000000/cancel-2.png' },
	{ label: 'Ayuda', url: 'https://img.icons8.com/officexs/64/000000/help.png' },
	{ label: 'Feliz / Bien', url: 'https://img.icons8.com/officexs/64/000000/happy.png' },
	{ label: 'Triste', url: 'https://img.icons8.com/officexs/64/000000/sad.png' },
	{ label: 'Me gusta / Quiero', url: 'https://img.icons8.com/officexs/64/000000/hearts.png' },
	{ label: 'Comer / Comida', url: 'https://img.icons8.com/officexs/64/000000/restaurant.png' },
	{ label: 'Beber / Agua', url: 'https://img.icons8.com/officexs/64/000000/water.png' },
	{ label: 'Casa / Hogar', url: 'https://img.icons8.com/officexs/64/000000/home.png' },
	{ label: 'Escuela / Clase', url: 'https://img.icons8.com/officexs/64/000000/school.png' },
	{ label: 'Dormir / Descansar', url: 'https://img.icons8.com/officexs/64/000000/sleeping-in-bed.png' },
	{ label: 'Música / Escuchar', url: 'https://img.icons8.com/officexs/64/000000/musical-notes.png' },
	{ label: 'Libro / Leer', url: 'https://img.icons8.com/officexs/64/000000/book.png' },
	{ label: 'Jugar', url: 'https://img.icons8.com/officexs/64/000000/controller.png' },
	{ label: 'Arriba', url: 'https://img.icons8.com/officexs/64/000000/long-arrow-up.png' },
	{ label: 'Abajo', url: 'https://img.icons8.com/officexs/64/000000/long-arrow-down.png' },
	{ label: 'Más', url: 'https://img.icons8.com/officexs/64/000000/more.png' },
	{ label: 'Parar / Alto', url: 'https://img.icons8.com/officexs/64/000000/stop-sign.png' },
];

const COLOR_SWATCHES = [
	{ key: 'white', hex: '#FFFFFF' },
	{ key: 'sunny', hex: '#FEF08A' },
	{ key: 'pear', hex: '#E2F0CB' },
	{ key: 'sky', hex: '#BAE6FD' },
	{ key: 'peach', hex: '#FFB7B2' },
	{ key: 'blush', hex: '#FBCFE8' },
	{ key: 'violet', hex: '#C7CEEA' },
	{ key: 'mint', hex: '#B5EAD7' },
];

export default {
	name: 'EditTileDialog',
	data () {
		return {
			colorSwatches: COLOR_SWATCHES,
			tileColors: COLOR_SWATCHES.map(s => s.key),
			valid: false,
			newTileObject: {
				name: '',
				text: '',
				image: QUICK_PICTOGRAMS[0].url,
				accent: 'white',
				navigation: ''
			},
			arasaacQuery: '',
			arasaacResults: [],
			arasaacLoading: false,
			rules: {
				required: value => !!value || 'Required'
			}
		};
	},
	computed: {
		...mapGetters('tilePad', [
			'editDialogVisibility',
			'currentTileBeingEdited',
			'customTilePadData'
		]),
		...mapGetters({
			locale: 'settings/locale',
			voices: 'settings/voices',
			selectedVoiceIndex: 'settings/selectedVoiceIndex'
		}),
		activeValues () {
			if (this.currentTileBeingEdited && this.currentTileBeingEdited.newTile) {
				return this.newTileObject;
			}
			return this.currentTileBeingEdited || {};
		},
		previewBgColor () {
			const acc = this.activeValues.accent || 'white';
			const found = COLOR_SWATCHES.find(s => s.key === acc);
			return found ? found.hex : '#FFFFFF';
		},
		displayedPictograms () {
			return this.arasaacResults.length > 0 ? this.arasaacResults : QUICK_PICTOGRAMS;
		},
		areRequiredFieldsFilled () {
			return !!this.newTileObject.name && !!this.newTileObject.text;
		},
		navigations () {
			return Object.keys(this.customTilePadData);
		}
	},
	watch: {
		editDialogVisibility (isOpen) {
			if (isOpen) {
				this.arasaacResults = [];
				this.arasaacQuery = '';
				if (this.currentTileBeingEdited && this.currentTileBeingEdited.newTile) {
					this.newTileObject = {
						name: '',
						text: '',
						image: QUICK_PICTOGRAMS[0].url,
						accent: 'white',
						navigation: ''
					};
				}
			}
		}
	},
	methods: {
		...mapActions('tilePad', [
			'toggleEditDialogVisibility',
			'saveEditsToTileBeingEdited',
			'createNewTile',
			'saveTileEdit',
			'deleteCurrentTile'
		]),
		validate () {
			if (this.$refs.form && this.$refs.form.validate) {
				this.$refs.form.validate();
			}
		},
		resetValidation () {
			if (this.$refs.form && this.$refs.form.resetValidation) {
				this.$refs.form.resetValidation();
			}
		},
		selectPictogram (pic) {
			this.update('image', pic.url);
			if (!this.activeValues.name) {
				const cleanLabel = pic.label.split('/')[0].trim();
				this.update('name', cleanLabel);
				if (!this.activeValues.text) {
					this.update('text', cleanLabel);
				}
			}
		},
		async searchArasaacPictograms () {
			const q = (this.arasaacQuery || '').trim();
			if (!q || typeof fetch === 'undefined') {
				this.arasaacResults = [];
				return;
			}
			this.arasaacLoading = true;
			try {
				const langCode = (this.locale === 'sp' || !this.locale) ? 'es' : this.locale;
				const res = await fetch(`https://api.arasaac.org/v1/pictograms/${encodeURIComponent(langCode)}/search/${encodeURIComponent(q)}`);
				if (res.ok) {
					const data = await res.json();
					if (Array.isArray(data) && data.length > 0) {
						this.arasaacResults = data.slice(0, 18).map(item => {
							const kw = (item.keywords && item.keywords[0] && item.keywords[0].keyword)
								? item.keywords[0].keyword
								: q;
							return {
								label: kw,
								url: `https://static.arasaac.org/pictograms/${item._id}/${item._id}_300.png`
							};
						});
					}
				}
			} catch {
				// Fallback to built-in catalog if offline
			} finally {
				this.arasaacLoading = false;
			}
		},
		handleLocalImageUpload (event) {
			const file = event && event.target && event.target.files ? event.target.files[0] : null;
			if (!file) return;
			const reader = new FileReader();
			reader.onload = (e) => {
				if (e.target && e.target.result) {
					this.update('image', e.target.result);
				}
			};
			reader.readAsDataURL(file);
		},
		testSpeakPreview () {
			const phrase = this.activeValues.text || this.activeValues.name;
			if (!phrase || typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
				return;
			}
			window.speechSynthesis.cancel();
			const utter = new SpeechSynthesisUtterance(phrase);
			if (this.voices && this.selectedVoiceIndex !== null && this.voices[this.selectedVoiceIndex]) {
				utter.voice = this.voices[this.selectedVoiceIndex];
			}
			window.speechSynthesis.speak(utter);
		},
		removeTile () {
			this.deleteCurrentTile();
			this.toggleEditDialogVisibility();
		},
		saveCurrentEdit () {
			if (this.currentTileBeingEdited.newTile) {
				this.validate();

				if (this.valid || this.areRequiredFieldsFilled) {
					this.resetValidation();
					delete this.currentTileBeingEdited.newTile;
					this.createNewTile({ ...this.newTileObject });
					this.newTileObject = {
						name: '',
						text: '',
						image: QUICK_PICTOGRAMS[0].url,
						accent: 'white',
						navigation: ''
					};
					this.toggleEditDialogVisibility();
				}
				return;
			} else {
				this.saveTileEdit();
				this.toggleEditDialogVisibility();
			}
		},
		update (key, value) {
			if (!this.currentTileBeingEdited.newTile) {
				this.saveEditsToTileBeingEdited({
					key,
					value
				});
			} else {
				this.newTileObject[key] = value;
			}
		}
	},
};
</script>

<style scoped>
.edit-tile-card {
	background: #ffffff !important;
	color: #0f172a !important;
	border-radius: 16px !important;
	overflow: hidden;
}
.edit-dialog-header {
	background: #0f766e;
	color: #ffffff;
}
.dialog-title-text {
	font-size: 1.2rem;
	font-weight: 800;
	display: flex;
	align-items: center;
}
.preview-section {
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	padding: 12px 16px;
	text-align: center;
}
.preview-label {
	font-size: 0.82rem;
	font-weight: 700;
	text-transform: uppercase;
	color: #475569;
}
.live-tile-preview {
	width: 132px;
	min-height: 116px;
	border-radius: 14px;
	border: 2px solid rgba(15, 23, 42, 0.2);
	box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
	padding: 12px 10px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8px;
}
.preview-img {
	width: 52px;
	height: 52px;
	object-fit: contain;
}
.preview-name {
	font-size: 0.98rem;
	font-weight: 800;
	color: #0f172a;
	line-height: 1.2;
	word-break: break-word;
}
.section-subtitle {
	font-size: 0.92rem;
	font-weight: 700;
	color: #1e293b;
}
.color-swatch-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
	gap: 8px;
}
.color-swatch-btn {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 10px;
	border-radius: 10px;
	border: 2px solid #cbd5e1;
	cursor: pointer;
	font-size: 0.82rem;
	font-weight: 700;
	color: #0f172a;
	text-align: left;
	transition: transform 0.12s ease, border-color 0.12s ease;
}
.color-swatch-btn:hover {
	transform: translateY(-1px);
	border-color: #0f766e;
}
.color-swatch-btn.is-selected {
	border-color: #0f172a;
	box-shadow: 0 0 0 2px #0f766e;
}
.swatch-check {
	width: 18px;
	font-weight: 900;
}
.pictogram-picker-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
	gap: 8px;
	max-height: 210px;
	overflow-y: auto;
	padding: 8px;
	background: #f8fafc;
	border: 1px solid #cbd5e1;
	border-radius: 10px;
}
.pictogram-option-btn {
	background: #ffffff;
	border: 2px solid #e2e8f0;
	border-radius: 10px;
	padding: 6px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	cursor: pointer;
	font-size: 0.74rem;
	font-weight: 600;
	color: #1e293b;
	text-align: center;
}
.pictogram-option-btn img {
	width: 40px;
	height: 40px;
	object-fit: contain;
}
.pictogram-option-btn:hover {
	border-color: #0284c7;
	background: #f0f9ff;
}
.pictogram-option-btn.is-selected {
	border-color: #0f766e;
	background: #ccfbf1;
}
.edit-dialog-footer {
	background: #f8fafc;
	border-top: 1px solid #e2e8f0;
}
</style>
