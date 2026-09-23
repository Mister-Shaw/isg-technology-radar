"""Public DOIT catalogue census. Stdlib only; run with --refresh to fetch again."""
import argparse, concurrent.futures, datetime as dt, hashlib, html, json, pathlib, re, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent / 'output' / 'doit'
START, END = '2026-01-01', '2026-09-20'
TZ = dt.timezone(dt.timedelta(hours=8))
SOURCES = {
    '809844327297093': ('doit_computing', '智能算力', 'https://www.doit.com.cn/computing/'),
    '809844327268421': ('doit_storage', '先进存力', 'https://www.doit.com.cn/storage/'),
    '809844327231557': ('doit_networking', '网络与安全', 'https://www.doit.com.cn/networking/'),
}
CATEGORIES = {
    'supernode': r'超节点|超结点|superpod',
    'liquid_cooling': r'液冷|浸没式冷却|冷板(?:式)?冷却',
    'domestic_gpu': r'国产.{0,12}GPU|国产图形处理|海光.{0,10}DCU|深算.{0,10}(?:芯片|卡)|(?:摩尔线程|沐曦|壁仞|燧原|天数智芯|景嘉微).{0,30}(?:GPU|智算卡|加速卡)|(?:GPU|智算卡|加速卡).{0,30}(?:摩尔线程|沐曦|壁仞|燧原|天数智芯|景嘉微)',
    'compute_field': r'算力资源池|算力池|算力调度|算力网络|算力网|算力互联网|异构(?:算力|智算)|(?:AI|大模型|智算|人工智能).{0,6}一体机',
    'eda': r'\bEDA\b|电子设计自动化',
    'compute_rental': r'算力租赁|算力租用|GPU.{0,5}租赁|智算.{0,5}租赁|租赁.{0,5}(?:算力|GPU)',
    'token_factory': r'token\s*(?:工厂|factory|运营中心)|词元工厂|词元运营中心|令牌工厂',
    'optical_switch': r'光交换(?:机|系统|超节点)|光路交换|\bOCS\b',
    'ai_storage': r'(?:AI|智算|人工智能|大模型).{0,8}存储|存储.{0,12}(?:AI|智算|人工智能|大模型)',
    'aidc': r'\bAIDC\b|智算中心|智能计算中心|人工智能数据中心|AI.{0,3}数据中心',
    'modular_dc': r'模块化数据中心|预制(?:化|模块化)?数据中心|(?:算力|数据中心).{0,3}方舱|集装箱.{0,5}数据中心',
}
INFRA = r'服务器|数据中心|算力|智算|超算|存储|计算集群|计算中心|云计算|云基础设施|云平台|分布式计算|GPU|CPU|处理器|加速卡|AI芯片|人工智能芯片|国产芯片|数据基础设施|高速互连|光互连|超节点|超结点|液冷|\bEDA\b|电子设计自动化|交换机|以太网|DPU|DCU|鲲鹏|海光|内存|HBM|SSD|机架|机柜|AI推理|AI计算'
CHINA = r'中国|国内|国产|我国|全国|北京|上海|天津|重庆|广东|广州|深圳|杭州|浙江|江苏|南京|安徽|合肥|山东|河南|河北|山西|陕西|甘肃|宁夏|内蒙|新疆|西藏|青海|云南|贵州|贵阳|四川|成都|湖北|武汉|湖南|福建|广西|江西|海南|辽宁|吉林|黑龙江|雄安'
DOMESTIC_ECOSYSTEM = r'华为|鲲鹏|昇腾|海光|曙光|浪潮|联想|新华三|H3C|宝德|超聚变|中兴|烽火|中国移动|中国电信|中国联通|阿里云|腾讯云|百度|京东云|火山引擎|摩尔线程|沐曦|壁仞|燧原|天数智芯|景嘉微|华大九天|概伦|芯华章|芯和|英维克|申菱|高澜|科华|佳力图|申威|龙芯|兆芯|中科可控'
FOREIGN = r'美国|欧洲|英国|法国|德国|日本|韩国|印度|泰国|越南|马来西亚|印尼|印度尼西亚|新加坡|沙特|阿联酋|巴西|墨西哥|澳大利亚|海外|境外|得克萨斯|德克萨斯|弗吉尼亚|加利福尼亚'
CONSUMER = r'手机|笔记本|游戏本|掌机|电竞|游戏显卡|消费级|移动硬盘|移动固态|U盘|耳机|电视|显示器|相机|汽车|自动驾驶|智能座舱|豆包.*云存储|网盘'
CUSTOMER = r'中国移动|中国电信|中国联通|银行|大学|医院|电网|海关|气象|政务|财政|公安|研究所|证券|保险|联交所|交易所'

