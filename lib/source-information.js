import {latestSourceAudit,sourceCheckTime} from './source-status.js';

const batchId=value=>value?.audit_id||value?.batch_id||value?.id;
const localDay=value=>value?new Date(sourceCheckTime({checked_at:value})+8*3600000).toISOString().slice(0,10):null;
const count=(value,fallback=0)=>Number.isInteger(value)&&value>=0?value:fallback;

const auditIdPattern=/^source-audit-\d{8}(?:-\d+)?$/;
export const isSourceAuditFilename=name=>typeof name==='string'&&name.endsWith('.json')&&auditIdPattern.test(name.slice(0,-5));

export function newestAudit(audits){
 const audit=[...audits].filter(a=>sourceCheckTime(a)>0).sort((a,b)=>sourceCheckTime(b)-sourceCheckTime(a))[0];
 if(!audit||!auditIdPattern.test(audit.id))throw Error('A dated source audit is required.');
 return audit;
}

// Same-day repeat batches need an explicit ID: a calendar day cannot identify
// whether an untagged manifest belongs to the morning or afternoon refresh.
function matchingManifest(audit,...candidates){
 return candidates.filter(Boolean).filter(row=>batchId(row)?batchId(row)===audit.id:!/^source-audit-\d{8}-/.test(audit.id)&&localDay(row.checked_at||row.checked_on)===localDay(audit.checked_at||audit.checked_on)).sort((a,b)=>sourceCheckTime(b)-sourceCheckTime(a))[0];
}

export function normalizeSourceAudit(audit,registry){
 return {
  schema_version:audit.schema_version,id:audit.id,checked_on:audit.checked_on||localDay(audit.checked_at),checked_at:audit.checked_at,
  requested_window:audit.requested_window,full_coverage:audit.full_coverage===true,coverage_statement:audit.coverage_statement,
  summary:audit.summary,supporting_facts:audit.supporting_facts||[],monthly_source_coverage:audit.monthly_source_coverage||[],
  source_checks:(audit.source_checks||[]).map(row=>{
   const registered=registry.find(s=>s.id===row.source_id);
   return {
    source_id:row.source_id,name:row.name||registered?.name,url:row.url||registered?.url,
    checked:row.checked,checked_at:row.checked_at||row.checked_on,checked_at_precision:row.checked_at_precision,
    checked_at_basis:row.checked_at_basis,checked_at_note:row.checked_at_note,entry_request_started_at:row.entry_request_started_at,entry_request_completed_at:row.entry_request_completed_at,
    history_complete:row.history_complete===true,status:row.status,
    detail:row.detail||row.result||row.note||'来源已检查，历史覆盖范围以核查记录为准。',
    requested_window:row.requested_window,verified_window:row.verified_window,snapshot_window:row.snapshot_window,
    verified_window_limits:row.verified_window_limits||row.actually_verified_window||row.coverage||'本次为入口及定向资料核查，不代表全库完整覆盖。',
    partial_current_day:row.partial_current_day,complete_calendar_days_through:row.complete_calendar_days_through,
    latest_observed_publication:row.latest_observed_publication,evidence_urls:row.evidence_urls,
   };
  }),exclusion_dispositions:audit.exclusion_dispositions,
  registry_dispositions:audit.registry_dispositions,registry_exclusions:audit.registry_exclusions,query_receipts:audit.query_receipts,article_event_links:audit.article_event_links,pending_candidates:audit.pending_candidates,evidence_links:audit.evidence_links,source_archive_exclusions:audit.source_archive_exclusions,
 };
}

// Static UI data comes from the generated manifest. An older import is only a
// fallback/history record; timestamps, rather than import order, decide freshness.
export function currentSourceAudit(latest,...history){
 const generated=Array.isArray(latest?.source_checks)?{
  id:latest.id,checked_at:latest.audit_checked_at||latest.checked_at,checked_on:latest.audit_checked_on,
  requested_window:latest.requested_window,full_coverage:latest.full_coverage,
  coverage_statement:latest.coverage_statement,source_checks:latest.source_checks,summary:{sources_checked:latest.sources_checked},
 }:null;
 return [generated,...history].filter(Boolean).sort((a,b)=>sourceCheckTime(b)-sourceCheckTime(a))[0]||null;
}

