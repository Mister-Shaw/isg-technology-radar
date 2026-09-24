'use client';
import {useState} from 'react';
import {dateWindow,monthsInWindow,monthLabel} from '@/lib/model';
import {PARENTS,CHILDREN,parentOf} from '@/lib/hierarchy';
import {panelColors} from '@/lib/panel';
import {categoryMonthRows,categoryMonthlyCsv} from '@/lib/monthly';
const metrics={total_amount:'合并披露金额',events:'收录独立事件'};
const fmt=n=>n==null?'—':n.toLocaleString('zh-CN',{maximumFractionDigits:2});
export default function CategoryTrends({window,rows,leads,eligible,reported,combined,category,month,onSelect,download,onEdit}){
 const w=dateWindow(window),months=monthsInWindow(w),[metric,setMetric]=useState('total_amount'),[level,setLevel]=useState('parent'),definitions=level==='parent'?PARENTS:CHILDREN,matrix=categoryMonthRows(rows,leads,eligible,reported,w,combined,definitions),money=metric==='total_amount',colors=panelColors([{points:matrix.map(r=>({value:r[metric]??null}))}]);
 return <section className="card category-trends" id="category-trends">
  <div className="section-heading"><div><h2>按月 × 按分类看趋势</h2><p>{level==='parent'?'5 个父类':'14 个子项'} · 点击筛选记录</p></div><button className="button secondary" disabled={!onEdit} onClick={()=>download(`${w.start}_${w.end}_${level==='parent'?'父类':'子类'}_分类月度趋势.csv`,categoryMonthlyCsv(matrix),'text/csv;charset=utf-8')}>导出分类月表</button></div>
  <div className="trend-options"><label>分类层级<select aria-label="月度分类层级" value={level} onChange={e=>setLevel(e.target.value)}><option value="parent">父类 · 5个方向</option><option value="child">子类 · 14个观察项</option></select></label><label>观察指标<select aria-label="趋势观察指标" value={metric} onChange={e=>setMetric(e.target.value)}>{Object.entries(metrics).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><span>{money?'单位：人民币万元 · 区间按下限着色':'单位：独立事件数'}</span></div>
  <div className="table-scroll"><table className="trend-matrix"><caption className="sr-only">各分类{w.start}至{w.end}的{metrics[metric]}</caption><thead><tr><th scope="col">项目分类</th>{months.map(m=><th scope="col" key={m}>{monthLabel(m,w)}</th>)}</tr></thead><tbody>{Object.entries(definitions).map(([id,label])=><tr key={id} className={id===category?'selected-trend':''}><th scope="row"><button onClick={()=>onSelect(id,'all',metric)}>{label}</button>{level==='child'&&<small className="muted">{PARENTS[parentOf(id)]}</small>}</th>{matrix.filter(r=>r.category===id).map(r=>{const v=r[metric]??null,selected=id===category&&r.month===month,valueLabel=money&&r.total_amount_upper!==v?`${fmt(v)}—${fmt(r.total_amount_upper)}`:fmt(v);return <td key={r.month}><button aria-pressed={selected} aria-label={`${label} ${r.month} ${metrics[metric]} ${v==null?'未收录':valueLabel+(money?'万元':'')}，筛选记录`} title={money?`${r.total_amount_count} 个去重金额项；合并披露 ${valueLabel} 万元`:`收录 ${r.records} 条 / ${r.events} 个事件`} onClick={()=>onSelect(id,r.month,metric)} style={{background:colors.background(v),color:'#284e81'}}>{money&&r.total_amount_upper!==v?<>{fmt(v)}<br/>—{fmt(r.total_amount_upper)}</>:fmt(v)}</button></td>;})}</tr>)}</tbody></table></div>
  <p className="footnote">色阶：{fmt(colors.min)}—{fmt(colors.max)}{money?' 万元':' 个事件'} · {money?'— 无可合并金额':'0 当前样本未收录'} · * 非完整月</p>
 </section>;
}
