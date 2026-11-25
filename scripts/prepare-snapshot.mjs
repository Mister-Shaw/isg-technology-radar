import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {createHash, randomUUID} from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const blobHash = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');

function replaceFile(target, data) {
  fs.mkdirSync(path.dirname(target), {recursive: true});
  const temp = `${target}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temp, data);
    fs.renameSync(temp, target);
  } finally {
    fs.rmSync(temp, {force: true});
  }
}

function materialize(dir, name, targetPath, markerPath, label) {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, `data/${name}.snapshot.json`), 'utf8'));
  const target = path.join(dir, targetPath);
  const marker = path.join(dir, '.cache', markerPath);
  let previous;
  try {
    previous = JSON.parse(fs.readFileSync(marker, 'utf8')).sha256;
  } catch (error) {
    if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
  }
  const existing = fs.existsSync(target) ? fs.readFileSync(target) : null;
  const digest = existing && sha256(existing);
  if (existing && digest !== manifest.sha256 && digest !== previous && blobHash(existing) !== manifest.previous_git_blob) {
    console.log(`保留本地已更新的${label}。`);
    return 'preserved';
  }
  if (digest !== manifest.sha256) {
    const parts = manifest.parts ?? [`data/${name}.snapshot.json.gz`];
    const packed = Buffer.concat(parts.map(file => fs.readFileSync(path.join(dir, file))));
    let data = gunzipSync(packed);
    if (manifest.field_overrides) {
      if (sha256(data) !== manifest.base_sha256) throw Error(`${label}基础快照校验失败`);
      const merged = Object.assign(JSON.parse(data), manifest.field_overrides);
      data = Buffer.from(JSON.stringify(merged) + '\n');
    }
    if (sha256(data) !== manifest.sha256) throw Error(`${label}完整性校验失败`);
    JSON.parse(data.toString('utf8'));
    replaceFile(target, data);
  }
  replaceFile(marker, JSON.stringify({sha256: manifest.sha256}) + '\n');
  return 'ready';
}

export function prepareSnapshot(dir = root) {
  return materialize(dir, 'market-panel', 'public/market-panel.json', 'market-snapshot.json', '市场样本');
}

export function prepareResearchSnapshot(dir = root) {
  return materialize(dir, 'research-2026', 'data/research-2026.json', 'research-snapshot.json', '研究底稿');
}

export function prepareMediaExpansion(dir = root) {
  return materialize(dir, 'market-expansion-3', 'public/market-expansion-3.json', 'media-expansion-3.json', '第三媒体分卷');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prepareSnapshot();
  prepareMediaExpansion();
  prepareResearchSnapshot();
}
