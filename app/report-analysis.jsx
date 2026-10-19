'use client';
import SegmentedControl from './segmented-control';
import {useState} from 'react';
import {Download,ArrowUpRight} from 'lucide-react';
import {BarChart,Bar,Cell,XAxis,YAxis,Tooltip,CartesianGrid,ResponsiveContainer,LabelList,ReferenceLine} from 'recharts';
import data from '@/data/report-monitor.json';
import legacy from '@/data/report-analysis.json';
import {safeUrl} from '@/lib/model';
import {reportInsightRows} from '@/lib/report-analysis';
import {NATURES,FREQUENCIES,numberText,qualifier,visibleObservations,pointKey,changeText,monitorCsv,axisPeriods,numericAxis,formatAxisTick} from '@/lib/report-monitor';
const FAMILY={size:'市场规模',growth:'增长速度',penetration:'渗透与结构',revision:'预测修订'};
const AUDIT_STATUS={usable:'可用',usable_with_caveats:'附限制可用',denominator_pending:'分母待核',endpoint_definition_pending:'时点定义待核',single_point_only:'仅单点',conditional_definition_review:'可比定义待核'};
const EVIDENCE_FIELDS={text_value:'正文数值',chart_implied_value:'图表对应数值',unit:'单位',old_value:'旧版数值',new_value:'新版数值',old_value_million_cny:'旧版（百万元人民币）',new_value_million_cny:'新版（百万元人民币）',old_vintage:'旧版本',new_vintage:'新版本',old_publication_date:'旧版发布',new_publication_date:'新版发布',old_scope:'旧版范围',new_scope:'新版范围',description:'说明',selected_baseline:'采用口径',policy:'保留规则',handling:'处理规则',impact:'影响',additional_wording_caveat:'文字限制',body_measurement:'正文指标',body_value:'正文数值',body_unit:'正文单位',table_measurement:'表格指标',table_value:'表格数值',table_unit:'表格单位',interpretation:'指标说明',definition_limit:'定义限制',scope:'范围'};
function EvidenceDetails({item}){return <div>{Object.entries(EVIDENCE_FIELDS).filter(([key])=>item[key]!==undefined&&item[key]!==null).map(([key,label])=><p key={key}><b>{label}：</b>{String(item[key])}</p>)}{item.source_url&&<SourceLink url={item.source_url}>原始来源</SourceLink>}</div>;}
function save(name,text,type='text/csv;charset=utf-8'){const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function SourceLink({url,children}){return <a href={safeUrl(url)||undefined} target="_blank" rel="noreferrer">{children}<ArrowUpRight size={13}/></a>;}
function Select({label,value,onChange,options,disabled=false}){return <label>{label}<select value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}>{options.map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>;}
function Tip({active,payload,unit,revision}){if(!active||!payload?.length)return null;const r=payload[0].payload;return <div className="panel-tooltip"><b>{r.label}</b><p>{numberText(r,unit)} · {NATURES[r.nature]||r.nature}</p><p>{revision?'固定目标期':'数据对应期'}：{r.period}</p><p>发布：{r.publication_date||'待确认'}</p><p>数据机构：{r.provider}</p></div>;}
function Chart({series,mode}){
 const observed=visibleObservations(series,mode).map((o,i)=>({...o,label:pointKey(series,o),labelValue:numberText(o),provider:series.provider,id:o.id||String(i)}));
 const exactKeys=new Set(observed.map(r=>r.label));if(exactKeys.size!==observed.length)return <p className="notice">同一时期有多个来源版本，暂不连成趋势；请在下方数据表核对各版本。</p>;
 const byPeriod=new Map(observed.map(r=>[r.label,r]));const records=axisPeriods([series],mode).map(label=>byPeriod.get(label)||{id:label,label,value:null,labelValue:''});
 const axis=numericAxis(records);
 return <div className="report-monitor-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={records} margin={{top:32,right:18,left:0,bottom:8}} accessibilityLayer>
  <CartesianGrid vertical={false} stroke="#edf0f5"/><XAxis dataKey="label" tick={{fontSize:14,fill:'#64748b'}} tickLine={false} axisLine={{stroke:'#dce3ec'}} interval="preserveStartEnd" minTickGap={20}/><YAxis width={76} tick={{fontSize:14,fill:'#64748b'}} tickLine={false} axisLine={false} domain={axis.domain} ticks={axis.ticks} tickFormatter={formatAxisTick} allowDecimals={axis.ticks.some(v=>!Number.isInteger(v))}/><ReferenceLine y={0} stroke="#94a3b8"/>
  <Tooltip content={<Tip unit={series.unit} revision={series.family==='revision'}/>} cursor={{fill:'#f1f5f9'}}/>
  <Bar dataKey="value" maxBarSize={64} isAnimationActive={false}>{records.map(r=><Cell key={r.id} fill={r.nature==='forecast'?'#fff':r.nature==='estimate'?'#aab8e8':'#4867de'} stroke="#4867de" strokeDasharray={r.nature==='forecast'?'4 3':undefined}/>)}<LabelList dataKey="labelValue" position="top" style={{fontSize:14,fill:'#334155'}}/></Bar>
 </BarChart></ResponsiveContainer></div>;
}
export default function ReportAnalysis({research,onEdit}){
 const [family,setFamily]=useState('all'),[query,setQuery]=useState(''),[mode,setMode]=useState('history'),[frequency,setFrequency]=useState('all'),[selected,setSelected]=useState('CN_SERVER_REVENUE_Q'),[tab,setTab]=useState('monitor');
 const categorySeries=data.series.filter(s=>visibleObservations(s,mode).length);
 const frequencies=[...new Set(categorySeries.map(s=>s.frequency))];
 const rows=categorySeries.filter(s=>(family==='all'||s.family===family)&&(frequency==='all'||s.frequency===frequency)&&(!query.trim()||`${s.title} ${s.subtopic} ${s.provider} ${s.scope}`.toLowerCase().includes(query.trim().toLowerCase()))&&visibleObservations(s,mode).length);
 const focus=rows.find(s=>s.id===selected)||rows[0];
 const notes=research?.report_insights||reportInsightRows(legacy);
 const selectedRecords=focus?visibleObservations(focus,mode):[];
 return <div className="report-monitor">
  <SegmentedControl className="keyword-board-tabs report-nature-tabs" label="研报数据分类" options={[{id:'history',label:'历史统计'},{id:'forecast',label:'预测'}]} value={mode} onChange={v=>{setMode(v);setFamily('all');setFrequency('all');setSelected('');}}/>
  <div className="report-monitor-toolbar"><div className="pills" role="group" aria-label="监测内容">{[['monitor','指标监测'],['dictionary','数据底表与口径']].map(([id,label])=><button key={id} aria-pressed={tab===id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{label}</button>)}</div><span>资料核查至 {data.as_of}</span></div>
  {tab==='monitor'&&<>
   <section className="card panel-controls"><div className="source-filters">
    <label>搜索指标<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="指标、方向或机构"/></label>
    <Select label="指标类型" value={family} onChange={setFamily} options={[["all","全部指标"],...Object.entries(FAMILY).filter(([key])=>categorySeries.some(s=>s.family===key))]}/>
    <Select label="数据频率" value={frequency} onChange={setFrequency} options={[["all","全部频率"],...frequencies.map(f=>[f,FREQUENCIES[f]||f])]}/>
   </div><div className="panel-actions"><span>{rows.length} 项指标</span><button className="text-button" onClick={()=>{setQuery('');setFamily('all');setFrequency('all');}}>重置筛选</button><button className="text-button" onClick={()=>save('研报指标.csv',monitorCsv(rows,mode))}><Download size={14}/>导出当前数据</button></div></section>
   <section className="card"><div className="section-heading"><h2>{mode==='history'?'历史统计':'预测'} · 指标总览</h2></div>
    {rows.length?<div className="table-scroll matrix-scroll" role="region" aria-label="研报指标总览" tabIndex={0}><table className="report-monitor-matrix"><thead><tr><th>指标 / 机构</th><th>最新期间 / 版本</th><th>数值</th><th>单位</th><th>频率</th></tr></thead><tbody>{rows.map(s=>{const observations=visibleObservations(s,mode),latest=observations.at(-1),versions=observations.filter(o=>pointKey(s,o)===pointKey(s,latest));return <tr key={s.id} className={focus?.id===s.id?'selected-row':''}><th><button className="text-button" onClick={()=>setSelected(s.id)} aria-pressed={focus?.id===s.id}>{s.title}</button><small>{s.provider}</small></th><td>{pointKey(s,latest)}{s.family==='revision'&&<small>目标期：{latest.period}</small>}</td><td>{versions.length>1?'多版本，点击查看':numberText(latest)}</td><td>{s.unit}</td><td>{FREQUENCIES[s.frequency]||s.frequency}</td></tr>;})}</tbody></table></div>:<p className="notice">没有符合筛选条件的指标。</p>}
    <p className="panel-note">各指标独立展示，不加总 · † 源内冲突 · 约 / 近 / &gt; 原文限定</p>
   </section>
   {focus&&<>
    <section className="card"><div className="section-heading"><div><h2>{focus.title}</h2><p>{focus.geography} · {focus.scope}</p></div><span className="report-unit">{focus.unit}</span></div>
     {focus.family==='revision'&&<p className="report-axis-caption">横轴：发布版本；预测目标期：{[...new Set(selectedRecords.map(o=>o.period))].join('、')}</p>}
     <Chart series={focus} mode={mode}/><p className="panel-reading">{changeText(focus,mode,data.series)}</p><p className="panel-note">{focus.comparability_note}</p>{selectedRecords.some(o=>qualifier(o.qualifier))&&<p className="panel-note">柱高为近似值或边界。</p>}{selectedRecords.some(o=>o.nature==='forecast')&&<p className="panel-note">空心虚线柱：预测。</p>}
    </section>
    <section className="card"><div className="section-heading"><div><h2>数据来源</h2></div></div><div className="table-scroll"><table><thead><tr><th>数据期间 / 目标期</th><th>数值</th><th>性质</th><th>发布日期 / 版本</th><th>报告与页码</th><th>证据说明</th></tr></thead><tbody>{selectedRecords.map(o=><tr key={o.id}><td>{o.period}</td><td>{numberText(o,focus.unit)}</td><td>{NATURES[o.nature]||o.nature}{o.calculation||o.formula?<small>含计算，见说明</small>:null}</td><td>{o.publication_date||'发布日期待确认'}{o.page_last_modified&&<small>页面修订：{o.page_last_modified}</small>}<small>{o.vintage&&o.vintage!==o.publication_date?`版本：${o.vintage}`:''}</small></td><td><SourceLink url={o.source_url}>{o.report_title||focus.provider}</SourceLink><small>{o.page||'公开正文'}</small></td><td>{o.definition_note||o.evidence_note||o.evidence_excerpt||o.evidence||o.quote||''}{o.publication_date_note&&<small>{o.publication_date_note}</small>}{o.normalization_note&&<small>{o.normalization_note}</small>}{(o.formula||o.calculation)&&<p>{typeof(o.formula||o.calculation)==='string'?(o.formula||o.calculation):JSON.stringify(o.formula||o.calculation)}{o.formula_unit?`（公式原始单位：${o.formula_unit}）`:''}</p>}</td></tr>)}</tbody></table></div></section>
   </>}
  </>}
  {tab==='dictionary'&&<section className="card"><div className="section-heading"><div><h2>研报指标底表</h2></div><button className="button secondary" onClick={()=>save(`${mode==='history'?'历史统计':'预测'}_研报观测底表.csv`,monitorCsv(categorySeries,mode))}><Download size={15}/>导出本类底表</button></div><div className="table-scroll"><table><thead><tr><th>细分方向</th><th>指标</th><th>统计范围 / 单位</th><th>原始机构</th><th>数据频率</th><th>已取得期间 / 版本</th><th>比较限制</th></tr></thead><tbody>{categorySeries.map(s=><tr key={s.id}><td>{s.subtopic}</td><td><button className="text-button" onClick={()=>{setTab('monitor');setFamily('all');setQuery('');setFrequency('all');setSelected(s.id);}}>{s.title}</button><small>{FAMILY[s.family]}</small></td><td>{s.scope}<small>{s.unit}</small></td><td>{s.provider}</td><td>{FREQUENCIES[s.frequency]||s.frequency}</td><td>{[...new Set(visibleObservations(s,mode).map(o=>s.family==='revision'?o.vintage:o.period))].join('、')}</td><td>{s.comparability_note}</td></tr>)}</tbody></table></div></section>}
  {tab==='dictionary'&&<>
   <details className="card report-method"><summary>补充资料 · {data.auxiliary.length} 项</summary>
    <p className="panel-note">含历史版本、全球对照及口径待核资料，保留各自限制，未并入上方主线指标。</p>
    <button className="text-button" onClick={()=>save('研报补充资料与口径.json',JSON.stringify({as_of:data.as_of,auxiliary:data.auxiliary,source_conflicts:data.source_conflicts,source_measurement_notes:data.source_measurement_notes,source_catalog:data.source_catalog},null,2),'application/json')}><Download size={14}/>下载补充资料与口径</button>
    {data.auxiliary.map(s=><details className="report-chart-note" key={s.id}><summary>{s.title} · {AUDIT_STATUS[s.audit_status]||s.audit_status} · {s.observations.length} 条</summary>
     <p>{s.geography} · {s.scope}</p><p>{s.comparability_note}</p>{s.exclusion_reason&&<p>限制：{s.exclusion_reason}</p>}{s.render_constraint&&<p>{s.render_constraint}</p>}
     <div className="table-scroll"><table><thead><tr><th>数据期间 / 目标期</th><th>数值</th><th>性质</th><th>发布日期 / 版本</th><th>来源与限制</th></tr></thead><tbody>{s.observations.map((o,i)=><tr key={o.id||`${s.id}-${i}`}><td>{o.period}</td><td>{numberText(o,s.unit)}</td><td>{NATURES[o.nature]||o.nature}</td><td>{o.publication_date||'发布日期待确认'}{o.vintage&&o.vintage!==o.publication_date&&<small>{o.vintage}</small>}</td><td><SourceLink url={o.source_url}>{o.report_title||s.provider}</SourceLink><small>{o.page}</small>{(o.definition_note||o.evidence_note||o.evidence||o.validation)&&<p>{o.definition_note||o.evidence_note||o.evidence||o.validation}</p>}</td></tr>)}</tbody></table></div>
    </details>)}
   </details>
   <details className="card report-method"><summary>口径冲突与修订 · {data.source_conflicts.length} 项；指标口径说明 · {(data.source_measurement_notes||[]).length} 项</summary>
    {data.source_conflicts.map(c=><details className="report-chart-note" key={c.id}><summary>{c.metric||c.id}</summary><EvidenceDetails item={c}/></details>)}
    {(data.source_measurement_notes||[]).map(c=><details className="report-chart-note" key={c.id}><summary>{c.metric}</summary><EvidenceDetails item={c}/></details>)}
   </details>
  </>}
  <details className="card report-method"><summary>数据缺口</summary><ul>{[...new Set(data.series.flatMap(s=>s.severe_gaps||[]))].map(t=><li key={t}>{t}</li>)}</ul>{data.gaps.map((g,i)=><p key={i}>{typeof g==='string'?g:g.reason||g.description||g.gap||g.title}</p>)}<p>{data.scope_notice}</p></details>
  <details className="card report-method"><summary>统计规则</summary><ul>{data.rules.map(t=><li key={t}>{t}</li>)}</ul></details>
  <details className="card report-method"><summary>原有研究笔记</summary>{notes.map(n=><div className="report-chart-note" key={n.id}><b>{n.title}</b>{n.note&&<p>{n.note}</p>}<button className="text-button" disabled={!onEdit} onClick={()=>onEdit?.('report_insights',n.id,n)}>查看与编辑</button></div>)}</details>
 </div>;
}
