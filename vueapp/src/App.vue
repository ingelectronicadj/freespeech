<template>
	<v-app theme="light">
		<v-app-bar
			app
			:color="taskbarColor"
			theme="dark"
			elevation="2"
		>
			<div class="d-flex align-center px-3">
				<h1 class="text-h6 font-weight-bold mb-0">Freespeech</h1>
			</div>

			<v-spacer />

			<v-btn
				icon
				to="/"
				:aria-label="$t('app.navHome')"
			>
				<v-icon aria-hidden="true">
					home
				</v-icon>
			</v-btn>

			<v-btn
				v-if="passcode"
				icon
				:aria-label="locked ? $t('app.navUnlock') : $t('app.navLock')"
				@click="toggleLocked"
			>
				<v-icon aria-hidden="true">{{ locked ? 'lock_open' : 'lock' }}</v-icon>
			</v-btn>

			<v-btn
				v-if="customTilePad"
				icon
				:disabled="isLocked"
				:aria-label="editMode ? $t('app.navSave') : $t('app.navEdit')"
				:aria-pressed="editMode"
				@click="toggleEditMode"
			>
				<v-icon aria-hidden="true">{{ editMode ? 'save' : 'edit' }}</v-icon>
			</v-btn>

			<v-btn
				icon
				to="/about"
				:disabled="isLocked"
				:aria-label="$t('app.navAbout')"
				@click="disableEditMode"
			>
				<v-icon aria-hidden="true">
					info
				</v-icon>
			</v-btn>

			<v-btn
				icon
				to="/settings"
				:disabled="isLocked"
				:aria-label="$t('app.navSettings')"
				@click="disableEditMode"
			>
				<v-icon aria-hidden="true">
					settings
				</v-icon>
			</v-btn>

			<v-btn
				v-if="!isEmbedded"
				id="openFloatingWindowButton"
				icon
				:aria-label="$t('app.navFloatingWindow')"
				@click="openFloatingWindow"
			>
				<v-icon aria-hidden="true">
					open_in_new
				</v-icon>
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
		let activeLocale = this.locale;
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
