/**
 * HSV editor: one color driven by the SV area, hue, alpha and the HEX field.
 * Port of `reference/modern-color-picker.html:333-361`. HSV state lives here,
 * so re-rendering from a HEX value never shifts the hue of a gray.
 */

import { formatHex, hsvToRgb, parseHex, rgbToHsv } from './color.js';

const clamp01 = (n) => Math.min(1, Math.max(0, n));
const round = (n) => Math.min(255, Math.max(0, Math.round(n)));

export function createEditor(refs, { showAlpha = true, onChange, onStatus } = {}) {
  const state = { h: 174, s: 87, v: 46, a: 1 };
  let current = { r: 15, g: 118, b: 110, a: 1 };
  let dragging = false;

  const rgbaFromHsv = () => {
    const rgb = hsvToRgb(state.h, state.s, state.v);
    return { r: round(rgb.r), g: round(rgb.g), b: round(rgb.b), a: showAlpha ? clamp01(state.a) : 1 };
  };

  function render() {
    const rgb = hsvToRgb(state.h, state.s, state.v);
    const opaque = formatHex({ r: round(rgb.r), g: round(rgb.g), b: round(rgb.b), a: 1 });
    refs.sv.style.backgroundColor = `hsl(${state.h} 100% 50%)`;
    refs.svThumb.style.left = `${state.s}%`;
    refs.svThumb.style.top = `${100 - state.v}%`;
    refs.preview.style.background = `rgba(${round(rgb.r)}, ${round(rgb.g)}, ${round(rgb.b)}, ${state.a})`;
    if (document.activeElement !== refs.hex) refs.hex.value = formatHex(current);
    refs.hue.value = String(Math.round(state.h));
    refs.hueValue.textContent = `${Math.round(state.h)}°`;
    if (showAlpha) {
      refs.alpha.value = String(Math.round(state.a * 100));
      refs.alphaValue.textContent = `${Math.round(state.a * 100)}%`;
      refs.alpha.style.background =
        `linear-gradient(90deg, transparent, ${opaque}), ` +
        'repeating-conic-gradient(#d9dee7 0 25%, white 0 50%) 0/12px 12px';
    }
    refs.sv.setAttribute('aria-valuenow', String(Math.round(state.s)));
    refs.sv.setAttribute('aria-valuetext', formatHex(current));
  }

  function apply({ silent = false } = {}) {
    current = rgbaFromHsv();
    render();
    if (!silent && onChange) onChange({ ...current });
  }

  /** Push a color in without emitting: used when the class changes the active color. */
  function setColor(rgba, { silent = true } = {}) {
    if (!rgba) return;
    const hsv = rgbToHsv(rgba);
    if (hsv.v > 0) {
      if (hsv.s > 0.01) state.h = hsv.h;
      state.s = hsv.s;
    }
    state.v = hsv.v;
    // `showAlpha: false` means alpha is off, not merely hidden: an 8-digit HEX
    // typed into the field must not leave a translucent color behind.
    state.a = showAlpha && typeof rgba.a === 'number' ? clamp01(rgba.a) : 1;
    current = { r: round(rgba.r), g: round(rgba.g), b: round(rgba.b), a: state.a };
    render();
    if (!silent && onChange) onChange({ ...current });
  }

  const pointTo = (event) => {
    const rect = refs.sv.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    state.s = clamp01((event.clientX - rect.left) / rect.width) * 100;
    state.v = (1 - clamp01((event.clientY - rect.top) / rect.height)) * 100;
    apply();
  };

  const onPointerDown = (event) => {
    dragging = true;
    try {
      if (refs.sv.setPointerCapture) refs.sv.setPointerCapture(event.pointerId);
    } catch (error) {
      /* synthetic events have no active pointer */
    }
    pointTo(event);
    event.preventDefault();
  };
  const onPointerMove = (event) => {
    if (dragging) pointTo(event);
  };
  const onPointerUp = () => {
    dragging = false;
  };
  const onSvKey = (event) => {
    const step = event.shiftKey ? 10 : 1;
    const moves = {
      ArrowLeft: ['s', -step],
      ArrowRight: ['s', step],
      ArrowUp: ['v', step],
      ArrowDown: ['v', -step],
    };
    const move = moves[event.key];
    if (!move) return;
    state[move[0]] = Math.min(100, Math.max(0, state[move[0]] + move[1]));
    apply();
    event.preventDefault();
  };
  const onHue = (event) => {
    state.h = Number(event.target.value) || 0;
    apply();
  };
  const onAlpha = (event) => {
    state.a = (Number(event.target.value) || 0) / 100;
    apply();
  };
  const commitHex = (event) => {
    const parsed = parseHex(event.target.value);
    if (!parsed) {
      refs.hex.value = formatHex(current);
      if (onStatus) onStatus('Enter a valid HEX value.');
      return;
    }
    if (onStatus) onStatus('');
    setColor(parsed, { silent: false });
  };
  const onHexChange = (event) => commitHex(event);
  const onHexKey = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.target.blur();
    }
  };

  refs.sv.addEventListener('pointerdown', onPointerDown);
  refs.sv.addEventListener('pointermove', onPointerMove);
  refs.sv.addEventListener('pointerup', onPointerUp);
  refs.sv.addEventListener('pointercancel', onPointerUp);
  refs.sv.addEventListener('keydown', onSvKey);
  refs.hue.addEventListener('input', onHue);
  refs.alpha.addEventListener('input', onAlpha);
  refs.hex.addEventListener('change', onHexChange);
  refs.hex.addEventListener('keydown', onHexKey);

  render();

  return {
    setColor,
    getColor: () => ({ ...current }),
    destroy() {
      refs.sv.removeEventListener('pointerdown', onPointerDown);
      refs.sv.removeEventListener('pointermove', onPointerMove);
      refs.sv.removeEventListener('pointerup', onPointerUp);
      refs.sv.removeEventListener('pointercancel', onPointerUp);
      refs.sv.removeEventListener('keydown', onSvKey);
      refs.hue.removeEventListener('input', onHue);
      refs.alpha.removeEventListener('input', onAlpha);
      refs.hex.removeEventListener('change', onHexChange);
      refs.hex.removeEventListener('keydown', onHexKey);
    },
  };
}