// Pure construction keeps tests from mutating the real data files or scheduler.
export function buildSiteInformation({panel,research,audits,registry,monitor,publishedAudits=[]}){
 const audit=newestAudit(audits),publicAudit=normalizeSourceAudit(audit,registry);
 const media=matchingManifest(audit,panel.latest_refresh),study=matchingManifest(audit,research.latest_refresh,research.source_audit_backfill);
 if(!media||!Number.isInteger(media.added_rows)||media.added_rows<0)throw Error(`Missing media refresh manifest for ${audit.id}.`);
 if(!study||!Number.isInteger(study.added_records)||study.added_records<0)throw Error(`Missing research refresh manifest for ${audit.id}.`);
 const mediaIds=panel.sources.find(s=>s.id==='media_all')?.document_source_ids||[];
 const active=panel.documents.filter(row=>mediaIds.includes(row.source_id)&&!row.superseded);
 const corrections=matchingManifest(audit,panel.source_audit);
 const stamps=[audit,media,study].filter(row=>sourceCheckTime(row)>0).sort((a,b)=>sourceCheckTime(b)-sourceCheckTime(a));
 const checked_at=stamps[0].checked_at||stamps[0].checked_on;
 const latestMonth=panel.window.end.slice(0,7);
 const allChecks=audits.map(row=>row.id===audit.id?publicAudit.source_checks:(publishedAudits.find(published=>published.id===row.id)||normalizeSourceAudit(row,registry)).source_checks);
 const source_checks=registry.map(source=>latestSourceAudit(source.id,...allChecks)).filter(Boolean);
 const latest={
  schema_version:2,id:audit.id,checked_at,audit_checked_at:audit.checked_at||audit.checked_on,audit_checked_on:publicAudit.checked_on,
  window:{...panel.window},requested_window:{...(audit.requested_window||panel.window)},
  research_window:{start:research.period_start||panel.window.start,end:research.period_end||panel.window.end},
  media_added:media.added_rows+count(media.expanded_added_rows),media_source_count:mediaIds.length,media_total:active.length,latest_month:latestMonth,latest_month_total:active.filter(row=>row.month===latestMonth).length,
  research_added:study.added_records,research_total:research.events.length+research.leads.length,restored_milestones:count(study.restored_milestones),
  nonarticle_exclusions:count(media.nonarticle_exclusions,(corrections?.excluded_nonarticle||[]).filter(row=>row.was_active).length),
  date_corrections:count(media.date_corrections,corrections?.date_corrections?.length||0),title_corrections:count(media.title_corrections,corrections?.title_corrections?.length||0),
  registered_sources:registry.length,sources_rechecked_this_batch:count(audit.summary?.sources_rechecked_this_batch,count(audit.summary?.sources_checked)),sources_checked:count(audit.summary?.sources_checked,(audit.source_checks||[]).filter(row=>row.checked!==false).length),
  full_coverage:audit.full_coverage===true,coverage_statement:audit.coverage_statement,audit_url:`/${audit.id}.json`,source_checks,
  audit_history:audits.filter(row=>row.id!==audit.id).sort((a,b)=>sourceCheckTime(b)-sourceCheckTime(a)).map(row=>({id:row.id,checked_on:row.checked_on||localDay(row.checked_at),...(row.checked_at?{checked_at:row.checked_at}:{}),audit_url:`/${row.id}.json`})),
 };
 const date=latest.audit_checked_on,dayLabel=`${Number(date.slice(5,7))}月${Number(date.slice(8,10))}日`;
 const monthLabel=`${Number(latestMonth.slice(5))}月`;
 const changes=[`新增${latest.media_added}篇媒体新闻、${latest.research_added}条研究记录`];
 if(latest.restored_milestones)changes.push(`恢复${latest.restored_milestones}条误排事件`);
 if(latest.nonarticle_exclusions)changes.push(`排除${latest.nonarticle_exclusions}条非新闻入口`);
 const nextMonitor={...monitor,
  latest_requested_cutoff:latest.requested_window.end,last_attempt_at:latest.checked_at,latest_update_status:latest.full_coverage?'complete':'partial',
  latest_status:`${dayLabel}手动审计：检查${latest.sources_rechecked_this_batch}个信源，${changes.join('，')}；${monthLabel}${latest.latest_month_total}篇。${latest.full_coverage?'本次请求范围已核对。':'部分历史归档仍未查全。'}${monitor.paused_by_user||monitor.enabled===false?'定时计划保持暂停。':''}`,
 };
 return {latest,publicAudit,monitor:nextMonitor};
}
