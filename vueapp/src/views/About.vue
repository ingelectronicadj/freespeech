<template>
	<v-container class="pb-10">
		<div v-html="compiledMarkdown" />
	</v-container>
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
	}
};
</script>
