import fs from'node:fs';
import{BOARDS,KEYWORD_RULE_VERSION,classifyBoards}from'../lib/keyword-boards.js';
const read=n=>JSON.parse(fs.readFileSync(new URL('../'+n,import.meta.url))),write=(n,d)=>fs.writeFileSync(new URL('../'+n,import.meta.url),JSON.stringify(d));
const panel=read('public/market-panel.json'),research=read('data/research-2026.json'),legacy=panel.taxonomy.legacy||{...panel.taxonomy};
delete legacy.boards;delete legacy.legacy;
const compact=r=>Object.fromEntries(BOARDS.map(b=>[b.id,r[b.id]]));
for(const r of panel.documents){r.board_matches=compact(classifyBoards(r,'news'));r.keyword_rule_version=KEYWORD_RULE_VERSION;}
for(const r of [...research.events,...research.leads]){r.board_matches=compact(classifyBoards(r,'research'));r.keyword_rule_version=KEYWORD_RULE_VERSION;}
panel.taxonomy={version:KEYWORD_RULE_VERSION,reclassified_at:'2026-10-08',boards:BOARDS,groups:BOARDS[0].categories.map(c=>({id:c.id,name:c.name,keywords:c.keywords})),legacy,rules:['三看板分别为业务方向4类、核心部件9类、场景生态8类。','全部固定媒体新闻为共同分母；新闻仅按标题，研究按标题和事实摘要。','同一记录允许多标签，跨类和跨看板金额不相加。','原始历史技术标签与用户笔记保留，新看板按当前关键词实时投影。']};
write('public/market-panel.json',panel);write('data/research-2026.json',research);
const sources=read('public/sample-sources.json');sources.taxonomy=panel.taxonomy;sources.sources=panel.sources.filter(s=>['media','official'].includes(s.group)&&!s.document_source_id);write('public/sample-sources.json',sources);
write('public/taxonomy-review.json',{version:KEYWORD_RULE_VERSION,boards:BOARDS,window:panel.window,news_documents:panel.documents.length,research_records:research.events.length+research.leads.length,method:panel.taxonomy.rules,audit_url:'/keyword-scan-20261008.json'});
console.log('Rebuilt three keyword board projections without changing raw categories or amounts');
