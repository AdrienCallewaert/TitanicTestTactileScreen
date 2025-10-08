const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET_DIRS = [
  path.join(ROOT, 'Assets', 'Data'),
];

const LANG_KEYS = ['fr', 'en', 'da', 'de', 'it', 'pt'];

function isLangObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  let count = 0;
  for (const key of LANG_KEYS) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) count += 1;
  }
  return count >= 2;
}

function addDutchRec(value) {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach(addDutchRec);
    return;
  }
  if (typeof value !== 'object') return;

  if (isLangObject(value) && !('nl' in value)) {
    const fallback = value.en || value.fr || value.de || value.da || value.it || value.pt;
    if (fallback) {
      value.nl = fallback;
    }
  }

  for (const key of Object.keys(value)) {
    addDutchRec(value[key]);
  }
}

function processFile(filePath) {
  let json;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    json = JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️ Skip ${filePath}: unable to parse JSON`);
    return;
  }
  addDutchRec(json);
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      walk(path.join(dir, entry.name));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      processFile(path.join(dir, entry.name));
    }
  }
}

for (const dir of TARGET_DIRS) {
  walk(dir);
}