def match(pattern, text):
    return bool(re.search(pattern, text, re.I))

def classify(title, summary):
    text = title + ' ' + summary
    cats = [k for k, p in CATEGORIES.items() if match(p, text)]
    theme = match(INFRA, text) or bool(cats)
    china = match(CHINA, text)
    ecosystem = match(DOMESTIC_ECOSYSTEM, text)
    foreign_title = match(FOREIGN, title) and not match(r'中国|国内|国产|我国', title)
    consumer = match(CONSUMER, title) and not match(r'服务器|数据中心|算力集群|智算中心|企业级', title)
    reason = 'consumer_or_device_topic' if consumer else 'outside_server_infrastructure_scope' if not theme else None
    tags = []
    if match('海光', text): tags.append('hygon_unspecified')
    if match(r'海光.{0,12}(?:CPU|处理器)|海光CPU', text): tags.append('hygon_cpu')
    if match(r'海光.{0,12}DCU|深算', text): tags.append('hygon_dcu')
    if match('鲲鹏', text): tags.append('kunpeng_cpu')
    if match(r'token|词元', text) and 'token_factory' not in cats: tags.append('token_discussion_not_factory')
    if match(r'昇腾|NPU', text): tags.append('npu_not_gpu')
    if match(r'中标|招标|采购|成交|签约|合同', text): context = 'procurement_discussion'
    elif match(r'扩容|复购|追加采购|二期投运', text): context = 'expansion_discussion'
    elif match(r'试点|试用|试运行|测试验证|验证通过', text): context = 'trial_discussion'
    elif match(r'投产|投运|正式上线|成功部署|已部署|累计部署|建成|落地应用', text): context = 'deployment_discussion'
    elif match(r'发布|推出|亮相|展示|新品|上市|解决方案|荣获|获奖', text): context = 'supplier_promotion_or_launch'
    elif match(r'政策|标准|白皮书|报告|研报|研究|预测|趋势|论坛|大会', text): context = 'policy_research_or_commentary'
    else: context = 'other_or_unclear'
    mixed = china and match(FOREIGN, title)
    return {'eligible': reason is None, 'exclusion_reason': reason, 'categories': cats, 'tags': tags, 'context_class': context, 'scope': 'global' if foreign_title else 'unknown' if mixed else 'china_explicit' if china else 'unknown', 'scope_exclusion_reason': 'overseas_focus' if foreign_title else 'mixed_geography' if mixed else None if china else 'china_relevance_not_explicit', 'geo_basis': 'mixed_geography' if mixed else 'explicit_china_reference' if china else 'domestic_ecosystem_reference' if ecosystem else 'unconfirmed', 'classification_basis': 'title_only', 'full_text_verified': False}

def get_page(page, refresh=False):
    cache = ROOT / 'raw' / f'page-{page:03d}.json'
    url = f'https://www.doit.com.cn/api/cms/content/list?sid=809835088719941&pp=pc&ps=100&pn={page}'
    if cache.exists() and not refresh:
        payload = cache.read_bytes()
    else:
        req = urllib.request.Request(url, headers={'User-Agent': 'PublicResearch/1.0'})
        with urllib.request.urlopen(req, timeout=25) as response:
            payload = response.read()
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_bytes(payload)
    data = json.loads(payload)
    assert data.get('code') == 200 and isinstance(data.get('data'), list), 'Unexpected public list response'
    rows = data['data']
    dates = [dt.datetime.fromtimestamp(int(r['publishDate']) / 1000, TZ).date().isoformat() for r in rows]
    return rows, {'page': page, 'url': url, 'status': 200, 'count': len(rows), 'first_date': max(dates) if dates else None, 'last_date': min(dates) if dates else None, 'sha256': hashlib.sha256(payload).hexdigest()}

def self_check():
    assert 'domestic_gpu' not in classify('鲲鹏CPU与海光CPU服务器发布', '')['categories']
    assert 'token_factory' not in classify('中国Token API价格下调', '')['categories']
    assert 'optical_switch' not in classify('中国移动采购以太网交换机', '')['categories']
    assert 'optical_switch' in classify('中国移动光交换系统OCS测试', '')['categories']
    assert classify('华为在泰国建设数据中心', '')['scope'] == 'global'
    assert not classify('华为液冷游戏手机发布', '')['eligible']
    assert classify('中国移动采购普通服务器', '')['eligible']
    assert not classify('中国移动采购普通服务器', '')['categories']
    assert not classify('Seedance 2.0上线', '')['eligible']
    assert not classify('豆包将上线云存储付费扩容', '')['eligible']
    assert 'optical_switch' in classify('国产光互连光交换超节点正式落地', '')['categories']
    assert classify('中国词元工厂发展白皮书发布', '')['eligible']
    assert classify('联想发布教育行业AI一体机', '')['eligible']
    assert not classify('以异构计算推动物理AI应用落地', '')['categories']

