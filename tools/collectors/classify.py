"""Apply the existing title dictionary uniformly; keep every news article in N."""
import importlib.util,json,pathlib,re
BASE=pathlib.Path(__file__).resolve().parent
ROOT=BASE/'output'
ROOT.mkdir(parents=True,exist_ok=True)
spec=importlib.util.spec_from_file_location('title_rules',BASE/'doit/collect_news.py')
rules=importlib.util.module_from_spec(spec);spec.loader.exec_module(rules)
documents=[];sources=[];audit=[]
unavailable=[{'name':'企业网 D1Net','reason':'历史归档访问受限，未纳入新闻分母。'}]
for folder in ['c114','zhiding','cbinews','kunpeng','hygon']:
    path=ROOT/folder
    if not (path/'articles.json').exists() or not (path/'coverage.json').exists():continue
    raw=json.loads((path/'articles.json').read_text(encoding='utf-8-sig'))
    coverage=json.loads((path/'coverage.json').read_text(encoding='utf-8-sig'))
    if not raw:
        unavailable.append({'name':coverage['name'],'reason':'尚未取得可枚举的完整新闻目录，未纳入分母，不能解释为零消息。'})
        continue
    rows=[r for r in raw if r.get('entry_kind') not in ['topic_or_live','special_or_landing'] and '2026-01-01'<=r['date']<='2026-09-20']
    seen={};classified=[]
    for row in sorted(rows,key=lambda r:(r['date'],r['id'])):
        c=rules.classify(row['title'],'')
        key=re.sub(r'\W+','',row['title']).lower();duplicate=seen.get(key);seen.setdefault(key,row['id'])
        classified.append({**row,**c,'duplicate_of':duplicate,'date_basis':row.get('date_basis','publisher_archive_date')})
    sid=coverage['source_id'];vendor=folder in ['kunpeng','hygon']
    monthly=[{'month':m['month'],'status':'complete' if m['complete'] else 'incomplete','total':sum(r['month']==m['month'] for r in classified),'eligible':sum(r['month']==m['month'] and not r['duplicate_of'] for r in classified),'note':m.get('note','')} for m in coverage['months']]
    unique=sum(not r['duplicate_of'] for r in classified)
    sources.append({'id':sid,'kind':'news','group':'official' if vendor else 'media','name':coverage['name'],'url':coverage['url'],'scope':coverage['scope'],'method':coverage['method']+' 所有来源统一使用同一标题分类词表；同源规范化标题去重，跨来源报道分别计数。专题/直播入口不是新闻文章，按文档类型排除。','limitation':f'新闻文章{len(classified):,}篇，同源标题去重后{unique:,}篇；所有主题保留在分母。'+('厂商官网发声单独观察，不并入媒体合计。' if vendor else '')+' '.join(coverage.get('limitations',[])[:2]),'application_reviewed':False,'coverage':monthly,'collected_at':coverage.get('collected_at'),'date_checks':coverage.get('date_checks')})
    assert len({r['id'] for r in classified})==len(classified)
    documents.extend(classified);audit.append({'source_id':sid,'raw_entries':len(raw),'news_articles':len(classified),'non_article_entries_excluded':len(raw)-len(classified),'unique_news':unique,'technology_titles':sum(not r['duplicate_of'] and r['eligible'] and bool(r['categories']) for r in classified),'monthly_denominators':[m['eligible'] for m in monthly]})
assert len({r['id'] for r in documents})==len(documents)
(ROOT/'classified.json').write_text(json.dumps({'sources':sources,'documents':documents,'unavailable_sources':unavailable},ensure_ascii=False),encoding='utf-8')
(ROOT/'integration-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(audit,ensure_ascii=True))
