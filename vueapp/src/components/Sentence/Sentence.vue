<template>
	<div
		class="sentenceCardContainer grey lighten-5"
		role="region"
		:aria-label="$t('sentence.title')"
	>
		<v-card
			outlined
			class="px-4 sentenceCard"
		>
			<v-card-title class="d-flex flex-wrap align-center gap-2">
				<span>{{ $t('sentence.title') }}</span>
				<v-spacer />
				<v-btn
					id="speakSentenceButton"
					raised
					tile
					class="mx-1 my-1"
					color="primary"
					:disabled="tilePadToDisplay.length === 0"
					:aria-label="$t('sentence.buttonSpeak')"
					style="height: unset"
					@click="$emit('speakSentence')"
				>
					<v-container justify="center">
						<v-row
							align="center"
							justify="center"
						>
							<v-icon
								class="pr-2"
								aria-hidden="true"
							>
								record_voice_over
							</v-icon>
						</v-row>
						<v-row>
							<v-card-text
								align="center"
								justify="center"
							>
								<h3>{{ $t('sentence.buttonSpeak') }}</h3>
							</v-card-text>
						</v-row>
					</v-container>
				</v-btn>

				<v-btn
					id="copySentenceButton"
					raised
					tile
					class="mx-1 my-1"
					color="teal darken-1"
					:disabled="tilePadToDisplay.length === 0"
					:aria-label="$t('sentence.buttonCopy')"
					style="height: unset; color: white;"
					@click="copySentence"
				>
					<v-container justify="center">
						<v-row
							align="center"
							justify="center"
						>
							<v-icon
								class="pr-2"
								aria-hidden="true"
							>
								content_copy
							</v-icon>
						</v-row>
						<v-row>
							<v-card-text
								align="center"
								justify="center"
							>
								<h3>{{ $t('sentence.buttonCopy') }}</h3>
							</v-card-text>
						</v-row>
					</v-container>
				</v-btn>

				<v-btn
					v-if="isEmbedded"
					id="insertSentenceButton"
					raised
					tile
					class="mx-1 my-1"
					color="indigo darken-1"
					:disabled="tilePadToDisplay.length === 0"
					:aria-label="$t('sentence.buttonInsert')"
					style="height: unset; color: white;"
					@click="insertSentenceInHost"
				>
					<v-container justify="center">
						<v-row
							align="center"
							justify="center"
						>
							<v-icon
								class="pr-2"
								aria-hidden="true"
							>
								input
							</v-icon>
						</v-row>
						<v-row>
							<v-card-text
								align="center"
								justify="center"
							>
								<h3>{{ $t('sentence.buttonInsert') }}</h3>
							</v-card-text>
						</v-row>
					</v-container>
				</v-btn>

				<v-divider
					class="mx-2"
					inset
					vertical
				/>
				<v-btn
					id="clearSentenceButton"
					raised
					tile
					class="mx-1 my-1"
					color="red darken-1"
					:disabled="tilePadToDisplay.length === 0"
					:aria-label="$t('sentence.buttonClear')"
					style="height: unset; color: white;"
					@click="$emit('clearSentence')"
				>
					<v-container justify="center">
						<v-row
							align="center"
							justify="center"
						>
							<v-icon
								class="pr-2"
								aria-hidden="true"
							>
								clear
							</v-icon>
						</v-row>
						<v-row>
							<v-card-text
								align="center"
								justify="center"
							>
								<h3>{{ $t('sentence.buttonClear') }}</h3>
							</v-card-text>
						</v-row>
					</v-container>
				</v-btn>
			</v-card-title>
			<v-card-text
				class="py-0"
				aria-live="polite"
			>
				<div
					v-if="constructedText"
					id="sentenceTextOutput"
					class="sentence-text-preview mb-3 px-3 py-2"
				>
					<span class="sentence-text-label">{{ $t('sentence.textPreviewLabel') }}</span>
					<strong class="sentence-text-value">{{ constructedText }}</strong>
				</div>

				<p
					v-if="feedbackMessage"
					id="sentenceFeedbackMessage"
					role="status"
					aria-live="polite"
					class="sentence-feedback mb-2"
				>
					{{ feedbackMessage }}
				</p>

				<p
					v-if="tilePadToDisplay.length === 0"
					class="body-2"
				>
					{{ $t('sentence.instructions') }}
				</p>
				<v-row
					v-else
					dense
					class="mb-4"
				>
					<v-col
						v-for="(tile, tileIndex) in tilePadToDisplay"
						:key="tileIndex"
						cols="4"
						sm="3"
						md="1"
						class="d-flex child-flex"
					>
						<Tile
							:tile-data="tile"
							in-sentence-component
							:sentence-index="tileIndex"
							@remove-from-sentence="$emit('removeFromSentence', $event)"
						/>
					</v-col>
				</v-row>
			</v-card-text>
		</v-card>
	</div>
