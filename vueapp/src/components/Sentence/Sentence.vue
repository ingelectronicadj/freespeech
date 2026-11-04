<template>
	<div
		class="sentenceCardContainer"
		:class="{
			'is-embedded-sentence': isEmbedded,
			'is-empty-sentence': tilePadToDisplay.length === 0
		}"
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
						class="text-none font-weight-bold sentence-action-btn speak-big"
						:disabled="tilePadToDisplay.length === 0"
						:aria-label="$t('sentence.buttonSpeak')"
						@click="$emit('speakSentence')"
					>
						<svg class="btn-svg-ico" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
							<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
							<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
							<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
						</svg>
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
						<svg class="btn-svg-ico" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
							<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
							<polyline points="10 17 15 12 10 7" />
							<line x1="15" y1="12" x2="3" y2="12" />
						</svg>
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
						<svg class="btn-svg-ico" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
						</svg>
						<span>{{ $t('sentence.buttonCopy') }}</span>
					</v-btn>

					<v-btn
						id="backspaceSentenceButton"
						color="warning"
						variant="tonal"
						class="text-none font-weight-bold sentence-action-btn"
						:disabled="tilePadToDisplay.length === 0"
						:aria-label="$t('sentence.buttonBackspace')"
						@click="$emit('backspaceSentence')"
					>
						<svg class="btn-svg-ico" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
							<line x1="18" y1="9" x2="12" y2="15" />
							<line x1="12" y1="9" x2="18" y2="15" />
						</svg>
						<span>{{ $t('sentence.buttonBackspace') }}</span>
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
						<svg class="btn-svg-ico" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
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
	emits: ['speakSentence', 'clearSentence', 'backspaceSentence', 'removeFromSentence', 'copySentence', 'insertSentence'],
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
.sentenceCardContainer.is-embedded-sentence {
	top: 42px;
	padding: 6px 8px 3px;
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
	min-width: 140px;
}
.sentence-section-title {
	font-size: 1.02rem;
	font-weight: 800;
	color: #0f172a;
	margin: 0;
	white-space: nowrap;
}
.sentence-actions-group {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 5px;
}
.sentence-action-btn {
	min-height: 36px !important;
	padding: 0 10px !important;
	font-size: 0.82rem !important;
}
.btn-svg-ico {
	margin-right: 5px;
	flex-shrink: 0;
}
.sentence-empty-hint {
	color: #475569;
	font-size: 0.85rem;
	padding: 4px 0 2px;
}
.sentence-text-preview {
	background-color: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-left: 4px solid #0f766e;
	border-radius: 8px;
	padding: 4px 10px;
	font-size: 0.92rem;
	display: inline-flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 6px;
	max-width: 100%;
}
.sentence-text-label {
	color: #334155;
	font-size: 0.78rem;
	font-weight: 600;
}
.sentence-text-value {
	color: #0f172a;
	font-size: 0.98rem;
	user-select: all;
	word-break: break-word;
}
.sentence-feedback {
	color: #0f766e;
	font-weight: 700;
	font-size: 0.84rem;
}
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
	width: auto;
}
.sentence-action-btn.speak-big {
	min-height: 52px !important;
	font-size: 1.05rem !important;
	padding: 0 26px !important;
	border-radius: 12px !important;
	box-shadow: 0 3px 8px rgba(15,118,110,.35);
}
@media (max-width: 640px) {
	.sentenceCardContainer {
		top: 56px;
		padding: 4px 8px 2px;
	}
	.sentenceCardContainer.is-embedded-sentence {
		top: 38px;
		padding: 3px 6px 2px;
	}
	.sentenceCardContainer.is-empty-sentence {
		position: static;
	}
	.sentenceCard {
		padding: 6px 10px !important;
		border-radius: 10px !important;
		border-width: 1.5px !important;
	}
	.sentenceCardContainer.is-empty-sentence .sentenceCard {
		padding: 4px 10px !important;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.sentenceCardContainer.is-empty-sentence .sentence-actions-group {
		display: none;
	}
	.sentenceCardContainer.is-empty-sentence .sentence-empty-hint {
		font-size: 0.78rem;
		padding: 0;
		line-height: 1.25;
	}
	.sentenceCardContainer:not(.is-empty-sentence) .sentence-section-title {
		display: none;
	}
	.sentence-section-title {
		font-size: 0.84rem;
	}
	.sentence-top-bar {
		gap: 6px;
	}
	.sentence-header-left {
		gap: 6px;
		min-width: 0;
		width: 100%;
	}
	.sentence-text-preview {
		padding: 6px 10px;
		font-size: 0.86rem;
		line-height: 1.4;
		gap: 6px;
		width: 100%;
	}
	.sentence-text-label {
		font-size: 0.78rem;
	}
	.sentence-text-value {
		font-size: 0.92rem;
		line-height: 1.4;
		letter-spacing: 0.01em;
	}
	.sentence-actions-group {
		width: 100%;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px;
	}
	.sentence-action-btn,
	.sentence-action-btn.speak-big {
		min-height: 34px !important;
		height: 34px !important;
		padding: 0 10px !important;
		font-size: 0.78rem !important;
		border-radius: 8px !important;
		width: 100%;
		box-shadow: none !important;
	}
	.btn-svg-ico {
		width: 14px;
		height: 14px;
		margin-right: 5px;
	}
	.sentence-tiles-strip {
		margin-top: 8px !important;
		gap: 8px;
		padding-bottom: 4px;
	}
	.sentence-tile-item {
		width: auto;
		min-width: 88px;
	}
}
</style>
