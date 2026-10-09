import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {chartData,tooltipPayload,zeroValueRows} from '../lib/trend-bars.js';

const {computeBarRectangles}=createRequire(import.meta.url)('recharts/lib/cartesian/Bar.js');

test('amount bars retain month slots across missing values without reporting missing amounts as zero',()=>{
 const bars=[{dataKey:'amount'},{dataKey:'reported_amount'}];
 const variants=[
  [[30,null,90],[null,12,null]],
  [[null,50,20],[10,null,40]],
  [[null,null,null],[undefined,null,undefined]],
  [[0,0,0],[0,null,25]],
  [[75,null,15],[null,0,null]],
 ];
 for(const [amounts,reported] of variants){
  const source=amounts.map((amount,i)=>Object.freeze({month:`2026-0${i+1}`,amount,reported_amount:reported[i]}));
  const snapshot=structuredClone(source),data=chartData(source,bars);
  for(const {dataKey} of bars){
   const rectangles=computeBarRectangles({
    layout:'horizontal',barSettings:{dataKey:`_barValues.${dataKey}`,hasCustomShape:true,minPointSize:0},
    pos:{offset:0,size:20},bandSize:50,xAxis:{type:'category'},
    yAxis:{type:'number',scale:{domain:()=>[0,100],map:value=>value==null?undefined:300-value*3}},
    xAxisTicks:data.map((_,i)=>({coordinate:i*50})),yAxisTicks:[],displayedData:data,
    offset:{top:0,height:300},cells:[],parentViewBox:{x:0,y:0,width:150,height:300},dataStartIndex:0,
   });
   assert.deepEqual(rectangles.map(r=>r.originalDataIndex),[0,1,2]);
   assert.deepEqual(rectangles.map(r=>r.x),[0,50,100]);
   assert.deepEqual(rectangles.map(r=>r.height),source.map(row=>(row[dataKey]??0)*3));
   const payload=data.map(row=>({dataKey:`_barValues.${dataKey}`,value:row._barValues[dataKey],payload:row,name:dataKey,color:'#286ac5'}));
   const originalPayload=structuredClone(payload),visible=tooltipPayload(payload);
   assert.deepEqual(visible.map(({dataKey:key,value,name,color})=>({key,value,name,color})),
    source.filter(row=>row[dataKey]!=null).map(row=>({key:dataKey,value:row[dataKey],name:dataKey,color:'#286ac5'})));
   assert.deepEqual(payload,originalPayload);
  }
  assert.deepEqual(source,snapshot);
  assert.deepEqual(data.map(({amount,reported_amount})=>({amount,reported_amount})),
   source.map(({amount,reported_amount})=>({amount,reported_amount})));
 }
 assert.deepEqual(tooltipPayload(),[]);
});

test('zero feedback distinguishes measured zero from missing and recognizes all-zero datasets',()=>{
 const bars=[{dataKey:'value'},{dataKey:'observed_value'}];
 const data=[{id:'zero',value:0,observed_value:null},{id:'sample-zero',value:null,observed_value:0},{id:'missing',value:null,observed_value:null},{id:'undefined'},{id:'positive',value:5,observed_value:null}];
 assert.deepEqual(zeroValueRows(data,bars).map(row=>row.id),['zero','sample-zero']);
 assert.equal(zeroValueRows([{value:0},{value:0}],bars).length,2);
 assert.equal(zeroValueRows([{value:null},{value:null}],bars).length,0);
 assert.equal(chartData(data,bars)[0]._barValues.value,0);
});
