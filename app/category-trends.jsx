'use client';
import {useKeywordCollapse,KeywordCollapseAll,KeywordParentToggle} from './keyword-collapse-controls';
import {useState} from 'react';
import {dateWindow,monthsInWindow,monthLabel} from '@/lib/model';
import {PARENTS,CHILDREN,parentOf} from '@/lib/hierarchy';
import {keywordRowById} from '@/lib/keyword-boards';
import {panelColors} from '@/lib/panel';
import {categoryMonthlyCsv} from '@/lib/monthly';
const metrics={total_amount:'合并披露金额',events:'收录独立事件'};
const fmt=n=>n==null?'—':n.toLocaleString('zh-CN',{maximumFractionDigits:2});
export default function CategoryTrends({window,definitions,boardName,matrix:allRows,category,month,onSelect,download,onEdit}){
 const collapse=useKeywordCollapse(Object.keys(definitions));
 const w=dateWindow(window),months=monthsInWindow(w),[metric,setMetric]=useState('events'),matrix=allRows.filter(r=>Object.hasOwn(definitions,r.category)),money=metric==='total_amount',colors=panelColors([{points:matrix.map(r=>({value:r[metric]??null}))}]);
 return <section className="card category-trends" id="category-trends">
  <div className="section-heading"><div><h2>按月 × 按分类看趋势</h2><p>{boardName}</p></div><button className="button secondary" disabled={!onEdit} onClick={()=>download(`${w.start}_${w.end}_${boardName}_分类月度趋势.csv`,categoryMonthlyCsv(matrix),'text/csv;charset=utf-8')}>导出分类月表</button></div>
  <div className="trend-options"><KeywordCollapseAll state={collapse} selected={category}/><label>观察指标<select aria-label="趋势观察指标" value={metric} onChange={e=>setMetric(e.target.value)}>{Object.entries(metrics).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><span>{money?'单位：人民币万元 · 区间按下限着色':'单位：独立事件数'}</span></div>
  <div className="table-scroll matrix-scroll" role="region" aria-label="分类月度趋势" tabIndex={0}><table className="trend-matrix"><caption className="sr-only">各分类{w.start}至{w.end}的{metrics[metric]}</caption><thead><tr><th scope="col">{Object.keys(definitions).some(id=>keywordRowById(id)?.level==='keyword')?'分类 / 关键词':'观察条目'}</th>{months.map(m=><th scope="col" key={m}>{monthLabel(m,w)}</th>)}</tr></thead><tbody>{Object.entries(definitions).filter(([id])=>collapse.visible(id)).map(([id,label])=><tr key={id} className={[(id===category?'selected-trend':''),(keywordRowById(id)?.level==='keyword'?'keyword-detail-row':'keyword-category-row')].join(' ')}><th scope="row"><div className="keyword-row-label"><KeywordParentToggle id={id} state={collapse}/><button onClick={()=>onSelect(id,'all',metric)}>{keywordRowById(id)?.name||label}</button></div></th>{matrix.filter(r=>r.category===id).map(r=>{const v=r[metric]??null,selected=id===category&&r.month===month,valueLabel=money&&r.total_amount_upper!==v?`${fmt(v)}—${fmt(r.total_amount_upper)}`:fmt(v);return <td key={r.month}><button aria-pressed={selected} aria-label={`${label} ${r.month} ${metrics[metric]} ${v==null?'未收录':valueLabel+(money?'万元':'')}，筛选记录`} title={money?`${r.total_amount_count} 个去重金额项；合并披露 ${valueLabel} 万元`:`收录 ${r.records} 条 / ${r.events} 个事件`} onClick={()=>onSelect(id,r.month,metric)} style={{background:colors.background(v),color:'#284e81'}}>{money&&r.total_amount_upper!==v?<>{fmt(v)}<br/>—{fmt(r.total_amount_upper)}</>:fmt(v)}</button></td>;})}</tr>)}</tbody></table></div>
  <div className="footnote panel-scale" aria-label={`${metrics[metric]}色阶图例`}><span>{fmt(colors.min)}</span><i aria-hidden="true" style={{background:colors.min===null?"#f1f3f6":`linear-gradient(to right, ${colors.background(colors.min)}, ${colors.background(colors.max)})`}}/><span>{fmt(colors.max)}{money?' 万元':' 个事件'}</span><span>{money?'— 无可合并金额':'0 当前样本未收录'} · * 非完整月</span></div>{money&&<p className="footnote">金额为相关项目披露额；分类与关键词不加总。</p>}
 </section>;
}
