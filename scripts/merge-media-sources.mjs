import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {mergeMarketAssets} from '../lib/market-data.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const write=(p,value)=>fs.writeFileSync(new URL('../'+p,import.meta.url),JSON.stringify(value,null,p==='public/market-panel.json'?undefined:2)+'\n');
export function synchronizeMediaSources(){
const base=read('public/market-panel.json');
const panel=mergeMarketAssets(base,(base.expansion_assets||[]).map(path=>read('public'+path)));
const members=panel.sources.filter(s=>s.kind==='news'&&s.group==='media'&&!s.document_source_id);
const ids=members.map(s=>s.id),active=panel.documents.filter(r=>ids.includes(r.source_id)&&!r.superseded&&r.date>=panel.window.start&&r.date<=panel.window.end);
const original=panel.sources.find(s=>s.id==='media_all');
const coverage=original.coverage.map(previous=>{
 const parts=members.map(s=>s.coverage.find(c=>c.month===previous.month));
 const complete=parts.every(c=>c?.status==='complete');
 const rows=panel.documents.filter(r=>ids.includes(r.source_id)&&r.month===previous.month&&r.date>=panel.window.start&&r.date<=panel.window.end);
 return {month:previous.month,total:rows.length,eligible:rows.filter(r=>!r.superseded).length,status:complete?'complete':'incomplete',partial_current_day:parts.some(c=>c?.partial_current_day),partial_calendar_month:parts.some(c=>c?.partial_calendar_month),history_complete:complete,checked_at:parts.map(c=>c?.checked_at).filter(Boolean).sort().at(-1),note:members.map((s,i)=>`${s.name}：${parts[i]?.eligible??'缺失'}${parts[i]?.status==='complete'?'':'（覆盖未全）'}`).join('；')+'。按各来源已采新闻合并；缺失来源月份不代表零新闻。'};
});
base.sources=panel.sources.filter(s=>s.id!=='media_expanded').map(s=>{
 if(['media_all','media_china'].includes(s.id))return {...s,name:s.id==='media_all'?'全部媒体来源':'全部媒体来源（分子限明确国内）',document_source_ids:ids,coverage,scope:'全部媒体已采新闻合并 · 同期全部去重新闻为分母',limitation:`合并${ids.length}个媒体来源的已采新闻；各来源栏目及历史覆盖不同，缺失月份不代表零新闻。跨媒体转载按各自发布次数计数，合并占比受来源发稿量和覆盖范围影响，不代表全市场热度或采用率。可切换单一来源核对。厂商官网单独观察。`,method:'同源标题去重，跨来源分别计数；技术与地域条件只筛分子。统计窗口以当前数据日期为准，历史缺口保留在逐源说明与审计。',latest_access_note:`全部${ids.length}个媒体来源统一统计；逐源保留原始出处、栏目边界及历史覆盖限制。`};
 if(s.cohort==='expanded')return {...s,scope:'公开专业栏目已采新闻，纳入全部媒体来源',latest_access_note:'已纳入全部媒体来源；可单独查看本来源，月份样本量和覆盖范围不同。'};
 return s;
});
base.media_summary={source_count:ids.length,source_ids:ids,total_documents:active.length,monthly:coverage.map(c=>({month:c.month,active_documents:c.eligible,total_documents:c.total,status:c.status})),method:'all_collected_media_sources'};
write('public/market-panel.json',base);
const sample=read('public/sample-sources.json');Object.assign(sample,{window:base.window,collected_at:base.collected_at,latest_refresh:base.latest_refresh,media_summary:base.media_summary});sample.sources=base.sources.filter(s=>['media','official'].includes(s.group)&&!s.document_source_id);write('public/sample-sources.json',sample);
return base.media_summary;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(synchronizeMediaSources()));
