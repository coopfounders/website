import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Check the CSS actually linked by the built homepage, not unused chunks.
// A previous deployment combined the new page with the old shared stylesheet.
const buildDirectory = resolve(process.argv[2] ?? '.next');
const html = await readFile(
  resolve(buildDirectory, 'server/app/index.html'),
  'utf8',
);
const stylesheets = [...html.matchAll(/<link\b[^>]*>/g)]
  .map(([tag]) => tag)
  .filter((tag) => /\brel="stylesheet"/.test(tag))
  .map((tag) => tag.match(/\bhref="([^"]+)"/)?.[1]);

assert.ok(stylesheets.length, 'The built homepage has no stylesheets.');

const css = (
  await Promise.all(
    stylesheets.map((href) => {
      assert.ok(
        href?.startsWith('/_next/static/'),
        `Unexpected CSS URL: ${href}`,
      );
      const pathname = new URL(href, 'https://build.local').pathname;
      return readFile(
        resolve(buildDirectory, pathname.slice('/_next/'.length)),
        'utf8',
      );
    }),
  )
)
  .join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '');

const requiredProperties = [
  'brand-blue',
  'brand-blue-dark',
  'surface-blue',
  'blue-light',
  'blue-midtone',
  'font-body',
  'font-display',
  'font-manrope',
  'font-newsreader',
];
const requiredClasses = [
  'header-navigation',
  'header-contact',
  'menu-toggle',
  'frontier-hero',
  'contact-modal',
];
const missing = [
  ...requiredProperties
    .filter((name) => !new RegExp(`[{;]\\s*--${name}\\s*:[^;}]+`).test(css))
    .map((name) => `--${name}`),
  ...requiredClasses
    .filter((name) => !new RegExp(`\\.${name}(?=[\\s,{.:>\\[])`).test(css))
    .map((name) => `.${name}`),
];

assert.equal(
  missing.length,
  0,
  `Production CSS is incomplete (missing ${missing.join(', ')}). Rebuild without the build cache.`,
);
console.log(
  'Production CSS verified: shared palette, fonts, navigation, hero, and contact styles.',
);
