// Keep one rectangle per month: Recharts matches animation frames by array index.
// Zero is only a drawing placeholder; undisclosed values remain null in the source.
export function chartData(data,bars){
 return data.map(row=>({...row,_barValues:Object.fromEntries(bars.map(({dataKey})=>[dataKey,row[dataKey]??0]))}));
}

export function tooltipPayload(payload=[]){
 return payload.flatMap(entry=>{
  const dataKey=entry.dataKey.replace(/^_barValues\./,''),value=entry.payload[dataKey];
  return value==null?[]:[{...entry,dataKey,value}];
 });
}
