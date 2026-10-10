import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {sourcePanel} from '../data/sources.js';
import {classifyNewsTitle,normalizedNewsTitle} from '../lib/news-classification.js';
import {compactBoardMatches,KEYWORD_RULE_VERSION} from '../lib/keyword-boards.js';
import {observationCategories} from '../lib/hierarchy.js';
import {validDate,TECHS,STAGES,SOURCES,researchReview} from '../lib/model.js';
import {mergeMarketAssets} from '../lib/market-data.js';
const dir=process.argv[2];assert(dir,'Pass the verified second-source integration artifact directory');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),optional=p=>fs.existsSync(p)?read(p):[],write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,p.startsWith('data/')||p.endsWith('taxonomy-review.json')?2:undefined)+'\n');
const scrub=v=>Array.isArray(v)?v.map(scrub).filter(x=>x!==undefined):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,scrub(x)]).filter(([,x])=>x!==undefined)):typeof v==='string'&&/^\/(?:workspace|tmp|home|root|Users)\//.test(v)?undefined:v;
const batch='source-audit-20261010-2256',now=process.argv[3],window={start:'2026-01-01',end:'2026-10-10'};
assert(now&&Number.isFinite(Date.parse(now)),'Pass actual verified UTC clock timestamp as third argument; executor wall clock may differ');
const panel=read('public/market-panel.json'),research=read('data/research-2026.json');
assert(panel.latest_refresh?.batch_id!==batch,'Batch already integrated; restore exact baseline before rerunning');
const merged=mergeMarketAssets(panel,(panel.expansion_assets||[]).map(p=>read('public'+p)));
const beforeNews=merged.documents.length,beforeResearch=research.events.length+research.leads.length;
const registryPlan=read(path.join(dir,'registry-plan.json')),aliases=new Map(registryPlan.dispositions.filter(x=>x.registry_id).map(x=>[x.candidate_id,x.registry_id]));
const curatedArticleLinks=optional(path.join(dir,'media/article-event-links.json'));
const news=[],newsExcluded=[],researchAdded=[],researchDuplicateLinks=[],referenceFacts=[];
const seenNewsIds=new Set(merged.documents.map(x=>x.id)),seenNewsKeys=new Map(merged.documents.map(x=>[x.source_id+'|'+normalizedNewsTitle(x.title),x.id]));
const seenNewsUrls=new Map(merged.documents.map(x=>[x.source_id+'|'+canonical(x.url),x.id]));
const rawNews=optional(path.join(dir,'media/news-records.json'));
const mediaCoverage=optional(path.join(dir,'media/coverage.json'));
const allDescriptors=optional(path.join(dir,'media/sources.json')).map(s=>({...s,archive_selection_basis:s.archive_selection_basis||s.archive_scope,scope:s.archive_scope||s.scope,archive_urls:s.archive_routes||s.archive_urls,coverage:s.coverage||mediaCoverage.filter(c=>c.source_id===s.id).map(c=>({...c,status:c.month==='2026-10'?'incomplete':c.complete===true?'complete':c.observed_count?'incomplete':'missing',note:c.notes||c.note,partial_calendar_month:c.month==='2026-10',partial_current_day:c.month==='2026-10',archive_total:c.total}))}));
const descriptors=allDescriptors.filter(s=>rawNews.some(r=>r.source_id===s.id));
assert(Array.isArray(rawNews)&&Array.isArray(descriptors));
const action=/(?:中标|采购|招标|租用|租赁|投运|投产|上线|部署|扩容|验收|启用|交付)|\b(?:leases?|leased|leasing|purchases?|purchased|procurement|deploys?|deployed|deployment|commissions?|commissioned|opens?|opened|expands?|expanded|expansion|awarded|delivers?|delivered)\b/i,prospective=/(?:计划|拟|将|预计|有望|如何|推动|助力|支持|方案|攻略|趋势|需求)|\b(?:plans?|planned|planning|proposes?|proposed|will|would|could|might|forecast|expected|intends?|aims?)\b/i,real=/(?:已|正式|完成|成功|中标|招标公告|采购公告|结果公告|验收)|\b(?:completed|successfully|officially|has deployed|has opened|was awarded)\b/i;
for(const raw of rawNews){
 const source_id=aliases.get(raw.source_id)||raw.source_id;
 assert(descriptors.some(s=>(aliases.get(s.id)||s.id)===source_id),`Missing bounded archive descriptor ${source_id}`);
 if(!validDate(raw.date)||raw.date<window.start||raw.date>window.end){newsExcluded.push({id:raw.id,url:raw.url,reason:'invalid_or_outside_publication_window'});continue;}
 assert(raw.id&&!seenNewsIds.has(raw.id),`Duplicate news id ${raw.id}`);seenNewsIds.add(raw.id);
 const key=source_id+'|'+normalizedNewsTitle(raw.title),urlKey=source_id+'|'+canonical(raw.url),duplicate=seenNewsUrls.get(urlKey)||seenNewsKeys.get(key)||null;
 const row={...raw,source_id,...classifyNewsTitle(raw.title,panel.news_classification_rules),month:raw.date.slice(0,7),superseded:!!duplicate,duplicate_of:duplicate,is_article:true,eligible_categories:[],required_categories:[],unknown_categories:[],context_class:'other',classification_basis:'title_only',collection_batch:batch};
 const linkedEvents=curatedArticleLinks.filter(x=>x.news_record_id===row.id);if(linkedEvents.length){row.research_record_ids=linkedEvents.map(x=>x.event_record_id);row.event_link_relationships=linkedEvents;}
 row.observation_categories=observationCategories(row,'news');row.board_matches=compactBoardMatches(row,'news');row.keyword_rule_version=KEYWORD_RULE_VERSION;row.keyword_context_class=action.test(row.title)&&(!prospective.test(row.title)||real.test(row.title))?'application':'other';row.keyword_behavior_basis='统一中英文标题行为词识别（含采购、租赁、部署、启用、扩容等），前瞻措辞单独排除，不核定实际采用';row.keyword_behavior_rule_version='title-behavior-20261010-en-v2';
 if(!duplicate){seenNewsKeys.set(key,row.id);seenNewsUrls.set(urlKey,row.id);}news.push(row);
}
for(const s of descriptors){
 const id=aliases.get(s.id)||s.id;assert(sourcePanel.some(x=>x.id===id));assert(!panel.sources.some(x=>x.id===id));
 assert(s.archive_selection_basis&&s.keyword_prefiltered===false,`Unproven denominator sampling ${id}`);
 assert(s.coverage?.length===10,`Missing source-month coverage ${id}`);
 const source={...s,id,kind:'news',group:'media',scope:s.scope||(s.selected_columns?.map(c=>c.name).join(' / ')||'指定公开栏目')+' · 全部已采新闻，纳入全部媒体来源',limitation:s.limitation||s.limitations||'仅覆盖声明的出版者栏目；未按关键词预筛。完整性以逐月回执为准，未知月份不当作零新闻。',application_reviewed:false};
 source.coverage=source.coverage.map(c=>{const rows=news.filter(x=>x.source_id===id&&x.month===c.month),active=rows.filter(x=>!x.superseded);return {...c,total:rows.length||c.status==='complete'?rows.length:null,eligible:rows.length||c.status==='complete'?active.length:null,observed_count:rows.length,history_complete:c.status==='complete',keyword_application_reviewed:true,checked_at:c.checked_at||now};});
 panel.sources.push(source);
}
// New rows use separately loaded assets; historical files and news projections stay unchanged.
const max=20*1024*1024;let chunk=[],bytes=30,index=2;while(fs.existsSync(`public/market-expansion-${index}.json`))index++;
const flush=()=>{if(!chunk.length)return;const name=`market-expansion-${index++}.json`;write('public/'+name,{schema_version:1,batch_id:batch,documents:chunk});assert(fs.statSync('public/'+name).size<25*1024*1024);panel.expansion_assets??=[];panel.expansion_assets.push('/'+name);chunk=[];bytes=30;};
for(const row of news){const size=Buffer.byteLength(JSON.stringify(row))+1;if(bytes+size>max)flush();chunk.push(row);bytes+=size;}flush();
const researchRows=[...research.events,...research.leads],byId=new Map(researchRows.map(x=>[x.id,x]));
function canonical(x){try{const u=new URL(x);u.hash='';for(const k of [...u.searchParams.keys()])if(/^utm_/i.test(k))u.searchParams.delete(k);return u.href}catch{return typeof x==='string'?x:''}}
for(const branch of ['industry','buyers-permits','vendors']){
 const file=path.join(dir,branch,branch==='industry'?'normalized-records.json':'new-records.json');
 for(const raw of optional(file)){
  assert(raw.id&&raw.url&&raw.title,`Incomplete ${branch} evidence row`);
  const row={...raw,source_id:aliases.get(raw.source_id)||raw.source_id,collection_batch:batch,published_date:raw.published_date??raw.publication_date??null,event_date:raw.event_date||null};
  if(!validDate(row.published_date)||row.published_date<window.start||row.published_date>window.end){referenceFacts.push({...row,include_in_monthly_event_count:false,include_in_monthly_money:false,exclusion_reason:'未核公开日期或不在观察期，保留资料但不伪造月份。'});continue;}
  if(row.event_date&&!validDate(row.event_date)){row.reported_event_date=row.event_date;row.event_date=null;}
  assert(STAGES[row.stage]&&SOURCES[row.source_type],`Unknown event model ${row.id}: ${row.stage}/${row.source_type}`);
  row.lot??='';row.customer??='';row.project_id??=row.id;row.event_key??=`${row.project_id}|${row.lot}|${row.stage}|${row.event_date||row.published_date}`;
  const existing=researchRows.find(x=>x.id===row.id||x.event_key===row.event_key||(canonical(x.url)===canonical(row.url)&&(x.project_id||x.project_key)===(row.project_id||row.project_key)&&(x.lot||'')===row.lot&&x.stage===row.stage));
  if(existing){researchDuplicateLinks.push({candidate_id:row.id,existing_id:existing.id,url:row.url,reason:'same_original_url_project_lot_milestone_or_event_key',source_id:row.source_id});continue;}
  assert(!byId.has(row.id));
  row.amount_cny??=null;row.amount_kind??='none';row.amount_scope??='unknown';row.amount_currency??='CNY';row.amount_storage_unit??='元';row.amount_eligible??=false;
  if(['cancel','failure'].includes(row.stage))row.combined_amount_exclusion=false;else if(row.amount_cny===null)row.combined_amount_exclusion=true;
  assert(row.amount_cny===null||Number.isFinite(row.amount_cny));
  if(researchReview(row)!=='accepted')row.amount_eligible=false;
  const classified=classifyNewsTitle([row.title,row.fact_summary].filter(Boolean).join(' '),panel.news_classification_rules);
  row.categories=(row.categories||classified.categories).filter(c=>TECHS[c]);row.tags??=classified.tags;row.observation_categories=observationCategories(row,'research');row.board_matches=compactBoardMatches(row,'research');row.keyword_rule_version=KEYWORD_RULE_VERSION;
  row.stage_label=STAGES[row.stage];row.geography??='中国大陆';row.retrieved_on??='2026-10-10';
  assert(row.fact_summary&&row.limitations,`Missing fact/limitation ${row.id}`);
  (researchReview(row)==='accepted'?research.events:research.leads).push(row);researchRows.push(row);byId.set(row.id,row);researchAdded.push(row.id);
 }
 referenceFacts.push(...optional(path.join(dir,branch,'supporting-facts.json')));
}
const appliedCorrections=[],evidenceLinks=[];
for(const branch of ['buyers-permits','vendors']){
 for(const fix of optional(path.join(dir,branch,'corrections.json'))){
  const old=byId.get(fix.target_id);assert(old&&(fix.evidence_record||fix.updated_record),`Unsupported correction ${fix.target_id}`);const proof=fix.evidence_record||fix.updated_record;
  const next={...old,...proof,id:old.id,project_id:old.project_id,project_key:old.project_key||old.project_id,event_key:old.event_key,amount_group:old.amount_group||`${old.project_id}|${old.lot||''}`,event_date:old.event_date||proof.event_date||null,collection_batch:old.collection_batch,last_evidence_batch:batch,corroborating_sources:[...(old.corroborating_sources||[]),{url:old.url,publisher:old.publisher,published_date:old.published_date,relationship:'同一里程碑既有媒体报道',independent:false}],previous_evidence:{url:old.url,publisher:old.publisher,published_date:old.published_date,evidence_status:old.evidence_status,verified_fulltext:old.verified_fulltext},source_id:aliases.get(proof.source_id)||proof.source_id};
  next.board_matches=compactBoardMatches(next,'research');next.keyword_rule_version=KEYWORD_RULE_VERSION;next.stage_label=STAGES[next.stage];
  assert(next.stage===old.stage||fix.allow_stage_correction===true,'A same-milestone evidence upgrade cannot silently change a reviewed stage');
  for(const section of ['events','leads'])research[section]=research[section].filter(r=>r.id!==old.id);
  (researchReview(next)==='accepted'?research.events:research.leads).push(next);researchRows[researchRows.findIndex(r=>r.id===old.id)]=next;byId.set(next.id,next);
  appliedCorrections.push({id:old.id,reason:fix.reason,previous_url:old.url,source_url:next.url,previous_grade:old.evidence_status,evidence_status:next.evidence_status,previous_stage:old.stage,stage:next.stage,event_key:next.event_key});
 }
 for(const rawLink of optional(path.join(dir,branch,'links.json'))){const link={...rawLink,target_id:rawLink.target_id||rawLink.target_event_id,url:rawLink.url||rawLink.source_url,facts:rawLink.facts||rawLink.evidence};const row=byId.get(link.target_id);assert(row,`Missing linked record ${link.target_id}`);row.corroborating_sources??=[];if(!row.corroborating_sources.some(x=>x.url===link.url))row.corroborating_sources.push({...link,relationship:link.relationship||'同一项目补充原始证据'});evidenceLinks.push(link);}
}
const articleEventLinks=[];for(const link of curatedArticleLinks){assert(byId.has(link.event_record_id),`Missing event link target ${link.event_record_id}`);assert(seenNewsIds.has(link.news_record_id),`Missing news link target ${link.news_record_id}`);const target=byId.get(link.event_record_id);target.news_record_ids=[...new Set([...(target.news_record_ids||[]),link.news_record_id])];articleEventLinks.push(link);}
for(const r of researchRows){if(!researchAdded.includes(r.id)&&!appliedCorrections.some(x=>x.id===r.id))continue;const urls=new Set([r.url,...(r.corroborating_sources||[]).map(x=>x.url)].filter(Boolean).map(canonical));const linked=[...merged.documents,...news].filter(n=>urls.has(canonical(n.url)));if(linked.length){r.news_record_ids=[...new Set([...(r.news_record_ids||[]),...linked.map(x=>x.id)])];articleEventLinks.push({event_record_id:r.id,news_record_ids:linked.map(x=>x.id),basis:'exact_canonical_source_or_corroborating_url'});}}
const currentLinks=read('data/news-event-links-20261010.json');for(const x of curatedArticleLinks){const e=byId.get(x.event_record_id);currentLinks[x.news_record_id]??=[];if(!currentLinks[x.news_record_id].some(y=>y.id===e.id))currentLinks[x.news_record_id].push({id:e.id,title:e.title,url:e.url,stage:e.stage,event_date:e.event_date,published_date:e.published_date,relationship:x.relationship,link_basis:x.basis});}write('data/news-event-links-current.json',currentLinks);
const previous=read('data/latest-update.json'),checks=new Map(previous.source_checks.map(x=>[x.source_id,x]));
const discovery=read(path.join(dir,'discovery-sources.json'));
for(const x of discovery){const id=aliases.get(x.id);if(!id||!registryPlan.added_ids.includes(id))continue;
 const date=x.checked_at||x.verified_at||'2026-10-10';const detail=[x.access_observed||x.access,x.monthly_history||x.monthly_archive_support||x.monthly_archive,x.dedup_and_limits||x.limitations||x.cautions?.join('；')].filter(Boolean).join('；');
 const existing=checks.get(id),evidence=[x.example?.url,x.url||x.entry_url].filter(Boolean);checks.set(id,{source_id:id,name:sourcePanel.find(s=>s.id===id).name,url:sourcePanel.find(s=>s.id===id).url,checked:true,checked_at:date,checked_at_precision:/T/.test(date)?'timestamp':'day',history_complete:false,status:sourcePanel.find(s=>s.id===id).mode==='manual'?'manual_partial_archive_unverified':'public_readable_archive_incomplete',detail:'代表目录/原文访问已核查；来源家族登记并入原目录。'+detail,requested_window:window,verified_window_limits:'来源发现阶段的实际访问记录；未逐月穷尽归档，不等于完整采集。',evidence_urls:[...new Set([...(existing?.evidence_urls||[]),...evidence])]});}
