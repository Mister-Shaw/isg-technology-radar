'use client';
import SegmentedControl from './segmented-control';
import {useState} from 'react';
import {Download,ArrowUpRight} from 'lucide-react';
import {BarChart,Bar,Cell,XAxis,YAxis,Tooltip,CartesianGrid,ResponsiveContainer,LabelList,ReferenceLine} from 'recharts';
import data from '@/data/report-monitor.json';
import legacy from '@/data/report-analysis.json';
import {safeUrl} from '@/lib/model';
import {reportInsightRows} from '@/lib/report-analysis';
import {NATURES,FREQUENCIES,numberText,qualifier,visibleObservations,pointKey,periodCells,changeText,monitorCsv,axisPeriods,numericAxis,formatAxisTick} from '@/lib/report-monitor';
const FAMILY={size:'市场规模',growth:'增长速度',penetration:'渗透与结构',revision:'预测修订'};
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
 const [group,setGroup]=useState(data.groups[0].id),[family,setFamily]=useState('size'),[subtopic,setSubtopic]=useState('all'),[mode,setMode]=useState('history'),[frequency,setFrequency]=useState(''),[selected,setSelected]=useState(''),[tab,setTab]=useState('monitor');
 const groupInfo=data.groups.find(g=>g.id===group),groupSeries=data.series.filter(s=>s.group===group),subtopics=[...new Set([...groupInfo.subtopics,...groupSeries.map(s=>s.subtopic)])];
 const inScope=groupSeries.filter(s=>s.family===family&&(subtopic==='all'||s.subtopic===subtopic||s.related_subtopics?.includes(subtopic)));
 const eligible=inScope.filter(s=>visibleObservations(s,mode).length),frequencies=[...new Set(eligible.map(s=>s.frequency))],effectiveFrequency=frequencies.includes(frequency)?frequency:frequencies[0];
 const rows=eligible.filter(s=>s.frequency===effectiveFrequency),focus=rows.find(s=>s.id===selected)||rows[0];
 const columns=axisPeriods(rows,mode);
 const notes=research?.report_insights||reportInsightRows(legacy);
 function chooseGroup(id){setGroup(id);setSubtopic('all');setFrequency('');setSelected('');setMode('history');setFamily('size');}
 const selectedRecords=focus?visibleObservations(focus,mode):[];
 return <div className="report-monitor">
  <SegmentedControl className="panel-tabs report-business-tabs" label="业务大类" options={data.groups.map(g=>({id:g.id,label:g.name}))} value={group} onChange={chooseGroup}/>
  <div className="report-monitor-toolbar"><div className="pills" role="group" aria-label="监测内容">{[['monitor','指标监测'],['dictionary','数据底表与口径']].map(([id,label])=><button key={id} aria-pressed={tab===id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{label}</button>)}</div><span>资料核查至 {data.as_of}</span></div>
  {tab==='monitor'&&<>
   <section className="card panel-controls"><div className="source-filters">
    <Select label="细分方向" value={subtopic} onChange={v=>{setSubtopic(v);setSelected('');}} options={[["all","全部方向"],...subtopics.map(v=>[v,v])]}/>
    <Select label="观察指标" value={family} onChange={v=>{setFamily(v);setFrequency('');setSelected('');}} options={Object.entries(FAMILY)}/>
    <Select label="数据性质" value={family==='revision'?'forecast':mode} onChange={v=>{setMode(v);setFrequency('');}} disabled={family==='revision'} options={[["history","历史统计 / 估计"],["forecast","预测"]]}/>
    <Select label={family==='revision'?'比较方式':'数据频率'} value={effectiveFrequency||''} onChange={setFrequency} options={frequencies.length?frequencies.map(f=>[f,FREQUENCIES[f]||f]):[['','暂无可比数据']]}/>
   </div><div className="panel-actions"><span>{groupInfo.boundary}</span><button className="text-button" onClick={()=>{setSubtopic('all');setFamily('size');setFrequency('');setMode('history');setSelected('');}}>重置筛选</button><button className="text-button" onClick={()=>save(`${groupInfo.name}_${FAMILY[family]}.csv`,monitorCsv(rows,mode))}><Download size={14}/>导出当前数据</button></div></section>
   <section className="card"><div className="section-heading"><div><h2>{groupInfo.name} · {FAMILY[family]}</h2><p>{family==='revision'?'列：预测发布版本；目标期固定。':'列：数据对应期间。'}</p></div></div>
    {rows.length?<div className="table-scroll matrix-scroll" role="region" aria-label="研报指标矩阵" tabIndex={0}><table className="report-monitor-matrix"><thead><tr><th>细分指标 / 机构</th><th>单位</th>{columns.map(p=><th key={p}>{p}</th>)}</tr></thead><tbody>{rows.map(s=>{const cells=periodCells(s,mode);return <tr key={s.id} className={focus?.id===s.id?'selected-row':''}><th><button className="text-button" onClick={()=>setSelected(s.id)} aria-pressed={focus?.id===s.id}>{s.title}</button><small>{s.subtopic} · {s.provider}</small></th><td>{s.unit}</td>{columns.map(p=>{const values=cells.get(p);return <td key={p}><button onClick={()=>setSelected(s.id)}>{values?.length===1?<><b>{numberText(values[0])}</b>{values[0].nature==='forecast'&&<small>预测</small>}{values[0].nature==='estimate'&&<small>估计</small>}</>:values?.length>1?'多版本':'—'}</button></td>;})}</tr>;})}</tbody></table></div>:<div className="notice"><p>暂无可比序列。</p>{inScope.some(s=>s.observations.some(o=>o.nature==='forecast'))&&mode==='history'&&<button className="text-button" onClick={()=>setMode('forecast')}>查看已有预测</button>}<p>缺失不代表零。</p></div>}
    <p className="panel-note">— 无数据 · † 源内冲突 · 约 / 近 / &gt; 原文限定 · 指标不加总</p>
   </section>
   {focus&&<>
    <section className="card"><div className="section-heading"><div><h2>{focus.title}</h2><p>{focus.geography} · {focus.scope}</p></div><span className="report-unit">{focus.unit}</span></div>
     {focus.family==='revision'&&<p className="report-axis-caption">横轴：发布版本；预测目标期：{[...new Set(selectedRecords.map(o=>o.period))].join('、')}</p>}
     <Chart series={focus} mode={mode}/><p className="panel-reading">{changeText(focus,mode,data.series)}</p><p className="panel-note">{focus.comparability_note}</p>{selectedRecords.some(o=>qualifier(o.qualifier))&&<p className="panel-note">柱高为近似值或边界。</p>}{selectedRecords.some(o=>o.nature==='forecast')&&<p className="panel-note">空心虚线柱：预测。</p>}
    </section>
    <section className="card"><div className="section-heading"><div><h2>数据来源</h2></div></div><div className="table-scroll"><table><thead><tr><th>数据期间 / 目标期</th><th>数值</th><th>性质</th><th>发布日期 / 版本</th><th>报告与页码</th><th>证据说明</th></tr></thead><tbody>{selectedRecords.map(o=><tr key={o.id}><td>{o.period}</td><td>{numberText(o,focus.unit)}</td><td>{NATURES[o.nature]||o.nature}{o.calculation||o.formula?<small>含计算，见说明</small>:null}</td><td>{o.publication_date||'发布日期待确认'}{o.page_last_modified&&<small>页面修订：{o.page_last_modified}</small>}<small>{o.vintage&&o.vintage!==o.publication_date?`版本：${o.vintage}`:''}</small></td><td><SourceLink url={o.source_url}>{o.report_title||focus.provider}</SourceLink><small>{o.page||'公开正文'}</small></td><td>{o.definition_note||o.evidence_note||o.evidence_excerpt||o.evidence||o.quote||''}{o.publication_date_note&&<small>{o.publication_date_note}</small>}{o.normalization_note&&<small>{o.normalization_note}</small>}{(o.formula||o.calculation)&&<p>{typeof(o.formula||o.calculation)==='string'?(o.formula||o.calculation):JSON.stringify(o.formula||o.calculation)}{o.formula_unit?`（公式原始单位：${o.formula_unit}）`:''}</p>}</td></tr>)}</tbody></table></div></section>
   </>}
  </>}
  {tab==='dictionary'&&<section className="card"><div className="section-heading"><div><h2>{groupInfo.name} · 指标底表</h2></div><button className="button secondary" onClick={()=>save('四类业务_研报观测底表.csv',monitorCsv(data.series))}><Download size={15}/>导出完整底表</button></div><div className="table-scroll"><table><thead><tr><th>细分方向</th><th>指标</th><th>统计范围 / 单位</th><th>原始机构</th><th>数据频率</th><th>已取得期间 / 版本</th><th>比较限制</th></tr></thead><tbody>{groupSeries.map(s=><tr key={s.id}><td>{s.subtopic}</td><td><button className="text-button" onClick={()=>{setTab('monitor');setFamily(s.family);setSubtopic('all');setFrequency(s.frequency);setMode(s.observations.every(o=>o.nature==='forecast')?'forecast':'history');setSelected(s.id);}}>{s.title}</button><small>{FAMILY[s.family]}</small></td><td>{s.scope}<small>{s.unit}</small></td><td>{s.provider}</td><td>{FREQUENCIES[s.frequency]||s.frequency}</td><td>{[...new Set(s.observations.map(o=>s.family==='revision'?o.vintage:o.period))].join('、')}</td><td>{s.comparability_note}</td></tr>)}</tbody></table></div></section>}
  <details className="card report-method"><summary>{groupInfo.name} · 数据缺口</summary><p>{groupInfo.boundary}</p><ul>{[...new Set(groupSeries.flatMap(s=>s.severe_gaps||[]))].map(t=><li key={t}>{t}</li>)}</ul>{data.gaps.filter(g=>!g.group||g.group===group||g.parent===group).map((g,i)=><p key={i}>{typeof g==='string'?g:g.reason||g.description||g.gap||g.title}</p>)}<p>{data.scope_notice}</p></details>
  <details className="card report-method"><summary>统计规则</summary><ul>{data.rules.map(t=><li key={t}>{t}</li>)}</ul></details>
  <details className="card report-method"><summary>原有研究笔记</summary>{notes.map(n=><div className="report-chart-note" key={n.id}><b>{n.title}</b>{n.note&&<p>{n.note}</p>}<button className="text-button" disabled={!onEdit} onClick={()=>onEdit?.('report_insights',n.id,n)}>查看与编辑</button></div>)}</details>
 </div>;
}
