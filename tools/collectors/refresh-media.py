"""Fresh public archive reread. Keep the completed-week cutoff and later previews separate."""
from pathlib import Path
import argparse,concurrent.futures as cf,datetime as dt,html,importlib.util,json,re,urllib.error,urllib.parse,urllib.request,urllib.robotparser
BASE=Path(__file__).resolve().parent
OUTPUT=BASE/'output'/'media-refresh'
START=END=CUTOFF=None
USER_AGENT='PublicResearch/1.0'
SOURCES={
    'doit':('doit_all','https://www.doit.com.cn/api/cms/content/list'),
    'c114':('c114_roll_all','https://www.c114.com.cn/news/roll.asp'),
    'zhiding':('zhiding_latest','https://www.zhiding.cn/list-35-1-1-0-0.htm'),
    'cbinews':('cbinews_all_news','https://api.cbinews.com/api/cate_list'),
}
spec=importlib.util.spec_from_file_location('refresh_title_rules',BASE/'doit/collect_news.py')
RULES=importlib.util.module_from_spec(spec);spec.loader.exec_module(RULES)
def iso_date(value):
    try:
        day=dt.date.fromisoformat(value)
    except ValueError:
        raise argparse.ArgumentTypeError('Use a valid date in YYYY-MM-DD format.') from None
    if value!=day.isoformat():
        raise argparse.ArgumentTypeError('Use YYYY-MM-DD format.')
    return value

def parse_args(argv=None):
    parser=argparse.ArgumentParser(description='Refresh four public news archives without a topic prefilter; fail if a source is incomplete.')
    parser.add_argument('--start',type=iso_date,required=True)
    parser.add_argument('--end',type=iso_date,required=True)
    parser.add_argument('--cutoff',type=iso_date,required=True,help='Completed-period boundary; later documents remain previews.')
    parser.add_argument('--output',type=Path,default=Path('output/media-refresh'),help='Directory under tools/collectors/output, relative to this script or absolute.')
    args=parser.parse_args(argv)
    if not args.start<=args.cutoff<=args.end:
        parser.error('Dates must satisfy start <= cutoff <= end.')
    args.output=(BASE/args.output).resolve()
    if not args.output.is_relative_to((BASE/'output').resolve()):
        parser.error('--output must stay inside tools/collectors/output.')
    return args

