import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const result = await build({
  absWorkingDir: root,
  entryPoints: ['src/handler.ts'],
  outfile: 'handler.js',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  metafile: true,
  preserveSymlinks: true,
  minify: true,
  legalComments: 'eof',
});
const packages = new Map();
for (const input of Object.keys(result.metafile.inputs)) {
  if (!input.includes('node_modules')) continue;
  let directory = dirname(resolve(root, input));
  while (directory !== dirname(directory)) {
    try {
      const pkg = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
      if (pkg.name) {
        packages.set(pkg.name, { directory, pkg });
        break;
      }
    } catch {}
    directory = dirname(directory);
  }
}
const notices = [];
for (const [name, { directory, pkg }] of [...packages].sort()) {
  let license;
  for (const file of [
    'LICENSE',
    'LICENSE.md',
    'LICENSE.txt',
    'license',
    'license.md',
    'LICENSE-MIT',
  ]) {
    try {
      license = await readFile(join(directory, file), 'utf8');
      break;
    } catch {}
  }
  if (!license) throw new Error(`Missing bundled dependency license: ${name}`);
  notices.push(`${name} ${pkg.version}\n${license}`);
}
await writeFile(join(root, 'THIRD_PARTY_LICENSES.txt'), notices.join('\n\n----------------\n\n'));
