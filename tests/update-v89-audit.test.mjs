import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MEDIA,mergeMedia} from '../scripts/update-data.mjs';
import {readHistorical} from './historical-fixture.mjs';

const read=name=>JSON.parse(fs.readFileSync(new URL('../'+name,import.meta.url)));
const original=read('public/market-panel.json');
const before=structuredClone(original);
const baseline=read('tests/fixtures/idc-march-baseline.json'),backfill=readHistorical('public/idc-march-backfill.json');
const historical=readHistorical('public/market-panel.json'),latest=read('data/latest-update.json');
assert.equal(baseline.media_summary.total_documents,25268,'The audited v89/v90 historical denominator is unchanged');
assert.deepEqual(baseline.expansion_assets,['/market-expansion.json','/market-expansion-2.json']);
assert.equal(original.media_summary.source_count,15);
assert.equal(backfill.added_rows,4,'The verified IDC March backfill remains four articles');
assert.equal(historical.media_summary.total_documents,25272,'The pinned v92 historical denominator is unchanged');
assert.equal(historical.media_summary.total_documents,baseline.media_summary.total_documents+backfill.added_rows,'Only receipted IDC backfill articles increase the v90 to v92 denominator');
assert.equal(original.media_summary.total_documents,25344,'The v93 current snapshot has 25,344 active media articles');
assert.equal(latest.media_added,72,'The current refresh adds 72 active media articles');
assert.equal(original.media_summary.total_documents,historical.media_summary.total_documents+latest.media_added,'The v93 denominator reconciles with the pinned v92 history and its update receipt');
assert.equal(original.media_summary.total_documents,latest.media_total,'The latest receipt matches the current snapshot');
assert.deepEqual(original.expansion_assets.slice(0,baseline.expansion_assets.length),baseline.expansion_assets,'Both historical expansion assets remain available');
const currentTotal=original.media_summary.total_documents;
// Replaying known public articles is an offline compatibility check, not a claim of a new scan.
const documents=original.documents.filter(row=>MEDIA.includes(row.source_id)&&row.url&&row.title&&Array.isArray(row.categories)&&Array.isArray(row.tags));
const fresh={cutoff:original.window.end,scanned_through:original.window.end,reread_start:original.window.start,checked_at:latest.checked_at,documents,sources:MEDIA.map(source_id=>({source_id,rows:documents.filter(row=>row.source_id===source_id).length,complete:true}))};
const updated=mergeMedia(original,fresh).panel;
assert.deepEqual(original,before,'The real snapshot remains untouched');
assert.deepEqual(updated.expansion_assets,original.expansion_assets);
assert.deepEqual(updated.media_summary.source_ids,original.media_summary.source_ids);
assert.equal(updated.media_summary.total_documents,currentTotal,'A no-new-news replay cannot resurrect audited non-news entries');
assert.deepEqual(updated.media_summary.monthly.map(c=>[c.month,c.total_documents,c.active_documents]),original.media_summary.monthly.map(c=>[c.month,c.total_documents,c.active_documents]));
const excluded=original.documents.filter(row=>MEDIA.includes(row.source_id)&&(row.is_article===false||row.exclusion_reason==='publisher_non_news_entry'));
assert.equal(excluded.length,31,'The current snapshot retains 31 explicitly excluded publisher entries');
const historicalExcluded=historical.documents.filter(row=>MEDIA.includes(row.source_id)&&(row.is_article===false||row.exclusion_reason==='publisher_non_news_entry'));
assert.equal(historicalExcluded.length,31,'The v92 historical snapshot retains all 31 v89 audited exclusions');
assert.deepEqual(excluded,historicalExcluded,'The current snapshot preserves every historical publisher exclusion');
const updatedById=new Map(updated.documents.map(row=>[row.id,row]));
for(const row of excluded){
 const retained=updatedById.get(row.id);
 assert.equal(retained.superseded,true,row.id);
 assert.equal(retained.is_article,false,row.id);
 assert.equal(retained.exclusion_reason,row.exclusion_reason,row.id);
 assert.deepEqual(retained.source_audit,row.source_audit,row.id);
}
for(const id of original.media_summary.source_ids.filter(id=>!MEDIA.includes(id)))assert.deepEqual(updated.sources.find(source=>source.id===id),original.sources.find(source=>source.id===id),'Retained source audit metadata is unchanged');
const parts=original.expansion_assets.map(asset=>read('public'+asset));
const combined=[...updated.documents,...parts.flatMap(part=>part.documents)];
assert.equal(combined.filter(row=>updated.media_summary.source_ids.includes(row.source_id)&&!row.superseded).length,currentTotal,'Every declared expansion asset contributes to the fifteen-source denominator');
const repeated=mergeMedia(updated,fresh).panel;
assert.deepEqual(repeated.documents,updated.documents,'A second replay is idempotent');
assert.equal(repeated.media_summary.total_documents,currentTotal);

// The collector must not override a previously audited exclusion when metadata changes.
const auditOnly={window:{start:'2026-10-01',end:'2026-10-10'},documents:[{id:'excluded',source_id:MEDIA[0],title:'Publisher event',date:'2026-10-02',month:'2026-10',categories:[],tags:[],is_article:false,exclusion_reason:'publisher_non_news_entry',superseded:true,source_audit:{batch:'verified-publisher-audit',reason:'Non-news event'},original_url:'https://example.org/original-event'}],sources:MEDIA.map(id=>({id,coverage:[{month:'2026-10',status:'complete',covered_through:'2026-10-10'}]}))};
const returned={...auditOnly.documents[0],title:'Updated publisher event',url:'https://example.org/event',superseded:false};
delete returned.is_article;delete returned.exclusion_reason;
const auditFresh={cutoff:'2026-10-10',scanned_through:'2026-10-10',reread_start:'2026-10-01',checked_at:fresh.checked_at,documents:[returned],sources:MEDIA.map(source_id=>({source_id,rows:source_id===MEDIA[0]?1:0,complete:true}))};
assert.equal(mergeMedia(auditOnly,auditFresh).panel.documents[0].superseded,true,'Metadata refresh does not undo explicit publisher-audit exclusions');
const conflicted={...returned,is_article:true,exclusion_reason:null,source_audit:{batch:'unreviewed-collector'},original_url:'https://example.org/replacement'};
const guarded=mergeMedia(auditOnly,{...auditFresh,documents:[conflicted]}).panel.documents[0];
assert.equal(guarded.superseded,true,'Conflicting incoming flags cannot reactivate an audited exclusion');
for(const field of ['is_article','exclusion_reason','source_audit','original_url'])assert.deepEqual(guarded[field],auditOnly.documents[0][field],`Preserve prior audit ${field}`);
console.log(`PASS: v89 audit baseline retained; no-new-news replay preserves ${currentTotal} active stories, 15 sources, ${parts.length} expansion assets and all 31 audited exclusions`);
