<template>
	<v-container class="pb-10">
		<h1 class="mb-5">
			{{ $t('settings.title') }}
		</h1>

		<div class="settings-grid">
			<div>
		<v-select
			v-model="selectedLanguage"
			:items="languageOptions"
			item-title="text"
			item-value="value"
			:label="$t('settings.optionLanguage')"
		/>

		<v-select
			v-model="selectedVoiceIndex"
			:items="voiceOptions"
			item-title="text"
			item-value="value"
			:label="$t('settings.optionVoice')"
		/>

		<v-slider
			v-model="voiceRate"
			:min="0.5"
			:max="1.5"
			:step="0.1"
			thumb-label
			:label="$t('settings.optionVoiceRate')"
			:hint="$t('settings.hintVoiceRate')"
			persistent-hint
			class="mb-3"
		/>

		<v-slider
			v-model="voicePitch"
			:min="0.5"
			:max="2"
			:step="0.1"
			thumb-label
			:label="$t('settings.optionVoicePitch')"
			:hint="$t('settings.hintVoicePitch')"
			persistent-hint
			class="mb-3"
		/>
		<v-select
			v-model="tileImageSize"
			:items="tileImageSizeOptions"
			item-title="text"
			item-value="value"
			:label="$t('settings.optionPictogramSize')"
			:hint="$t('settings.hintPictogramSize')"
			persistent-hint
		/>

		<v-select
			v-model="gridDensity"
			:items="gridDensityOptions"
			item-title="text"
			item-value="value"
			:label="$t('settings.optionBoardTileSize')"
			:hint="$t('settings.hintBoardTileSize')"
			persistent-hint
		/>

		<v-switch
			v-model="highContrast"
			color="primary"
			:label="$t('settings.optionHighContrast')"
			:hint="$t('settings.hintHighContrast')"
			persistent-hint
		/>

		<v-select
			v-model="activationDelay"
			:items="activationDelayOptions"
			item-title="text"
			item-value="value"
			:label="$t('settings.optionActivationDelay')"
			:hint="$t('settings.hintActivationDelay')"
			persistent-hint
		/>

			</div>
			<div
			class="settings-live-preview"
			:class="{ 'preview-contrast': highContrast }"
			role="img"
			:aria-label="$t('settings.previewAria')"
		>
			<span class="preview-caption">{{ $t('settings.previewLabel') }}</span>
			<div
				class="preview-tile"
				:class="['preview-' + (tileImageSize || 'medium'), 'dens-' + (gridDensity || 'auto')]"
			>
				<img src="/img/pictograms/6456.png" alt="" aria-hidden="true">
				<span>{{ previewWord }}</span>
				<span v-if="tapCount" class="preview-taps">7</span>
			</div>
		</div>
		</div>

		<div class="switches-grid">
		<v-switch
			v-model="customTilePad"
			color="primary"
			:label="$t('settings.optionCustomTilePad')"
		/>

		<v-switch
			v-model="sentenceMode"
			color="primary"
			:label="$t('settings.optionCreateSentences')"
		/>

		<v-switch
			v-model="passcodeEnabled"
			color="primary"
			:label="$t('settings.optionPasscodeEnabled')"
		/>

		<v-switch
			v-model="tapCount"
			color="primary"
			:label="$t('settings.displayTapCounter')"
		/>
		</div>

		<v-dialog
			v-model="passcodeEntry"
			width="400"
			persistent
		>
			<NumberPad
				:title="$t('settings.titleSetPasscode')"
				:length="passcodeLength"
				:hidden="true"
				@input="handlePasscodeInput"
			/>
		</v-dialog>

		<div>
			<v-btn
				color="warning"
				class="mt-4 mr-4"
				@click="fullReset"
			>
				<v-icon
					class="mr-2"
					aria-hidden="true"
				>
					refresh
				</v-icon>
				{{ $t('settings.buttonReset') }}
			</v-btn>
		</div>

		<div>
			<v-btn
				color="white"
				class="mt-4 mr-4"
				@click="exportSettings"
			>
				<v-icon
					class="mr-2"
					aria-hidden="true"
				>
					cloud_download
				</v-icon>
				{{ $t('settings.buttonExport') }}
			</v-btn>

			<v-btn
				color="white"
				class="mt-4 mr-4"
				@click="$refs.importSettingsFile.click()"
			>
				<v-icon
					class="mr-2"
					aria-hidden="true"
				>
					cloud_upload
				</v-icon>
				{{ $t('settings.buttonImport') }}
			</v-btn>

			<input
				ref="importSettingsFile"
				type="file"
				accept=".json,application/json"
				style="display: none"
				:aria-label="$t('settings.buttonImport')"
				@change="importSettings"
			>
		</div>
	</v-container>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { saveAs } from 'file-saver';
