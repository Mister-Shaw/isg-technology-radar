'use client';
import {useLayoutEffect,useRef,useState,useEffect,useTransition} from 'react';
import {segmentIndex,nextSegmentIndex} from '@/lib/segmented-control';

export default function SegmentedControl({options,value,onChange,label,className=''}){
 const root=useRef(null),buttons=useRef([]),[box,setBox]=useState(null),[ready,setReady]=useState(false),[pressing,setPressing]=useState(false);
 const [visualValue,setVisualValue]=useState(value),[pending,startTransition]=useTransition();
 useEffect(()=>{if(!pending)setVisualValue(value);},[value,pending]);
 const active=segmentIndex(options,visualValue),signature=options.map(o=>o.id).join('|');
 useLayoutEffect(()=>{
  let live=true,frame;
  const measure=()=>{
   const target=buttons.current[active];if(!live||!target||!target.offsetWidth||!target.offsetHeight)return;
   const next={x:target.offsetLeft,y:target.offsetTop,width:target.offsetWidth,height:target.offsetHeight};
   setBox(old=>old&&Object.keys(next).every(k=>old[k]===next[k])?old:next);
   frame=requestAnimationFrame(()=>{if(live)setReady(true);});
  };
  measure();
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);
  if(root.current)observer?.observe(root.current);
  buttons.current.filter(Boolean).forEach(b=>observer?.observe(b));
  window.addEventListener('resize',measure);
  document.fonts?.ready.then(()=>{if(live)measure();});
  return()=>{live=false;cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',measure);};
 },[active,signature]);
 function select(index){if(index>=0&&index<options.length){const next=options[index].id;setVisualValue(next);startTransition(()=>onChange(next));}}
 function keydown(e,index){const next=nextSegmentIndex(index,e.key,options.length);if(next<0)return;e.preventDefault();buttons.current[next]?.focus();select(next);}
 return <div ref={root} className={`${className} glass-segmented`} role="radiogroup" aria-label={label} data-ready={ready?'true':'false'} data-pressing={pressing?'true':'false'} onPointerUp={()=>setPressing(false)} onPointerCancel={()=>setPressing(false)} onPointerLeave={()=>setPressing(false)}>
  <span className="segment-indicator" aria-hidden="true" style={box?{width:box.width,height:box.height,transform:`translate3d(${box.x}px,${box.y}px,0)`,opacity:1}:{opacity:0}}/>
  {options.map((option,index)=><button key={option.id} ref={node=>{buttons.current[index]=node;}} type="button" role="radio" aria-checked={index===active} tabIndex={index===active?0:-1} className={index===active?'selected':''} onPointerDown={()=>setPressing(true)} onKeyDown={e=>keydown(e,index)} onClick={()=>select(index)}><b>{option.label}</b></button>)}
 </div>;
}
