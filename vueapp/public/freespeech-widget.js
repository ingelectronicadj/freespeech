/**
 * Free Speech SAAC - Universal Web & LMS Floating Widget SDK
 * Permite integrar y abrir el tablero SAAC en cualquier página web, portal,
 * buscador, aplicación SPA o LMS (Moodle, Canvas, Blackboard) mediante:
 *   1. Cualquier customTrigger (selector CSS, elemento DOM o atributo [data-saac-trigger])
 *   2. El botón flotante integrado (showDefaultTrigger: true/false)
 *   3. API programática (window.FreeSpeechSAAC.open / toggle / close)
 *   4. Atajo de teclado accesible (Alt + Shift + S)
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
		dockMode: 'float', // 'float' | 'right' | 'left'
		lastActiveInput: null,
		detectedTargets: [],
		selectedTargetIndex: -1, // -1 = Portapapeles / Campo con foco automático
		clearAfterInsert: false,
		options: {
			url: '/',
			customTrigger: null,
			showDefaultTrigger: true,
			position: 'bottom-right', // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
			title: 'Comunicador SAAC · Free Speech',
			launcherLabel: 'SAAC',
			lang: '',
			width: 500,
			height: 640
		},
		elements: {}
	};

	function isEditableElement (el) {
		if (!el || el === document.body || el === document.documentElement) return false;
		if (el.closest && el.closest('.fs-saac-window')) return false;
		var tag = el.tagName ? el.tagName.toLowerCase() : '';
		if (tag === 'textarea') return !el.disabled && !el.readOnly;
		if (tag === 'input') {
			var type = (el.type || 'text').toLowerCase();
			var textTypes = ['text', 'search', 'url', 'tel', 'email', 'number'];
			return textTypes.indexOf(type) !== -1 && !el.disabled && !el.readOnly;
		}
		return el.isContentEditable === true;
	}

	function isElementVisible (el) {
		if (!el || !el.getBoundingClientRect) return false;
		var style = window.getComputedStyle ? window.getComputedStyle(el) : null;
		if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
		var rect = el.getBoundingClientRect();
		return rect.width > 0 && rect.height > 0;
	}

	function getAccessibleFieldLabel (el, idx) {
		if (!el) return 'Campo ' + (idx + 1);
		if (el.id) {
			var explicitLabel = document.querySelector('label[for="' + el.id.replace(/"/g, '\\"') + '"]');
			if (explicitLabel && explicitLabel.textContent.trim()) {
				return explicitLabel.textContent.replace(/\s+/g, ' ').trim();
			}
		}
		var parentLabel = el.closest ? el.closest('label') : null;
		if (parentLabel && parentLabel.textContent.trim()) {
			return parentLabel.textContent.replace(/\s+/g, ' ').trim();
		}
		var ariaLabel = el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder') || el.getAttribute('name'));
		if (ariaLabel && ariaLabel.trim()) {
			return ariaLabel.trim();
		}
		var tag = el.tagName ? el.tagName.toLowerCase() : 'campo';
		if (el.isContentEditable) return 'Editor de texto enriquecido #' + (idx + 1);
		return tag.toUpperCase() + (el.id ? ' (#' + el.id + ')' : ' #' + (idx + 1));
	}

	function scanPageEditableTargets () {
		var list = [];
		var seen = [];

		// 1. Editores TinyMCE activos si existen en la página (Moodle, WordPress, CMS)
		if (window.tinymce && Array.isArray(window.tinymce.editors)) {
			for (var t = 0; t < window.tinymce.editors.length; t++) {
				var ed = window.tinymce.editors[t];
				if (ed && !ed.isHidden()) {
					var targetElm = ed.getElement ? ed.getElement() : null;
					var label = getAccessibleFieldLabel(targetElm, list.length);
					list.push({
						type: 'tinymce',
						editor: ed,
						element: ed.getContainer ? ed.getContainer() : targetElm,
						label: 'Editor: ' + label
					});
					if (targetElm) seen.push(targetElm);
				}
			}
		}

		// 2. Inputs, textareas y bloques contenteditable en cualquier página web
		var nodes = document.querySelectorAll('input, textarea, [contenteditable="true"], .editor_atto_content, .ck-editor__editable, .ql-editor');
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			if (seen.indexOf(node) !== -1) continue;
			if (!isEditableElement(node) || !isElementVisible(node)) continue;
			seen.push(node);
			list.push({
				type: 'dom',
				element: node,
				label: getAccessibleFieldLabel(node, list.length)
			});
		}

		state.detectedTargets = list;
		renderTargetSelectOptions();
	}

	function highlightTargetOnPage (el) {
		var prev = document.querySelectorAll('.fs-saac-active-target-ring');
		for (var i = 0; i < prev.length; i++) {
			prev[i].classList.remove('fs-saac-active-target-ring');
		}
		if (el && el.classList) {
			el.classList.add('fs-saac-active-target-ring');
		}
	}

	function renderTargetSelectOptions () {
		var sel = state.elements.targetSelect;
		if (!sel) return;

		sel.innerHTML = '';

		var clipOpt = document.createElement('option');
		clipOpt.value = '-1';
		clipOpt.textContent = state.detectedTargets.length > 0
			? 'Automático (último campo con foco o portapapeles)'
			: 'Portapapeles (copiar texto plano)';
		sel.appendChild(clipOpt);

		for (var i = 0; i < state.detectedTargets.length; i++) {
			var item = state.detectedTargets[i];
			var opt = document.createElement('option');
			opt.value = String(i);
			opt.textContent = (i + 1) + '. ' + item.label.slice(0, 52);
			if (state.lastActiveInput && item.element === state.lastActiveInput && state.selectedTargetIndex === -1) {
				state.selectedTargetIndex = i;
			}
			sel.appendChild(opt);
		}

		if (state.selectedTargetIndex >= state.detectedTargets.length) {
			state.selectedTargetIndex = -1;
		}
		sel.value = String(state.selectedTargetIndex);
	}

	function trackFocus (e) {
		var target = e.target;
		if (!isEditableElement(target)) return;
		state.lastActiveInput = target;
		scanPageEditableTargets();
		for (var i = 0; i < state.detectedTargets.length; i++) {
			if (state.detectedTargets[i].element === target) {
				state.selectedTargetIndex = i;
				if (state.elements.targetSelect) {
					state.elements.targetSelect.value = String(i);
				}
				highlightTargetOnPage(target);
				break;
			}
		}
	}

	function insertIntoDomElement (target, text, replaceAll) {
		if (!target || !isEditableElement(target)) return false;

		target.focus();
		if (target.isContentEditable) {
			if (replaceAll) {
				target.textContent = text;
			} else {
				var current = (target.textContent || '').trim();
				target.textContent = current ? (current + ' ' + text) : text;
			}
		} else {
			if (replaceAll) {
				target.value = text;
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
					try {
						target.setSelectionRange(newPos, newPos);
					} catch (_e) {
						// Algunos tipos de input como email/number no soportan setSelectionRange
					}
				}
			}
		}

		target.dispatchEvent(new Event('input', { bubbles: true }));
		target.dispatchEvent(new Event('change', { bubbles: true }));
		target.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
		highlightTargetOnPage(target);
		return true;
	}

	function insertTextIntoTarget (text, replaceAll) {
		// 1. Si el usuario seleccionó un campo específico de la lista
		if (state.selectedTargetIndex >= 0 && state.detectedTargets[state.selectedTargetIndex]) {
			var chosen = state.detectedTargets[state.selectedTargetIndex];
			if (chosen.type === 'tinymce' && chosen.editor) {
				if (replaceAll) {
					chosen.editor.setContent('<p>' + text + '</p>');
				} else {
					chosen.editor.insertContent(' ' + text);
				}
				if (chosen.editor.save) chosen.editor.save();
				return true;
			}
			if (chosen.element) {
				return insertIntoDomElement(chosen.element, text, replaceAll);
			}
		}

		// 2. Si hay un editor TinyMCE activo globalmente
		if (window.tinymce && window.tinymce.activeEditor && !window.tinymce.activeEditor.isHidden()) {
			var activeEd = window.tinymce.activeEditor;
			if (replaceAll) {
				activeEd.setContent('<p>' + text + '</p>');
			} else {
				activeEd.insertContent(' ' + text);
			}
			if (activeEd.save) activeEd.save();
			return true;
		}

		// 3. Si hay un último campo con foco recordado
		if (state.lastActiveInput && isEditableElement(state.lastActiveInput)) {
			return insertIntoDomElement(state.lastActiveInput, text, replaceAll);
		}

		// 4. Si no había foco previo pero existen campos editables en la página, usar el primero
		scanPageEditableTargets();
		if (state.detectedTargets.length > 0) {
			state.selectedTargetIndex = 0;
			if (state.elements.targetSelect) state.elements.targetSelect.value = '0';
			return insertTextIntoTarget(text, replaceAll);
		}

		return false;
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
			// Ignorado
		}
		document.body.removeChild(textarea);
	}

	function detectHostLang () {
		if (state.options.lang) return state.options.lang;
		var htmlLang = (document.documentElement && document.documentElement.getAttribute('lang')) || '';
		var short = htmlLang.toLowerCase().slice(0, 2);
		if (short === 'es' || short === 'en' || short === 'de') return short;
		return '';
	}

	function resolveEmbedUrl (rawUrl) {
		var hostLang = detectHostLang();
		try {
			var parsed = new URL(rawUrl, window.location.origin);
			parsed.searchParams.set('embed', '1');
			if (hostLang) parsed.searchParams.set('lang', hostLang);
			return parsed.toString();
		} catch (_e) {
			var sep = rawUrl.indexOf('?') === -1 ? '?' : '&';
			return rawUrl + sep + 'embed=1' + (hostLang ? '&lang=' + hostLang : '');
		}
	}

	function injectStyles () {
		if (document.getElementById('freespeech-saac-styles')) return;
		var style = document.createElement('style');
		style.id = 'freespeech-saac-styles';
		style.textContent = [
			'.fs-saac-active-target-ring {',
			'  outline: 2px dashed #0f766e !important;',
			'  outline-offset: 2px !important;',
			'}',
			'.fs-saac-launcher {',
			'  position: fixed;',
			'  z-index: 2147483640;',
			'  background: #18181b;',
			'  color: #ffffff;',
			'  border: 2px solid #ffffff;',
			'  border-radius: 999px;',
			'  padding: 10px 18px;',
			'  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;',
			'  font-size: 14px;',
			'  font-weight: 700;',
			'  cursor: pointer;',
			'  box-shadow: 0 8px 24px rgba(9, 9, 11, 0.32);',
			'  display: inline-flex;',
			'  align-items: center;',
			'  gap: 8px;',
			'  transition: transform 0.15s ease, background 0.15s ease;',
			'}',
			'.fs-saac-launcher:hover { background: #27272a; transform: translateY(-1px); }',
			'.fs-saac-launcher.pos-bottom-right { bottom: 20px; right: 20px; }',
			'.fs-saac-launcher.pos-bottom-left { bottom: 20px; left: 20px; }',
			'.fs-saac-launcher.pos-top-right { top: 20px; right: 20px; }',
			'.fs-saac-launcher.pos-top-left { top: 20px; left: 20px; }',
			/* Icono geométrico CSS de globo de comunicación en el botón flotante */
			'.fs-saac-launcher-ico {',
			'  width: 14px;',
			'  height: 12px;',
			'  border: 2px solid currentColor;',
			'  border-radius: 3px;',
			'  display: inline-block;',
			'  position: relative;',
			'}',
			'.fs-saac-launcher-ico::after {',
			'  content: "";',
			'  position: absolute;',
			'  bottom: -4px;',
			'  left: 2px;',
			'  width: 4px;',
			'  height: 4px;',
			'  background: currentColor;',
			'  clip-path: polygon(0 0, 100% 0, 0 100%);',
			'}',
			'.fs-saac-launcher:focus-visible, .fs-saac-header-btn:focus-visible, .fs-saac-target-select:focus-visible {',
			'  outline: 3px solid #38bdf8;',
			'  outline-offset: 2px;',
			'}',
			'.fs-saac-window {',
			'  position: fixed;',
			'  bottom: 76px;',
			'  right: 20px;',
			'  width: 500px;',
			'  height: 640px;',
			'  max-width: calc(100vw - 24px);',
			'  max-height: calc(100vh - 92px);',
			'  z-index: 2147483645;',
			'  background: #ffffff;',
			'  border-radius: 14px;',
			'  border: 1px solid #27272a;',
			'  box-shadow: 0 20px 50px rgba(9, 9, 11, 0.38);',
			'  display: none;',
			'  flex-direction: column;',
			'  overflow: hidden;',
			'  resize: both;',
			'}',
			'.fs-saac-window.is-open { display: flex; }',
			'.fs-saac-window.is-minimized {',
			'  height: 46px !important;',
			'  resize: none;',
			'}',
			'.fs-saac-window.is-minimized .fs-saac-targetbar, .fs-saac-window.is-minimized .fs-saac-iframe {',
			'  display: none !important;',
			'}',
			'.fs-saac-window.is-maximized {',
			'  width: min(1040px, calc(100vw - 32px)) !important;',
			'  height: calc(100vh - 96px) !important;',
			'}',
			'.fs-saac-window.is-docked-right {',
			'  top: 0 !important;',
			'  right: 0 !important;',
			'  bottom: 0 !important;',
			'  left: auto !important;',
			'  width: min(480px, 100vw) !important;',
			'  height: 100vh !important;',
			'  max-height: 100vh !important;',
			'  border-radius: 12px 0 0 12px;',
			'}',
			'.fs-saac-header {',
			'  background: #18181b;',
			'  color: #ffffff;',
			'  padding: 9px 12px;',
			'  display: flex;',
			'  align-items: center;',
			'  justify-content: space-between;',
			'  cursor: move;',
			'  user-select: none;',
			'  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;',
			'}',
			'.fs-saac-title {',
			'  font-size: 14px;',
			'  font-weight: 700;',
			'  margin: 0;',
			'  display: flex;',
			'  align-items: center;',
			'  gap: 8px;',
			'}',
			'.fs-saac-controls {',
			'  display: flex;',
			'  align-items: center;',
			'  gap: 5px;',
			'}',
			'.fs-saac-header-btn {',
			'  background: rgba(255, 255, 255, 0.12);',
			'  color: #ffffff;',
			'  border: 1px solid rgba(255, 255, 255, 0.24);',
			'  border-radius: 6px;',
			'  width: 30px;',
			'  height: 28px;',
			'  padding: 0;',
			'  display: inline-flex;',
			'  align-items: center;',
			'  justify-content: center;',
			'  cursor: pointer;',
			'}',
			'.fs-saac-header-btn:hover { background: rgba(255, 255, 255, 0.24); }',
			/* Iconos geométricos 100% en CSS para los controles de la ventana */
			'.fs-ico { display: inline-block; position: relative; pointer-events: none; }',
			'.fs-ico-dock {',
			'  width: 13px; height: 11px; border: 1.5px solid currentColor; border-radius: 2px;',
			'}',
			'.fs-ico-dock::after {',
			'  content: ""; position: absolute; top: 0; right: 0; bottom: 0; width: 4px; background: currentColor;',
			'}',
			'.fs-ico-popout {',
			'  width: 11px; height: 11px; border: 1.5px solid currentColor; border-radius: 2px;',
			'}',
			'.fs-ico-popout::after {',
			'  content: ""; position: absolute; top: -2px; right: -2px; width: 6px; height: 6px;',
			'  border-top: 2px solid currentColor; border-right: 2px solid currentColor; background: #18181b;',
			'}',
			'.fs-ico-min {',
			'  width: 11px; height: 2px; background: currentColor;',
			'}',
			'.fs-ico-max {',
			'  width: 11px; height: 10px; border: 1.5px solid currentColor; border-radius: 2px;',
			'}',
			'.fs-ico-close { width: 12px; height: 12px; }',
			'.fs-ico-close::before, .fs-ico-close::after {',
			'  content: ""; position: absolute; left: 5px; top: 0; width: 1.8px; height: 12px; background: currentColor;',
			'}',
			'.fs-ico-close::before { transform: rotate(45deg); }',
			'.fs-ico-close::after { transform: rotate(-45deg); }',
			/* Barra de selección de campo destino en la página anfitriona */
			'.fs-saac-targetbar {',
			'  background: #f4f4f5;',
			'  border-bottom: 1px solid #e4e4e7;',
			'  padding: 6px 10px;',
			'  display: flex;',
			'  align-items: center;',
			'  justify-content: space-between;',
			'  flex-wrap: wrap;',
			'  gap: 6px;',
			'  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;',
			'  font-size: 12px;',
			'  color: #27272a;',
			'}',
			'.fs-saac-target-group {',
			'  display: flex;',
			'  align-items: center;',
			'  gap: 6px;',
			'  flex: 1;',
			'  min-width: 180px;',
			'}',
			'.fs-saac-target-label { font-weight: 700; white-space: nowrap; color: #52525b; }',
			'.fs-saac-target-select {',
			'  flex: 1;',
			'  min-width: 0;',
			'  padding: 4px 8px;',
			'  border-radius: 6px;',
			'  border: 1px solid #d4d4d8;',
			'  background: #ffffff;',
			'  color: #18181b;',
			'  font-size: 12px;',
			'  font-weight: 600;',
			'}',
			'.fs-saac-refresh-btn {',
			'  background: #ffffff;',
			'  color: #27272a;',
			'  border: 1px solid #d4d4d8;',
			'  border-radius: 6px;',
			'  padding: 3px 8px;',
			'  font-size: 11px;',
			'  font-weight: 600;',
			'  cursor: pointer;',
			'}',
			'.fs-saac-refresh-btn:hover { background: #e4e4e7; }',
			'.fs-saac-iframe {',
			'  flex: 1;',
			'  width: 100%;',
			'  border: 0;',
			'  background: #f8fafc;',
			'}',
			'@media (max-width: 640px) {',
			'  .fs-saac-window {',
			'    left: 0 !important;',
			'    right: 0 !important;',
			'    bottom: 0 !important;',
			'    top: auto !important;',
			'    width: 100vw !important;',
			'    max-width: 100vw !important;',
			'    height: 78vh !important;',
			'    max-height: 85vh !important;',
			'    border-radius: 16px 16px 0 0 !important;',
			'    resize: none;',
			'  }',
			'  .fs-saac-window.is-maximized {',
			'    height: 94vh !important;',
			'    max-height: 96vh !important;',
			'  }',
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

		function beginDrag (clientX, clientY, targetEl) {
			if ((targetEl && targetEl.closest && targetEl.closest('button')) || state.dockMode !== 'float' || window.innerWidth <= 640) return;
			dragging = true;
			var rect = winEl.getBoundingClientRect();
			startX = clientX;
			startY = clientY;
			origLeft = rect.left;
			origTop = rect.top;
			winEl.style.right = 'auto';
			winEl.style.bottom = 'auto';
			winEl.style.left = origLeft + 'px';
			winEl.style.top = origTop + 'px';
		}

		function moveDrag (clientX, clientY) {
			if (!dragging) return;
			var dx = clientX - startX;
			var dy = clientY - startY;
			var nextLeft = Math.max(8, Math.min(window.innerWidth - 120, origLeft + dx));
			var nextTop = Math.max(8, Math.min(window.innerHeight - 60, origTop + dy));
			winEl.style.left = nextLeft + 'px';
			winEl.style.top = nextTop + 'px';
		}

		headerEl.addEventListener('mousedown', function (e) {
			beginDrag(e.clientX, e.clientY, e.target);
		});

		window.addEventListener('mousemove', function (e) {
			moveDrag(e.clientX, e.clientY);
		});

		window.addEventListener('mouseup', function () {
			dragging = false;
		});

		headerEl.addEventListener('touchstart', function (e) {
			if (!e.touches || !e.touches[0]) return;
			beginDrag(e.touches[0].clientX, e.touches[0].clientY, e.target);
		}, { passive: true });

		window.addEventListener('touchmove', function (e) {
			if (!dragging || !e.touches || !e.touches[0]) return;
			moveDrag(e.touches[0].clientX, e.touches[0].clientY);
		}, { passive: true });

		window.addEventListener('touchend', function () {
			dragging = false;
		});
	}

	function createIconButton (ariaLabel, titleText, iconClass, onClick) {
		var btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'fs-saac-header-btn';
		btn.setAttribute('aria-label', ariaLabel);
		btn.title = titleText;
		var ico = document.createElement('span');
		ico.className = 'fs-ico ' + iconClass;
		ico.setAttribute('aria-hidden', 'true');
		btn.appendChild(ico);
		btn.addEventListener('click', onClick);
		return btn;
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
		var titleIco = document.createElement('span');
		titleIco.className = 'fs-saac-launcher-ico';
		titleIco.setAttribute('aria-hidden', 'true');
		var titleText = document.createElement('span');
		titleText.textContent = state.options.title;
		titleEl.appendChild(titleIco);
		titleEl.appendChild(titleText);

		var controlsEl = document.createElement('div');
		controlsEl.className = 'fs-saac-controls';

		var dockBtn = createIconButton(
			'Acoplar o desacoplar panel lateral SAAC',
			'Acoplar al lateral derecho / Ventana flotante',
			'fs-ico-dock',
			function () {
				state.dockMode = state.dockMode === 'right' ? 'float' : 'right';
				state.isMinimized = false;
				winEl.classList.remove('is-minimized');
				winEl.classList.toggle('is-docked-right', state.dockMode === 'right');
			}
		);

		var popoutBtn = createIconButton(
			'Abrir SAAC en ventana independiente',
			'Abrir en ventana independiente (para Word / escritorio)',
			'fs-ico-popout',
			function () {
				window.open(
					resolveEmbedUrl(state.options.url),
					'FreeSpeechSAACPopup',
					'width=500,height=680,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
				);
			}
		);

		var minBtn = createIconButton(
			'Minimizar o restaurar ventana SAAC',
			'Minimizar / Restaurar',
			'fs-ico-min',
			function () {
				state.isMinimized = !state.isMinimized;
				winEl.classList.toggle('is-minimized', state.isMinimized);
			}
		);

		var maxBtn = createIconButton(
			'Ampliar o reducir ventana SAAC',
			'Ampliar / Reducir',
			'fs-ico-max',
			function () {
				state.isMaximized = !state.isMaximized;
				state.isMinimized = false;
				state.dockMode = 'float';
				winEl.classList.remove('is-minimized', 'is-docked-right');
				winEl.classList.toggle('is-maximized', state.isMaximized);
			}
		);

		var closeBtn = createIconButton(
			'Cerrar ventana SAAC',
			'Cerrar (Esc)',
			'fs-ico-close',
			closeWindow
		);

		controlsEl.appendChild(dockBtn);
		controlsEl.appendChild(popoutBtn);
		controlsEl.appendChild(minBtn);
		controlsEl.appendChild(maxBtn);
		controlsEl.appendChild(closeBtn);

		headerEl.appendChild(titleEl);
		headerEl.appendChild(controlsEl);

		// Barra universal de selección de campo destino en la página anfitriona
		var targetBarEl = document.createElement('div');
		targetBarEl.className = 'fs-saac-targetbar';

		var targetGroupEl = document.createElement('div');
		targetGroupEl.className = 'fs-saac-target-group';

		var targetLabelEl = document.createElement('label');
		targetLabelEl.className = 'fs-saac-target-label';
		targetLabelEl.setAttribute('for', 'fs-saac-target-select');
		targetLabelEl.textContent = 'Insertar en:';

		var targetSelectEl = document.createElement('select');
		targetSelectEl.id = 'fs-saac-target-select';
		targetSelectEl.className = 'fs-saac-target-select';
		targetSelectEl.setAttribute('aria-label', 'Seleccionar campo de la página donde insertar el texto del SAAC');
		targetSelectEl.addEventListener('change', function () {
			state.selectedTargetIndex = parseInt(targetSelectEl.value, 10);
			if (state.selectedTargetIndex >= 0 && state.detectedTargets[state.selectedTargetIndex]) {
				highlightTargetOnPage(state.detectedTargets[state.selectedTargetIndex].element);
			} else {
				highlightTargetOnPage(null);
			}
		});

		var refreshBtn = document.createElement('button');
		refreshBtn.type = 'button';
		refreshBtn.className = 'fs-saac-refresh-btn';
		refreshBtn.textContent = 'Detectar campos';
		refreshBtn.setAttribute('aria-label', 'Volver a detectar campos de texto en la página');
		refreshBtn.addEventListener('click', scanPageEditableTargets);

		targetGroupEl.appendChild(targetLabelEl);
		targetGroupEl.appendChild(targetSelectEl);
		targetBarEl.appendChild(targetGroupEl);
		targetBarEl.appendChild(refreshBtn);

		var iframeEl = document.createElement('iframe');
		iframeEl.className = 'fs-saac-iframe';
		iframeEl.title = state.options.title;
		iframeEl.setAttribute('allow', 'clipboard-write; microphone');

		winEl.appendChild(headerEl);
		winEl.appendChild(targetBarEl);
		winEl.appendChild(iframeEl);
		document.body.appendChild(winEl);

		setupDragging(winEl, headerEl);

		state.elements.window = winEl;
		state.elements.iframe = iframeEl;
		state.elements.targetSelect = targetSelectEl;

		if (state.options.showDefaultTrigger) {
			var launcherBtn = document.createElement('button');
			launcherBtn.type = 'button';
			var posClass = 'pos-' + (state.options.position || 'bottom-right');
			launcherBtn.className = 'fs-saac-launcher ' + posClass;
			launcherBtn.setAttribute('aria-expanded', 'false');
			launcherBtn.setAttribute('aria-label', 'Abrir tablero comunicador SAAC Free Speech');

			var lIco = document.createElement('span');
			lIco.className = 'fs-saac-launcher-ico';
			lIco.setAttribute('aria-hidden', 'true');
			var lText = document.createElement('span');
			lText.textContent = state.options.launcherLabel || 'SAAC';

			launcherBtn.appendChild(lIco);
			launcherBtn.appendChild(lText);
			launcherBtn.addEventListener('click', function () {
				toggleWindow();
			});
			document.body.appendChild(launcherBtn);
			state.elements.launcher = launcherBtn;
		}
	}

	function getTriggerElements () {
		var list = [];
		if (state.options.customTrigger) {
			if (typeof state.options.customTrigger === 'string') {
				var nodes = document.querySelectorAll(state.options.customTrigger);
				for (var i = 0; i < nodes.length; i++) list.push(nodes[i]);
			} else if (state.options.customTrigger instanceof Element) {
				list.push(state.options.customTrigger);
			}
		}
		var declarativeNodes = document.querySelectorAll('[data-saac-trigger]');
		for (var j = 0; j < declarativeNodes.length; j++) {
			if (list.indexOf(declarativeNodes[j]) === -1) {
				list.push(declarativeNodes[j]);
			}
		}
		return list;
	}

	function syncAriaExpanded () {
		if (state.elements.launcher) {
			state.elements.launcher.setAttribute('aria-expanded', String(state.isOpen));
		}
		var triggers = getTriggerElements();
		for (var i = 0; i < triggers.length; i++) {
			triggers[i].setAttribute('aria-expanded', String(state.isOpen));
		}
	}

	function focusSpecificTargetSelector (selector) {
		if (!selector) return;
		var targetEl = null;
		try {
			targetEl = document.querySelector(selector);
		} catch (_e) {
			targetEl = document.getElementById(selector.replace(/^#/, ''));
		}
		if (!targetEl) return;
		state.lastActiveInput = targetEl;
		scanPageEditableTargets();
		for (var i = 0; i < state.detectedTargets.length; i++) {
			if (state.detectedTargets[i].element === targetEl) {
				state.selectedTargetIndex = i;
				if (state.elements.targetSelect) {
					state.elements.targetSelect.value = String(i);
				}
				highlightTargetOnPage(targetEl);
				break;
			}
		}
	}

	function openWindow (targetSelector) {
		if (!state.initialized) init();
		if (!state.elements.iframe.src) {
			state.elements.iframe.src = resolveEmbedUrl(state.options.url);
		}
		scanPageEditableTargets();
		if (targetSelector && typeof targetSelector === 'string') {
			focusSpecificTargetSelector(targetSelector);
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
		highlightTargetOnPage(null);
		syncAriaExpanded();
	}

	function toggleWindow (targetSelector) {
		if (state.isOpen && !targetSelector) {
			closeWindow();
		} else {
			openWindow(targetSelector);
		}
	}

	function findMatchedTrigger (targetNode) {
		if (!targetNode || !targetNode.closest) return null;
		var declarative = targetNode.closest('[data-saac-trigger]');
		if (declarative) return declarative;

		var selector = state.options.customTrigger;
		if (!selector) return null;
		if (typeof selector === 'string') {
			try {
				return targetNode.closest(selector);
			} catch (_e) {
				return null;
			}
		}
		if (selector instanceof Element && (targetNode === selector || selector.contains(targetNode))) {
			return selector;
		}
		return null;
	}

	function bindCustomTriggers () {
		document.addEventListener('click', function (e) {
			var matched = findMatchedTrigger(e.target);
			if (!matched) return;
			e.preventDefault();
			var explicitTarget = matched.getAttribute ? matched.getAttribute('data-saac-target') : null;
			if (explicitTarget) {
				openWindow(explicitTarget);
			} else {
				toggleWindow();
			}
		});

		window.addEventListener('freespeech:toggle', function (e) {
			var tgt = e && e.detail && e.detail.target ? e.detail.target : null;
			toggleWindow(tgt);
		});
		window.addEventListener('freespeech:open', function (e) {
			var tgt = e && e.detail && e.detail.target ? e.detail.target : null;
			openWindow(tgt);
		});
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
				var inserted = insertTextIntoTarget(data.text, Boolean(data.replace));
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
		if (ds.position) parsed.position = ds.position;
		if (ds.title) parsed.title = ds.title;
		if (ds.launcherLabel) parsed.launcherLabel = ds.launcherLabel;
		if (ds.lang) parsed.lang = ds.lang;
		return parsed;
	}

	function init (userOptions) {
		var scriptOpts = readScriptDataset();
		state.options = Object.assign({}, state.options, scriptOpts, userOptions || {});

		if (state.initialized) {
			scanPageEditableTargets();
			syncAriaExpanded();
			return window.FreeSpeechSAAC;
		}

		state.initialized = true;
		document.addEventListener('focusin', trackFocus, true);
		buildDOM();
		scanPageEditableTargets();
		bindCustomTriggers();
		bindPostMessage();
		syncAriaExpanded();
		return window.FreeSpeechSAAC;
	}

	window.FreeSpeechSAAC = {
		init: init,
		open: openWindow,
		close: closeWindow,
		toggle: toggleWindow,
		scanTargets: scanPageEditableTargets,
		setTarget: focusSpecificTargetSelector
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function () {
			var autoOpts = readScriptDataset();
			if (autoOpts.customTrigger || autoOpts.url || document.querySelector('[data-saac-trigger]')) {
				init(autoOpts);
			}
		});
	} else {
		var autoOpts = readScriptDataset();
		if (autoOpts.customTrigger || autoOpts.url || document.querySelector('[data-saac-trigger]')) {
			init(autoOpts);
		}
	}
})(window, document);
