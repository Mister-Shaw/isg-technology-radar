"""Collect the publisher's complete latest-article stream; no topic prefilter."""
import concurrent.futures, datetime as dt, hashlib, html, json, pathlib, re, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent / 'output' / 'zhiding'
START,END='2026-01-01','2026-09-20'
ENTRY='https://www.zhiding.cn/list-35-1-1-0-0.htm'
SID='zhiding_latest'
REFRESH = False
def get(url,path):
    if path.exists() and not REFRESH: return path.read_bytes()
    for attempt in range(3):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'PublicResearch/1.0'})
            raw=urllib.request.urlopen(req,timeout=25).read()
            path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw);return raw
        except Exception:
            if attempt==2: raise
            time.sleep(1)
def page(n):
    url=f'https://www.zhiding.cn/list-35-1-{n}-0-0.htm'
    raw=get(url,ROOT/'raw'/f'page-{n:04}.html');s=raw.decode('gb18030','replace');rows=[]
    assert 'LIVE INDEX' in s, 'Unexpected archive response'
    for block in re.findall(r'<article class="feed-item">(.*?)</article>',s,re.S):
        day=re.search(r'class="times">(\d{4}-\d{2}-\d{2})',block)
        link=re.search(r'<h3><a href="([^"]+)"[^>]*>(.*?)</a>',block,re.S)
        assert day and link, 'Unparsed archive article'
        target=html.unescape(link[1]).replace('http://','https://')
        title=html.unescape(re.sub('<[^>]+>','',link[2])).strip()
        rows.append({'id':'zhiding-'+target.rsplit('/',1)[-1].split('.')[0],'url':target,'title':title,'date':day[1],'month':day[1][:7],'source_id':SID,'publisher':'至顶科技（至顶网／科技行者）','date_basis':'publisher_latest_stream','entry_kind':'news_article' if re.search(r'/\d+\.shtml$',target) else 'special_or_landing'})
    assert rows, 'Empty archive before verified start boundary'
    return rows,{'page':n,'url':url,'rows':len(rows),'first':max(r['date'] for r in rows),'last':min(r['date'] for r in rows),'sha256':hashlib.sha256(raw).hexdigest()}
def main():
    records={};logs=[];errors=[];boundary=False
    for base in range(1,801,4):
        with concurrent.futures.ThreadPoolExecutor(4) as pool:
            jobs={n:pool.submit(page,n) for n in range(base,base+4)}
            for n,job in jobs.items():
                try:
                    rows,log=job.result();logs.append(log)
                    for r in rows:
                        if START<=r['date']<=END: records.setdefault(r['id'],r)
                    if log['first']<START: boundary=True
                except Exception as e: errors.append({'page':n,'error':str(e)})
        if (base+3)%40==0 or boundary or errors: print(json.dumps({'through_page':base+3,'articles':len(records),'oldest':logs[-1]['last'] if logs else None,'errors':len(errors)}),flush=True)
        if boundary or errors: break
    rows=sorted(records.values(),key=lambda r:(r['date'],r['id']));seen={}
    for r in rows:
        key=re.sub(r'\W+','',r['title']).lower();r['duplicate_of']=seen.get(key);seen.setdefault(key,r['id'])
    months=[f'2026-{m:02}' for m in range(1,10)]
    coverage={'source_id':SID,'name':'至顶科技 · 全部最新文章','url':ENTRY,'scope':'至顶网首页最新文章完整聚合流，含科技行者关联报道；同一出版方，不计为两个独立媒体。','method':'从首页“查看更多”进入最新文章归档，逐页回溯至整页早于2026年，抓取所有主题；按URL/文章ID及规范化标题去重。','collected_at':dt.datetime.now(dt.timezone(dt.timedelta(hours=8))).isoformat(),'months':[{'month':m,'total':sum(r['month']==m for r in rows),'unique':sum(r['month']==m and not r['duplicate_of'] for r in rows),'complete':boundary and not errors,'note':'当前公开最新文章归档连续覆盖；9月截至20日。'} for m in months],'limitations':['该聚合流是出版方公开最新文章范围，无法证明覆盖已删除或未进入该归档的内容。','统一按标题分类，不代表采购或实际采用；包含海外与消费内容。'],'boundary_reached':boundary,'errors':errors}
    samples=[]
    for month in months:
        own=[r for r in rows if r['month']==month and r['entry_kind']=='news_article']
        if own: samples.extend([own[0],own[-1]])
    def check_date(r):
        raw=get(r['url'],ROOT/'raw'/f"body-{r['id']}.html");s=raw.decode('ascii','ignore')
        stamp=re.search(r'class="byline".{0,800}?<span>(\d{4}-\d{2}-\d{2})',s,re.S) or re.search(r'class="times"[^>]*>\s*(\d{4}-\d{2}-\d{2})',s)
        return {'id':r['id'],'url':r['url'],'archive_date':r['date'],'body_date':stamp[1] if stamp else None,'matched':bool(stamp and stamp[1]==r['date']),'sha256':hashlib.sha256(raw).hexdigest()}
    with concurrent.futures.ThreadPoolExecutor(4) as pool: checks=list(pool.map(check_date,samples))
    coverage['date_checks']={'sample_size':len(checks),'matched':sum(r['matched'] for r in checks)}
    for name,data in [('articles.json',rows),('coverage.json',coverage),('page-log.json',logs),('date-checks.json',checks)]: (ROOT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    assert boundary and not errors, 'Incomplete historical archive'
    assert len({r['id'] for r in rows})==len(rows)
    assert all(START<=r['date']<=END for r in rows)
    assert all(r['matched'] for r in checks), 'Body date mismatch'
    print(json.dumps({'complete':True,'articles':len(rows),'unique':sum(not r['duplicate_of'] for r in rows),'months':coverage['months']}),flush=True)
if __name__=='__main__':main()
