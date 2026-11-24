// Expansion cohorts are separate assets so each hosted file stays below size limits.
export function mergeMarketAssets(base,parts=[]){
 const documents=[...base.documents],ids=new Set(documents.map(r=>r.id));
 let metadata=base;
 for(const part of parts){
  if(!Array.isArray(part.documents))throw Error('扩展来源数据格式无效');
  for(const row of part.documents){if(ids.has(row.id))throw Error('扩展来源记录重复');ids.add(row.id);documents.push(row);}
  if(part.media_update)metadata=applyMediaUpdate(metadata,part.media_update,part.documents.filter(r=>r.collection_batch===part.media_update.batch_id));
 }
 return {...metadata,documents};
}

// Publisher-specific additions retain the original archive and its historical denominator.
export function applyMediaUpdate(base,update,docs){
 if(base.latest_refresh?.batch_id===update.batch_id)return base;
 const {start,end}=update;
 const months=[...new Set([start.slice(0,7),end.slice(0,7)])];
 const fixedDocs=docs.filter(r=>r.collection_method==='publisher_archive');
 const members=(source)=>source.document_source_ids||[source.document_source_id||source.id];
 const statusNote=update.coverage_note;
 const sources=[...base.sources,...update.new_sources].map(s=>{
  if(s.kind!=='news') return s;
  const source=s;
  const scope=new Set(members(source)),found=docs.filter(r=>scope.has(r.source_id));
  const coverage=[...source.coverage];
  for(const month of months){
   const index=coverage.findIndex(c=>c.month===month),old=coverage[index]||{},delta=found.filter(r=>r.month===month);
   if(index>=0&&!delta.length)continue;
   const total=(old.total??0)+delta.length,eligible=(old.eligible??0)+delta.length;
   const hasSample=Number.isFinite(old.eligible)||delta.length>0;
   const theme=source.group==='supplement';
   const next={...old,month,total:hasSample?total:null,eligible:hasSample?eligible:null,status:hasSample?'incomplete':'missing',observed_count:hasSample?total:null,history_complete:false,audit_recheck_complete:false,partial_calendar_month:month===end.slice(0,7),partial_current_day:month===end.slice(0,7),note:delta.length?(theme?'议题检索样本，分母仅为补采报道。':'本轮采集部分公开栏目及归档页面，分母包含未命中关键词的已采报道。'):'本轮未取得该月可计数的报道。'};
   if(delta.length){next.checked_at=update.checked_at;next.coverage_basis=theme?'topic_search_sample':'partial_archive_sample';next.keyword_application_reviewed=false;}
   if(index>=0)coverage[index]=next;else coverage.push(next);
  }
  return {...source,coverage,...(found.length?{latest_access_note:statusNote,last_rechecked_at:update.checked_at}: {})};
 });
 const media=base.media_summary;
 const media_summary=media&&{...media,total_documents:media.total_documents+fixedDocs.length,monthly:[...new Set([...media.monthly.map(m=>m.month),...months])].map(month=>{
  const old=media.monthly.find(m=>m.month===month)||{month,active_documents:0,total_documents:0},delta=fixedDocs.filter(r=>r.month===month).length;
  return delta?{...old,active_documents:old.active_documents+delta,total_documents:old.total_documents+delta,status:'incomplete'}:old;
 })};
 return {...base,sources,window:{...base.window,end},collected_at:update.checked_at,media_summary,
  latest_refresh:{...base.latest_refresh,batch_id:update.batch_id,checked_at:update.checked_at,requested_cutoff:end,added_rows:docs.length,archive_added:fixedDocs.length,topic_search_added:docs.length-fixedDocs.length,added_ids:docs.map(r=>r.id),active_added_rows:docs.length,unique_media_news:media_summary?.total_documents,skipped_existing:update.skipped_existing},media_update_note:statusNote};
}
export async function loadMarketData(fetcher=fetch){
 const read=async path=>{const response=await fetcher(path);if(!response.ok)throw Error('来源样本数据暂时无法读取');return response.json();};
 const base=await read('/market-panel.json');
 const paths=base.expansion_assets||[];
 if(paths.some(p=>!/^\/market-expansion(?:-\d+)?\.json$/.test(p)))throw Error('扩展来源地址无效');
 return mergeMarketAssets(base,await Promise.all(paths.map(read)));
}

// Read-only outbound news navigation accepts the publisher's literal HTTP links.
// This does not relax the HTTPS-only collection/import or server-fetch rules.
export function publicNewsUrl(value){
 try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password&&!u.port&&u.hostname.includes('.')?u.href:null;}catch{return null;}
}
