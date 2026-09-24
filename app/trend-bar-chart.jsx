'use client';
import {BarChart,Bar,Cell,Rectangle,XAxis,YAxis,Tooltip,Legend,ResponsiveContainer,CartesianGrid} from 'recharts';

// Background geometry is the target layout; only y/height use Recharts' animation frames.
function HeightOnlyBar({background,...props}){
 return <Rectangle {...props} x={background.x} width={background.width} isUpdateAnimationActive={false}/>;
}

export default function TrendBarChart({data,bars,yAxis={},tooltip={}}){
 return <div className="trend-chart"><ResponsiveContainer width="100%" height="100%">
  <BarChart data={data} margin={{top:15,left:0,right:12,bottom:0}} barGap={4} barCategoryGap="20%" accessibilityLayer>
   <CartesianGrid vertical={false} stroke="#edf0f5"/>
   <XAxis dataKey="label" tick={{fontSize:12,fill:'#64748b'}} tickLine={false} axisLine={{stroke:'#e2e8f0'}}/>
   <YAxis width={66} tick={{fontSize:12,fill:'#64748b'}} tickLine={false} axisLine={false} {...yAxis}/>
   <Tooltip cursor={{fill:'#f1f5f9'}} contentStyle={{border:'1px solid #dae3ee',borderRadius:7,padding:13,fontSize:14,lineHeight:1.8,boxShadow:'0 4px 16px #12233c12'}} {...tooltip}/>
   <Legend wrapperStyle={{fontSize:12,paddingTop:8}}/>
   {bars.map(({dataKey,...bar})=><Bar key={dataKey} dataKey={dataKey} shape={<HeightOnlyBar/>} radius={[3,3,0,0]} maxBarSize={44} isAnimationActive="auto" animationDuration={650} animationEasing="ease-in-out" {...bar}>
    {data.map((p,i)=><Cell key={p.id||p.month||i} fillOpacity={p.partial ? .5 : 1} stroke={p.partial?bar.fill:undefined} strokeDasharray={p.partial?'3 3':undefined}/>)}
   </Bar>)}
  </BarChart>
 </ResponsiveContainer></div>;
}
