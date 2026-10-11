import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readMarket} from './market-fixture.mjs';
import {readHistorical,readHistoricalMarket} from './historical-fixture.mjs';
import {normalizedNewsTitle} from '../lib/news-classification.js';
import {compactBoardMatches} from '../lib/keyword-boards.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const p=readMarket(),before=readHistoricalMarket(),r=read('data/research-2026.json'),old=readHistorical('data/research-2026.json'),latest=read('data/latest-update.json');
test('rolling refresh retains historical articles, evidence, IDs, and classifications',()=>{
 const byId=new Map(p.documents.map(x=>[x.id,x]));
 for(const x of before.documents)assert.deepEqual(byId.get(x.id),x,x.id);
 assert.equal(byId.size,p.documents.length);
 const rows=new Map([...r.events,...r.leads].map(x=>[x.id,x]));
 for(const x of [...old.events,...old.leads])assert(rows.has(x.id),x.id);
 assert.deepEqual(r.monthly_notes,old.monthly_notes,'Shared notes are overlaid at runtime; snapshot notes are retained');
 assert.deepEqual(p.taxonomy.boards,before.taxonomy.boards,'No keyword or alias changes');
});
test('current rolling totals reconcile across all media shards and coverage',()=>{
 const ids=p.sources.find(x=>x.id==='media_all').document_source_ids;
 const rows=p.documents.filter(x=>ids.includes(x.source_id)&&!x.superseded);
 assert.equal(latest.media_total,rows.length);assert.equal(p.media_summary.total_documents,rows.length);
 assert.equal(latest.research_total,r.events.length+r.leads.length);
 assert.equal(latest.latest_month_total,rows.filter(x=>x.month===latest.latest_month).length);
 for(const x of p.documents.filter(x=>x.collection_batch===latest.id)){assert.equal(x.classification_basis,'title_only');assert.deepEqual(x.board_matches,compactBoardMatches(x,'news'));assert(x.date<=p.window.end);}
 for(const asset of ['public/market-panel.json',...p.expansion_assets.map(x=>'public'+x)])assert(fs.statSync(asset).size<25*1024*1024,asset);
 const s=p.sources.find(x=>x.id==='idcquan_expanded');assert.equal(s.coverage.find(x=>x.month==='2026-03').eligible,4);assert.equal(s.coverage.find(x=>x.month==='2026-03').status,'incomplete');
 const monitor=read('data/weekly-monitor.json');assert.equal(monitor.enabled,false);assert.equal(monitor.paused_by_user,true);assert.equal(monitor.last_completed_cutoff,'2026-09-20');
});

test('new media cannot repeat an existing URL across shards; title duplicates stay superseded',()=>{
 const oldUrls=new Set(before.documents.map(x=>x.source_id+'|'+x.url));
 const oldTitles=new Set(before.documents.filter(x=>!x.superseded).map(x=>x.source_id+'|'+normalizedNewsTitle(x.title)));
 const oldIds=new Set(before.documents.map(x=>x.id));
 for(const row of p.documents.filter(x=>!oldIds.has(x.id))){assert(!oldUrls.has(row.source_id+'|'+row.url),row.id);if(oldTitles.has(row.source_id+'|'+normalizedNewsTitle(row.title)))assert(row.superseded&&row.duplicate_of,row.id);}
});
