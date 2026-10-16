<template>
	<div
		class="sentenceCardContainer"
		role="region"
		:aria-label="$t('sentence.title')"
	>
		<v-card
			theme="light"
			class="sentenceCard"
		>
			<div class="sentence-top-bar">
				<div class="sentence-header-left">
					<h2 class="sentence-section-title">
						{{ $t('sentence.title') }}
					</h2>
					<div
						v-if="constructedText"
						id="sentenceTextOutput"
						class="sentence-text-preview"
					>
						<span class="sentence-text-label">{{ $t('sentence.textPreviewLabel') }}</span>
						<strong class="sentence-text-value">{{ constructedText }}</strong>
					</div>
				</div>

				<div class="sentence-actions-group">
					<v-btn
						id="speakSentenceButton"
						color="primary"
						class="text-none font-weight-bold sentence-action-btn"
						:disabled="tilePadToDisplay.length === 0"
						:aria-label="$t('sentence.buttonSpeak')"
						@click="$emit('speakSentence')"
					>
						<v-icon class="mr-1" aria-hidden="true">record_voice_over</v-icon>
						<span>{{ $t('sentence.buttonSpeak') }}</span>
					</v-btn>

					<v-btn
						v-if="isEmbedded"
						id="insertSentenceButton"
						color="info"
						class="text-none font-weight-bold sentence-action-btn"
						:disabled="tilePadToDisplay.length === 0"
						:aria-label="$t('sentence.buttonInsert')"
						@click="insertSentenceInHost"
					>
						<v-icon class="mr-1" aria-hidden="true">input</v-icon>
						<span>{{ $t('sentence.buttonInsert') }}</span>
					</v-btn>

					<v-btn
						id="copySentenceButton"
						color="secondary"
						class="text-none font-weight-bold sentence-action-btn"
						:disabled="tilePadToDisplay.length === 0"
						:aria-label="$t('sentence.buttonCopy')"
						@click="copySentence"
					>
						<v-icon class="mr-1" aria-hidden="true">content_copy</v-icon>
						<span>{{ $t('sentence.buttonCopy') }}</span>
					</v-btn>

					<v-btn
						id="clearSentenceButton"
						color="error"
						variant="tonal"
						class="text-none font-weight-bold sentence-action-btn"
						:disabled="tilePadToDisplay.length === 0"
						:aria-label="$t('sentence.buttonClear')"
						@click="$emit('clearSentence')"
					>
						<v-icon class="mr-1" aria-hidden="true">clear</v-icon>
						<span>{{ $t('sentence.buttonClear') }}</span>
					</v-btn>
				</div>
			</div>

			<v-card-text
				class="pa-0"
				aria-live="polite"
			>
				<p
					v-if="feedbackMessage"
					id="sentenceFeedbackMessage"
					role="status"
					aria-live="polite"
					class="sentence-feedback mb-1"
				>
					{{ feedbackMessage }}
				</p>

				<p
					v-if="tilePadToDisplay.length === 0"
					class="sentence-empty-hint mb-0"
				>
					{{ $t('sentence.instructions') }}
				</p>
				<div
					v-else
					class="sentence-tiles-strip mt-2"
				>
					<div
						v-for="(tile, tileIndex) in tilePadToDisplay"
						:key="tileIndex"
						class="sentence-tile-item"
					>
						<Tile
							:tile-data="tile"
							in-sentence-component
							:sentence-index="tileIndex"
							@remove-from-sentence="$emit('removeFromSentence', $event)"
						/>
					</div>
				</div>
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
	padding: 8px 12px 4px;
	background-color: #f1f5f9;
}
.sentenceCard {
	max-width: 1380px;
	margin: 0 auto;
	padding: 10px 14px !important;
	background: #ffffff !important;
	border: 2px solid #cbd5e1 !important;
	border-radius: 14px !important;
	box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08) !important;
}
.sentence-top-bar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
}
.sentence-header-left {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 10px;
	flex: 1;
	min-width: 180px;
}
.sentence-section-title {
	font-size: 1.05rem;
	font-weight: 800;
	color: #0f172a;
	margin: 0;
	white-space: nowrap;
}
.sentence-actions-group {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
}
.sentence-action-btn {
	min-height: 40px !important;
	padding: 0 12px !important;
	font-size: 0.86rem !important;
}
.sentence-empty-hint {
	color: #475569;
	font-size: 0.88rem;
	padding: 4px 0 2px;
}
.sentence-text-preview {
	background-color: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-left: 4px solid #0f766e;
	border-radius: 8px;
	padding: 4px 10px;
	font-size: 0.95rem;
	display: inline-flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 6px;
	max-width: 100%;
}
.sentence-text-label {
	color: #334155;
	font-size: 0.8rem;
	font-weight: 600;
}
.sentence-text-value {
	color: #0f172a;
	font-size: 1.02rem;
	user-select: all;
	word-break: break-word;
}
.sentence-feedback {
	color: #0f766e;
	font-weight: 700;
	font-size: 0.86rem;
}
/* Tira horizontal compacta de pictogramas seleccionados (ideal para móviles y tablets) */
.sentence-tiles-strip {
	display: flex;
	flex-wrap: nowrap;
	overflow-x: auto;
	gap: 8px;
	padding-bottom: 4px;
	-webkit-overflow-scrolling: touch;
}
.sentence-tile-item {
	flex: 0 0 auto;
	width: 112px;
}
@media (max-width: 640px) {
	.sentenceCardContainer {
		top: 48px;
		padding: 6px 8px 2px;
	}
	.sentenceCard {
		padding: 8px 10px !important;
		border-radius: 10px !important;
	}
	.sentence-section-title {
		font-size: 0.92rem;
	}
	.sentence-actions-group {
		width: 100%;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
		gap: 5px;
	}
	.sentence-action-btn {
		min-height: 36px !important;
		padding: 0 8px !important;
		font-size: 0.78rem !important;
		width: 100%;
	}
	.sentence-tile-item {
		width: 94px;
	}
}
</style>
