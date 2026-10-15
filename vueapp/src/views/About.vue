<template>
	<div class="about-page py-6 px-4">
		<v-container class="about-container">
			<v-card theme="light" class="about-card px-6 py-6">
				<div
					ref="markdownRoot"
					class="markdown-body"
					v-html="compiledMarkdown"
				/>
			</v-card>
		</v-container>
	</div>
</template>

<script>
import readMeAboutMarkDownText from '../../../README.md?raw';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

export default {
	name: 'About',
	data () {
		return {
			readMeAboutMarkDownText
		};
	},
	computed: {
		compiledMarkdown () {
			const htmlFromMarkDown = marked.parse(this.readMeAboutMarkDownText);
			return DOMPurify.sanitize(htmlFromMarkDown);
		}
	},
	mounted () {
		this.enhanceCodeBlocks();
	},
	updated () {
		this.enhanceCodeBlocks();
	},
	methods: {
		enhanceCodeBlocks () {
			const root = this.$refs.markdownRoot;
			if (!root || typeof document === 'undefined') return;
			const preBlocks = root.querySelectorAll('pre');
			preBlocks.forEach((pre) => {
				if (pre.dataset.enhanced === 'true') return;
				pre.dataset.enhanced = 'true';

				const btn = document.createElement('button');
				btn.type = 'button';
				btn.className = 'copy-snippet-btn';
				btn.textContent = 'Copiar código';
				btn.setAttribute('aria-label', 'Copiar fragmento de código');

				btn.addEventListener('click', () => {
					const codeEl = pre.querySelector('code');
					const text = codeEl ? codeEl.innerText : pre.innerText;
					if (navigator.clipboard && navigator.clipboard.writeText) {
						navigator.clipboard.writeText(text).catch(() => {});
					}
					btn.textContent = '¡Copiado!';
					setTimeout(() => {
						btn.textContent = 'Copiar código';
					}, 2000);
				});

				pre.appendChild(btn);
			});
		}
	}
};
</script>

<style>
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
</style>
