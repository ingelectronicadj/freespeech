<template>
	<v-app theme="light" :class="{ 'is-embedded-app': isEmbedded }">
		<v-app-bar
			app
			:color="taskbarColor"
			:height="isEmbedded ? 42 : 56"
			theme="dark"
			elevation="2"
			class="saac-app-bar"
		>
			<div class="d-flex align-center px-3">
				<img src="/img/logos/a11ypro.webp" alt="" height="22" style="margin-right:8px;vertical-align:middle;filter:brightness(0) invert(1)"><h1 class="saac-brand-title mb-0">Freespeech</h1>
			</div>

			<v-spacer />

			<v-btn
				icon
				to="/"
				:aria-label="$t('app.navHome')"
				:title="$t('app.navHome')"
				class="saac-nav-icon-btn"
			>
				<svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 10.5L12 3l9 7.5" />
					<path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
					<path d="M9 21v-6h6v6" />
				</svg>
			</v-btn>

			<v-btn
				v-if="passcode"
				icon
				:aria-label="locked ? $t('app.navUnlock') : $t('app.navLock')"
				:title="locked ? $t('app.navUnlock') : $t('app.navLock')"
				class="saac-nav-icon-btn"
				@click="toggleLocked"
			>
				<svg v-if="locked" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="4" y="11" width="16" height="10" rx="2" />
					<path d="M8 11V7a4 4 0 0 1 7.8-1" />
				</svg>
				<svg v-else aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="4" y="11" width="16" height="10" rx="2" />
					<path d="M8 11V7a4 4 0 0 1 8 0v4" />
				</svg>
			</v-btn>

			<v-btn
				v-if="customTilePad"
				icon
				:disabled="isLocked"
				:aria-label="editMode ? $t('app.navSave') : $t('app.navEdit')"
				:title="editMode ? $t('app.navSave') : $t('app.navEdit')"
				:aria-pressed="editMode"
				class="saac-nav-icon-btn"
				@click="toggleEditMode"
			>
				<svg v-if="editMode" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
					<polyline points="17 21 17 13 7 13 7 21" />
					<polyline points="7 3 7 8 15 8" />
				</svg>
				<svg v-else aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 20h9" />
					<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
				</svg>
			</v-btn>

			<v-btn
				icon
				to="/acerca-de"
				:disabled="isLocked"
				:aria-label="$t('app.navAbout')"
				:title="$t('app.navAbout')"
				class="saac-nav-icon-btn"
				@click="disableEditMode"
			>
				<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="9" />
					<line x1="12" y1="16" x2="12" y2="12" />
					<line x1="12" y1="8" x2="12.01" y2="8" />
				</svg>
			</v-btn>

			<v-btn
				icon
				to="/ajustes"
				:disabled="isLocked"
				:aria-label="$t('app.navSettings')"
				:title="$t('app.navSettings')"
				class="saac-nav-icon-btn"
				@click="disableEditMode"
			>
				<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="3" />
					<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.02 1.41 1.09H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
				</svg>
			</v-btn>

			<v-btn
				v-if="!isEmbedded"
				id="openFloatingWindowButton"
				icon
				:aria-label="$t('app.navFloatingWindow')"
				:title="$t('app.navFloatingWindow')"
				class="saac-nav-icon-btn"
				@click="openFloatingWindow"
			>
				<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
					<polyline points="15 3 21 3 21 9" />
					<line x1="10" y1="14" x2="21" y2="3" />
				</svg>
			</v-btn>
		</v-app-bar>

		<v-main>
			<router-view />
			<EditDialog />
		</v-main>

		<v-snackbar
			v-model="passcodeError"
			color="error"
			location="top"
		>
			{{ $t('app.errorIncorrectPasscode') }}
		</v-snackbar>

		<v-dialog
			v-model="passcodeEntry"
			width="400"
			persistent
		>
			<NumberPad
				:title="$t('app.titleEnterPasscode')"
				:length="passcodeLength"
				:hidden="true"
				@input="handlePasscodeInput"
			/>
		</v-dialog>
	</v-app>
</template>

<script>
import EditDialog from '@/components/TilePad/EditTileDialog.vue';
import NumberPad from '@/components/NumberPad/NumberPad.vue';
import { mapActions, mapGetters } from 'vuex';

function normalizeLocaleCode (code) {
	if (!code) return 'en';
	const short = code.toLowerCase().substring(0, 2);
	if (short === 'sp' || short === 'es') return 'es';
	if (short === 'de') return 'de';
	return 'en';
}

