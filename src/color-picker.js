/**
 * ColorPicker — public surface, per-instance state, and the modal shell.
 * No module-level mutable state, so two instances stay independent.
 *
 * `colors` is keyed by slot id, so the host always knows which thing a value
 * belongs to: the key it reads back is the name it declared.
 */

import { formatHex, normalizeHex, parseHex } from './color.js';
import { assemble } from './assemble.js';
import { bindShell, unbindShell } from './bindings.js';
import { clampAlpha, resolveColors, resolveOptions, resolvePair, resolveSlots } from './options.js';
import { syncTabs } from './tablist.js';

export default class ColorPicker {
  constructor(options = {}) {
    this.options = resolveOptions(options);
    this.slots = resolveSlots(this.options.slots, this.options.labels);
    this.slotIds = this.slots.map((slot) => slot.id);
    this.pair = resolvePair(this.options.contrastPair, this.slotIds);
    this.initialColors = resolveColors(options.initialColors, this.slots, this.options.showAlpha);
    this.colors = { ...this.initialColors };
    this.snapshot = { ...this.colors };
    this.activeSlot = this.slotIds.includes(options.activeSlot) ? options.activeSlot : this.slotIds[0];
    this.isOpen = false;
    this.mode = this.options.mode;
    /** The element a popover hangs off; null means "no anchor". */
    this.anchor = null;

    this.root = document.createElement('div');
    this.root.className = `cp-root${this.options.classNames ? ` ${this.options.classNames}` : ''}`;
    this.root.dataset.theme = this.options.theme;
    this.root.classList.add('hidden');

    assemble(this);
    bindShell(this);
    syncTabs(this.refs, this.activeSlot);
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
    this.editor.setColor(parseHex(this.colors[this.activeSlot]));
    this.renderPanels();
  }

  /** Repaint the read-only surfaces; the editor is left alone mid-drag. */
  renderPanels() {
    const slot = this.slots.find((entry) => entry.id === this.activeSlot) || this.slots[0];
    this.panel.render(slot.presetSet, this.colors[this.activeSlot]);
    this.suggestions.render(this.activeSlot, slot.presetSet, this.colors);
    if (this.swatches) this.swatches.render(this.colors);
  }

  /**
   * The single writer to `colors`. Swatch clicks, HEX/SV edits and
   * `setColors()` all land here, so editor, HEX, preview and per-slot memory
   * can never disagree. `slot` defaults to the one the editor is showing; a
   * preset grid passes its own slot, so its click never lands elsewhere.
   */
  selectColor(hex, { source = 'preset', slot = this.activeSlot } = {}) {
    const normalized = clampAlpha(normalizeHex(hex), this.options.showAlpha);
    if (!normalized || !this.slotIds.includes(slot)) return;
    if (slot !== this.activeSlot) {
      this.activeSlot = slot;
      syncTabs(this.refs, this.activeSlot);
      this.setStatus('');
    }
    const changed = this.colors[slot] !== normalized;
    this.colors[slot] = normalized;
    if (source === 'editor') {
      // The editor emits once per pointermove: writing the status region here
      // would queue dozens of polite announcements during one drag. The editor
      // owns that region for commit-level messages (invalid HEX, etc), so the
      // first commit only clears a message it has already made stale.
      if (this.refs.status.textContent) {
        this.setStatus('');
        this.refs.hex.removeAttribute('aria-invalid');
      }
      this.renderPanels();
    } else {
      this.refresh();
      this.setStatus(normalized);
    }
    if (changed) this.emit('onChange');
  }

  setActiveSlot(slot) {
    if (!this.slotIds.includes(slot) || slot === this.activeSlot) return;
    this.activeSlot = slot;
    syncTabs(this.refs, this.activeSlot);
    this.refresh();
    this.setStatus('');
  }

  getColors() {
    return { ...this.colors };
  }

  setColors(partial) {
    const next = resolveColors({ ...this.colors, ...(partial || {}) }, this.slots, this.options.showAlpha);
    let changed = false;
    for (const id of this.slotIds) {
      if (next[id] !== this.colors[id]) {
        this.colors[id] = next[id];
        changed = true;
      }
    }
    if (!changed) return;
    this.refresh();
    this.setStatus('');
    this.emit('onChange');
  }

  open(anchor = null) {
    if (this.isOpen) return;
    this.anchor = anchor || (this.swatches ? this.swatches.anchorFor(this.activeSlot) : null);
    this.snapshot = { ...this.colors };
    this.isOpen = true;
    this.root.classList.remove('hidden');
    this.refresh();
    this.drag.clamp();
    if (this.popover) this.popover.place();
    this.setStatus('');
    this.focusTrap.activate(this.anchor);
    const activeTab = this.refs.tabs[this.slotIds.indexOf(this.activeSlot)];
    /* No tablist on one slot: the SV area is the primary control. */
    (activeTab || this.refs.sv).focus();
    if (this.swatches) this.swatches.sync(true);
    this.emit('onOpen');
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.anchor = null;
    this.root.classList.add('hidden');
    this.focusTrap.deactivate();
    if (this.swatches) this.swatches.sync(false);
    this.emit('onClose');
  }

  /**
   * The one dismiss path for the shell. A popover commits on the way out —
   * every edit is painted live and there is no OK/Cancel to undo it — while a
   * modal restores the snapshot it opened with.
   */
  dismiss() {
    if (this.mode === 'popover') this.close();
    else this.cancel();
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
    unbindShell(this);
    this.focusTrap.deactivate();
    this.drag.destroy();
    if (this.popover) this.popover.destroy();
    if (this.swatches) this.swatches.destroy();
    for (const part of [this.copy, this.suggestions, this.panel, this.editor]) part.destroy();
    this.root.remove();
    this.isOpen = false;
  }
}

export { ColorPicker };