def module(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
    m.ROOT=OUTPUT/name;m.ROOT.mkdir(parents=True,exist_ok=True);m.RAW=m.ROOT/'raw';m.RAW.mkdir(exist_ok=True)
    m.REFRESH=True
    m.START,m.END=START,END
    return m
def save(name,d): (OUTPUT/name).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')

def check_robots(url):
    parts=urllib.parse.urlsplit(url)
    robots_url=urllib.parse.urlunsplit((parts.scheme,parts.netloc,'/robots.txt','',''))
    try:
        request=urllib.request.Request(robots_url,headers={'User-Agent':USER_AGENT})
        with urllib.request.urlopen(request,timeout=20) as response:
            content=response.read(262145)
        if len(content)>262144:raise RuntimeError('Unexpected oversized robots response')
        body=content.decode('utf-8-sig','replace')
        if re.search(r'<\s*(?:html|!doctype)|captcha|aliyun_waf_',body,re.I):
            raise RuntimeError('Robots returned HTML/access challenge; collection stopped')
        parser=urllib.robotparser.RobotFileParser(robots_url);parser.parse(body.splitlines())
        if not parser.can_fetch(USER_AGENT,url):raise RuntimeError('Robots disallows archive path')
        return {'url':robots_url,'status':200,'allowed':True}
    except urllib.error.HTTPError as error:
        if error.code in (404,410):
            return {'url':robots_url,'status':error.code,'allowed':True,'note':'No robots file published'}
        raise

def enrich(rows,source_id):
    result=[]
    for row in rows:
        if row['source_id']!=source_id:raise ValueError('Unexpected source ID')
        if not row.get('id') or not row.get('title','').strip():raise ValueError('Missing article ID/title')
        day=iso_date(row['date'])
        if not START<=day<=END:raise ValueError('Article outside requested date range')
        parsed=urllib.parse.urlsplit(row['url'])
        if parsed.scheme not in ('http','https') or not parsed.netloc:raise ValueError('Invalid article URL')
        classification=RULES.classify(row['title'],'')
        result.append({**row,**classification,'month':day[:7],
            'market_scope':classification['scope'],'superseded':False,
            'categories':classification['categories'] if classification['eligible'] else [],
            'tags':[{'hygon_cpu':'hyg_cpu','hygon_dcu':'hyg_dcu','kunpeng_cpu':'kunpeng'}.get(tag,tag) for tag in classification['tags']],
            'eligible_categories':[],'required_categories':[],'unknown_categories':[],
            'title_context_class':classification['context_class'],'context_class':'other','application_reviewed':False,
            'classification_note':'统一标题词表自动识别；采购/部署等标题表述尚未人工复核，不证明实际采用。所有新闻保留在分母。'})
    return result

def collect(name,fn):
    source_id,url=SOURCES[name]
    robots=check_robots(url)
    rows,log=fn()
    log['robots']=robots
    return enrich(rows,source_id),log
def doit():
    m=module('doit',BASE/'doit/collect_news.py');rows=[];logs=[];boundary=False
    for p in range(1,31):
        raw,log=m.get_page(p,True);logs.append(log)
        for r in raw:
            day=dt.datetime.fromtimestamp(int(r['publishDate'])/1000,m.TZ).date().isoformat()
            if START<=day<=END:rows.append({'id':'doit-'+str(r['contentId']),'title':html.unescape(r['title']).strip(),'url':'https://www.doit.com.cn'+r['link'],'date':day,'month':day[:7],'source_id':'doit_all','publisher':'DOIT','date_basis':'publisher_list_publishDate_AsiaShanghai'})
        if log['last_date'] and log['last_date']<START:boundary=True;break
    return rows,{'source_id':'doit_all','complete':boundary,'page_log':logs}
def c114():
    m=module('c114',BASE/'c114/collect.py');days=[dt.date.fromisoformat(START)+dt.timedelta(days=n) for n in range((dt.date.fromisoformat(END)-dt.date.fromisoformat(START)).days+1)]
    rows=[];logs=[]
    with cf.ThreadPoolExecutor(2) as pool:
        for rr,log in pool.map(m.daily,days):rows.extend(r for r in rr if r['entry_kind']=='article');logs.append(log)
    return rows,{'source_id':m.SOURCE,'complete':all(l['complete'] for l in logs),'page_log':logs}
def zhiding():
    m=module('zhiding',BASE/'zhiding/collect.py');rows=[];logs=[];boundary=False
    for p in range(1,151):
        rr,log=m.page(p);logs.append(log);rows.extend(r for r in rr if START<=r['date']<=END and r['entry_kind']=='news_article')
        if log['first']<START:boundary=True;break
    return rows,{'source_id':m.SID,'complete':boundary,'page_log':logs}
def cbinews():
    m=module('cbinews',BASE/'cbinews/collect.py');m.REFRESH=True;rows={};logs=[]
    with cf.ThreadPoolExecutor(2) as pool:
        for rr,log in pool.map(m.collect_category,m.CATS):
            logs.append(log)
            for r in rr:
                id='cbinews-'+str(r['id']);rows[id]={'id':id,'title':html.unescape(r['title']),'url':urllib.parse.urljoin('https://www.cbinews.com/',r['url']),'date':r['date'],'month':r['date'][:7],'source_id':m.SOURCE,'publisher':'电脑商情在线','date_basis':'publisher_category_list_created_at'}
    return list(rows.values()),{'source_id':m.SOURCE,'complete':all(l['complete'] for l in logs),'page_log':logs}
def main(argv=None):
    global START,END,CUTOFF,OUTPUT
    args=parse_args(argv)
    START,END,CUTOFF,OUTPUT=args.start,args.end,args.cutoff,args.output
    OUTPUT.mkdir(parents=True,exist_ok=True)
    docs=[];logs=[]
    with cf.ThreadPoolExecutor(4) as pool:
        jobs={name:pool.submit(collect,name,fn) for name,fn in [('doit',doit),('c114',c114),('zhiding',zhiding),('cbinews',cbinews)]}
        for name,job in jobs.items():
            try:
                rows,log=job.result();log.update(checked_at=dt.datetime.now(dt.timezone.utc).isoformat(),fresh_request=True,rows=len(rows));docs.extend(rows)
                save(name+'-fresh.json',{'documents':rows,'audit':log});logs.append(log);print(name,len(rows),log['complete'],flush=True)
            except Exception as e:
                log={'source_id':SOURCES[name][0],'complete':False,'fresh_request':True,'rows':0,'error':str(e),'checked_at':dt.datetime.now(dt.timezone.utc).isoformat()};logs.append(log);save(name+'-fresh.json',{'documents':[],'audit':log});print(name,str(e),flush=True)
    save('media-refresh.json',{'checked_at':dt.datetime.now(dt.timezone.utc).isoformat(),'reread_start':START,'scanned_through':END,'cutoff':CUTOFF,'sources':logs,'documents':docs})

    return 0 if all(log['complete'] for log in logs) else 1

if __name__=='__main__':
    raise SystemExit(main())
