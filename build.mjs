/**
 * Bundle src/ into dist/: an ESM build, its minified twin, a minified IIFE
 * that sets `window.ColorPicker` for plain <script> tags, and minified CSS.
 */

import { build } from 'esbuild';

const js = { entryPoints: ['src/color-picker.js'], bundle: true, sourcemap: true, logLevel: 'info' };

await Promise.all([
  build({ ...js, format: 'esm', outfile: 'dist/color-picker.esm.js' }),
  build({ ...js, format: 'esm', minify: true, outfile: 'dist/color-picker.esm.min.js' }),
  // globalName receives the module namespace; unwrap it so the global is the class itself.
  build({ ...js, format: 'iife', minify: true, globalName: 'ColorPicker',
    footer: { js: 'ColorPicker=ColorPicker.default;' }, outfile: 'dist/color-picker.min.js' }),
  build({ entryPoints: ['color-picker.css'], minify: true, logLevel: 'info', outfile: 'dist/color-picker.min.css' }),
]);
