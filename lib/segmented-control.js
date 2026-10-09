export function segmentIndex(options,value){const i=options.findIndex(o=>o.id===value);return i<0?0:i;}
export function nextSegmentIndex(index,key,count){
 if(!count)return -1;
 if(key==='Home')return 0;
 if(key==='End')return count-1;
 if(key==='ArrowRight'||key==='ArrowDown')return (index+1)%count;
 if(key==='ArrowLeft'||key==='ArrowUp')return (index-1+count)%count;
 return -1;
}