import NumberPad from '@/components/NumberPad/NumberPad.vue';
import { messages as localeMessages } from '@/i18n';

export default {
	name: 'Settings',
	components: { NumberPad },
	data () {
		return {
			passcodeEntry: false,
			passcodeLength: 4,
		};
	},
	computed: {
		...mapGetters({
			customTilePadData: 'tilePad/customTilePadData',
			locale: 'settings/locale',
			passcode: 'settings/passcode',
			voiceOptions: 'settings/voiceOptions',
			voices: 'settings/voices',
			displayTapCount: 'settings/displayTapCount',
		}),
		selectedVoiceIndex: {
			get () {
				return this.$store.state.settings.selectedVoiceIndex;
			},
			set (value) {
				this.setSelectedVoiceIndex(value);
				if (typeof window !== 'undefined' && window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined') {
					const speechSynthesisUtterance = new SpeechSynthesisUtterance('Welcome to Free Speech');
					if (this.voices && this.voices[value]) {
						speechSynthesisUtterance.voice = this.voices[value];
					}
					window.speechSynthesis.speak(speechSynthesisUtterance);
				}
			}
		},
		customTilePad: {
			get () {
				return this.$store.state.settings.customTilePad;
			},
			set (value) {
				if (!value) {
					this.setEditMode(false);
				}
				this.toggleCustomTilePad();
			}
		},
		passcodeEnabled: {
			get () {
				return this.passcode !== null;
			},
			set (value) {
				if (value === true) {
					this.setPasscode('');
					this.passcodeEntry = true;
				} else {
					this.setPasscode(null);
				}
			}
		},
		sentenceMode: {
			get () {
				return this.$store.state.settings.sentenceMode;
			},
			set () {
				this.toggleSentenceMode();
			}
		},
		selectedLanguage: {
			get () {
				return this.locale === 'sp' ? 'es' : this.locale;
			},
			set (value) {
				if (this.$i18n) {
					this.$i18n.locale = value;
				}
				this.setLocale(value);
			}
		},
		languageOptions () {
			const supported = ['en', 'es', 'de'];
			return supported
				.filter(code => localeMessages[code])
				.map(code => ({
					value: code,
					text: localeMessages[code].languageName
				}));
		},
		tapCount: {
			get () {
				return this.displayTapCount;
			},
			set (value) {
				this.setDisplayTapCount(value);
			}
		},
		tileImageSize: {
			get () {
				return this.$store.state.settings.tileImageSize || 'medium';
			},
			set (value) {
				this.setTileImageSize(value);
			}
		},
		previewWord () {
			const loc = (this.locale || 'sp').toLowerCase();
			return loc.startsWith('de') ? 'Essen' : (loc.startsWith('en') ? 'Eat' : 'Comer');
		},
		tileImageSizeOptions () {
			return ['medium', 'large', 'xlarge'].map(v => ({
				value: v,
				text: this.$t('settings.pictogramSize.' + v)
			}));
		},
		gridDensity: {
			get () {
				return this.$store.state.settings.gridDensity || 'auto';
			},
			set (value) {
				this.setGridDensity(value);
			}
		},
		gridDensityOptions () {
			return ['auto', 'large', 'xlarge'].map(v => ({
				value: v,
				text: this.$t('settings.boardTileSize.' + v)
			}));
		},
		voiceRate: {
			get () { return this.$store.state.settings.voiceRate || 1; },
			set (v) { this.setVoiceRate(v); }
		},
		voicePitch: {
			get () { return this.$store.state.settings.voicePitch || 1; },
			set (v) { this.setVoicePitch(v); }
		},
		activationDelay: {
			get () { return this.$store.state.settings.activationDelay || 0; },
			set (v) { this.setActivationDelay(v); }
		},
		activationDelayOptions () {
			return [0, 300, 500, 800].map(v => ({ value: v, text: v === 0 ? this.$t('settings.delayOff') : v + ' ms' }));
		},
		highContrast: {
			get () {
				return !!this.$store.state.settings.highContrast;
			},
			set (value) {
				this.setHighContrast(value);
			}
		}
	},
	methods: {
		...mapActions({
			setEditMode: 'tilePad/setEditMode',
			setLocale: 'settings/setLocale',
			setLocked: 'settings/setLocked',
			setPasscode: 'settings/setPasscode',
			setSelectedVoiceIndex: 'settings/setSelectedVoiceIndex',
			toggleCustomTilePad: 'settings/toggleCustomTilePad',
			toggleSentenceMode: 'settings/toggleSentenceMode',
			setDisplayTapCount: 'settings/setDisplayTapCount',
			setTileImageSize: 'settings/setTileImageSize',
			setGridDensity: 'settings/setGridDensity',
			setHighContrast: 'settings/setHighContrast',
			setVoiceRate: 'settings/setVoiceRate',
			setVoicePitch: 'settings/setVoicePitch',
			setActivationDelay: 'settings/setActivationDelay',
		}),
		exportSettings () {
			const json = JSON.stringify({
				'settings/setSentenceMode': this.sentenceMode,
				'settings/setCustomTilePad': this.customTilePad,
				'settings/setPasscode': this.passcode,
				'tilePad/setCustomTilePadData': this.customTilePadData
			});

			const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
			saveAs(blob, 'freespeech-settings.json');
		},
		async importSettings () {
			if (!this.$refs.importSettingsFile || !this.$refs.importSettingsFile.files || !this.$refs.importSettingsFile.files[0]) {
				return;
			}

			const json = await this.$refs.importSettingsFile.files[0].text();
			const data = JSON.parse(json);
			if (data) {
				for (const [key, value] of Object.entries(data)) {
					await this.$store.dispatch(key, value);
				}
			}
		},
		fullReset () {
			if (!confirm('Are you sure you want to reset all settings and custom pictograms?')) {
				return false;
			}

			if (typeof window.localStorage !== 'undefined') {
				window.localStorage.removeItem('vuex');
			}

			document.location.reload();
		},
		handlePasscodeInput (input) {
			this.passcodeEntry = false;

			if (input !== null && input.length === this.passcodeLength) {
				this.setPasscode(input);
				this.setLocked(true);
			} else {
				this.setPasscode(null);
			}
		}
	}
};
</script>

