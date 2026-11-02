<template>
	<div class="about-page py-6 px-4">
		<v-container class="about-container">
			<v-card theme="light" class="about-card px-6 py-6 about-hero">
				<div class="about-hero-brand mb-3"><img src="/img/logos/a11ypro-light.webp" alt="A11Y PRO" class="about-hero-logo"></div>
				<h1 class="about-hero-title mb-3">{{ $t('about.heroTitle') }}</h1>
				<p class="about-legal mb-3" v-html="$t('about.heroBody')" />
				<p class="about-legal mb-0" v-html="$t('about.inviteBody')" />
			</v-card>
			<v-expansion-panels class="mt-4" multiple>
				<v-expansion-panel :title="$t('about.creditsTitle')">
					<v-expansion-panel-text>
						<div class="about-legal" v-html="$t('about.creditsBody')" />
					</v-expansion-panel-text>
				</v-expansion-panel>
				<v-expansion-panel :title="$t('about.guideTitle')">
					<v-expansion-panel-text>
						<div class="about-legal" v-html="$t('about.guideBody')" />
					</v-expansion-panel-text>
				</v-expansion-panel>
				<v-expansion-panel :title="$t('about.attributionTitle')">
					<v-expansion-panel-text>
						<p class="about-legal mb-0" v-html="$t('about.attributionArasaac')" />
					</v-expansion-panel-text>
				</v-expansion-panel>
				<v-expansion-panel :title="$t('about.privacyTitle')">
					<v-expansion-panel-text>
						<p class="about-legal mb-0">{{ $t('about.privacyBody') }}</p>
					</v-expansion-panel-text>
				</v-expansion-panel>
				<v-expansion-panel :title="$t('about.docsTitle')">
					<v-expansion-panel-text>
						<div class="about-legal" v-html="$t('about.docsBody')" />
					</v-expansion-panel-text>
				</v-expansion-panel>
			</v-expansion-panels>
		</v-container>
	</div>
</template>

<script>
export default {
	name: 'About'
};
</script>

<style>
.about-hero-logo { height: 34px; }
.about-hero-brand { border-bottom: 3px solid #0F766E; display: inline-block; padding-bottom: 6px; }
.about-hero-title {
	color: #0F766E;
	font-size: 1.35rem;
	font-weight: 800;
	color: #0f172a;
}

.about-page {
	background-color: #f1f5f9;
	min-height: calc(100vh - 64px);
}
.about-container {
	max-width: 980px;
	margin: 0 auto;
}
.about-card {
	background: #ffffff !important;
	color: #0f172a !important;
	border: 2px solid #cbd5e1 !important;
	border-radius: 16px !important;
	box-shadow: 0 6px 20px rgba(15, 23, 42, 0.07) !important;
}
.markdown-body {
	font-size: 1rem;
	line-height: 1.65;
	color: #1e293b;
}
.markdown-body h1 {
	font-size: 1.75rem;
	font-weight: 800;
	color: #0f172a;
	border-bottom: 2px solid #e2e8f0;
	padding-bottom: 12px;
	margin: 0 0 16px;
}
.markdown-body h2 {
	font-size: 1.35rem;
	font-weight: 800;
	color: #0f766e;
	border-bottom: 1px solid #e2e8f0;
	padding-bottom: 6px;
	margin: 28px 0 12px;
}
.markdown-body h3 {
	font-size: 1.1rem;
	font-weight: 700;
	color: #0f172a;
	margin: 20px 0 8px;
}
.markdown-body p {
	margin: 0 0 14px;
}
.markdown-body ul,
.markdown-body ol {
	padding-left: 24px;
	margin: 0 0 16px;
}
.markdown-body li {
	margin-bottom: 8px;
}
.markdown-body a {
	color: #0284c7;
	font-weight: 600;
	text-decoration: underline;
}
.markdown-body a:hover {
	color: #0369a1;
}
.markdown-body code {
	background: #e2e8f0;
	color: #0f172a;
	padding: 2px 7px;
	border-radius: 5px;
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 0.88em;
	font-weight: 600;
}
.markdown-body pre {
	position: relative;
	background: #0f172a;
	color: #f8fafc;
	border: 1px solid #334155;
	border-left: 5px solid #14b8a6;
	border-radius: 10px;
	padding: 18px 20px;
	margin: 14px 0 20px;
	overflow-x: auto;
	box-shadow: 0 4px 14px rgba(15, 23, 42, 0.18);
}
.markdown-body pre code {
	background: transparent;
	color: #e2e8f0;
	padding: 0;
	border-radius: 0;
	font-size: 0.88rem;
	font-weight: 400;
	line-height: 1.55;
	display: block;
}
.markdown-body .copy-snippet-btn {
	position: absolute;
	top: 10px;
	right: 10px;
	background: rgba(255, 255, 255, 0.14);
	color: #f8fafc;
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-radius: 6px;
	padding: 4px 10px;
	font-size: 0.76rem;
	font-weight: 700;
	cursor: pointer;
	transition: background 0.15s ease;
}
.markdown-body .copy-snippet-btn:hover {
	background: #0f766e;
	border-color: #14b8a6;
}
.markdown-body .copy-snippet-btn:focus-visible {
	outline: 2px solid #f59e0b;
	outline-offset: 2px;
}
.markdown-body img {
	max-width: 100%;
	height: auto;
	vertical-align: middle;
}

.code-snippet {
	background: #0f172a;
	color: #e2e8f0;
	padding: 12px 16px;
	border-radius: 8px;
	font-size: .8rem;
	overflow-x: auto;
	white-space: pre;
}

.key-swatches { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
.key-chip { padding: 4px 12px; border-radius: 999px; font-size: .75rem; font-weight: 700; border: 1.5px solid rgba(0,0,0,.15); color: #0f172a; }
.chip-sunny { background: #fef08a; }
.chip-mint { background: #d1fae5; }
.chip-sky { background: #bae6fd; }
.chip-peach { background: #fed7aa; }
.chip-white { background: #fff; }
</style>
