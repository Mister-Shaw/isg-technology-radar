export const NATURES={actual:'历史统计',estimate:'历史估计',forecast:'预测',derived:'计算值'};
export const FREQUENCIES={annual:'年度',yearly:'年度',quarterly:'季度',half_year_H1_only:'历年上半年',half_year:'半年度',halfyear:'半年度',semiannual:'半年度',monthly:'月度',snapshot:'时点',monthly_daily_average:'月内日均时点',annual_forecast:'年度预测',forecast_vintage:'预测版本',publication_vintage_fixed_target:'预测版本'};
export function qualifier(q){return ({'等于':'','=':'','约':'约','approximately':'约','approx':'约','near':'近','接近':'近','>':'>','≥':'≥','<':'<','≤':'≤','超过':'>','大于':'>','至少':'≥'})[q]??q??'';}
export function numberText(o,withUnit=''){if(!o)return '—';return `${qualifier(o.qualifier)}${Number(o.value).toLocaleString('zh-CN',{maximumFractionDigits:3})}${withUnit?` ${withUnit}`:''}${o.conflict_id?'†':''}`;}
export function isForecast(o){return o.nature==='forecast'||o.base_nature==='forecast';}
export function visibleObservations(s,mode='history'){
 const rows=s.observations.filter(o=>mode==='all'||(mode==='forecast'?isForecast(o):!isForecast(o)));
 return [...rows].sort((a,b)=>String(s.family==='revision'?a.vintage:a.period).localeCompare(String(s.family==='revision'?b.vintage:b.period))||String(a.vintage).localeCompare(String(b.vintage)));
}
export function pointKey(s,o){return s.family==='revision'?o.vintage:o.period;}
export function periodCells(s,mode){const map=new Map();for(const o of visibleObservations(s,mode)){const k=pointKey(s,o);if(!map.has(k))map.set(k,[]);map.get(k).push(o);}return map;}
export function latestObservation(s,mode){return visibleObservations(s,mode).at(-1);}
export function changeText(s,mode,allSeries=[]){
 const rows=visibleObservations(s,mode),last=rows.at(-1),prev=rows.at(-2);if(!last)return '当前范围尚未取得可用数值。';
 const latest=`${s.family==='revision'?`${last.vintage}版（目标${last.period}）`:last.period}：${numberText(last,s.unit)}。`;
 const growthSeries=allSeries.find(g=>g.id===s.linked_growth_id),growth=growthSeries?.observations.find(o=>o.period===last.period&&!isForecast(o));
 if(growth)return latest+`机构披露同期同比：${numberText(growth,'%')}（沿用机构口径）。`;
 if(!prev||!s.allow_auto_delta||qualifier(last.qualifier)||qualifier(prev.qualifier))return latest+'按来源原值显示；未自动推算增长。';
 if(s.family!=='revision'&&last.period===prev.period)return latest+'同一期间有多个版本，详见数据依据。';
 const delta=last.value-prev.value;if(['growth','penetration'].includes(s.family))return latest+`较${prev.period}${delta>=0?'增加':'减少'}${Math.abs(delta).toFixed(2)}个百分点。`;
 if(!prev.value)return latest;
 const pct=delta/Math.abs(prev.value)*100;
 return latest+(s.family==='revision'?`相对${prev.vintage}版${pct>=0?'上调':'下调'}`:`相对${prev.period}${pct>=0?'增加':'减少'}`)+`${Math.abs(pct).toFixed(1)}%${s.family==='revision'?'（预测变化）':'（按两期公布值计算）'}。`;
}
export function monitorCsv(series,mode='all'){
 const rows=[['大类','子方向','指标','单位','统计范围','数据期间/目标期','数值','限定符','性质','发布日','预测版本','来源','页码/章节','比较限制']];
 for(const s of series)for(const o of mode==='all'?s.observations:visibleObservations(s,mode))rows.push([s.group,s.subtopic,s.title,s.unit,s.scope,o.period,o.value,o.qualifier,NATURES[o.nature]||o.nature,o.publication_date,o.vintage,o.source_url,o.page,s.comparability_note]);
 return '\ufeff'+rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');
}

export function axisPeriods(series,mode='history'){
 const keys=[...new Set(series.flatMap(s=>visibleObservations(s,mode).map(o=>pointKey(s,o))))].sort();
 if(!keys.length||series.some(s=>s.family==='revision'))return keys;
 const frequency=series[0]?.frequency;
 const parse=k=>frequency==='quarterly'?Number(k.slice(0,4))*4+Number(k.slice(-1))-1:frequency==='half_year'?Number(k.slice(0,4))*2+Number(k.slice(-1))-1:Number(k.slice(0,4));
 const valid=keys.every(k=>frequency==='quarterly'?/^\d{4}Q[1-4]$/.test(k):frequency==='half_year'?/^\d{4}H[12]$/.test(k):frequency==='half_year_H1_only'?/^\d{4}H1$/.test(k):frequency==='annual'?/^\d{4}$/.test(k):false);
 if(!valid)return keys;const start=parse(keys[0]),end=parse(keys.at(-1));if(end-start>40)return keys;
 return Array.from({length:end-start+1},(_,i)=>{const n=start+i;return frequency==='quarterly'?`${Math.floor(n/4)}Q${n%4+1}`:frequency==='half_year'?`${Math.floor(n/2)}H${n%2+1}`:frequency==='half_year_H1_only'?`${n}H1`:String(n);});
}

// Numeric domains and explicit nice ticks prevent floating-point tails from
// becoming axis labels (e.g. 30.7 * 1.2 = 36.839999999999996).
export function numericAxis(rows){
 const values=rows.map(r=>typeof r==='number'?r:r?.value).filter(v=>typeof v==='number'&&Number.isFinite(v));
 if(!values.length||values.every(v=>v===0))return {domain:[0,1],ticks:[0,.25,.5,.75,1]};
 const min=Math.min(0,...values),max=Math.max(0,...values),lo=min<0?min*1.12:0,hi=max>0?max*1.12:0;
 const rough=(hi-lo)/4,power=10**Math.floor(Math.log10(rough));
 const factor=[1,2,2.5,5,10].find(f=>f>=rough/power)||10,step=factor*power;
 const clean=v=>Object.is(v,-0)?0:Number(v.toPrecision(12));
 const lower=clean(Math.floor(lo/step)*step),upper=clean(Math.ceil(hi/step)*step);
 const count=Math.round((upper-lower)/step),ticks=Array.from({length:count+1},(_,i)=>clean(lower+i*step));
 return {domain:[lower,upper],ticks};
}
export function formatAxisTick(value){
 if(typeof value!=='number'||!Number.isFinite(value))return '';
 const n=Number(Number(value).toPrecision(12)),abs=Math.abs(n);
 if(abs>=1e6)return new Intl.NumberFormat('zh-CN',{notation:'compact',maximumFractionDigits:2}).format(n);
 if(abs>0&&abs<1e-5)return n.toExponential(2);
 return new Intl.NumberFormat('zh-CN',{maximumFractionDigits:6}).format(n);
}