def main():
    args = argparse.ArgumentParser()
    args.add_argument('--refresh', action='store_true')
    args.add_argument('--check', action='store_true')
    opts = args.parse_args()
    self_check()
    if opts.check:
        print('Classification boundary assertions passed.'); return
    all_rows, logs, errors = [], [], []
    reached = False
    # ponytail: bounded sequential batches; increase the ceiling only if the year grows beyond 10,000 posts.
    for base in range(1, 101, 4):
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            jobs = {p: executor.submit(get_page, p, opts.refresh) for p in range(base, base + 4)}
            for p, job in jobs.items():
                try:
                    rows, log = job.result(); all_rows.extend(rows); logs.append(log)
                    print(f"page {p}: {log['count']} {log['first_date']}..{log['last_date']}", flush=True)
                except Exception as exc:
                    errors.append({'page': p, 'error': str(exc)}); print(errors[-1], flush=True)
        if errors: break
        if logs[-1]['last_date'] and logs[-1]['last_date'] < START:
            reached = True; break
        time.sleep(.1)
    panel, duplicates, seen, titles = [], [], set(), {}
    for raw in all_rows:
        cid = str(raw.get('catalogId', ''))
        date = dt.datetime.fromtimestamp(int(raw['publishDate']) / 1000, TZ).date().isoformat()
        if not START <= date <= END: continue
        id_ = 'doit-' + str(raw['contentId'])
        if id_ in seen: duplicates.append(id_); continue
        seen.add(id_)
        sid, name, channel = 'doit_all', raw.get('catalogName', 'unknown'), 'https://www.doit.com.cn' + raw.get('catalogLink', '/')
        title, summary = html.unescape(raw['title']).strip(), html.unescape(raw.get('summary', '')).strip()
        norm = re.sub(r'\W+', '', title).lower()
        row = {'id': id_, 'url': 'https://www.doit.com.cn' + raw['link'], 'title': title, 'summary': summary, 'date': date, 'month': date[:7], 'source_id': sid, 'publisher': 'DOIT', 'channel': name, 'catalog_id': cid, 'channel_url': channel, 'author': raw.get('author'), 'original_source': raw.get('source') or None, 'original_source_status': 'not_exposed_in_list', 'reprint_status': 'unknown_from_list', 'duplicate_of': titles.get(norm), 'date_basis': 'publisher_list_publishDate_AsiaShanghai', **classify(title, '')}
        titles.setdefault(norm, id_); panel.append(row)
    # Same normalized title is a duplicate candidate, not proof of identical full text.
    titles = {}
    for row in sorted(panel, key=lambda r: (r['date'], r['id'])):
        norm = re.sub(r'\W+', '', row['title']).lower()
        row['duplicate_of'] = titles.get(norm)
        row['duplicate_basis'] = 'exact_normalized_title_first_publication'
        titles.setdefault(norm, row['id'])
    review_path = ROOT / 'application-review.json'
    reviews = {r['id']: r for r in json.loads(review_path.read_text(encoding='utf-8'))} if review_path.exists() else {}
    for row in panel:
        row['original_source_status'] = 'known_from_list' if row['original_source'] else 'not_exposed_in_list'
        row['screen_context_class'] = row['context_class']
        row['application_screen_hit'] = row['eligible'] and (row['context_class'] in ['procurement_discussion', 'trial_discussion', 'expansion_discussion', 'deployment_discussion'] or match(r'部署|上线|落地|交付|启用', row['title']))
        row['reviewed_application_signal'] = None
        row['application_review_status'] = 'pending_title_review' if row['application_screen_hit'] else 'not_selected_by_title_screen'
        if row['id'] in reviews:
            review = reviews[row['id']]
            row['context_class'] = review['context_class']
            row['reviewed_application_signal'] = review['reviewed_application_signal']
            row['application_review_status'] = 'reviewed_title_only'
            row['application_review_reason'] = review['reason']
            if 'eligible_override' in review:
                row['eligible'] = review['eligible_override']
                if not row['eligible']: row['exclusion_reason'] = 'manual_title_scope_review: ' + review['reason']
            if 'categories_override' in review: row['categories'] = review['categories_override']
    months = [f'2026-{m:02d}' for m in range(1,10)]
    source_coverage = []
    for sid, name, url in [('doit_all', 'DOIT全站固定语料', 'https://www.doit.com.cn/')]:
        own = [r for r in panel if r['source_id'] == sid]
        source_coverage.append({'source_id': sid, 'name': name, 'publisher': 'DOIT', 'url': url, 'archive_pagination_complete': reached and not errors, 'complete_scope': 'all currently accessible site article list; does not establish absence of deleted articles', 'months': [{'month': m, 'total_articles': sum(r['month']==m for r in own), 'eligible_articles': sum(r['month']==m and r['eligible'] for r in own), 'eligible_unique_titles': sum(r['month']==m and r['eligible'] and not r['duplicate_of'] for r in own), 'china_explicit_eligible': sum(r['month']==m and r['eligible'] and r['scope']=='china_explicit' for r in own), 'global_eligible': sum(r['month']==m and r['eligible'] and r['scope']=='global' for r in own), 'unknown_scope_eligible': sum(r['month']==m and r['eligible'] and r['scope']=='unknown' for r in own), 'summary_available': sum(r['month']==m and bool(r['summary']) for r in own), 'complete': reached and not errors, 'partial_calendar_month': m == '2026-09'} for m in months]})
    coverage = {'as_of': END, 'collected_at': dt.datetime.now(TZ).isoformat(), 'date_range': [START, END], 'raw_all_site_rows': len(all_rows), 'panel_rows': len(panel), 'eligible_rows': sum(r['eligible'] for r in panel), 'all_site_duplicate_ids_ignored': duplicates, 'reached_pre_2026_boundary': reached, 'errors': errors, 'sources': source_coverage, 'page_log': logs, 'body_checks': {'count': 0, 'full_text_classification': False}, 'limitations': ['Three columns belong to one publisher, not three independent media.', 'Title and list summary only; unmentioned technology means no visible mention, not no adoption.', 'Source and reprint provenance unavailable in list; retain unknown rather than invent original status.', 'Current archive taxonomy may have changed historically; monthly composition must be reviewed.', 'China relevance includes named domestic vendor ecosystem discussion; it is not evidence of domestic procurement.', 'September ends on day 20, compare aligned days or show incomplete month.']}
    coverage['limitations'] = ['One publisher only, not representative of all Chinese media or the server market.', 'All months use TITLE ONLY. Missing list summaries before June are never used in trend classification.', 'Whole-site fixed census eliminates mechanical effects of changed category assignments; source editorial changes and deleted history remain possible.', 'Eligible means infrastructure-topic title, not China geography. Filter scope=china_explicit separately; unknown is not domestic.', 'Title without a mention means no visible title mention, not no adoption.', 'Reprint provenance unavailable in list; exact duplicate titles are linked, original status remains unknown.', 'Context labels are procurement/deployment wording candidates, not verified customer usage or linkage to a technology.', 'September ends on day 20; use equal-day windows or mark it incomplete.']
    rules = {'version': '2026-09-21-v2.1-title-only', 'frame': {'source_id': 'doit_all', 'url': 'https://www.doit.com.cn/', 'method': 'Whole site public article list census; catalogue metadata never limits denominator'}, 'scope_positive': INFRA, 'china_explicit': CHINA, 'domestic_ecosystem': DOMESTIC_ECOSYSTEM, 'foreign_title_exclusion': FOREIGN, 'consumer_title_exclusion': CONSUMER, 'technology_patterns': CATEGORIES, 'method': 'All nine months use title only. Entire source census precedes eligibility classification. Categories never define denominator. Multiple category labels allowed; do not sum shares to 100%. Eligible is topic scope only; China requires scope=china_explicit.', 'context_warning': 'Lexical discussion signals only. Named buyer identity and actual adoption are not verified.'}
    candidates = [r for r in panel if r['application_screen_hit']]
    coverage['application_review'] = {'review_file_rows': len(reviews), 'title_candidates': len(candidates), 'pending_title_review': sum(r['application_review_status']=='pending_title_review' for r in candidates), 'positive_title_wording': sum(r['reviewed_application_signal'] is True for r in panel), 'actual_adoption_verified': False}
    assert len({r['id'] for r in panel}) == len(panel)
    assert all(START <= r['date'] <= END and set(r['categories']) <= set(CATEGORIES) for r in panel)
    assert sum(m['total_articles'] for s in source_coverage for m in s['months']) == len(panel)
    (ROOT / 'application-candidates.json').write_text(json.dumps(candidates, ensure_ascii=False, indent=2), encoding='utf-8')
    for name, data in [('articles.json', panel), ('coverage.json', coverage), ('classification-rules.json', rules), ('page-log.json', logs)]:
        (ROOT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'panel': len(panel), 'eligible': sum(r['eligible'] for r in panel), 'sources': source_coverage}, ensure_ascii=False))

if __name__ == '__main__': main()
