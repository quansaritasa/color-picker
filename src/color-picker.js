/**
 * ColorPicker — public surface, per-instance state, and the modal shell.
 * No module-level mutable state, so two instances stay independent.
 */

import { formatHex, normalizeHex, parseHex } from './color.js';
import { buildTemplate } from './template.js';
import { createEditor } from './editor.js';
import { DEFAULT_PRESETS, mergePresets } from './presets.js';
import { createPresetPanel } from './presets-panel.js';
import { createSuggestions } from './suggestions.js';
import { bindShell } from './bindings.js';
import { DEFAULTS, TABS, resolveColors } from './options.js';
import { syncTabs } from './tablist.js';

export default class ColorPicker {
  constructor(options = {}) {
    this.options = {
      ...DEFAULTS,
      ...options,
      labels: { ...DEFAULTS.labels, ...(options.labels || {}) },
    };
    this.initialColors = resolveColors(options.initialColors, DEFAULTS.initialColors);
    this.colors = { ...this.initialColors };
    this.snapshot = { ...this.colors };
    this.activeTab = TABS.includes(options.activeTab) ? options.activeTab : DEFAULTS.activeTab;
    this.isOpen = false;

    this.root = document.createElement('div');
    this.root.className = `cp-root${this.options.classNames ? ` ${this.options.classNames}` : ''}`;
    this.root.dataset.theme = this.options.theme;
    this.root.classList.add('hidden');
    const built = buildTemplate({ showAlpha: this.options.showAlpha, labels: this.options.labels });
    this.refs = built.refs;
    this.root.append(built.root);
    (this.options.container || document.body).append(this.root);

    this.editor = createEditor(this.refs, {
      showAlpha: this.options.showAlpha,
      onChange: (rgba) => this.commit(rgba),
      onStatus: (message) => this.setStatus(message),
    });

    this.presets = mergePresets(DEFAULT_PRESETS, this.options.presets || {});
    this.panel = createPresetPanel({
      refs: this.refs,
      presets: this.presets,
      onSelect: (hex, tab) => this.selectColor(hex, { source: 'preset', tab }),
    });
    this.suggestions = createSuggestions({
      mount: this.refs.suggestions,
      presets: this.presets,
      enabled: this.options.showContrastSuggestions,
      onPick: (hex, tab) => this.selectColor(hex, { source: 'suggestion', tab }),
    });

    bindShell(this);
    syncTabs(this.refs, this.activeTab);
    this.refresh();
  }

  setStatus(message) {
    this.refs.status.textContent = message || '';
  }

  emit(name) {
    const handler = this.options[name];
    if (typeof handler === 'function') handler(this.getColors());
  }

  commit(rgba) {
    this.selectColor(formatHex(rgba), { source: 'editor' });
  }

  /** Push editor + panels from `this.colors` without emitting. */
  refresh() {
    this.editor.setColor(parseHex(this.colors[this.activeTab]));
    this.renderPanels();
  }

  /** Repaint the read-only surfaces; the editor is left alone mid-drag. */
  renderPanels() {
    this.panel.render(this.activeTab, this.colors);
    this.suggestions.render(this.activeTab, this.colors);
  }

  /**
   * The single writer to `colors`. Swatch clicks, HEX/SV edits and
   * `setColors()` all land here, so editor, HEX, preview and tab memory
   * can never disagree.
   */
  selectColor(hex, { source = 'preset', tab = this.activeTab } = {}) {
    const normalized = normalizeHex(hex);
    if (!normalized || !TABS.includes(tab)) return;
    if (tab !== this.activeTab) {
      this.activeTab = tab;
      syncTabs(this.refs, this.activeTab);
      this.setStatus('');
    }
    const changed = this.colors[tab] !== normalized;
    this.colors[tab] = normalized;
    if (source === 'editor') {
      // The editor emits once per pointermove: writing the status region here
      // would queue dozens of polite announcements during one drag. The editor
      // owns that region for commit-level messages (invalid HEX, etc).
      this.renderPanels();
    } else {
      this.refresh();
      this.setStatus(normalized);
    }
    if (changed) this.emit('onChange');
  }

  setActiveTab(tab) {
    if (!TABS.includes(tab) || tab === this.activeTab) return;
    this.activeTab = tab;
    syncTabs(this.refs, this.activeTab);
    this.refresh();
    this.setStatus('');
  }

  getColors() {
    return { ...this.colors };
  }

  setColors(partial) {
    const next = resolveColors({ ...this.colors, ...(partial || {}) }, this.colors);
    let changed = false;
    for (const tab of TABS) {
      if (next[tab] !== this.colors[tab]) {
        this.colors[tab] = next[tab];
        changed = true;
      }
    }
    if (!changed) return;
    this.refresh();
    this.setStatus('');
    this.emit('onChange');
  }

  open() {
    if (this.isOpen) return;
    this.snapshot = { ...this.colors };
    this.isOpen = true;
    this.root.classList.remove('hidden');
    this.refresh();
    this.setStatus('');
    this.focusTrap.activate();
    this.refs.tabs[TABS.indexOf(this.activeTab)].focus();
    this.emit('onOpen');
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.root.classList.add('hidden');
    this.focusTrap.deactivate();
    this.emit('onClose');
  }

  reset() {
    this.colors = { ...this.initialColors };
    this.refresh();
    this.setStatus('Restored the initial colors.');
    this.emit('onChange');
  }

  cancel() {
    if (!this.isOpen) return;
    this.colors = { ...this.snapshot };
    this.refresh();
    this.setStatus('Changes discarded.');
    this.emit('onCancel');
    this.close();
  }

  apply() {
    this.snapshot = { ...this.colors };
    this.setStatus('Colors applied.');
    this.emit('onApply');
    this.close();
  }

  destroy() {
    document.removeEventListener('keydown', this.onDocumentKey);
    this.focusTrap.deactivate();
    this.suggestions.destroy();
    this.panel.destroy();
    this.editor.destroy();
    this.root.remove();
    this.isOpen = false;
  }
}

export { ColorPicker };