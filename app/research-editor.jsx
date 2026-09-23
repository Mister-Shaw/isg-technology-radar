'use client';
import {useEffect,useState} from 'react';
import {TECHS,STAGES,SOURCES,SCOPES} from '@/lib/model';
import {AMOUNTS,CHIPS} from '@/lib/monthly';

export default function ResearchEditor({section,itemKey,record,save}){
 const [value,setValue]=useState({...record}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[history,setHistory]=useState(null);
 const row=section==='events'||section==='leads';
 const update=(key,v)=>setValue(old=>({...old,[key]:v}));
 useEffect(()=>{let active=true;fetch(record._ref?.source==='workspace'?`/api/radar?history=${encodeURIComponent(itemKey)}`:`/api/radar?research_history=${encodeURIComponent(itemKey)}&section=${section}`,{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);if(active)setHistory(d.history);}).catch(e=>{if(active)setHistory({error:e.message});});return()=>{active=false;};},[section,itemKey]);
 const input=(label,key,type='text')=><label key={key}>{label}<input type={type} value={value[key]??''} required={['title','url'].includes(key)} onChange={e=>update(key,type==='number'?(e.target.value===''?null:Number(e.target.value)):e.target.value)} {...(type==='number'?{min:0,step:'any'}:{})}/></label>;
 const area=(label,key)=><label key={key}>{label}<textarea rows={4} value={value[key]??''} onChange={e=>update(key,e.target.value)}/></label>;
 const select=(label,key,options)=>{const items=value[key]&&!Object.hasOwn(options,value[key])?{...options,[value[key]]:value[key]}:options;return <label key={key}>{label}<select value={value[key]??Object.keys(items)[0]} onChange={e=>update(key,e.target.value)}>{Object.entries(items).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>;};
 const checks=(label,key,items)=><fieldset><legend>{label}</legend><div className="tech-checks">{Object.entries(items).map(([k,v])=><label key={k}><input type="checkbox" checked={(value[key]||[]).includes(k)} onChange={e=>update(key,e.target.checked?[...(value[key]||[]),k]:(value[key]||[]).filter(x=>x!==k))}/>{v}</label>)}</div></fieldset>;
 const narrative=section==='monthly_notes'?[['月份判断','text']]:section==='insights'?[['标题','title'],['事实','fact'],['判断','inference'],['行动','action'],['证据强度','strength']]:[['趋势','trend'],['事实','findings'],['判断','interpretation'],['行动','action'],['局限','limitations']];
 async function submit(e){e.preventDefault();setBusy(true);setError('');try{await save({section,key:itemKey,revision:record._revision||0,value});}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <form className="edit-form" onSubmit={submit}>
  <p className="soft-note">公开协作：保存后，所有访客都能看到修改。无需登录。</p>
  {row?<>{input('标题 *','title')}{input('原文链接（HTTPS）*','url','url')}{checks('技术分类（可多选；常规芯片采购可留空）','categories',TECHS)}{checks('芯片路线（仅勾选原文已明确的路线）','tags',CHIPS)}
   <div className="form-grid">{input('发布主体','publisher')}{input('买方主体','customer')}{select('来源角色','source_type',SOURCES)}{select('项目阶段','stage',STAGES)}{input('阶段说明（可空）','stage_label')}{input('披露日期','published_date','date')}{input('事件日期（可空）','event_date','date')}{input('金额（元，可空）','amount_cny','number')}{select('金额口径','amount_kind',AMOUNTS)}{select('金额范围','amount_scope',SCOPES)}{input('项目编号（未披露可空）','project_id')}{input('事件编号','event_key')}{input('标包','lot')}</div>
   <div className="form-grid">{['min','max'].map(bound=><label key={bound}>预计区间{bound==='min'?'下限':'上限'}（元，可空）<input type="number" min="0" step="any" value={value.amount_range_cny?.[bound]??''} onChange={e=>{const range={...(value.amount_range_cny||{min:null,max:null}),[bound]:e.target.value===''?null:Number(e.target.value)};update('amount_range_cny',range.min==null&&range.max==null?null:range);}}/></label>)}</div>{!!value.tags?.filter(t=>!CHIPS[t]).length&&<p className="muted">保留已有技术标签：{value.tags.filter(t=>!CHIPS[t]).join('、')}</p>}{area('金额原文及区间说明','amount_text')}{area('事实摘要','fact_summary')}{area('局限与待核问题','limitations')}{area('原文读取结果','source_read_result')}{area('共享研究笔记','note')}{area('战略判断（推断）','implication')}{input('下次核查日期（不自动提醒）','followup_on','date')}
   {select('证据状态','evidence_status',{primary:'原始披露已核',reported:'报道待原文确认',lead:'待核线索',conflict:'存在冲突',vendor:'厂商自报'})}
   <label className="check-line"><input type="checkbox" checked={!!value.verified_fulltext} onChange={e=>update('verified_fulltext',e.target.checked)}/>已核对原文正文、日期、主体和金额</label>
   <label className="check-line"><input type="checkbox" checked={value.amount_eligible!==false} onChange={e=>update('amount_eligible',e.target.checked)}/>符合现有去重及金额口径时允许参与汇总</label>
   <p className="muted">所有条目均进入统一数据库；正文核验影响证据状态，不影响收录。已核与待核披露金额分列，冲突和预计区间保留详情。关联来源和其他未修改的证据字段会保留。填写确定金额前请清空预计区间。</p>
  </>:narrative.map(([label,key])=>area(label,key))}
  {error&&<p className="error" role="alert">{error}</p>}
  <button className="button primary save-button" type="submit" disabled={busy}>{busy?'正在保存…':'保存共享修改'}</button>
  <details className="history"><summary>修改历史 · 当前版本 {record._revision||0}</summary>{history===null?<p>正在加载…</p>:history.error?<p className="error">{history.error}</p>:history.length?history.map(h=><details key={`${h.source}-${h.data.id}-${h.data.revision}`}><summary>{h.source} · 版本 {h.data.revision} · {new Date(h.at).toLocaleString('zh-CN')}</summary>{Object.entries(h.data.value||h.data).filter(([k,v])=>typeof v==='string'&&['title','fact_summary','limitations','note','text','fact','inference','action','trend','findings','interpretation'].includes(k)).map(([k,v])=><p key={k}>{v}</p>)}</details>):<p>初始研究内容，暂无后续修改。</p>}</details>
 </form>;
}