<style scoped>
.settings-grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 8px 24px;
	align-items: start;
}
@media (min-width: 720px) {
	.settings-grid { grid-template-columns: 1fr 1fr; }
}
.settings-live-preview {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 16px;
	margin: 4px 0 16px;
	border-radius: 10px;
	background: #f1f5f9;
	border: 1px solid #e2e8f0;
	min-height: 100%;
	justify-content: center;
}
.preview-caption { font-size: .8rem; font-weight: 700; color: #475569; }
.preview-tile {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-start;
	gap: 4px;
	width: 130px;
	min-height: 118px;
	padding: 8px 6px;
	border-radius: 12px;
	background: #d1fae5;
	border: 2px solid rgba(15,118,110,.35);
	box-shadow: 0 2px 6px rgba(0,0,0,.12);
	font-weight: 700;
	font-size: .85rem;
	text-align: center;
	color: #0f172a;
	transition: all .15s ease;
}
.preview-tile img { width: 48px; height: 48px; object-fit: contain; }
.preview-tile.dens-large { width: 160px; }
.preview-tile.dens-xlarge { width: 200px; }
.preview-tile.preview-large { min-height: 140px; }
.preview-tile.preview-large img { width: 64px; height: 64px; }
.preview-tile.preview-large { font-size: 1.02rem; }
.preview-tile.preview-xlarge { min-height: 164px; }
.preview-tile.preview-xlarge img { width: 80px; height: 80px; }
.preview-tile.preview-xlarge { font-size: 1.1rem; }
.preview-contrast .preview-tile { border: 3px solid #000; }
.preview-contrast .preview-tile img { filter: contrast(1.15) saturate(1.15); }

.preview-tile { position: relative; }
.preview-taps {
	position: absolute;
	top: 4px;
	right: 6px;
	background: #0f766e;
	color: #fff;
	font-size: .62rem;
	font-weight: 800;
	padding: 1px 6px;
	border-radius: 999px;
}
.switches-grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 0 24px;
}
@media (min-width: 720px) {
	.switches-grid { grid-template-columns: 1fr 1fr; }
}
</style>
