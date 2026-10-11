import fs from 'node:fs';
import assert from 'node:assert/strict';
import {sourcePanel} from '../data/sources.js';
import {normalizeSourceReceipt,canonicalSourceUrl} from '../lib/source-audit.js';
import {mergeMarketAssets} from '../lib/market-data.js';
import {compactBoardMatches,KEYWORD_RULE_VERSION} from '../lib/keyword-boards.js';
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,p.includes('market-panel')?0:2)+'\n');
const bundle=read(process.argv[2]),base=read('public/market-panel.json'),r=read('data/research-2026.json');
assert.equal(base.latest_refresh.batch_id,bundle.batch_id);
const p=mergeMarketAssets(base,base.expansion_assets.map(x=>read('public'+x)));
const prior=read('data/latest-update.json'),registry=new Map(sourcePanel.map(x=>[x.id,x]));
const alias={doit_all:'doit',c114_roll_all:'c114',zhiding_latest:'zhiding',cbinews_all_news:'cbinews',idcquan_expanded:'idcquan'};
const checked=new Map();
for(const input of [...(bundle.media_receipts||[]),...(bundle.research_receipts||[])]){
 const row=normalizeSourceReceipt({...input,verified_window_limits:input.verified_window_limits||((input.detail||'已读取所列来源入口。')+' 仅本轮入口、目录或所列指定原文，非完整历史覆盖。'),requested_window:input.requested_window||bundle.requested_window}),id=alias[row.source_id]||row.source_id;
 assert(registry.has(id),`Unregistered receipt ${id}`);assert(row.checked_at&&row.verified_window_limits,`Incomplete receipt ${id}`);
 checked.set(id,{name:registry.get(id).name,url:registry.get(id).url,...row,source_id:id,history_complete:false,partial_current_day:true});
}
const source_checks=sourcePanel.map(s=>checked.get(s.id)||prior.source_checks.find(x=>x.source_id===s.id));assert(source_checks.every(Boolean));
const mediaIds=base.sources.find(s=>s.id==='media_all').document_source_ids;
const added=p.documents.filter(x=>x.collection_batch===bundle.batch_id);
const researchAdded=[...r.events,...r.leads].filter(x=>x.collection_batch===bundle.batch_id);
const audit={schema_version:2,id:bundle.batch_id,checked_on:bundle.cutoff,checked_at:bundle.checked_at,requested_window:bundle.requested_window,full_coverage:false,coverage_statement:bundle.coverage_statement,summary:{registered_sources:sourcePanel.length,source_receipts:source_checks.length,historically_complete_sources:0,exclusion_candidates:0,sources_checked:source_checks.filter(x=>x.checked===true).length,sources_rechecked_this_batch:checked.size,new_media_records:added.length,new_research_records:researchAdded.length},source_checks,media_record_ids:added.map(x=>x.id),research_record_ids:researchAdded.map(x=>x.id),pending_candidates:bundle.pending_rechecks||[],supporting_facts:['逐源回执保留各自实际核查时间；本轮未读来源沿用旧回执，不算新核查。','共享数据库已只读核对；未覆盖共享笔记、修订或操作历史。','定时计划保持暂停；历史完整覆盖水位不推进。']};
write(`data/${bundle.batch_id}.json`,audit);
// Recompute current projections without editing keyword definitions or evidence fields.
for(const row of p.documents)assert.deepEqual(row.board_matches,compactBoardMatches(row,'news'),row.id);
for(const row of [...r.events,...r.leads])row.board_matches=compactBoardMatches(row,'research');
base.taxonomy.reclassified_at=bundle.cutoff;
write('public/market-panel.json',base);write('data/research-2026.json',r);
const review=read('public/taxonomy-review.json');Object.assign(review,{window:base.window,news_documents:p.documents.length,research_records:r.events.length+r.leads.length,audit_url:`/${bundle.batch_id}.json`,latest_source_audit_url:`/${bundle.batch_id}.json`,reclassified_at:bundle.cutoff});write('public/taxonomy-review.json',review);
const sample=read('public/sample-sources.json');sample.taxonomy=base.taxonomy;write('public/sample-sources.json',sample);
const links=read('data/news-event-links-current.json'),rows=[...r.events,...r.leads];
const freshResearchUrls=new Set(researchAdded.flatMap(x=>[x.url,...(x.corroborating_sources||[]).map(v=>typeof v==='string'?v:v.url)]).filter(Boolean).map(canonicalSourceUrl));
for(const doc of p.documents.filter(x=>x.collection_batch===bundle.batch_id||freshResearchUrls.has(canonicalSourceUrl(x.url)))){const url=canonicalSourceUrl(doc.url);const related=rows.filter(x=>[x.url,...(x.corroborating_sources||[]).map(v=>typeof v==='string'?v:v.url)].filter(Boolean).some(u=>canonicalSourceUrl(u)===url));if(related.length){const existing=links[doc.id]||[],known=new Set(existing.map(x=>x.id));links[doc.id]=[...existing,...related.filter(x=>!known.has(x.id)).map(x=>({id:x.id,title:x.title,stage:x.stage,url:x.url,relationship:'same_source_url'}))];}}
write('data/news-event-links-current.json',links);
console.log(JSON.stringify({batch:bundle.batch_id,media_added:added.length,active_media_added:added.filter(x=>!x.superseded).length,research_added:researchAdded.length,sources_rechecked:checked.size,total_media:p.documents.filter(x=>mediaIds.includes(x.source_id)&&!x.superseded).length,total_research:rows.length}));
