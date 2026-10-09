'use client';
import {cloneElement,useMemo} from 'react';
import {BarChart,Bar,Cell,Rectangle,XAxis,YAxis,Tooltip,DefaultTooltipContent,Legend,ResponsiveContainer,CartesianGrid,ReferenceDot} from 'recharts';
import {chartData,tooltipPayload,zeroValueRows} from '@/lib/trend-bars.js';

// Background geometry is the target layout; only y/height use Recharts' animation frames.
function HeightOnlyBar({background,...props}){
 return <Rectangle {...props} x={background.x} width={background.width} isUpdateAnimationActive={false}/>;
}

function ChartTooltip({renderer,payload,...props}){
 const entries=tooltipPayload(payload);
 return entries.length?cloneElement(renderer||<DefaultTooltipContent/>,{...props,payload:entries}):null;
}

export default function TrendBarChart({data,bars,yAxis={},tooltip={},showZeroValues=false,zeroUnit='',seriesKey=''}){
 const drawingData=useMemo(()=>chartData(data,bars),[data,bars]);
 return <div className="trend-chart"><ResponsiveContainer width="100%" height="100%">
  <BarChart data={drawingData} margin={{top:15,left:0,right:12,bottom:0}} barGap={4} barCategoryGap="20%" accessibilityLayer>
   <CartesianGrid vertical={false} stroke="#edf0f5"/>
   <XAxis dataKey="label" tick={{fontSize:12,fill:'#64748b'}} tickLine={false} axisLine={{stroke:'#e2e8f0'}}/>
   <YAxis width={66} tick={{fontSize:12,fill:'#64748b'}} tickLine={false} axisLine={false} {...yAxis}/>
   <Tooltip cursor={{fill:'#f1f5f9'}} contentStyle={{border:'1px solid #dae3ee',borderRadius:7,padding:13,fontSize:14,lineHeight:1.8,boxShadow:'0 4px 16px #12233c12'}} {...tooltip} content={<ChartTooltip renderer={tooltip.content}/>}/>
   <Legend wrapperStyle={{fontSize:12,paddingTop:8}}/>
   {bars.map(({dataKey,...bar})=><Bar key={dataKey} dataKey={'_barValues.'+dataKey} shape={<HeightOnlyBar/>} radius={[3,3,0,0]} maxBarSize={44} isAnimationActive="auto" animationDuration={650} animationEasing="ease-in-out" {...bar}>
    {data.map((p,i)=><Cell key={p.id||p.month||i} fillOpacity={p.partial ? .5 : 1} stroke={p.partial?bar.fill:undefined} strokeDasharray={p.partial?'3 3':undefined}/>)}
   </Bar>)}
  {showZeroValues&&zeroValueRows(data,bars).map((p,i)=><ReferenceDot key={`${seriesKey}:${p.id||p.month||i}`} x={p.label} y={0} r={0} fill="none" stroke="none" ifOverflow="extendDomain" className="chart-zero-marker" label={{className:'chart-zero-value-label',value:`0${zeroUnit}`,position:'top',offset:7,fontSize:11,fill:'#536783'}}/>)}
  </BarChart>
 </ResponsiveContainer></div>;
}
