import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {classifyNewsTitle,normalizedNewsTitle} from '../lib/news-classification.js';
import {compactBoardMatches,KEYWORD_RULE_VERSION} from '../lib/keyword-boards.js';
import {observationCategories} from '../lib/hierarchy.js';
import {validDate} from '../lib/model.js';
const input=process.argv[2];assert(input,'Pass reviewed refresh input JSON');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const root=new URL('../',import.meta.url),readSite=p=>read(new URL(p,root));
const write=(p,x)=>fs.writeFileSync(new URL(p,root),JSON.stringify(x,null,p==='public/market-panel.json'?0:2)+'\n');
const bundle=read(input),{batch_id:batch,cutoff:end,checked_at:now}=bundle;
assert(batch&&validDate(end)&&Number.isFinite(Date.parse(now)));
const p=readSite('public/market-panel.json'),r=readSite('data/research-2026.json');
assert(p.latest_refresh?.batch_id!==batch,'Already merged batch');
assert(end>=p.window.end,'Cannot roll window backward');
const ids=new Set(p.documents.map(x=>x.id)),urls=new Set(p.documents.map(x=>x.source_id+'|'+x.url));
const media=p.sources.find(s=>s.id==='media_all').document_source_ids;
const titles=new Map(p.documents.filter(x=>!x.superseded).map(x=>[x.source_id+'|'+normalizedNewsTitle(x.title),x.id]));
const added=[],skipped=[];
const action=/(?:中标|采购|招标|租用|租赁|投运|投产|上线|部署|扩容|验收|启用|交付)/i,prospective=/(?:计划|拟|将|预计|有望|如何|推动|助力|支持|方案|攻略|趋势|需求)/,real=/(?:已|正式|完成|成功|中标|招标公告|采购公告|结果公告|验收)/;
for(const raw of bundle.media_candidates||[]){
 assert(media.includes(raw.source_id)&&validDate(raw.date)&&raw.date<=end&&raw.date>=p.window.start);
 assert(/^https?:\/\//.test(raw.url)&&raw.title&&raw.is_article!==false);
 const id=raw.id||`refresh-${crypto.createHash('sha256').update(raw.source_id+'|'+raw.url).digest('hex').slice(0,16)}`;
 if(ids.has(id)||urls.has(raw.source_id+'|'+raw.url)){skipped.push(id);continue;}
 const key=raw.source_id+'|'+normalizedNewsTitle(raw.title),duplicate=titles.get(key)||null;
 const row={...raw,id,...classifyNewsTitle(raw.title,p.news_classification_rules),month:raw.date.slice(0,7),is_article:true,superseded:!!duplicate,duplicate_of:duplicate,eligible_categories:[],required_categories:[],unknown_categories:[],context_class:'other',classification_basis:'title_only',collection_batch:batch,collected_at:now};
 row.observation_categories=observationCategories(row,'news');row.board_matches=compactBoardMatches(row,'news');row.keyword_rule_version=KEYWORD_RULE_VERSION;
 row.keyword_context_class=action.test(row.title)&&(!prospective.test(row.title)||real.test(row.title))?'application':'other';row.keyword_behavior_basis='统一标题行为词识别，不核定实际采用';
 p.documents.push(row);ids.add(id);urls.add(row.source_id+'|'+row.url);if(!duplicate)titles.set(key,id);added.push(id);
}
const researchIds=new Set([...r.events,...r.leads].map(x=>x.id));
const researchKeys=new Set([...r.events,...r.leads].filter(x=>x.event_key).map(x=>x.event_key+'|lot:'+(x.lot||'')));
const researchAdded=[],researchSkipped=[];
for(const raw of bundle.research_candidates||[]){
 assert(raw.id&&raw.title&&/^https?:\/\//.test(raw.url));assert(validDate(raw.published_date)&&raw.published_date<=end);
 if(researchIds.has(raw.id)||(raw.event_key&&researchKeys.has(raw.event_key+'|lot:'+(raw.lot||'')))){researchSkipped.push(raw.id);continue;}
 assert(raw.amount_cny===null||Number.isFinite(raw.amount_cny));assert(raw.amount_currency==='CNY'||raw.amount_cny===null||raw.amount_normalization?.fx_basis);
 const row={...raw,collection_batch:batch,retrieved_on:end,checked_at:now,keyword_rule_version:KEYWORD_RULE_VERSION};
 row.board_matches=compactBoardMatches(row,'research');
 const target=row.refresh_disposition==='event'?'events':'leads';delete row.refresh_disposition;
 if(target==='events')assert(row.verified_fulltext===true&&['primary','verified'].includes(row.evidence_status),'Events require verified primary evidence');
 r[target].push(row);researchAdded.push(row.id);researchIds.add(row.id);if(row.event_key)researchKeys.add(row.event_key+'|lot:'+(row.lot||''));
}
p.refresh_history??=[];if(p.latest_refresh)p.refresh_history.push(p.latest_refresh);
p.window.end=end;p.collected_at=now;
const active=p.documents.filter(x=>media.includes(x.source_id)&&!x.superseded);
p.latest_refresh={batch_id:batch,checked_at:now,requested_cutoff:end,added_rows:added.length,added_ids:added,unique_media_news:active.length,active_added_rows:p.documents.filter(x=>added.includes(x.id)&&!x.superseded).length,skipped_existing:skipped.length};
for(const s of p.sources){
 const sourceIds=s.document_source_ids||[s.document_source_id||s.id];if(!sourceIds.some(id=>media.includes(id)))continue;
 const month=end.slice(0,7),rows=p.documents.filter(x=>sourceIds.includes(x.source_id)&&x.month===month);
 s.coverage??=[];let c=s.coverage.find(c=>c.month===month);if(!c){c={month};s.coverage.push(c);}
 const previous={...c};delete previous.previous_snapshots;c.previous_snapshots=[...(c.previous_snapshots||[]),previous];
 for(const key of Object.keys(c))if(!['month','previous_snapshots'].includes(key))delete c[key];
 Object.assign(c,{total:rows.length,eligible:rows.filter(x=>!x.superseded).length,status:'incomplete',partial_current_day:true,partial_calendar_month:true});
 const receipts=(bundle.media_receipts||[]).filter(x=>sourceIds.includes(x.archive_source_id||x.source_id));
 if(receipts.length){s.last_rechecked_at=now;s.latest_access_note=receipts.map(x=>x.detail||x.status).join('；');c.checked_at=now;c.latest_refresh_window=bundle.requested_window;c.audit_recheck_complete=false;c.audit_recheck_status='bounded_recent_snapshot';c.note='本轮仅更新10月8日起重叠窗口至10月10日采集时点；历史收录保留，不表示全年或整月完整覆盖。';}
}
r.refresh_history??=[];if(r.latest_refresh)r.refresh_history.push(r.latest_refresh);
r.period_end=end;r.as_of=end;r.latest_refresh={batch_id:batch,checked_at:now,added_records:researchAdded.length,added_ids:researchAdded,skipped_existing:researchSkipped.length,restored_milestones:0};
write('public/market-panel.json',p);write('data/research-2026.json',r);
const samples=readSite('public/sample-sources.json');samples.window=p.window;samples.collected_at=now;samples.sources=p.sources.filter(s=>['media','official'].includes(s.group)&&!s.document_source_id);samples.latest_refresh=p.latest_refresh;write('public/sample-sources.json',samples);
const taxonomy=readSite('public/taxonomy-review.json');taxonomy.window=p.window;taxonomy.news_documents=p.documents.length;taxonomy.research_records=r.events.length+r.leads.length;taxonomy.audit_url=`/${batch}.json`;write('public/taxonomy-review.json',taxonomy);
console.log(JSON.stringify({batch_id:batch,media_added:added.length,active_media_added:p.latest_refresh.active_added_rows,media_total:active.length,research_added:researchAdded.length,research_total:r.events.length+r.leads.length,skipped_media:skipped.length,skipped_research:researchSkipped.length}));
