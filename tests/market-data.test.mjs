import assert from 'node:assert/strict';
import {mergeMarketAssets,loadMarketData} from '../lib/market-data.js';
import {buildSiteInformation} from '../lib/source-information.js';
const base={documents:[{id:'a'}],expansion_assets:['/market-expansion.json']};
assert.equal(mergeMarketAssets(base,[{documents:[{id:'b'}]}]).documents.length,2);
assert.equal(base.documents.length,1);
assert.throws(()=>mergeMarketAssets(base,[{documents:[{id:'a'}]}]));
const loaded=await loadMarketData(async url=>({ok:true,json:async()=>url==='/market-panel.json'?base:{documents:[{id:'b'}]}}));assert.equal(loaded.documents.length,2);
await assert.rejects(loadMarketData(async url=>({ok:url==='/market-panel.json',json:async()=>base})),/无法读取/);
await assert.rejects(loadMarketData(async()=>({ok:true,json:async()=>({...base,expansion_assets:['https://example.com/x.json']})})),/地址无效/);
console.log('PASS: expansion loader preserves original data, rejects duplicate IDs, unsafe URLs and missing assets');

const batchId='source-audit-20261124',checkedAt='2026-11-24T15:25:00Z';
const previous={documents:[],window:{start:'2026-01-01',end:'2026-10-19'},
 sources:[{id:'media_all',kind:'news',coverage:[],document_source_ids:['fixed']}],
 latest_refresh:{batch_id:'source-audit-20261019',expanded_added_rows:88,date_corrections:3}};
const update={batch_id:batchId,start:'2026-10-20',end:'2026-11-24',checked_at:checkedAt,new_sources:[]};
const additions=['publisher_archive','topic_search'].map((method,i)=>({id:String(i),source_id:i?'topic':'fixed',month:'2026-11',collection_batch:batchId,collection_method:method}));
additions.push({...additions[0],id:'republished',superseded:true,duplicate_of:additions[0].id});
const merged=mergeMarketAssets(previous,[{documents:additions,media_update:update}]);
const {latest}=buildSiteInformation({panel:merged,research:{events:[],leads:[],latest_refresh:{batch_id:batchId,added_records:0}},
 audits:[{id:batchId,checked_at:checkedAt}],registry:[],monitor:{}});
assert.equal(merged.latest_refresh.added_rows,3);
assert.equal(merged.latest_refresh.active_added_rows,2);
assert.equal(merged.sources[0].coverage.at(-1).total,2);
assert.equal(merged.sources[0].coverage.at(-1).eligible,1);
assert.equal(latest.media_added,1);
assert.equal(latest.media_archive_added,2);
assert.equal(latest.media_archive_active_added,1);
assert.equal(latest.media_topic_added,1);
assert.equal(latest.media_added_all_sources,3);
assert.equal(latest.media_active_added_all_sources,2);
assert.equal(latest.date_corrections,0);
