import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {classifyNewsTitle,normalizedNewsTitle} from '../lib/news-classification.js';
import {compactBoardMatches,KEYWORD_RULE_VERSION} from '../lib/keyword-boards.js';
import {observationCategories} from '../lib/hierarchy.js';
import {validDate,monthsInWindow} from '../lib/model.js';
const base=process.argv[2];assert(base,'Pass a verified audit directory');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const file=new URL('../public/market-panel.json',import.meta.url),p=read(file);
const batch='source-audit-20261009',now=new Date().toISOString(),end='2026-10-09';
assert(p.latest_refresh?.batch_id!==batch,'Audit already merged');
const scrub=v=>Array.isArray(v)?v.map(scrub):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([,x])=>!(typeof x==='string'&&/^\/(workspace|tmp|home)\//.test(x))).map(([k,x])=>[k,scrub(x)])):v;
const media=['doit_all','c114_roll_all','zhiding_latest','cbinews_all_news'];
const byId=new Map(p.documents.map(r=>[r.id,r])),before=p.documents.length;
const added=[],excluded=[],corrections=[];
const nonarticles=read(path.join(base,'nonarticle-exclusion-candidates.json'));
for(const x of nonarticles){const r=byId.get(x.id);if(!r)continue;excluded.push({id:r.id,was_active:!r.superseded,old_url:r.url,reason:x.reason});r.original_url??=r.url;r.url=x.corrected_url;r.is_article=false;r.superseded=true;r.exclusion_reason='publisher_non_news_entry';r.source_audit={batch,checked_at:now,reason:x.reason};}
const seen=new Map(p.documents.filter(r=>!r.superseded&&media.includes(r.source_id)).map(r=>[r.source_id+'|'+normalizedNewsTitle(r.title),r.id]));
const action=/(?:中标|采购|招标|租用|租赁|投运|投产|上线|部署|扩容|验收|启用|交付)/i,prospective=/(?:计划|拟|将|预计|有望|如何|推动|助力|支持|方案|攻略|趋势|需求)/,real=/(?:已|正式|完成|成功|中标|招标公告|采购公告|结果公告|验收)/;
for(const raw of read(path.join(base,'new-records.json'))){
 if(raw.is_article===false||nonarticles.some(x=>x.id===raw.id))continue;
 assert(!byId.has(raw.id),'Unexpected existing candidate '+raw.id);
 assert(media.includes(raw.source_id)&&validDate(raw.date)&&raw.date>=p.window.start&&raw.date<=end,'Invalid source/date '+raw.id);
 const key=raw.source_id+'|'+normalizedNewsTitle(raw.title),duplicate=seen.get(key)||null;
 const r={...scrub(raw),...classifyNewsTitle(raw.title,p.news_classification_rules),month:raw.date.slice(0,7),is_article:true,superseded:!!duplicate,duplicate_of:duplicate,eligible_categories:[],required_categories:[],unknown_categories:[],context_class:'other',classification_basis:'title_only',collection_batch:batch};
 r.observation_categories=observationCategories(r,'news');r.board_matches=compactBoardMatches(r,'news');r.keyword_rule_version=KEYWORD_RULE_VERSION;
 r.keyword_context_class=action.test(r.title)&&(!prospective.test(r.title)||real.test(r.title))?'application':'other';r.keyword_behavior_basis='统一标题行为词识别，不核定实际采用';
 if(!duplicate)seen.set(key,r.id);p.documents.push(r);byId.set(r.id,r);added.push(r.id);
}
const corrected=byId.get('doit-852474848862277');assert(corrected);
if(corrected.date!=='2026-09-30'){corrections.push({id:corrected.id,old_date:corrected.date,date:'2026-09-30',basis:'Original article time.entry-date: 2026-09-30 09:23:24'});corrected.original_date??=corrected.date;corrected.date='2026-09-30';corrected.month='2026-09';corrected.date_basis='original_article_time_entry_date_verified_20261009';}
p.window={...p.window,end};p.collected_at=now;
const coverage=read(path.join(base,'coverage.json')),months=monthsInWindow(p.window);
for(const s of p.sources.filter(s=>s.kind==='news')){
 const ids=s.document_source_ids||[s.document_source_id||s.id];if(!ids.some(id=>media.includes(id)))continue;
 s.coverage=months.map(month=>{
  const old=s.coverage.find(c=>c.month===month)||{},checks=ids.map(id=>coverage.find(c=>c.source_id===id&&c.month===month));
  const complete=checks.every(c=>c?.complete===true),docs=p.documents.filter(r=>ids.includes(r.source_id)&&r.month===month);
  return {...old,month,total:docs.length,eligible:docs.filter(r=>!r.superseded).length,status:month==='2026-10'?'incomplete':complete?'complete':old.status||'incomplete',checked_at:now,covered_start:month+'-01',covered_through:complete?[end,new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).toISOString().slice(0,10)].sort()[0]:old.covered_through||null,partial_current_day:month==='2026-10',partial_calendar_month:month==='2026-10',keyword_application_reviewed:true,audit_recheck_complete:complete,audit_recheck_status:complete?'verified_current_archive':'partial_reread_prior_records_retained',note:complete?'本轮当前公开归档已逐页核查；保留历史收录，排除明确非新闻入口。':'本轮回查未覆盖完整归档；保留此前记录并补入已核有效日期新闻。'};
 });s.latest_access_note='2026-10-09逐源审计：当前归档复核范围详见数据回执；未重现旧记录不删除。';s.last_rechecked_at=now;
}
const all=p.documents.filter(r=>media.includes(r.source_id)&&!r.superseded);
p.latest_refresh={...p.latest_refresh,batch_id:batch,checked_at:now,requested_cutoff:end,added_rows:added.length,added_ids:added,unique_media_news:all.length};
p.source_audit={id:batch,checked_at:now,added_ids:added,excluded_nonarticle:excluded,date_corrections:corrections,retained_unseen:true};
assert.equal(p.documents.length,before+added.length);assert.equal(byId.size,p.documents.length);
fs.writeFileSync(file,JSON.stringify(p));
const sf=new URL('../public/sample-sources.json',import.meta.url),s=read(sf);Object.assign(s,{collected_at:now,window:p.window,sources:p.sources.filter(s=>['media','official'].includes(s.group)&&!s.document_source_id),latest_refresh:p.latest_refresh});fs.writeFileSync(sf,JSON.stringify(s));
const summary={added:added.length,added_active:added.filter(id=>!byId.get(id).superseded).length,historical:added.filter(id=>byId.get(id).date<'2026-10-09').length,excluded_previously_active:excluded.filter(r=>r.was_active).length,corrected_dates:corrections.length,all_news:all.length,october:all.filter(r=>r.month==='2026-10').length};
console.log(JSON.stringify(summary));
