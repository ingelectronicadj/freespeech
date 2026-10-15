import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
	...pluginVue.configs['flat/recommended'],
	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021,
				describe: 'readonly',
				it: 'readonly',
				expect: 'readonly',
				beforeEach: 'readonly',
				afterEach: 'readonly',
				vi: 'readonly',
			},
		},
		rules: {
			'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'no-undef': 'error',
			'quotes': ['error', 'single', { avoidEscape: true }],
			'semi': ['error', 'always'],
			'indent': ['error', 'tab', { SwitchCase: 1 }],
			'vue/html-indent': ['error', 'tab', {
				alignAttributesVertically: false,
				closeBracket: 0,
			}],
			'vue/multi-word-component-names': 'off',
			'vue/no-v-html': 'off',
			'vue/require-default-prop': 'off',
			'vue/max-attributes-per-line': 'off',
			'vue/singleline-html-element-content-newline': 'off',
			'object-curly-spacing': ['error', 'always'],
		},
	},
];
