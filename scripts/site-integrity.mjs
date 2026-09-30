import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const site = path.join(root, 'dist');
const manifestPath = path.join(root, 'site-integrity.json');

async function inventory(directory = site, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await inventory(absolute, relative));
    else if (entry.isFile()) {
      const bytes = await readFile(absolute);
      files.push({ path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
    } else throw new Error(`Tipo de arquivo não suportado: ${relative}`);
  }
  return files.sort((a, b) => a.path.localeCompare(b.path, 'en'));
}

const actual = await inventory();
if (process.argv.includes('--update')) {
  const manifest = { schema: 1, directory: 'dist', files: actual };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Manifesto atualizado: ${actual.length} arquivos; ${actual.reduce((sum, file) => sum + file.bytes, 0)} bytes.`);
} else {
  const expected = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (expected.schema !== 1 || expected.directory !== 'dist' || !Array.isArray(expected.files)) {
    throw new Error('Manifesto inválido.');
  }
  const expectedMap = new Map(expected.files.map(file => [file.path, file]));
  const actualMap = new Map(actual.map(file => [file.path, file]));
  const errors = [];
  for (const [relative, file] of expectedMap) {
    const current = actualMap.get(relative);
    if (!current) errors.push(`Ausente: ${relative}`);
    else if (current.bytes !== file.bytes || current.sha256 !== file.sha256) errors.push(`Alterado: ${relative}`);
  }
  for (const relative of actualMap.keys()) if (!expectedMap.has(relative)) errors.push(`Não registrado: ${relative}`);
  if (errors.length) throw new Error(`Falha de integridade:\n${errors.join('\n')}`);
  console.log(`Integridade confirmada: ${actual.length} arquivos; imagens e vídeos preservados integralmente.`);
}