</template>

<script>
import Tile from '@/components/TilePad/Tile.vue';

function fallbackCopyText (text) {
	if (typeof document === 'undefined') return false;
	const textarea = document.createElement('textarea');
	textarea.value = text;
	textarea.setAttribute('readonly', '');
	textarea.style.position = 'fixed';
	textarea.style.opacity = '0';
	document.body.appendChild(textarea);
	textarea.select();
	let copied = false;
	try {
		copied = document.execCommand('copy');
	} catch {
		copied = false;
	}
	document.body.removeChild(textarea);
	return copied;
}

export default {
	name: 'Sentence',
	components: {
		Tile
	},
	props: {
		tilePadToDisplay: {
			type: Array,
			default () {
				return [];
			}
		}
	},
	emits: ['speakSentence', 'clearSentence', 'removeFromSentence', 'copySentence', 'insertSentence'],
	data () {
		return {
			feedbackMessage: '',
			feedbackTimer: null
		};
	},
	computed: {
		constructedText () {
			return this.tilePadToDisplay
				.map(tile => (tile && (tile.text || tile.name)) ? String(tile.text || tile.name).trim() : '')
				.filter(Boolean)
				.join(' ');
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
	beforeUnmount () {
		if (this.feedbackTimer) {
			clearTimeout(this.feedbackTimer);
		}
	},
	methods: {
		showFeedback (msg) {
			this.feedbackMessage = msg;
			if (this.feedbackTimer) {
				clearTimeout(this.feedbackTimer);
			}
			this.feedbackTimer = setTimeout(() => {
				this.feedbackMessage = '';
			}, 3000);
		},
		async copySentence () {
			const text = this.constructedText;
			if (!text) return;

			let copied = false;
			if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
				try {
					await navigator.clipboard.writeText(text);
					copied = true;
				} catch {
					copied = fallbackCopyText(text);
				}
			} else {
				copied = fallbackCopyText(text);
			}

			if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
				window.parent.postMessage({
					type: 'FREESPEECH_SAAC_MESSAGE',
					action: 'copy',
					text
				}, '*');
			}

			this.$emit('copySentence', text);
			this.showFeedback(this.$t('sentence.copiedSuccess'));
			return copied;
		},
		insertSentenceInHost () {
			const text = this.constructedText;
			if (!text) return;

			if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
				window.parent.postMessage({
					type: 'FREESPEECH_SAAC_MESSAGE',
					action: 'insert',
					text
				}, '*');
			}
			this.$emit('insertSentence', text);
			this.showFeedback(this.$t('sentence.insertedSuccess'));
		}
	}
};
</script>
<style scoped>
.sentenceCardContainer {
	position: -webkit-sticky;
	position: sticky;
	top: 56px;
	z-index: 100;
	padding: 5px;
	background-color: white;
}
.sentence-text-preview {
	background-color: #f1f5f9;
	border-left: 4px solid #0f766e;
	border-radius: 4px;
	font-size: 1.05rem;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
}
.sentence-text-label {
	color: #475569;
	font-size: 0.9rem;
}
.sentence-text-value {
	color: #0f172a;
	font-size: 1.15rem;
	user-select: all;
}
.sentence-feedback {
	color: #0f766e;
	font-weight: 600;
	font-size: 0.95rem;
}
</style>
