import fs from 'node:fs';
import {BOARDS,KEYWORD_RULE_VERSION,compactBoardMatches} from '../lib/keyword-boards.js';
import {fileURLToPath} from 'node:url';
import {TECHS} from '../lib/model.js';
import {GROUPS,CHILDREN,observationCategories,TAXONOMY_VERSION,TAXONOMY_NOTE,XPU_NOTE} from '../lib/hierarchy.js';
const read=name=>JSON.parse(fs.readFileSync(new URL('../'+name,import.meta.url),'utf8'));
const write=(name,value)=>fs.writeFileSync(new URL('../'+name,import.meta.url),JSON.stringify(value));
export function refreshTaxonomy(panel,research,sources,date=new Date().toISOString().slice(0,10)){
const rolling=research.october_refresh||research.manual_refresh||research.rolling_update;
for(const r of panel.documents)r.observation_categories=observationCategories(r,r.context_class==='procurement'?'research':'news');
for(const source of panel.sources)if(source.kind==='news'&&source.application_reviewed!==false)source.application_reviewed_topics??=Object.keys(TECHS).filter(id=>id!=='xpu');
const taxonomy={version:TAXONOMY_VERSION,reclassified_at:date,groups:GROUPS,children:CHILDREN,rules:[TAXONOMY_NOTE,XPU_NOTE,'固定媒体全部新闻为分母；各月份统一标题识别；只重算分类，未新增采集。','海光或鲲鹏备选同时计入路线提及，不能理解为均已采用。父类并集去重。'],xpu_search_status:'历史资料重识别；未完成专项补采',application_new_topics:'海光、鲲鹏、xPU标题行为复核未完成',procurement_new_topics:'海光、鲲鹏、xPU适用分母未建立'};
if(rolling){taxonomy.xpu_search_status=`${rolling.checked_at.slice(0,10)}完成本批限定主题与来源的补采；执行不等于全量覆盖`;taxonomy.rules[2]='固定媒体全部新闻为分母；各月份统一标题识别；历史补录与新发生事件分开。';taxonomy.rolling_batch=rolling.id;}
for(const r of panel.documents){r.board_matches=compactBoardMatches(r,'news');r.keyword_rule_version=KEYWORD_RULE_VERSION;}
const currentTaxonomy={version:KEYWORD_RULE_VERSION,reclassified_at:date,boards:BOARDS,groups:BOARDS[0].categories.map(c=>({id:c.id,name:c.name,keywords:c.keywords})),legacy:taxonomy,rules:['三看板分别为业务方向4类、核心部件9类、场景生态8类。','全部固定媒体新闻为共同分母；新闻仅按标题，研究按标题和事实摘要。','同一记录允许多标签，跨类和跨看板金额不相加。','原始历史技术标签与用户笔记保留，新看板按当前关键词实时投影。']};
panel.taxonomy=currentTaxonomy;
sources.taxonomy=currentTaxonomy;sources.sources=panel.sources.filter(s=>['media','official'].includes(s.group)&&!s.document_source_id);
const researchRows=[...research.events,...research.leads];
const review={...currentTaxonomy,window:panel.window,news_documents:panel.documents.length,research_records:researchRows.length,topics:Object.fromEntries(['hygon','kunpeng_route','xpu'].map(id=>[id,{news_ids:panel.documents.filter(r=>r.context_class!=='procurement'&&!r.superseded&&r.observation_categories.includes(id)).map(r=>r.id),research_ids:researchRows.filter(r=>observationCategories(r).includes(id)).map(r=>r.id)}]))};
return {panel,sources,review};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
const {panel,sources,review}=refreshTaxonomy(read('public/market-panel.json'),read('data/research-2026.json'),read('public/sample-sources.json'),process.argv.find(a=>/^\d{4}-\d{2}-\d{2}$/.test(a)));
write('public/market-panel.json',panel);write('public/sample-sources.json',sources);write('public/taxonomy-review.json',review);
console.log(JSON.stringify({version:TAXONOMY_VERSION,records:review.research_records,documents:panel.documents.length,topics:Object.fromEntries(Object.entries(review.topics).map(([k,v])=>[k,{news:v.news_ids.length,research:v.research_ids.length}]))}));
}
