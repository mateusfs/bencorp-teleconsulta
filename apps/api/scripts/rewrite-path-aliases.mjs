import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(__dirname, '..');
const distDir = path.join(apiRoot, 'dist');
const aliasPrefix = '@/';

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
      continue;
    }
    if (/\.js$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function toRelativeImport(fromFile, absoluteTargetWithoutExt) {
  let rel = path.relative(path.dirname(fromFile), absoluteTargetWithoutExt);
  rel = rel.split(path.sep).join('/');
  if (!rel.startsWith('.')) {
    rel = `./${rel}`;
  }
  return rel;
}

function rewriteContent(filePath, content) {
  return content.replace(
    /((?:from|require)\s*\(?\s*)(['"])@\/([^'"]+)\2/g,
    (_match, prefix, quote, importPath) => {
      const target = path.join(distDir, importPath);
      const relative = toRelativeImport(filePath, target);
      return `${prefix}${quote}${relative}${quote}`;
    },
  );
}

if (!fs.existsSync(distDir)) {
  console.error(`dist not found at ${distDir}`);
  process.exit(1);
}

let changed = 0;
for (const file of walk(distDir)) {
  const before = fs.readFileSync(file, 'utf8');
  if (!before.includes(aliasPrefix)) {
    continue;
  }
  const after = rewriteContent(file, before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed += 1;
  }
}

console.log(`rewrite-path-aliases: updated ${changed} file(s)`);