const monthly=[];
for(const id of registryPlan.added_ids)for(let m=1;m<=10;m++){const month=`2026-${String(m).padStart(2,'0')}`,items=researchRows.filter(x=>(x.collection_batch===batch||x.last_evidence_batch===batch)&&x.source_id===id&&(x.event_date||x.published_date).slice(0,7)===month),media=panel.sources.find(x=>x.id===id)?.coverage?.find(x=>x.month===month);monthly.push({source_id:id,month,media_records:media?.eligible??null,research_records:items.length||null,coverage_status:media?.status||'not_exhaustively_collected',complete:false,note:'已入库记录数不代表该月全部披露；未采到记录保留缺失，不认定零事件。'});}
for(const s of allDescriptors){const id=aliases.get(s.id)||s.id;checks.set(id,{...checks.get(id),source_id:id,checked_at:now,checked_at_precision:'timestamp',status:!rawNews.some(r=>r.source_id===s.id)?s.collection_status:s.coverage.every(c=>c.status==='complete')?'historical_directory_pages_verified':'partial_archive_readable',history_complete:false,detail:s.limitation||s.limitations||s.scope,verified_window_limits:s.archive_selection_basis,evidence_urls:[s.url,...(s.archive_urls||[])],requested_window:window});}
for(const branch of ['buyers-permits','vendors']){const receipts=optional(path.join(dir,branch,'source-checks.json'));if(Array.isArray(receipts))for(const r of receipts){const id=aliases.get(r.source_id)||r.source_id;checks.set(id,{...checks.get(id),...r,source_id:id,detail:r.detail||r.verified_window_limits||checks.get(id)?.detail,evidence_urls:r.evidence_urls||r.verified_original_urls||checks.get(id)?.evidence_urls});}}
assert(sourcePanel.every(s=>checks.has(s.id)),'Every registered source needs a current or retained receipt');
const queryReceipts=[];for(const branch of ['media','buyers-permits','vendors']){const entries=optional(path.join(dir,branch,'queries.json'));if(Array.isArray(entries))for(const q of entries){queryReceipts.push({...q,branch});research.queries.push({...scrub(q),collection_batch:batch,month:q.month||'2026-01—10',category:q.category||'来源归档',query:q.query||q.url||q.archive_url||q.source_id||branch,result_summary:q.result_summary||q.note||q.status||'公开来源访问记录；不代表该月或主题完整覆盖。'});}}
const audit={schema_version:2,id:batch,checked_on:'2026-10-10',checked_at:now,requested_window:window,full_coverage:false,coverage_statement:`第二轮来源直接并入原目录及原统计：${sourcePanel.length}个登记来源；媒体仅纳入有明确栏目边界的全部已采文章，采购、建设、厂商及标准证据归研究台账。逐月未查全处保留缺失，来源调查记录数不等于独立来源数。`,summary:{registered_sources:sourcePanel.length,source_receipts:sourcePanel.length,sources_checked:[...checks.values()].filter(x=>x.checked===true).length,historically_complete_sources:[...checks.values()].filter(x=>x.history_complete===true).length,exclusion_candidates:newsExcluded.length,sources_rechecked_this_batch:registryPlan.added_ids.length,discovery_records:99,new_registry_families:registryPlan.added_ids.length,aliases_merged:registryPlan.dispositions.filter(d=>d.action==='alias_existing_publisher').length,new_media_records:news.length,new_research_records:researchAdded.length,new_verified_records:researchAdded.filter(id=>researchReview(byId.get(id))==='accepted').length,new_pending_leads:researchAdded.filter(id=>researchReview(byId.get(id))!=='accepted').length},source_checks:sourcePanel.map(s=>({...checks.get(s.id),name:s.name,url:s.url})),monthly_source_coverage:monthly,supporting_facts:referenceFacts,record_updates:[...researchDuplicateLinks,...appliedCorrections],evidence_links:evidenceLinks,article_event_links:articleEventLinks,exclusion_dispositions:newsExcluded.map(x=>({...x,title:x.id,outcome:'pending_verification',reason:'来源发布日期无效或不在当前观察窗，保留回执等待原文进一步核验。',record_ids:[]})),registry_exclusions:optional(path.join(dir,'excluded-candidates.json')),query_receipts:queryReceipts,registry_dispositions:registryPlan.dispositions,pending_candidates:[...optional(path.join(dir,'buyers-permits/pending.json')),...optional(path.join(dir,'vendors/leads.json'))],source_archive_exclusions:optional(path.join(dir,'media/exclusions.json')),record_ids:researchAdded,media_record_ids:news.map(x=>x.id),historical_records_preserved:true};
research.refresh_history??=[];research.refresh_history.push(research.latest_refresh);research.latest_refresh={batch_id:batch,checked_at:now,added_records:researchAdded.length,added_ids:researchAdded};research.period_end=window.end;research.as_of=window.end;
panel.latest_refresh={batch_id:batch,checked_at:now,requested_cutoff:window.end,added_rows:news.length,added_ids:news.map(x=>x.id),nonarticle_exclusions:0,date_corrections:0,title_corrections:0};panel.collected_at=now;panel.window={...panel.window,...window};
const taxonomy=read('public/taxonomy-review.json');Object.assign(taxonomy,{window,news_documents:beforeNews+news.length,research_records:research.events.length+research.leads.length,latest_source_audit_url:`/${batch}.json`});write('public/taxonomy-review.json',taxonomy);
write('public/market-panel.json',panel);write('data/research-2026.json',research);write(`data/${batch}.json`,scrub(audit));
write(path.join(dir,'integration-result.json'),{batch,beforeNews,beforeResearch,addedNews:news.length,addedResearch:researchAdded.length,duplicateResearchLinks:researchDuplicateLinks.length,references:referenceFacts.length,correctedRecords:appliedCorrections.length,evidenceLinks:evidenceLinks.length,registry:sourcePanel.length,newSources:registryPlan.added_ids.length});
console.log(JSON.stringify({batch,news:news.length,research:researchAdded.length,registry:sourcePanel.length,references:referenceFacts.length}));
