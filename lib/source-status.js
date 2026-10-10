// Normalize audit-day timestamps and live capture timestamps for one source view.
export function sourceCheckTime(row) {
 const value=row?.captured_at||row?.checked_at||row?.checkedAt||row?.checked_on;
 if(!value)return 0;
 const time=Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(value)?value+'T00:00:00+08:00':value);
 return Number.isFinite(time)?time:0;
}
export function latestSourceAudit(id,...batches){
 return batches.flatMap(b=>b||[]).filter(r=>r.source_id===id).sort((a,b)=>sourceCheckTime(b)-sourceCheckTime(a))[0]||null;
}
export function newerCapture(capture,audit){
 if(!capture||!sourceCheckTime(capture))return null;
 const day=audit?.checked_at||audit?.checked_on;
 // A day-only receipt cannot establish the order of two checks on that day.
 if(/^\d{4}-\d{2}-\d{2}$/.test(day||'')){
  const captureDay=new Date(sourceCheckTime(capture)+8*3600000).toISOString().slice(0,10);
  return captureDay>day?capture:null;
 }
 return sourceCheckTime(capture)>=sourceCheckTime(audit)?capture:null;
}
export function sourceAuditLabel(row){
 const status=row?.status||'';
 if(row?.checked===false||status==='not_checked')return '本次未核查';
 if(/license_(not|unavailable|required)|unlicensed|authorization_required/.test(status))return '授权未接通';
 if(/manual|article_link_required/.test(status))return '需手动资料';
 if(/captcha/.test(status))return '访问验证受限';
 if(/blocked|restricted|timeout|failed|error|empty|unindexed/.test(status))return /partial|readable/.test(status)?'部分资料可读':'读取受限';
 if(/identity_entry_only/.test(status))return '主体入口已确认';
 if(/marketing/.test(status))return '仅公开介绍';
 if(/shell/.test(status))return '仅入口可见';
 if(row?.history_complete===true)return '归档已复核';
 if(/partial|incomplete|mixed|dynamic/.test(status))return '部分资料已核查';
 if(/readable|verified/.test(status))return '公开资料已核查';
 return row?.label||'来源检查记录';
}
export function sourceAuditDetail(row){return row?.detail||row?.result||row?.source_check||row?.note||row?.coverage_note||`${sourceAuditLabel(row)}，详见核查范围。`;}
