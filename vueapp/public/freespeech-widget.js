/**
 * Free Speech SAAC - Universal Web & LMS Floating Widget SDK
 * Permite integrar y abrir el tablero SAAC en cualquier página web, portal,
 * buscador, aplicación SPA o LMS (Moodle, Canvas, Blackboard) mediante:
 *   1. Cualquier customTrigger (selector CSS, elemento DOM o atributo [data-saac-trigger])
 *      con soporte opcional de atributos:
 *        - data-saac-target="#selector-del-campo"
 *        - data-saac-mode="float|right|left|bottom"
 *        - data-saac-direct="true|false"
 *   2. El botón flotante integrado (showDefaultTrigger: true/false)
 *   3. API programática (window.FreeSpeechSAAC.open / toggle / close / setMode / setDirectInsert)
 *   4. Atajo de teclado accesible (Alt + Shift + S)
 */
(function (window, document) {
	'use strict';

	if (window.FreeSpeechSAAC) {
		return;
	}

	var STORAGE_KEY = 'freespeech_saac_widget_prefs_v1';

	var state = {
		initialized: false,
		isOpen: false,
		isMinimized: false,
		isMaximized: false,
		dockMode: 'float', // 'float' | 'right' | 'left' | 'bottom'
		directInsert: false,
		userDragged: false,
		lastActiveInput: null,
		lastTriggerElement: null,
		detectedTargets: [],
		selectedTargetIndex: -1, // -1 = Portapapeles / Campo con foco automático
		options: {
			url: '/',
			customTrigger: null,
			showDefaultTrigger: true,
			position: 'bottom-right', // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
			title: 'Comunicador SAAC - Free Speech',
			launcherLabel: 'SAAC',
			lang: '',
			width: 520,
			height: 650,
			smartPosition: true,
			directInsert: false
		},
		elements: {}
	};

	function loadSavedPrefs () {
		try {
			var raw = window.sessionStorage && window.sessionStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			var parsed = JSON.parse(raw);
			if (parsed && typeof parsed === 'object') {
				if (parsed.dockMode) state.dockMode = parsed.dockMode;
				if (typeof parsed.directInsert === 'boolean') state.directInsert = parsed.directInsert;
			}
		} catch (_e) {
			// Ignorado si sessionStorage está restringido
		}
	}

	function savePrefs () {
		try {
			if (!window.sessionStorage) return;
			window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
				dockMode: state.dockMode,
				directInsert: state.directInsert
			}));
		} catch (_e) {
			// Ignorado
		}
	}

	function announcePolite (message) {
		if (!state.elements.liveRegion || !message) return;
		state.elements.liveRegion.textContent = '';
		setTimeout(function () {
			if (state.elements.liveRegion) {
				state.elements.liveRegion.textContent = message;
			}
		}, 40);
	}

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

	function highlightTargetOnPage (el, pulse) {
		var prev = document.querySelectorAll('.fs-saac-active-target-ring, .fs-saac-inserted-pulse');
		for (var i = 0; i < prev.length; i++) {
			prev[i].classList.remove('fs-saac-active-target-ring', 'fs-saac-inserted-pulse');
		}
		if (el && el.classList) {
			el.classList.add('fs-saac-active-target-ring');
			if (pulse) {
				el.classList.add('fs-saac-inserted-pulse');
				setTimeout(function () {
					if (el && el.classList) el.classList.remove('fs-saac-inserted-pulse');
				}, 700);
			}
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
			var cleanLabel = item.label.replace(/^\d+[\.\)]\s*/, '');
			opt.textContent = (i + 1) + '. ' + cleanLabel.slice(0, 52);
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

	function getActiveTargetDomElement () {
		if (state.selectedTargetIndex >= 0 && state.detectedTargets[state.selectedTargetIndex]) {
			return state.detectedTargets[state.selectedTargetIndex].element || null;
		}
		if (state.lastActiveInput && isEditableElement(state.lastActiveInput)) {
			return state.lastActiveInput;
		}
		return null;
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
				if (state.isOpen) {
					highlightTargetOnPage(target, false);
				}
				break;
			}
		}
	}

	function insertIntoDomElement (target, text, replaceAll) {
		if (!target || !isEditableElement(target)) return false;

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
		highlightTargetOnPage(target, true);
		return true;
	}

	function deleteLastWordInTarget () {
		var target = getActiveTargetDomElement();
		if (!target || !isEditableElement(target)) return false;
		if (target.isContentEditable) {
			var txt = (target.textContent || '').trimEnd();
			target.textContent = txt.replace(/\S+\s*$/, '').trimEnd();
		} else {
			var val = (target.value || '').trimEnd();
			target.value = val.replace(/\S+\s*$/, '').trimEnd();
		}
		target.dispatchEvent(new Event('input', { bubbles: true }));
		target.dispatchEvent(new Event('change', { bubbles: true }));
		highlightTargetOnPage(target, true);
		announcePolite('Última palabra borrada del campo activo.');
		return true;
	}

	function insertTextIntoTarget (text, replaceAll) {
		if (!text) return false;
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
				announcePolite('Texto insertado en ' + chosen.label);
				return true;
			}
			if (chosen.element) {
				var ok = insertIntoDomElement(chosen.element, text, replaceAll);
				if (ok) announcePolite('Texto insertado en ' + chosen.label);
				return ok;
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
			announcePolite('Texto insertado en el editor activo.');
			return true;
		}

		// 3. Si hay un último campo con foco recordado
		if (state.lastActiveInput && isEditableElement(state.lastActiveInput)) {
			var okLast = insertIntoDomElement(state.lastActiveInput, text, replaceAll);
			if (okLast) announcePolite('Texto insertado en el campo activo.');
			return okLast;
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
			'.fs-saac-sr-only {',
			'  position: absolute !important;',
			'  width: 1px !important;',
			'  height: 1px !important;',
			'  padding: 0 !important;',
			'  margin: -1px !important;',
			'  overflow: hidden !important;',
			'  clip: rect(0, 0, 0, 0) !important;',
			'  white-space: nowrap !important;',
			'  border: 0 !important;',
			'}',
			'.fs-saac-active-target-ring {',
			'  outline: 2.5px dashed #0f766e !important;',
			'  outline-offset: 2px !important;',
			'  transition: box-shadow 0.2s ease, outline-color 0.2s ease;',
			'}',
			'body.fs-saac-body-docked-bottom {',
			'  padding-bottom: 420px !important;',
			'}',
			'.fs-saac-inserted-pulse {',
			'  box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.28) !important;',
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
			'.fs-saac-launcher-ico {',
			'  width: 14px;',
			'  height: 12px;',
			'  border: 2px solid currentColor;',
			'  border-radius: 3px;',
			'  display: inline-block;',
			'  position: relative;',
			'  flex-shrink: 0;',
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
			'.fs-saac-launcher:focus-visible, .fs-saac-header-btn:focus-visible, .fs-saac-target-select:focus-visible, .fs-saac-tool-btn:focus-visible {',
			'  outline: 3px solid #38bdf8;',
			'  outline-offset: 2px;',
			'}',
			'.fs-saac-window {',
			'  position: fixed;',
			'  bottom: 76px;',
			'  right: 20px;',
			'  width: 520px;',
			'  height: 650px;',
			'  max-width: calc(100vw - 24px);',
			'  max-height: calc(100vh - 88px);',
			'  z-index: 2147483645;',
			'  background: #ffffff;',
			'  border-radius: 14px;',
			'  border: 1.5px solid #18181b;',
			'  box-shadow: 0 22px 54px rgba(9, 9, 11, 0.38);',
			'  display: none;',
			'  flex-direction: column;',
			'  overflow: hidden;',
			'  resize: both;',
			'}',
			'.fs-saac-window.is-open { display: flex; }',
			'.fs-saac-window.is-minimized {',
			'  height: 44px !important;',
			'  resize: none;',
			'}',
			'.fs-saac-window.is-minimized .fs-saac-targetbar, .fs-saac-window.is-minimized .fs-saac-iframe {',
			'  display: none !important;',
			'}',
			'.fs-saac-window.is-maximized {',
			'  left: 16px !important;',
			'  top: 16px !important;',
			'  right: 16px !important;',
			'  bottom: auto !important;',
			'  width: calc(100vw - 32px) !important;',
			'  max-width: calc(100vw - 32px) !important;',
			'  height: calc(100vh - 88px) !important;',
			'}',
			'.fs-saac-window.is-docked-right {',
			'  top: 0 !important;',
			'  right: 0 !important;',
			'  bottom: 0 !important;',
			'  left: auto !important;',
			'  width: min(500px, 100vw) !important;',
			'  height: 100vh !important;',
			'  max-height: 100vh !important;',
			'  border-radius: 12px 0 0 12px;',
			'}',
			'.fs-saac-window.is-docked-left {',
			'  top: 0 !important;',
			'  left: 0 !important;',
			'  bottom: 0 !important;',
			'  right: auto !important;',
			'  width: min(500px, 100vw) !important;',
			'  height: 100vh !important;',
			'  max-height: 100vh !important;',
			'  border-radius: 0 12px 12px 0;',
			'}',
			'.fs-saac-window.is-docked-bottom {',
			'  left: 0 !important;',
			'  right: 0 !important;',
			'  bottom: 0 !important;',
			'  top: auto !important;',
			'  width: 100vw !important;',
			'  max-width: 100vw !important;',
			'  height: min(410px, 56vh) !important;',
			'  max-height: 62vh !important;',
			'  border-radius: 14px 14px 0 0;',
			'}',
			'.fs-saac-header {',
			'  background: #18181b;',
			'  color: #ffffff;',
			'  padding: 8px 12px;',
			'  display: flex;',
			'  align-items: center;',
			'  justify-content: space-between;',
			'  cursor: move;',
			'  user-select: none;',
			'  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;',
			'}',
			'.fs-saac-title {',
			'  font-size: 13.5px;',
			'  font-weight: 700;',
			'  margin: 0;',
			'  display: flex;',
			'  align-items: center;',
			'  gap: 8px;',
			'  white-space: nowrap;',
			'  overflow: hidden;',
			'  text-overflow: ellipsis;',
			'}',
			'.fs-saac-controls {',
			'  display: flex;',
			'  align-items: center;',
			'  gap: 4px;',
			'}',
			'.fs-saac-header-btn {',
			'  background: rgba(255, 255, 255, 0.12);',
			'  color: #ffffff;',
			'  border: 1px solid rgba(255, 255, 255, 0.22);',
			'  border-radius: 6px;',
			'  width: 28px;',
			'  height: 26px;',
			'  padding: 0;',
			'  display: inline-flex;',
			'  align-items: center;',
			'  justify-content: center;',
			'  cursor: pointer;',
			'}',
			'.fs-saac-header-btn:hover { background: rgba(255, 255, 255, 0.25); }',
			'.fs-saac-header-btn[aria-pressed="true"] {',
			'  background: #0ea5e9;',
			'  border-color: #7dd3fc;',
			'  color: #082f49;',
			'}',
			'.fs-ico { display: inline-block; position: relative; pointer-events: none; }',
			'.fs-ico-dock-left {',
			'  width: 13px; height: 11px; border: 1.5px solid currentColor; border-radius: 2px;',
			'}',
			'.fs-ico-dock-left::after {',
			'  content: ""; position: absolute; top: 0; left: 0; bottom: 0; width: 4px; background: currentColor;',
			'}',
			'.fs-ico-dock-bottom {',
			'  width: 13px; height: 11px; border: 1.5px solid currentColor; border-radius: 2px;',
			'}',
			'.fs-ico-dock-bottom::after {',
			'  content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: currentColor;',
			'}',
			'.fs-ico-dock-right {',
			'  width: 13px; height: 11px; border: 1.5px solid currentColor; border-radius: 2px;',
			'}',
			'.fs-ico-dock-right::after {',
			'  content: ""; position: absolute; top: 0; right: 0; bottom: 0; width: 4px; background: currentColor;',
			'}',
			'.fs-ico-popout {',
			'  width: 11px; height: 11px; border: 1.5px solid currentColor; border-radius: 2px;',
			'}',
			'.fs-ico-popout::after {',
			'  content: ""; position: absolute; top: -2px; right: -2px; width: 6px; height: 6px;',
			'  border-top: 2px solid currentColor; border-right: 2px solid currentColor; background: #18181b;',
			'}',
			'.fs-ico-min { width: 11px; height: 2px; background: currentColor; }',
			'.fs-ico-max { width: 11px; height: 10px; border: 1.5px solid currentColor; border-radius: 2px; }',
			'.fs-ico-close { width: 12px; height: 12px; }',
			'.fs-ico-close::before, .fs-ico-close::after {',
			'  content: ""; position: absolute; left: 5px; top: 0; width: 1.8px; height: 12px; background: currentColor;',
			'}',
			'.fs-ico-close::before { transform: rotate(45deg); }',
			'.fs-ico-close::after { transform: rotate(-45deg); }',
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
			'  font-size: 11.5px;',
			'  color: #27272a;',
			'}',
			'.fs-saac-target-group {',
			'  display: flex;',
			'  align-items: center;',
			'  gap: 6px;',
			'  flex: 1 1 210px;',
			'  min-width: 0;',
			'}',
			'.fs-saac-target-label { font-weight: 700; white-space: nowrap; color: #3f3f46; }',
			'.fs-saac-target-select {',
			'  flex: 1;',
			'  min-width: 0;',
			'  padding: 4px 7px;',
			'  border-radius: 6px;',
			'  border: 1px solid #d4d4d8;',
			'  background: #ffffff;',
			'  color: #18181b;',
			'  font-size: 11.5px;',
			'  font-weight: 600;',
			'}',
			'.fs-saac-target-actions {',
			'  display: flex;',
			'  align-items: center;',
			'  gap: 5px;',
			'  flex-wrap: wrap;',
			'}',
			'.fs-saac-tool-btn {',
			'  background: #ffffff;',
			'  color: #27272a;',
			'  border: 1px solid #d4d4d8;',
			'  border-radius: 6px;',
			'  padding: 3px 8px;',
			'  font-size: 11px;',
			'  font-weight: 700;',
			'  cursor: pointer;',
			'  display: inline-flex;',
			'  align-items: center;',
			'  gap: 5px;',
			'  white-space: nowrap;',
			'}',
			'.fs-saac-tool-btn:hover { background: #e4e4e7; }',
			'.fs-saac-tool-btn.is-direct-active {',
			'  background: #0f766e;',
			'  color: #ffffff;',
			'  border-color: #0f766e;',
			'}',
			'.fs-direct-dot {',
			'  width: 7px;',
			'  height: 7px;',
			'  border-radius: 50%;',
			'  background: #a1a1aa;',
			'  display: inline-block;',
			'}',
			'.fs-saac-tool-btn.is-direct-active .fs-direct-dot {',
			'  background: #5eead4;',
			'}',
			'.fs-saac-iframe {',
			'  flex: 1;',
			'  width: 100%;',
			'  border: 0;',
			'  background: #f8fafc;',
			'  overscroll-behavior: contain;',
			'}',
			'@media (max-width: 640px) {',
			'  .fs-saac-window {',
			'    left: 0 !important;',
			'    right: 0 !important;',
			'    bottom: 0 !important;',
			'    top: auto !important;',
			'    width: 100vw !important;',
			'    max-width: 100vw !important;',
			'    height: 86vh !important;',
			'    height: 86dvh !important;',
			'    max-height: 92vh !important;',
			'    max-height: 92dvh !important;',
			'    border-radius: 14px 14px 0 0 !important;',
			'    resize: none;',
			'    overscroll-behavior: contain;',
			'  }',
			'  .fs-saac-window.is-maximized {',
			'    height: 94vh !important;',
			'    max-height: 96vh !important;',
			'  }',
			'  .fs-saac-header {',
			'    padding: 6px 10px;',
			'  }',
			'  .fs-saac-title {',
			'    font-size: 12.5px;',
			'  }',
			'  .fs-saac-dock-btn {',
			'    display: none !important;',
			'  }',
			'  .fs-saac-targetbar {',
			'    padding: 4px 8px;',
			'    gap: 4px;',
			'    flex-wrap: nowrap;',
			'    overflow-x: auto;',
			'  }',
			'  .fs-saac-target-label {',
			'    display: none;',
			'  }',
			'  .fs-saac-target-group {',
			'    flex: 1 1 100px;',
			'    min-width: 85px;',
			'  }',
			'  .fs-saac-target-select {',
			'    padding: 3px 5px;',
			'    font-size: 11px;',
			'  }',
			'  .fs-saac-target-actions {',
			'    flex-wrap: nowrap;',
			'    gap: 4px;',
			'    flex-shrink: 0;',
			'  }',
			'  .fs-saac-tool-btn {',
			'    padding: 3px 6px;',
			'    font-size: 10.5px;',
			'  }',
			'  .fs-saac-refresh-btn {',
			'    display: none !important;',
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
			state.userDragged = true;
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

	/**
	 * Posiciona la ventana flotante de forma inteligente al abrirse desde un customTrigger
	 * para no tapar nunca el campo de texto donde el usuario está escribiendo.
	 */
	function positionFloatingWindowSmart (triggerEl) {
		var winEl = state.elements.window;
		if (!winEl || state.dockMode !== 'float' || state.isMaximized || state.userDragged || window.innerWidth <= 640) {
			return;
		}
		if (!state.options.smartPosition) return;

		var vw = window.innerWidth;
		var vh = window.innerHeight;
		var winW = Math.min(state.options.width || 520, vw - 24);
		var winH = Math.min(state.options.height || 650, vh - 88);

		var refEl = getActiveTargetDomElement() || triggerEl;
		if (!refEl || !refEl.getBoundingClientRect) return;

		var refRect = refEl.getBoundingClientRect();
		if (refRect.width === 0 && refRect.height === 0) return;

		var chosenLeft = vw - winW - 20;
		var chosenTop = Math.max(16, vh - winH - 76);

		// Verificar si la posición por defecto se solapa con el campo activo
		var overlapsHoriz = chosenLeft < (refRect.right + 12) && (chosenLeft + winW) > (refRect.left - 12);
		var overlapsVert = chosenTop < (refRect.bottom + 12) && (chosenTop + winH) > (refRect.top - 12);

		if (overlapsHoriz && overlapsVert) {
			var spaceRight = vw - refRect.right - 20;
			var spaceLeft = refRect.left - 20;
			var spaceBelow = vh - refRect.bottom - 24;

			if (spaceRight >= winW) {
				chosenLeft = refRect.right + 14;
			} else if (spaceLeft >= winW) {
				chosenLeft = Math.max(12, refRect.left - winW - 14);
			} else if (spaceBelow >= 340) {
				chosenTop = Math.min(vh - winH - 16, refRect.bottom + 12);
			} else {
				// Si el campo está en la mitad derecha, ubicar la ventana a la izquierda y viceversa
				var refCenter = refRect.left + refRect.width / 2;
				chosenLeft = refCenter > (vw / 2) ? 16 : Math.max(16, vw - winW - 16);
			}
		}

		winEl.style.right = 'auto';
		winEl.style.bottom = 'auto';
		winEl.style.left = Math.max(12, Math.min(vw - winW - 12, chosenLeft)) + 'px';
		winEl.style.top = Math.max(12, Math.min(vh - winH - 12, chosenTop)) + 'px';
	}

	function setDockMode (mode) {
		var winEl = state.elements.window;
		if (!winEl) return;
		var validModes = ['float', 'right', 'left', 'bottom'];
		var nextMode = validModes.indexOf(mode) !== -1 ? mode : 'float';
		state.dockMode = nextMode;
		state.isMinimized = false;
		state.isMaximized = false;

		winEl.classList.remove('is-minimized', 'is-maximized', 'is-docked-right', 'is-docked-left', 'is-docked-bottom');
		if (nextMode === 'right') winEl.classList.add('is-docked-right');
		if (nextMode === 'left') winEl.classList.add('is-docked-left');
		if (nextMode === 'bottom') winEl.classList.add('is-docked-bottom');

		if (state.elements.dockLeftBtn) {
			state.elements.dockLeftBtn.setAttribute('aria-pressed', String(nextMode === 'left'));
		}
		if (state.elements.dockRightBtn) {
			state.elements.dockRightBtn.setAttribute('aria-pressed', String(nextMode === 'right'));
		}
		if (document.body) {
			document.body.classList.toggle('fs-saac-body-docked-bottom', state.isOpen && nextMode === 'bottom');
		}
		savePrefs();
	}

	function setDirectInsertMode (enabled) {
		state.directInsert = Boolean(enabled);
		if (state.elements.directBtn) {
			state.elements.directBtn.setAttribute('aria-pressed', String(state.directInsert));
			state.elements.directBtn.classList.toggle('is-direct-active', state.directInsert);
		}
		savePrefs();
		announcePolite(state.directInsert
			? 'Modo escritura directa activado: cada baldosa pulsada se insertará en el campo activo.'
			: 'Modo escritura directa desactivado: construye primero la oración.');
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

		var liveEl = document.createElement('div');
		liveEl.className = 'fs-saac-sr-only';
		liveEl.setAttribute('role', 'status');
		liveEl.setAttribute('aria-live', 'polite');
		liveEl.setAttribute('aria-atomic', 'true');
		document.body.appendChild(liveEl);
		state.elements.liveRegion = liveEl;

		var winEl = document.createElement('section');
		winEl.id = 'fs-saac-floating-window';
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

		var dockLeftBtn = createIconButton(
			'Acoplar tablero SAAC al lateral izquierdo',
			'Acoplar a la izquierda / Ventana flotante',
			'fs-ico-dock-left',
			function () {
				setDockMode(state.dockMode === 'left' ? 'float' : 'left');
			}
		);
		dockLeftBtn.classList.add('fs-saac-dock-btn');
		dockLeftBtn.setAttribute('aria-pressed', 'false');

		var dockRightBtn = createIconButton(
			'Acoplar tablero SAAC al lateral derecho',
			'Acoplar a la derecha / Ventana flotante',
			'fs-ico-dock-right',
			function () {
				setDockMode(state.dockMode === 'right' ? 'float' : 'right');
			}
		);
		dockRightBtn.classList.add('fs-saac-dock-btn');
		dockRightBtn.setAttribute('aria-pressed', 'false');

		var closeBtn = createIconButton(
			'Cerrar ventana SAAC',
			'Cerrar (Esc)',
			'fs-ico-close',
			closeWindow
		);

		controlsEl.appendChild(dockLeftBtn);
		controlsEl.appendChild(dockRightBtn);
		controlsEl.appendChild(closeBtn);

		headerEl.appendChild(titleEl);
		headerEl.appendChild(controlsEl);

		// Barra universal de selección de campo destino y modo de escritura directa
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
				highlightTargetOnPage(state.detectedTargets[state.selectedTargetIndex].element, false);
			} else {
				highlightTargetOnPage(null, false);
			}
		});

		targetGroupEl.appendChild(targetLabelEl);
		targetGroupEl.appendChild(targetSelectEl);

		var actionsGroupEl = document.createElement('div');
		actionsGroupEl.className = 'fs-saac-target-actions';

		var directBtn = document.createElement('button');
		directBtn.type = 'button';
		directBtn.className = 'fs-saac-tool-btn';
		directBtn.setAttribute('aria-pressed', String(state.directInsert));
		directBtn.setAttribute('aria-label', 'Activar o desactivar escritura directa al pulsar cada pictograma');
		directBtn.title = 'Insertar cada palabra automáticamente al pulsar un pictograma en el tablero';
		var directDot = document.createElement('span');
		directDot.className = 'fs-direct-dot';
		directDot.setAttribute('aria-hidden', 'true');
		var directText = document.createElement('span');
		directText.textContent = 'Escritura directa';
		directBtn.appendChild(directDot);
		directBtn.appendChild(directText);
		directBtn.addEventListener('click', function () {
			setDirectInsertMode(!state.directInsert);
		});

		var backspaceBtn = document.createElement('button');
		backspaceBtn.type = 'button';
		backspaceBtn.className = 'fs-saac-tool-btn';
		backspaceBtn.textContent = 'Borrar palabra';
		backspaceBtn.setAttribute('aria-label', 'Borrar la última palabra del campo de texto activo');
		backspaceBtn.title = 'Borrar última palabra escrita en el campo destino';
		backspaceBtn.addEventListener('click', deleteLastWordInTarget);

		var refreshBtn = document.createElement('button');
		refreshBtn.type = 'button';
		refreshBtn.className = 'fs-saac-tool-btn fs-saac-refresh-btn';
		refreshBtn.textContent = 'Detectar campos';
		refreshBtn.setAttribute('aria-label', 'Volver a detectar campos de texto en la página');
		refreshBtn.addEventListener('click', scanPageEditableTargets);

		actionsGroupEl.appendChild(directBtn);
		actionsGroupEl.appendChild(backspaceBtn);
		actionsGroupEl.appendChild(refreshBtn);

		targetBarEl.appendChild(targetGroupEl);
		targetBarEl.appendChild(actionsGroupEl);

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
		state.elements.dockLeftBtn = dockLeftBtn;
		state.elements.dockRightBtn = dockRightBtn;
		state.elements.directBtn = directBtn;
		state.elements.closeBtn = closeBtn;

		setDockMode(state.dockMode);
		if (state.directInsert) {
			directBtn.classList.add('is-direct-active');
		}

		if (state.options.showDefaultTrigger) {
			var launcherBtn = document.createElement('button');
			launcherBtn.type = 'button';
			var posClass = 'pos-' + (state.options.position || 'bottom-right');
			launcherBtn.className = 'fs-saac-launcher ' + posClass;
			launcherBtn.setAttribute('aria-expanded', 'false');
			launcherBtn.setAttribute('aria-controls', 'fs-saac-floating-window');
			launcherBtn.setAttribute('aria-label', 'Abrir tablero comunicador SAAC Free Speech');

			var lIco = document.createElement('span');
			lIco.className = 'fs-saac-launcher-ico';
			lIco.setAttribute('aria-hidden', 'true');
			var lText = document.createElement('span');
			lText.textContent = state.options.launcherLabel || 'SAAC';

			launcherBtn.appendChild(lIco);
			launcherBtn.appendChild(lText);
			launcherBtn.addEventListener('click', function () {
				state.lastTriggerElement = launcherBtn;
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
			triggers[i].setAttribute('aria-controls', 'fs-saac-floating-window');
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
				highlightTargetOnPage(targetEl, false);
				break;
			}
		}
	}

	function openWindow (targetSelector, openOptions) {
		if (!state.initialized) init();
		if (!state.elements.iframe.src) {
			state.elements.iframe.src = resolveEmbedUrl(state.options.url);
		}
		var opts = openOptions || {};
		if (opts.triggerElement) {
			state.lastTriggerElement = opts.triggerElement;
		}
		if (opts.mode) {
			setDockMode(opts.mode);
		}
		if (typeof opts.directInsert === 'boolean') {
			setDirectInsertMode(opts.directInsert);
		}

		scanPageEditableTargets();
		if (targetSelector && typeof targetSelector === 'string') {
			focusSpecificTargetSelector(targetSelector);
		}
		state.isOpen = true;
		state.isMinimized = false;
		state.elements.window.classList.remove('is-minimized');
		state.elements.window.classList.add('is-open');
		positionFloatingWindowSmart(state.lastTriggerElement);
		syncAriaExpanded();

		var activeTarget = getActiveTargetDomElement();
		if (activeTarget) {
			highlightTargetOnPage(activeTarget, false);
			if (state.dockMode === 'bottom' && activeTarget.scrollIntoView) {
				activeTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}
		if (document.body) {
			document.body.classList.toggle('fs-saac-body-docked-bottom', state.dockMode === 'bottom');
		}
		announcePolite('Tablero comunicador SAAC abierto.');
	}

	function closeWindow () {
		if (!state.initialized) return;
		state.isOpen = false;
		state.elements.window.classList.remove('is-open');
		if (document.body) {
			document.body.classList.remove('fs-saac-body-docked-bottom');
		}
		highlightTargetOnPage(null, false);
		syncAriaExpanded();
		announcePolite('Tablero comunicador SAAC cerrado.');
		var returnEl = state.lastActiveInput || state.lastTriggerElement;
		if (returnEl && typeof returnEl.focus === 'function') {
			try {
				returnEl.focus();
			} catch (_e) {
				// Ignorado
			}
		}
	}

	function toggleWindow (targetSelector, openOptions) {
		if (state.isOpen && !targetSelector && (!openOptions || !openOptions.mode)) {
			closeWindow();
		} else {
			openWindow(targetSelector, openOptions);
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
			var explicitMode = matched.getAttribute ? matched.getAttribute('data-saac-mode') : null;
			var explicitDirect = matched.getAttribute ? matched.getAttribute('data-saac-direct') : null;

			var openOpts = {
				triggerElement: matched
			};
			if (explicitMode) openOpts.mode = explicitMode;
			if (explicitDirect === 'true' || explicitDirect === 'false') {
				openOpts.directInsert = explicitDirect === 'true';
			}

			if (explicitTarget || explicitMode || explicitDirect !== null) {
				openWindow(explicitTarget, openOpts);
			} else {
				toggleWindow(null, openOpts);
			}
		});

		window.addEventListener('freespeech:toggle', function (e) {
			var d = (e && e.detail) || {};
			toggleWindow(d.target || null, d);
		});
		window.addEventListener('freespeech:open', function (e) {
			var d = (e && e.detail) || {};
			openWindow(d.target || null, d);
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
			} else if (data.action === 'tileTap' && state.directInsert) {
				insertTextIntoTarget(data.text, false);
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
		if (ds.directInsert !== undefined) {
			parsed.directInsert = ds.directInsert === 'true';
		}
		return parsed;
	}

	function init (userOptions) {
		loadSavedPrefs();
		var scriptOpts = readScriptDataset();
		state.options = Object.assign({}, state.options, scriptOpts, userOptions || {});
		if (typeof state.options.directInsert === 'boolean' && userOptions && typeof userOptions.directInsert === 'boolean') {
			state.directInsert = state.options.directInsert;
		}

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
		setTarget: focusSpecificTargetSelector,
		setMode: setDockMode,
		setDirectInsert: setDirectInsertMode,
		deleteLastWord: deleteLastWordInTarget
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
