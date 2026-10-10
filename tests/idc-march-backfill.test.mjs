import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {readMarket} from './market-fixture.mjs';
import {panelMatrix} from '../lib/panel.js';
import {definitionsForRows,compactBoardMatches} from '../lib/keyword-boards.js';
import {panelSampleLabel,presentPanelMatrix} from '../lib/panel-presentation.js';
const read=p=>JSON.parse(fs.readFileSync(p)),p=readMarket(),a=read('public/idc-march-backfill.json');
const batch=a.batch_id,added=p.documents.filter(r=>r.collection_batch===batch),source=p.sources.find(s=>s.id==='idcquan_expanded'),march=source.coverage.find(c=>c.month==='2026-03');
assert(added.length>0);assert.equal(added.length,a.added_rows);assert.equal(march.eligible,added.length);assert.equal(march.status,'incomplete');assert.equal(march.history_complete,false);
for(const r of added){assert(['cloud.idcquan.com','dc.idcquan.com'].includes(new URL(r.url).hostname));assert.equal(r.month,'2026-03');assert.equal(r.date_verified,true);assert.deepEqual(r.board_matches,compactBoardMatches(r,'news'));}
assert.equal(new Set(p.documents.map(r=>r.id)).size,p.documents.length);
// Captured from the pinned pre-backfill Site commit, not from the current snapshot.
// Hash every field, retaining array order; archives and shallow GitHub clones need no Site history.
const baseline=read(new URL('./fixtures/idc-march-baseline.json',import.meta.url));
assert.equal(baseline.baseline_site_commit,'2ce8902a26639509ad23012de850fd2b0bf2a434');
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const hash=value=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const previous=p.documents.filter(r=>r.collection_batch!==batch);
assert.equal(previous.length,baseline.documents.count);
assert.equal(hash(previous),baseline.documents.sha256,'All previous news and classifications preserved');
const research=read('data/research-2026.json');
assert.deepEqual(Object.keys(research).filter(k=>!['latest_refresh','refresh_history'].includes(k)).sort(),Object.keys(baseline.research_fields).sort());
for(const [key,sha256] of Object.entries(baseline.research_fields))assert.equal(hash(research[key]),sha256,`Unchanged research ${key}`);
for(const [id,sha256] of Object.entries(baseline.unaffected_sources)){const unchanged=p.sources.find(x=>x.id===id);assert(unchanged,`Retained source ${id}`);assert.equal(hash(unchanged),sha256,`Unchanged source ${id}`);}
for(const [month,sha256] of Object.entries(baseline.idc_non_march_coverage)){const unchanged=source.coverage.find(x=>x.month===month);assert(unchanged,`Retained IDC coverage ${month}`);assert.equal(hash(unchanged),sha256,`Unchanged IDC coverage ${month}`);}
for(const board of ['business','components','scenarios']){const raw=panelMatrix(p,source,'attention','month','all',definitionsForRows(board)),shown=presentPanelMatrix(raw,'news');for(let i=0;i<raw.length;i++){const cell=raw[i].points.find(x=>x.id==='2026-03'),view=shown[i].points.find(x=>x.id==='2026-03');assert.equal(cell.N,added.length);assert.equal(cell.value,null);assert.equal(cell.complete,false);assert.equal(view.value,1000*cell.n/cell.N);assert.equal(panelSampleLabel(view),`${cell.n}/${cell.N}`);}}
assert.equal(panelSampleLabel({n:0,N:0}),'暂无样本');assert.equal(panelSampleLabel({n:0,N:10}),'0/10');
assert.equal(p.media_summary.total_documents,baseline.media_summary.total_documents+added.length);
console.log(`PASS: ${added.length} verified March articles, all keyword cells and aggregates, no-sample semantics, prior news/research/source data preserved`);
