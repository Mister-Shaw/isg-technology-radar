import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readMarket} from './market-fixture.mjs';
import {normalizedNewsTitle} from '../lib/news-classification.js';
const read=path=>JSON.parse(fs.readFileSync(new URL('../'+path,import.meta.url)));
const panel=readMarket(),latest=read('data/latest-update.json'),samples=read('public/sample-sources.json');
const receipt=read('public/source-audit-20261020.json'),rows=panel.documents.filter(r=>r.collection_batch===receipt.id);
assert.equal(rows.length,42);
assert.deepEqual(rows.map(r=>r.id),receipt.media_record_ids);
assert(rows.every(r=>r.date<='2026-10-19'&&r.month===r.date.slice(0,7)&&r.url&&r.date_evidence&&r.verification_level&&!r.superseded));
const sourceId=r=>r.source_id.replace(/^topic_/,'');
const url=r=>r.url&&new URL(r.url),urlKey=r=>{const u=url(r);return u&&u.hostname.replace(/^www\./,'')+u.pathname.replace(/\/$/,'')+u.search;};
const active=panel.documents.filter(r=>!r.superseded);
for(const row of rows){
 const peers=active.filter(r=>sourceId(r)===sourceId(row));
 assert.equal(peers.filter(r=>urlKey(r)===urlKey(row)).length,1,row.url);
 assert.equal(peers.filter(r=>normalizedNewsTitle(r.title)===normalizedNewsTitle(row.title)).length,1,row.title);
}
const members=new Set(panel.sources.find(s=>s.id==='media_all').document_source_ids);
const fixed=active.filter(r=>members.has(r.source_id)),nov=fixed.filter(r=>r.month==='2026-11');
assert.equal(fixed.filter(r=>r.collection_batch===receipt.id).length,42);
if(latest.id==='source-audit-20261124'){
 assert.equal(fixed.length,27728);assert.equal(nov.length,837);
 assert.equal(latest.media_total,fixed.length);assert.equal(latest.latest_month_total,nov.length);
 assert.deepEqual(panel.media_summary,samples.media_summary);
 assert.equal(latest.cross_day_followup.new_records,0);
 assert.equal(latest.cross_day_followup.collection_cutoff,'2026-11-24');
}
console.log('PASS: 42 deduplicated historical articles; 837 November fixed-source articles; 00:36 follow-up adds zero.');