export default {
	name: 'App',
	components: {
		EditDialog,
		NumberPad
	},
	data: () => ({
		passcodeEntry: false,
		passcodeError: false,
		passcodeLength: 4,
	}),
	computed: {
		...mapGetters({
			customTilePad: 'settings/customTilePad',
			editMode: 'tilePad/editMode',
			locale: 'settings/locale',
			locked: 'settings/locked',
			passcode: 'settings/passcode',
			selectedVoiceIndex: 'settings/selectedVoiceIndex'
		}),
		isLocked () {
			return this.passcode !== null && this.passcode.length > 0 && this.locked;
		},
		taskbarColor () {
			return this.editMode ? 'success' : 'primary';
		},
		isEmbedded () {
			if (typeof window === 'undefined') return false;
			try {
				const params = new URLSearchParams(window.location.search);
				return params.get('embed') === '1' || window.self !== window.top;
			} catch {
				return true;
			}
		}
	},
	watch: {
		locale (newLocale) {
			const normalized = normalizeLocaleCode(newLocale);
			if (this.$i18n) {
				this.$i18n.locale = normalized;
			}
			if (typeof document !== 'undefined' && document.documentElement) {
				document.documentElement.setAttribute('lang', normalized);
			}
		}
	},
	created () {
		this.systemSaveBackupOfTilePad();
		let urlLang = null;
		if (typeof window !== 'undefined') {
			try {
				const params = new URLSearchParams(window.location.search);
				if (params.get('lang')) {
					urlLang = normalizeLocaleCode(params.get('lang'));
				}
			} catch {
				urlLang = null;
			}
		}

		let activeLocale = urlLang || this.locale;
		if (activeLocale === null) {
			const defaultLanguage = (typeof navigator !== 'undefined' && navigator.languages && navigator.languages[0])
				? navigator.languages[0]
				: ((typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || 'en');
			activeLocale = normalizeLocaleCode(defaultLanguage);
			this.setLocale(activeLocale);
		} else {
			activeLocale = normalizeLocaleCode(activeLocale);
			if (activeLocale !== this.locale) {
				this.setLocale(activeLocale);
			}
		}

		if (this.$i18n) {
			this.$i18n.locale = activeLocale;
		}
		if (typeof document !== 'undefined' && document.documentElement) {
			document.documentElement.setAttribute('lang', activeLocale);
		}

		if (typeof window !== 'undefined') {
			window.addEventListener('message', this.handleHostMessage);
		}

		if (typeof window !== 'undefined' && window.speechSynthesis) {
			const windowVoices = window.speechSynthesis.getVoices();
			if (!windowVoices.length) {
				window.speechSynthesis.onvoiceschanged = () => {
					this.populateVoiceData(window.speechSynthesis.getVoices());
				};
			} else {
				this.populateVoiceData(windowVoices);
			}
		}
	},
	beforeUnmount () {
		if (typeof window !== 'undefined') {
			window.removeEventListener('message', this.handleHostMessage);
		}
	},
	methods: {
		...mapActions({
			setLocale: 'settings/setLocale',
			setLocked: 'settings/setLocked',
			setSelectedVoiceIndex: 'settings/setSelectedVoiceIndex',
			setVoices: 'settings/setVoices',
			setVoiceOptions: 'settings/setVoiceOptions',
			toggleEditMode: 'tilePad/toggleEditMode',
			systemSaveBackupOfTilePad: 'tilePad/systemSaveBackupOfTilePad'
		}),
		switchLanguage (lng) {
			const normalized = normalizeLocaleCode(lng);
			this.setLocale(normalized);
			if (this.$i18n) {
				this.$i18n.locale = normalized;
			}
			if (typeof window !== 'undefined' && window.speechSynthesis) {
				this.populateVoiceData(window.speechSynthesis.getVoices());
			}
		},
		handleHostMessage (event) {
			const data = event && event.data;
			if (!data || data.type !== 'FREESPEECH_HOST_COMMAND') return;
			if (data.command === 'setLang' && data.lang) {
				this.switchLanguage(data.lang);
			}
		},
		handlePasscodeInput (input) {
			this.passcodeEntry = false;

			if (input === this.passcode) {
				this.setLocked(false);
			} else if (input !== null) {
				this.passcodeError = true;
			}
		},
		populateVoiceData (windowVoices) {
			const targetLang = normalizeLocaleCode(this.locale);
			const voiceOptions = windowVoices.map((voice, index) => {
				if (this.selectedVoiceIndex === null && voice.lang && voice.lang.toLowerCase().substring(0, 2) === targetLang) {
					this.setSelectedVoiceIndex(index);
				}
				return {
					text: `${voice.name} (${voice.lang})`,
					value: index
				};
			}).sort((a, b) => a.text.localeCompare(b.text));

			this.setVoices(windowVoices);
			this.setVoiceOptions(voiceOptions);
		},
		disableEditMode () {
			this.$store.dispatch('tilePad/setEditMode', false);
		},
		toggleLocked () {
			if (this.locked) {
				this.passcodeEntry = true;
			} else {
				this.disableEditMode();
				this.setLocked(true);
			}
		},
		openFloatingWindow () {
			if (typeof window === 'undefined') return;
			const targetUrl = new URL(window.location.href);
			targetUrl.searchParams.set('embed', '1');
			window.open(
				targetUrl.toString(),
				'FreeSpeechSAACFloating',
				'width=460,height=680,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
			);
		}
	}
};
</script>

<style scoped>
.saac-brand-title {
	font-size: 1.05rem;
	font-weight: 800;
	letter-spacing: -0.01em;
}
.saac-nav-icon-btn {
	width: 34px !important;
	height: 34px !important;
}
</style>
