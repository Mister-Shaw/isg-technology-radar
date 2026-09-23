import {TECHS} from './model.js';

// Business taxonomy: overlapping observation topics, not exclusive market segments.
export const GROUPS=[
 {id:'processors',name:'处理器与异构计算',children:['domestic_gpu','xpu','hygon','kunpeng_route']},
 {id:'systems',name:'算力系统与数据互连',children:['supernode','optical_switch','ai_storage']},
 {id:'platforms',name:'算力平台与运营',children:['compute_field','compute_rental','token_factory']},
 {id:'facilities',name:'数据中心设施与能效',children:['aidc','modular_dc','liquid_cooling']},
 {id:'design',name:'EDA工具与设计算力',children:['eda']}
];
export const CHILDREN=Object.fromEntries(GROUPS.flatMap(g=>g.children.map(id=>[id,({hygon:'海光〔路线〕',kunpeng_route:'鲲鹏〔路线〕',xpu:'xPU / 异构加速'})[id]||TECHS[id]])));
export const PARENTS=Object.fromEntries(GROUPS.map(g=>[g.id,g.name]));
export const CLASS_LABELS={...PARENTS,...CHILDREN,focus:'常规芯片采购补充'};
export const childIds=id=>GROUPS.find(g=>g.id===id)?.children||[id];
export const parentOf=id=>GROUPS.find(g=>g.children.includes(id))?.id;
export const normalizeChip=t=>({hygon_cpu:'hyg_cpu',hygon_dcu:'hyg_dcu',kunpeng_cpu:'kunpeng'}[t]||t);
export const matchesChip=(r,chip)=>chip==='all'||(r.tags||[]).some(t=>normalizeChip(t)===chip);
export const TAXONOMY_NOTE='五个父类按业务层次聚合，十四个子项保留技术主题与重点路线。海光、鲲鹏统计路线提及，包含未确定的备选路线，不等于已采用。父类按底层记录取并集，不能把子类数值相加；跨父类仍可重叠。';
export const XPU_NOTE='xPU观察口径：显式xPU、异构计算/算力/加速，以及服务器或数据中心场景的NPU、DPU、FPGA、专用加速器；单独出现普通CPU/GPU不自动纳入。排除明确消费终端、汽车与手机场景。';
export const hasXpu=text=>!/(手机|智能手表|自动驾驶|车载|车规|游戏本|笔记本|AI\s*PC|高校训练营|启航营|MCU|边缘端|嵌入式|物理AI|端侧)/i.test(text)&&(/\bxpu\b/i.test(text)||(/异构(?:计算|算力|加速)|多架构(?:计算|融合)|\b(?:NPU|DPU|FPGA)\b|昇腾|专用加速器/i.test(text)&&/服务器|数据中心|智算|算力|机架|机柜|云端|集群|超节点|超结点|JBOF|NVMe|RDMA/i.test(text)));
export function observationCategories(r,mode='research'){
 const result=new Set(r.categories||r.techs||[]),tags=(r.tags||[]).map(normalizeChip);
 // News is uniformly title-only; research uses recorded facts, never speculative limitations.
 const text=mode==='news'?r.title||'':[r.title,r.fact_summary].filter(Boolean).join(' ');
 if(tags.some(t=>['hyg_cpu','hyg_dcu','hygon_unspecified','hyg_or_kunpeng'].includes(t))||/海光|\bHygon\b/i.test(text))result.add('hygon');
 if(tags.some(t=>['kunpeng','hyg_or_kunpeng'].includes(t))||/鲲鹏|\bKunpeng\b/i.test(text))result.add('kunpeng_route');
 if(hasXpu(text))result.add('xpu');
 return [...result].filter(id=>Object.hasOwn(CHILDREN,id));
}
export function matchesCategory(r,id,mode='research'){
 if(id==='all')return true;
 if(id==='focus')return !(r.categories||r.techs||[]).length;
 const categories=[...(r.categories||r.techs||[]),...(r.observation_categories||observationCategories(r,mode)).filter(c=>['hygon','kunpeng_route','xpu'].includes(c))];
 return childIds(id).some(c=>categories.includes(c));
}
export const TAXONOMY_VERSION='2026-09-23-hierarchy-v1';
