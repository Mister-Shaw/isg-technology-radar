import {readMarket} from './market-fixture.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compactBoardMatches} from '../lib/keyword-boards.js';
import {sourcePanel} from '../data/sources.js';
import {validateSourceAudit} from '../lib/source-audit.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const p=readMarket(),r=read('data/research-2026.json'),latest=read('data/latest-update.json'),a=read(`data/${latest.id}.json`);
const media=p.sources.find(s=>s.id==='media_all').document_source_ids;
assert.equal(p.window.end,'2026-10-10');assert.equal(r.period_end,'2026-10-10');
assert.equal(p.latest_refresh.batch_id,latest.id);assert.equal(r.latest_refresh.batch_id,latest.id);
assert.equal(new Set(p.documents.map(x=>x.id)).size,p.documents.length);
assert.equal(new Set([...r.events,...r.leads].map(x=>x.id)).size,r.events.length+r.leads.length);
const fresh=p.documents.filter(x=>x.collection_batch===p.latest_refresh.batch_id);
for(const x of fresh){assert(media.includes(x.source_id));assert(x.date<=p.window.end);assert.equal(x.month,x.date.slice(0,7));assert.equal(x.classification_basis,'title_only');assert.deepEqual(x.board_matches,compactBoardMatches(x,'news'));}
assert.equal(fresh.length,p.latest_refresh.added_rows+(p.latest_refresh.expanded_added_rows||0));
assert.equal(latest.media_total,p.documents.filter(x=>media.includes(x.source_id)&&!x.superseded).length);
assert.deepEqual(new Set(a.source_checks.map(s=>s.source_id)),new Set(sourcePanel.map(s=>s.id)));
assert.deepEqual(validateSourceAudit(a,[...r.events,...r.leads],sourcePanel.map(s=>s.id),{requireReady:true}),[]);
assert.equal(a.source_checks.length,sourcePanel.length);assert.equal(a.full_coverage,false);
assert(!JSON.stringify(read(`public/${latest.id}.json`)).includes('/workspace/'));
assert.deepEqual(read('data/report-monitor.json'),read('public/report-monitor.json'));
assert.equal(latest.id,a.id);assert.equal(latest.research_total,r.events.length+r.leads.length);
const m=read('data/weekly-monitor.json');assert.equal(m.enabled,false);assert.equal(m.paused_by_user,true);assert.equal(m.last_completed_cutoff,'2026-09-20');
const css=fs.readFileSync(new URL('../app/compact.css',import.meta.url),'utf8'),jsx=fs.readFileSync(new URL('../app/workspace.jsx',import.meta.url),'utf8');
assert(css.includes('justify-content:space-between;align-items:center;width:100%;margin:2px 0 22px'));
assert(css.includes('width:calc(100% - 22px);max-width:138px'));
assert(jsx.includes('alt="Lenovo"/><p className="nav-caption"'));
assert(jsx.includes('aria-label="中国服务器市场动向监测"'));assert(!jsx.includes('className="brand-symbol"'));assert(!jsx.includes('ISG China'));
console.log('PASS: Oct10 manual refresh counts, source receipts, projection, paused schedule and aligned header caption');

assert(fs.readFileSync('app/compact.css','utf8').includes('.brand.lenovo-only .lenovo-wordmark{border-radius:6px}'));

assert(fs.readFileSync('app/compact.css','utf8').includes('.sidebar .brand.lenovo-only .nav-caption{width:calc(100% - 8px);margin-inline:4px}'));
