'use client';
import {useState} from 'react';
import {keywordRowById} from '@/lib/keyword-boards';
import {defaultCollapsedKeywordParents,collapsibleParents,keywordRowVisible,toggleKeywordParent,setKeywordParentsCollapsed} from '@/lib/keyword-collapse';

export function useKeywordCollapse(ids){
 const [collapsed,setCollapsed]=useState(defaultCollapsedKeywordParents);
 const parents=collapsibleParents(ids),allCollapsed=parents.length>0&&parents.every(id=>collapsed.has(id));
 return {collapsed,parents,allCollapsed,visible:id=>keywordRowVisible(id,collapsed),
  toggle:id=>setCollapsed(old=>toggleKeywordParent(old,id)),
  toggleAll:()=>setCollapsed(old=>setKeywordParentsCollapsed(old,parents,!allCollapsed))};
}
export function KeywordCollapseAll({state,selected}){
 if(!state.parents.length)return null;
 const hidden=selected&&!state.visible(selected);
 return <div className="keyword-collapse-actions"><button type="button" className="button secondary" onClick={state.toggleAll}>{state.allCollapsed?'全部展开子分类':'全部收起子分类'}</button>{hidden&&<small>当前筛选：{keywordRowById(selected)?.fullLabel}（已收起）</small>}</div>;
}
export function KeywordParentToggle({id,state}){
 if(!state.parents.includes(id))return null;
 const expanded=!state.collapsed.has(id),name=keywordRowById(id)?.name;
 return <button type="button" className="keyword-collapse-toggle" aria-expanded={expanded} aria-label={`${expanded?'收起':'展开'}${name}的子分类`} title={`${expanded?'收起':'展开'}子分类`} onClick={()=>state.toggle(id)}><span aria-hidden="true">{expanded?'▾':'▸'}</span></button>;
}
