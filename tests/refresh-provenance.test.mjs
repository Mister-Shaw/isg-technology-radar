import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p));
const research=read('data/research-2026.json'),rows=[...research.events,...research.leads];
test('October 14 refresh distinguishes actual source reads from import time',()=>{
 const fresh=rows.filter(x=>x.collection_batch==='source-audit-20261014');assert.equal(fresh.length,21);
 for(const row of fresh){assert.equal(row.checked_at,row.source_read_at,row.id);assert(row.imported_at);assert(Date.parse(row.checked_at)<=Date.parse(row.imported_at));}
});
test('bilingual CPO news remains in denominator and links the same research event',()=>{
 const panel=read('public/market-panel.json'),links=read('data/news-event-links-current.json');
 const news=panel.documents.find(x=>x.id==='trendforce-refresh-50d344184b7d42b1'),event=rows.find(x=>x.id==='refresh-trendforce-cpo-test-platforms-20261013');
 assert(news&&!news.superseded);assert.equal(news.classification_basis,'title_only');
 assert(event.corroborating_sources.some(x=>x.url===news.url));
 assert(links[news.id].some(x=>x.id===event.id&&x.relationship==='same_publisher_language_version'));
});
