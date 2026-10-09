import fs from 'node:fs';import assert from 'node:assert/strict';
import {classifyNewsTitle} from '../lib/news-classification.js';
import {panelMatrix} from '../lib/panel.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const d=read('public/market-panel.json'),a=read('public/aidc-label-audit-20261008.json');
assert.equal(a.added_label_count,24);assert.equal(new Set(a.records.map(r=>r.id)).size,24);
assert.equal(a.verification_summary.accepted,24);
for(const row of a.records){const r=d.documents.find(x=>x.id===row.id);assert(r&&!r.superseded);assert(r.categories.includes('aidc'));assert(classifyNewsTitle(r.title,d.news_classification_rules).categories.includes('aidc'));}
d.documents=d.documents.filter(r=>r.collection_batch!=='three-boards-20261008');
const s=d.sources.find(s=>s.id==='media_all'),docs=d.documents.filter(r=>s.document_source_ids.includes(r.source_id)&&!r.superseded);
assert.equal(docs.length,22747);
assert.deepEqual(panelMatrix(d,s,'attention','quarter','all',{aidc:'AIDC'})[0].points.map(p=>[p.n,p.N]),[[13,5457],[36,6304],[123,10726],[5,260]]);
assert.equal(d.documents.find(r=>r.id==='c114-1312848').aidc_classification_review.original_body_unavailable,true);
assert.equal(d.documents.find(r=>r.id==='doit-809849036763205').date,'2026-03-04');
assert.equal(d.documents.find(r=>r.id==='doit-809849036763205').aidc_classification_review.publisher_page_date,'2026-03-03');
assert.equal(read('data/weekly-monitor.json').enabled,false);
console.log('PASS: 24 reverified AIDC additions, title-only limitations, date discrepancy, fixed denominators and corrected quarter counts');
