/**
 * ColorPicker — public surface, per-instance state, and the modal shell.
 * No module-level mutable state, so two instances stay independent.
 */

import { formatHex, normalizeHex, parseHex } from './color.js';
import { buildTemplate } from './template.js';
import { createEditor } from './editor.js';

const TABS = ['highContrast', 'lowContrast'];

const DEFAULTS = {
  container: null,
  initialColors: { highContrast: '#0F766E', lowContrast: '#CCFBF1' },
  activeTab: 'highContrast',
  showAlpha: true,
  showContrastSuggestions: false,
  theme: 'light',
  presets: null,
  classNames: '',
  labels: {},
  onChange: null,
  onApply: null,
  onCancel: null,
  onOpen: null,
  onClose: null,
};

const resolveColors = (values, fallback) => {
  const resolved = {};
  for (const tab of TABS) {
    const raw = values && values[tab];
    resolved[tab] = (typeof raw === 'string' && normalizeHex(raw)) || fallback[tab];
  }
  return resolved;
};

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

    this.onDocumentKey = (event) => {
      if (event.key === 'Escape' && this.isOpen) this.cancel();
    };
    document.addEventListener('keydown', this.onDocumentKey);
    this.bind();
    this.syncTabs();
    this.editor.setColor(parseHex(this.colors[this.activeTab]));
  }

  bind() {
    this.refs.tabs.forEach((button) => {
      button.addEventListener('click', () => this.setActiveTab(button.dataset.tab));
    });
    this.refs.tabs[0].parentElement.addEventListener('keydown', (event) => this.handleTabKey(event));
    this.refs.close.addEventListener('click', () => this.cancel());
    this.refs.cancel.addEventListener('click', () => this.cancel());
    this.refs.apply.addEventListener('click', () => this.apply());
    this.refs.reset.addEventListener('click', () => this.reset());
  }

  handleTabKey(event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const index = TABS.indexOf(this.activeTab);
    const step = event.key === 'ArrowRight' ? 1 : TABS.length - 1;
    const next = TABS[(index + step) % TABS.length];
    this.setActiveTab(next);
    this.refs.tabs[TABS.indexOf(next)].focus();
    event.preventDefault();
  }

  syncTabs() {
    this.refs.tabs.forEach((button) => {
      const active = button.dataset.tab === this.activeTab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
  }

  setStatus(message) {
    this.refs.status.textContent = message || '';
  }

  emit(name) {
    const handler = this.options[name];
    if (typeof handler === 'function') handler(this.getColors());
  }

  commit(rgba) {
    const hex = formatHex(rgba);
    if (hex === this.colors[this.activeTab]) return;
    this.colors[this.activeTab] = hex;
    this.setStatus(hex);
    this.emit('onChange');
  }

  setActiveTab(tab) {
    if (!TABS.includes(tab) || tab === this.activeTab) return;
    this.activeTab = tab;
    this.syncTabs();
    this.editor.setColor(parseHex(this.colors[tab]));
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
    this.editor.setColor(parseHex(this.colors[this.activeTab]));
    this.setStatus('');
    this.emit('onChange');
  }

  open() {
    if (this.isOpen) return;
    this.snapshot = { ...this.colors };
    this.isOpen = true;
    this.root.classList.remove('hidden');
    this.editor.setColor(parseHex(this.colors[this.activeTab]));
    this.setStatus('');
    this.refs.tabs[TABS.indexOf(this.activeTab)].focus();
    this.emit('onOpen');
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.root.classList.add('hidden');
    this.emit('onClose');
  }

  reset() {
    this.colors = { ...this.initialColors };
    this.editor.setColor(parseHex(this.colors[this.activeTab]));
    this.setStatus('Restored the initial colors.');
    this.emit('onChange');
  }

  cancel() {
    if (!this.isOpen) return;
    this.colors = { ...this.snapshot };
    this.editor.setColor(parseHex(this.colors[this.activeTab]));
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
    this.editor.destroy();
    this.root.remove();
    this.isOpen = false;
  }
}

export { ColorPicker };
