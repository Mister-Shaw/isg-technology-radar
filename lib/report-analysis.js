// The report-derived analysis is separate from project transaction counts.
export function reportInsightRows(analysis){
 return (analysis.insights||[]).map(i=>({
  id:i.id,title:i.headline,fact:(i.facts||[]).map(f=>f.text).join('\n'),
  inference:i.inference||i.judgment||'',
  action:(i.action||i.actions||[]).map(a=>`${a.indicator}：${a.next_evidence}；范围：${a.scope}；判断条件：${a.decision_trigger}`).join('\n'),
  strength:[i.evidence_maturity?.label,i.evidence_maturity?.confidence].filter(Boolean).join(' · '),
  limitations:(i.limitations||i.uncertainties||[]).join('\n'),note:'',followup_on:null,
  analysis_as_of:analysis.as_of,source_ids:i.source_ids||[],
 }));
}

export function reportAnalysisSnapshot(snapshot,analysis){
 return {...snapshot,report_insights:reportInsightRows(analysis)};
}

export function reportMetricCsv(groups){
 const rows=[['指标组','地域','总体','指标','数值','单位','时期','数据性质','同比（%）','来源','口径'],
  ...groups.flatMap(g=>g.rows.map(r=>[g.title,g.geography,g.population,r.label,r.value??'',r.unit,r.period,r.value_type,r.yoy_percent??'',(r.source_refs||[]).map(s=>s.url).join(' | '),g.comparison_rule]))];
 return '\ufeff'+rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');
}
