/**
 * Free Speech SAAC - Floating Window Widget SDK
 * Permite cargar el Sistema Aumentativo y Alternativo de Comunicación (SAAC)
 * como una ventana flotante sobre cualquier plataforma web (ej. Moodle, LMS, portales)
 * mediante un customTrigger o botón flotante accesible (WCAG 2.2 AA).
 */
(function (window, document) {
	'use strict';

	if (window.FreeSpeechSAAC) {
		return;
	}

	var state = {
		initialized: false,
		isOpen: false,
		isMinimized: false,
		isMaximized: false,
		lastActiveInput: null,
		options: {
			url: '/',
			customTrigger: null,
			showDefaultTrigger: true,
			position: 'bottom-right',
			title: 'Free Speech SAAC',
			width: 480,
			height: 620
		},
		elements: {}
	};

	function isEditableElement (el) {
		if (!el || el === document.body || el === document.documentElement) return false;
		var tag = el.tagName ? el.tagName.toLowerCase() : '';
		if (tag === 'textarea') return !el.disabled && !el.readOnly;
		if (tag === 'input') {
			var type = (el.type || 'text').toLowerCase();
			var textTypes = ['text', 'search', 'url', 'tel', 'email', 'password'];
			return textTypes.indexOf(type) !== -1 && !el.disabled && !el.readOnly;
		}
		return el.isContentEditable === true;
	}

	function trackFocus (e) {
		if (isEditableElement(e.target)) {
			state.lastActiveInput = e.target;
		}
	}

	function insertTextIntoActiveElement (text) {
		var target = state.lastActiveInput;
		if (!target || !isEditableElement(target)) {
			return false;
		}

		target.focus();
		if (target.isContentEditable) {
			var sel = window.getSelection();
			if (sel && sel.rangeCount > 0 && target.contains(sel.anchorNode)) {
				var range = sel.getRangeAt(0);
				range.deleteContents();
				var textNode = document.createTextNode((target.textContent ? ' ' : '') + text);
				range.insertNode(textNode);
				range.setStartAfter(textNode);
				range.collapse(true);
				sel.removeAllRanges();
				sel.addRange(range);
			} else {
				target.textContent = (target.textContent ? target.textContent.trim() + ' ' : '') + text;
			}
		} else {
			var start = typeof target.selectionStart === 'number' ? target.selectionStart : target.value.length;
			var end = typeof target.selectionEnd === 'number' ? target.selectionEnd : target.value.length;
			var before = target.value.substring(0, start);
			var after = target.value.substring(end);
			var prefix = (before.length > 0 && !/\s$/.test(before)) ? ' ' : '';
			var inserted = prefix + text;
			target.value = before + inserted + after;
			var newPos = start + inserted.length;
			if (target.setSelectionRange) {
				target.setSelectionRange(newPos, newPos);
			}
		}

		target.dispatchEvent(new Event('input', { bubbles: true }));
		target.dispatchEvent(new Event('change', { bubbles: true }));
		return true;
	}

	function copyTextInHost (text) {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(text).catch(function () {});
			return;
		}
		var textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.setAttribute('readonly', '');
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		document.body.appendChild(textarea);
		textarea.select();
		try {
			document.execCommand('copy');
		} catch (_err) {
			// Fallback ignored
		}
		document.body.removeChild(textarea);
	}

	function resolveEmbedUrl (rawUrl) {
		try {
			var parsed = new URL(rawUrl, window.location.origin);
			parsed.searchParams.set('embed', '1');
			return parsed.toString();
		} catch (_e) {
			return rawUrl + (rawUrl.indexOf('?') === -1 ? '?embed=1' : '&embed=1');
		}
	}

	function injectStyles () {
		if (document.getElementById('freespeech-saac-styles')) return;
		var style = document.createElement('style');
		style.id = 'freespeech-saac-styles';
		style.textContent = [
			'.fs-saac-launcher {',
			'  position: fixed;',
			'  bottom: 20px;',
			'  right: 20px;',
			'  z-index: 2147483640;',
			'  background: #0f766e;',
			'  color: #ffffff;',
			'  border: 2px solid #ffffff;',
			'  border-radius: 999px;',
			'  padding: 12px 20px;',
			'  font-family: system-ui, -apple-system, sans-serif;',
			'  font-size: 15px;',
			'  font-weight: 700;',
			'  cursor: pointer;',
			'  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.28);',
			'  display: inline-flex;',
			'  align-items: center;',
			'  gap: 8px;',
			'}',
			'.fs-saac-launcher:focus-visible, .fs-saac-header-btn:focus-visible {',
			'  outline: 3px solid #f59e0b;',
			'  outline-offset: 2px;',
			'}',
			'.fs-saac-window {',
			'  position: fixed;',
			'  bottom: 80px;',
			'  right: 20px;',
			'  width: 480px;',
			'  height: 620px;',
			'  max-width: calc(100vw - 24px);',
			'  max-height: calc(100vh - 100px);',
			'  z-index: 2147483645;',
			'  background: #ffffff;',
			'  border-radius: 12px;',
			'  border: 2px solid #0f766e;',
			'  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.35);',
			'  display: none;',
			'  flex-direction: column;',
			'  overflow: hidden;',
			'  resize: both;',
			'}',
			'.fs-saac-window.is-open {',
			'  display: flex;',
			'}',
			'.fs-saac-window.is-minimized {',
			'  height: 52px !important;',
			'  resize: none;',
			'}',
			'.fs-saac-window.is-maximized {',
			'  width: min(980px, calc(100vw - 32px)) !important;',
			'  height: calc(100vh - 100px) !important;',
			'}',
			'.fs-saac-header {',
			'  background: #0f766e;',
			'  color: #ffffff;',
			'  padding: 10px 14px;',
			'  display: flex;',
			'  align-items: center;',
			'  justify-content: space-between;',
			'  cursor: move;',
			'  user-select: none;',
			'  font-family: system-ui, -apple-system, sans-serif;',
			'}',
			'.fs-saac-title {',
			'  font-size: 15px;',
			'  font-weight: 700;',
			'  margin: 0;',
			'}',
			'.fs-saac-controls {',
			'  display: flex;',
			'  align-items: center;',
			'  gap: 6px;',
			'}',
			'.fs-saac-header-btn {',
			'  background: rgba(255, 255, 255, 0.16);',
			'  color: #ffffff;',
			'  border: 1px solid rgba(255, 255, 255, 0.35);',
			'  border-radius: 6px;',
			'  min-width: 32px;',
			'  height: 32px;',
			'  padding: 0 8px;',
			'  font-size: 13px;',
			'  font-weight: 600;',
			'  cursor: pointer;',
			'}',
			'.fs-saac-header-btn:hover {',
			'  background: rgba(255, 255, 255, 0.28);',
			'}',
			'.fs-saac-iframe {',
			'  flex: 1;',
			'  width: 100%;',
			'  border: 0;',
			'  background: #f8fafc;',
			'}'
		].join('\n');
		document.head.appendChild(style);
	}

	function setupDragging (winEl, headerEl) {
		var dragging = false;
		var startX = 0;
		var startY = 0;
		var origLeft = 0;
		var origTop = 0;

		headerEl.addEventListener('mousedown', function (e) {
			if (e.target.closest('button')) return;
			dragging = true;
			var rect = winEl.getBoundingClientRect();
			startX = e.clientX;
			startY = e.clientY;
			origLeft = rect.left;
			origTop = rect.top;
			winEl.style.right = 'auto';
			winEl.style.bottom = 'auto';
			winEl.style.left = origLeft + 'px';
			winEl.style.top = origTop + 'px';
		});

		window.addEventListener('mousemove', function (e) {
			if (!dragging) return;
			var dx = e.clientX - startX;
			var dy = e.clientY - startY;
			var nextLeft = Math.max(8, Math.min(window.innerWidth - 120, origLeft + dx));
			var nextTop = Math.max(8, Math.min(window.innerHeight - 60, origTop + dy));
			winEl.style.left = nextLeft + 'px';
			winEl.style.top = nextTop + 'px';
		});

		window.addEventListener('mouseup', function () {
			dragging = false;
		});
	}

	function buildDOM () {
		injectStyles();

		var winEl = document.createElement('section');
		winEl.className = 'fs-saac-window';
		winEl.setAttribute('role', 'dialog');
		winEl.setAttribute('aria-modal', 'false');
		winEl.setAttribute('aria-label', state.options.title);
		winEl.style.width = state.options.width + 'px';
		winEl.style.height = state.options.height + 'px';

		var headerEl = document.createElement('div');
		headerEl.className = 'fs-saac-header';

		var titleEl = document.createElement('h2');
		titleEl.className = 'fs-saac-title';
		titleEl.textContent = state.options.title;

		var controlsEl = document.createElement('div');
		controlsEl.className = 'fs-saac-controls';

		var popoutBtn = document.createElement('button');
		popoutBtn.type = 'button';
		popoutBtn.className = 'fs-saac-header-btn';
		popoutBtn.setAttribute('aria-label', 'Abrir SAAC en ventana independiente');
		popoutBtn.title = 'Abrir en ventana independiente (para Word / escritorio)';
		popoutBtn.textContent = '↗';
		popoutBtn.addEventListener('click', function () {
			window.open(
				resolveEmbedUrl(state.options.url),
				'FreeSpeechSAACPopup',
				'width=480,height=660,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
			);
		});

		var minBtn = document.createElement('button');
		minBtn.type = 'button';
		minBtn.className = 'fs-saac-header-btn';
		minBtn.setAttribute('aria-label', 'Minimizar o restaurar ventana SAAC');
		minBtn.title = 'Minimizar / Restaurar';
		minBtn.textContent = '—';
		minBtn.addEventListener('click', function () {
			state.isMinimized = !state.isMinimized;
			winEl.classList.toggle('is-minimized', state.isMinimized);
		});

		var maxBtn = document.createElement('button');
		maxBtn.type = 'button';
		maxBtn.className = 'fs-saac-header-btn';
		maxBtn.setAttribute('aria-label', 'Ampliar o reducir ventana SAAC');
		maxBtn.title = 'Ampliar / Reducir';
		maxBtn.textContent = '▢';
		maxBtn.addEventListener('click', function () {
			state.isMaximized = !state.isMaximized;
			state.isMinimized = false;
			winEl.classList.remove('is-minimized');
			winEl.classList.toggle('is-maximized', state.isMaximized);
		});

		var closeBtn = document.createElement('button');
		closeBtn.type = 'button';
		closeBtn.className = 'fs-saac-header-btn';
		closeBtn.setAttribute('aria-label', 'Cerrar ventana SAAC');
		closeBtn.title = 'Cerrar (Esc)';
		closeBtn.textContent = '✕';
		closeBtn.addEventListener('click', closeWindow);

		controlsEl.appendChild(popoutBtn);
		controlsEl.appendChild(minBtn);
		controlsEl.appendChild(maxBtn);
		controlsEl.appendChild(closeBtn);

		headerEl.appendChild(titleEl);
		headerEl.appendChild(controlsEl);

		var iframeEl = document.createElement('iframe');
		iframeEl.className = 'fs-saac-iframe';
		iframeEl.title = state.options.title;
		iframeEl.setAttribute('allow', 'clipboard-write; microphone');

		winEl.appendChild(headerEl);
		winEl.appendChild(iframeEl);
		document.body.appendChild(winEl);

		setupDragging(winEl, headerEl);

		state.elements.window = winEl;
		state.elements.iframe = iframeEl;

		if (state.options.showDefaultTrigger) {
			var launcherBtn = document.createElement('button');
			launcherBtn.type = 'button';
			launcherBtn.className = 'fs-saac-launcher';
			launcherBtn.setAttribute('aria-expanded', 'false');
			launcherBtn.setAttribute('aria-label', 'Abrir comunicador SAAC Free Speech');
			launcherBtn.textContent = 'SAAC';
			launcherBtn.addEventListener('click', toggleWindow);
			document.body.appendChild(launcherBtn);
			state.elements.launcher = launcherBtn;
		}
	}

	function syncAriaExpanded () {
		if (state.elements.launcher) {
			state.elements.launcher.setAttribute('aria-expanded', String(state.isOpen));
		}
		if (state.options.customTrigger && typeof state.options.customTrigger === 'string') {
			var triggers = document.querySelectorAll(state.options.customTrigger);
			for (var i = 0; i < triggers.length; i++) {
				triggers[i].setAttribute('aria-expanded', String(state.isOpen));
			}
		}
	}

	function openWindow () {
		if (!state.initialized) init();
		if (!state.elements.iframe.src) {
			state.elements.iframe.src = resolveEmbedUrl(state.options.url);
		}
		state.isOpen = true;
		state.isMinimized = false;
		state.elements.window.classList.remove('is-minimized');
		state.elements.window.classList.add('is-open');
		syncAriaExpanded();
	}

	function closeWindow () {
		if (!state.initialized) return;
		state.isOpen = false;
		state.elements.window.classList.remove('is-open');
		syncAriaExpanded();
	}

	function toggleWindow () {
		if (state.isOpen) {
			closeWindow();
		} else {
			openWindow();
		}
	}

	function bindCustomTriggers () {
		document.addEventListener('click', function (e) {
			var selector = state.options.customTrigger;
			if (!selector) return;
			if (typeof selector === 'string') {
				var matched = e.target.closest(selector);
				if (matched) {
					e.preventDefault();
					toggleWindow();
				}
			} else if (selector instanceof Element && (e.target === selector || selector.contains(e.target))) {
				e.preventDefault();
				toggleWindow();
			}
		});

		window.addEventListener('freespeech:toggle', toggleWindow);
		window.addEventListener('freespeech:open', openWindow);
		window.addEventListener('freespeech:close', closeWindow);

		window.addEventListener('keydown', function (e) {
			if (e.altKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
				e.preventDefault();
				toggleWindow();
			} else if (e.key === 'Escape' && state.isOpen) {
				closeWindow();
			}
		});
	}

	function bindPostMessage () {
		window.addEventListener('message', function (e) {
			var data = e.data;
			if (!data || data.type !== 'FREESPEECH_SAAC_MESSAGE' || !data.text) {
				return;
			}
			if (data.action === 'copy') {
				copyTextInHost(data.text);
			} else if (data.action === 'insert') {
				var inserted = insertTextIntoActiveElement(data.text);
				if (!inserted) {
					copyTextInHost(data.text);
				}
			}
		});
	}

	function readScriptDataset () {
		var currentScript = document.currentScript || document.querySelector('script[src*="freespeech-widget.js"]');
		if (!currentScript) return {};
		var ds = currentScript.dataset || {};
		var parsed = {};
		if (ds.saacUrl || ds.url) parsed.url = ds.saacUrl || ds.url;
		if (ds.customTrigger || ds.trigger) parsed.customTrigger = ds.customTrigger || ds.trigger;
		if (ds.showDefaultTrigger !== undefined) {
			parsed.showDefaultTrigger = ds.showDefaultTrigger !== 'false';
		}
		if (ds.title) parsed.title = ds.title;
		return parsed;
	}

	function init (userOptions) {
		var scriptOpts = readScriptDataset();
		state.options = Object.assign({}, state.options, scriptOpts, userOptions || {});

		if (state.initialized) {
			syncAriaExpanded();
			return window.FreeSpeechSAAC;
		}

		state.initialized = true;
		document.addEventListener('focusin', trackFocus, true);
		buildDOM();
		bindCustomTriggers();
		bindPostMessage();
		syncAriaExpanded();
		return window.FreeSpeechSAAC;
	}

	window.FreeSpeechSAAC = {
		init: init,
		open: openWindow,
		close: closeWindow,
		toggle: toggleWindow
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function () {
			var autoOpts = readScriptDataset();
			if (autoOpts.customTrigger || autoOpts.url) {
				init(autoOpts);
			}
		});
	} else {
		var autoOpts = readScriptDataset();
		if (autoOpts.customTrigger || autoOpts.url) {
			init(autoOpts);
		}
	}
})(window, document);
