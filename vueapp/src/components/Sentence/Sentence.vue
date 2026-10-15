<template>
	<div
		class="sentenceCardContainer"
		role="region"
		:aria-label="$t('sentence.title')"
	>
		<v-card
			theme="light"
			class="px-5 py-3 sentenceCard"
		>
			<div class="d-flex flex-wrap align-center justify-space-between mb-2" style="gap: 10px;">
				<h2 class="sentence-section-title">
					{{ $t('sentence.title') }}
				</h2>
				<div class="d-flex flex-wrap align-center" style="gap: 8px;">
					<v-btn
						id="speakSentenceButton"
						color="primary"
						size="large"
						class="text-none font-weight-bold px-4"
						:disabled="tilePadToDisplay.length === 0"
						:aria-label="$t('sentence.buttonSpeak')"
						@click="$emit('speakSentence')"
					>
						<v-icon class="mr-2" aria-hidden="true">record_voice_over</v-icon>
						{{ $t('sentence.buttonSpeak') }}
					</v-btn>

					<v-btn
						id="copySentenceButton"
						color="secondary"
						size="large"
						class="text-none font-weight-bold px-4"
						:disabled="tilePadToDisplay.length === 0"
						:aria-label="$t('sentence.buttonCopy')"
						@click="copySentence"
					>
						<v-icon class="mr-2" aria-hidden="true">content_copy</v-icon>
						{{ $t('sentence.buttonCopy') }}
					</v-btn>

					<v-btn
						v-if="isEmbedded"
						id="insertSentenceButton"
						color="info"
						size="large"
						class="text-none font-weight-bold px-4"
						:disabled="tilePadToDisplay.length === 0"
						:aria-label="$t('sentence.buttonInsert')"
						@click="insertSentenceInHost"
					>
						<v-icon class="mr-2" aria-hidden="true">input</v-icon>
						{{ $t('sentence.buttonInsert') }}
					</v-btn>

					<v-btn
						id="clearSentenceButton"
						color="error"
						variant="tonal"
						size="large"
						class="text-none font-weight-bold px-4"
						:disabled="tilePadToDisplay.length === 0"
						:aria-label="$t('sentence.buttonClear')"
						@click="$emit('clearSentence')"
					>
						<v-icon class="mr-2" aria-hidden="true">clear</v-icon>
						{{ $t('sentence.buttonClear') }}
					</v-btn>
				</div>
			</div>

			<v-card-text
				class="pa-0"
				aria-live="polite"
			>
				<div
					v-if="constructedText"
					id="sentenceTextOutput"
					class="sentence-text-preview mb-3 px-4 py-2"
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
					class="sentence-empty-hint mb-0"
				>
					{{ $t('sentence.instructions') }}
				</p>
				<v-row
					v-else
					dense
					class="mt-1"
				>
					<v-col
						v-for="(tile, tileIndex) in tilePadToDisplay"
						:key="tileIndex"
						cols="6"
						sm="3"
						md="2"
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
	padding: 10px 16px 4px;
	background-color: #f1f5f9;
}
.sentenceCard {
	max-width: 1380px;
	margin: 0 auto;
	background: #ffffff !important;
	border: 2px solid #cbd5e1 !important;
	border-radius: 14px !important;
	box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08) !important;
}
.sentence-section-title {
	font-size: 1.2rem;
	font-weight: 800;
	color: #0f172a;
	margin: 0;
}
.sentence-empty-hint {
	color: #475569;
	font-size: 0.95rem;
	padding: 6px 0;
}
.sentence-text-preview {
	background-color: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-left: 5px solid #0f766e;
	border-radius: 8px;
	font-size: 1.05rem;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
}
.sentence-text-label {
	color: #334155;
	font-size: 0.9rem;
	font-weight: 600;
}
.sentence-text-value {
	color: #0f172a;
	font-size: 1.2rem;
	user-select: all;
}
.sentence-feedback {
	color: #0f766e;
	font-weight: 700;
	font-size: 0.95rem;
}
</style>
