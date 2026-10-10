// Show observed news ratios normally while preserving completeness for analysis/export.
// Missing or unreviewed data remains missing; this does not impute observations.
export function presentPanelMatrix(matrix,kind){
 if(kind!=='news')return matrix;
 return matrix.map(row=>({...row,points:row.points.map(p=>p.N>0&&Number.isFinite(p.value??p.sample_value)?{
  ...p,value:p.value??p.sample_value,upper:p.upper??p.sample_upper,unknown:p.unknown??p.sample_unknown,
  observedPresentation:true,status:p.complete?p.status:'已采样本'
 }:{...p,status:p.status==='覆盖不完整'?'暂无可计算数据':p.status})}));
}

// Missing denominators must not look like an observed zero-hit sample.
export function panelSampleLabel(point){
 return point.N>0?`${point.n}/${point.N}${point.u?`（?${point.u}）`:""}`:"暂无样本";
}
