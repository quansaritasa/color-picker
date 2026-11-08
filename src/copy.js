/**
 * Copy the active slot's HEX to the clipboard. Reads through `getValue` and
 * never writes state; the confirmation lives on the button itself, because the
 * status region is screen-reader only and a silent copy would look like a dead
 * click.
 */

const FEEDBACK_MS = 1200;
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Two offset squares, drawn rather than typed: a glyph renders differently per OS. */
function copyIcon() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [name, value] of Object.entries({
    viewBox: '0 0 16 16', width: '14', height: '14', 'aria-hidden': 'true',
    fill: 'none', stroke: 'currentColor', 'stroke-width': '1.4', 'stroke-linejoin': 'round',
  })) svg.setAttribute(name, value);
  const front = document.createElementNS(SVG_NS, 'rect');
  for (const [name, value] of Object.entries({ x: '5.6', y: '5.6', width: '8', height: '8', rx: '1.7' })) {
    front.setAttribute(name, value);
  }
  const back = document.createElementNS(SVG_NS, 'path');
  back.setAttribute('d', 'M10.4 2.6H4.3a1.7 1.7 0 0 0-1.7 1.7v6.1');
  svg.append(front, back);
  return svg;
}

/** The button is built empty by the template; its two glyphs belong to this feature. */
function paintButton(button) {
  const done = document.createElement('span');
  done.className = 'cp-copy-done';
  done.textContent = '✓';
  done.setAttribute('aria-hidden', 'true');
  button.replaceChildren(copyIcon(), done);
}

/** Clipboard API where it exists (HTTPS/localhost), selection path otherwise. */
async function writeClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    /* denied permission or an insecure origin: fall through to the field path */
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.top = '-1000px';
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (error) {
    ok = false;
  }
  area.remove();
  return ok;
}

export function createCopy({ button, getValue, onStatus, label = 'Copy HEX' }) {
  let timer = null;
  paintButton(button);

  const reset = () => {
    button.dataset.copied = 'false';
    button.setAttribute('aria-label', label);
  };

  async function onClick() {
    const value = getValue();
    if (!value) return;
    const ok = await writeClipboard(value);
    if (onStatus) {
      onStatus(ok ? `Copied ${value}.` : `Copy failed — select ${value} and copy it.`);
    }
    if (!ok) return;
    button.dataset.copied = 'true';
    button.setAttribute('aria-label', `Copied ${value}`);
    if (timer) clearTimeout(timer);
    timer = setTimeout(reset, FEEDBACK_MS);
  }

  button.addEventListener('click', onClick);

  return {
    destroy() {
      if (timer) clearTimeout(timer);
      button.removeEventListener('click', onClick);
    },
  };
}
