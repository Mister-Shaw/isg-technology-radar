import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {mergeMarketAssets} from '../lib/market-data.js';

// Exact-count regressions use the verified Site snapshot even in Git-free ZIPs.
export const VERIFIED_V92='81b9c61b6eff247c61e250305695fc004cb94f37';
const root=new URL('./fixtures/historical-v92/',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root)));
assert.equal(manifest.schema_version,1,'Supported historical fixture manifest');
assert.equal(manifest.baseline_site_commit,VERIFIED_V92,'Pinned historical Site commit');
const verified=new Map();
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export function readHistorical(path,sha=VERIFIED_V92){
 assert.equal(sha,VERIFIED_V92,'Only the bundled verified v92 history is available');
 assert(Object.hasOwn(manifest.files,path),`Historical fixture was not captured: ${path}`);
 if(!verified.has(path)){
  const entry=manifest.files[path];
  assert.equal(entry.fixture,path+'.gz','Historical fixture path matches its manifest key');
  const compressed=fs.readFileSync(new URL(entry.fixture,root));
  assert.equal(compressed.length,entry.gzip_bytes,`Historical gzip size: ${path}`);
  assert.equal(sha256(compressed),entry.gzip_sha256,`Historical gzip hash: ${path}`);
  const bytes=gunzipSync(compressed);
  assert.equal(bytes.length,entry.bytes,`Historical source size: ${path}`);
  assert.equal(sha256(bytes),entry.sha256,`Historical source hash: ${path}`);
  const blob=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  assert.equal(blob,entry.git_blob,`Historical Git blob: ${path}`);
  verified.set(path,bytes.toString('utf8'));
 }
 // Each caller receives a fresh value, as with the original git-show helper.
 return JSON.parse(verified.get(path));
}
export function readHistoricalMarket(){
 const panel=readHistorical('public/market-panel.json');
 return mergeMarketAssets(panel,panel.expansion_assets.map(path=>readHistorical('public'+path)));
}
