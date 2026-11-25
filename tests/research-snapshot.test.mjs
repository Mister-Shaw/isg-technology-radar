import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {prepareResearchSnapshot} from '../scripts/prepare-snapshot.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = 'data/research-2026.snapshot.json';
const manifest = JSON.parse(fs.readFileSync(path.join(repo, manifestPath)));

test('research snapshot restores the original bytes and retains subsequent local edits', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'isg-research-'));
  try {
    for (const file of [manifestPath, ...manifest.parts]) {
      fs.mkdirSync(path.dirname(path.join(dir, file)), {recursive: true});
      fs.copyFileSync(path.join(repo, file), path.join(dir, file));
    }
    const json = path.join(dir, 'data/research-2026.json');
    assert.equal(prepareResearchSnapshot(dir), 'ready');
    const restored = fs.readFileSync(json);
    assert.equal(createHash('sha256').update(restored).digest('hex'), manifest.sha256);
    const ledger = JSON.parse(restored);
    assert.equal(ledger.events.length + ledger.leads.length, manifest.records);
    assert.equal(ledger.as_of, manifest.as_of);
    assert.equal(prepareResearchSnapshot(dir), 'ready');
    fs.writeFileSync(json, '{"local":"edit"}');
    assert.equal(prepareResearchSnapshot(dir), 'preserved');
    assert.equal(fs.readFileSync(json, 'utf8'), '{"local":"edit"}');
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
});
