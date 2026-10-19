export const CATEGORIES={procurement:'政府采购与公共标讯',operators:'运营商与央企采购',buyers:'重点买方',vendors:'厂商官网',wechat:'公众号与行业媒体',commercial:'商业标讯服务',disclosures:'上市公司披露',industry:'行业组织与标准',projects:'项目审批与建设'};
// A bounded, versioned source panel, not a claim of nationwide coverage.
export const sourcePanel=[
  {
    "id": "thinkforce",
    "category": "vendors",
    "name": "熠知电子",
    "url": "https://www.think-force.com/site/news",
    "mode": "public",
    "note": "xPU芯片、机架服务器与异构计算；原文日期和应用场景单独核对。",
    "hosts": [
      "www.think-force.com"
    ]
  },
  {
    "id": "jaguarmicro",
    "category": "vendors",
    "name": "云豹智能",
    "url": "https://www.jaguarmicro.com/news1-1.html",
    "mode": "public",
    "note": "DPU、服务器生态与算网；公司新闻和媒体转载分清来源，产品合作不等于采购。",
    "hosts": [
      "www.jaguarmicro.com"
    ]
  },
  {
    "id": "ccgp",
    "category": "procurement",
    "name": "中国政府采购网",
    "url": "https://www.ccgp.gov.cn/",
    "mode": "public",
    "note": "意向、招标、成交、更正、废标；以公告正文和附件为准。",
    "hosts": [
      "www.ccgp.gov.cn",
      "search.ccgp.gov.cn"
    ]
  },
  {
    "id": "intent",
    "category": "procurement",
    "name": "政府采购意向公开",
    "url": "https://cgyx.ccgp.gov.cn/cgyx/pub/projSearch",
    "mode": "manual",
    "note": "查询可能需要验证码；打开官方入口后导入原文或文件。",
    "hosts": [
      "cgyx.ccgp.gov.cn"
    ]
  },
  {
    "id": "ggzy",
    "category": "procurement",
    "name": "全国公共资源交易平台",
    "url": "https://www.ggzy.gov.cn/deal/dealList.html?HEADER_DEAL_TYPE=02",
    "mode": "manual",
    "note": "动态检索与验证码；回溯地方交易平台原始公告。",
    "hosts": [
      "www.ggzy.gov.cn",
      "deal.ggzy.gov.cn"
    ]
  },
  {
    "id": "ceb",
    "category": "procurement",
    "name": "中国招标投标公共服务平台",
    "url": "https://bulletin.cebpubservice.com/",
    "mode": "manual",
    "note": "公共公告入口；访问受限时使用公开链接或文件导入。",
    "hosts": [
      "bulletin.cebpubservice.com",
      "www.cebpubservice.com"
    ]
  },
  {
    "id": "mobile",
    "category": "operators",
    "name": "中国移动采购与招标网",
    "url": "https://b2b.10086.cn/",
    "mode": "manual",
    "note": "动态公告查询；采购、候选人公示、结果分阶段保留。",
    "hosts": [
      "b2b.10086.cn"
    ]
  },
  {
    "id": "telecom",
    "category": "operators",
    "name": "中国电信阳光采购网",
    "url": "https://caigou.chinatelecom.com.cn/",
    "mode": "manual",
    "note": "动态平台；以电信官网采购供应链入口及公告为准。",
    "hosts": [
      "caigou.chinatelecom.com.cn",
      "trade.chinatelecom.com.cn",
      "www.chinatelecom.com.cn"
    ]
  },
  {
    "id": "unicom",
    "category": "operators",
    "name": "中国联通采购平台",
    "url": "https://unibapi.unicom.net.cn/",
    "mode": "manual",
    "note": "动态查询，部分内容需登录；不自动登录或绕过验证。",
    "hosts": [
      "unibapi.unicom.net.cn"
    ]
  },
  {
    "id": "tower",
    "category": "operators",
    "name": "中国铁塔电子采购平台",
    "url": "https://ebid.chinatowercom.cn/",
    "mode": "public",
    "note": "采购、公示、结果、变更及失败公告。",
    "hosts": [
      "ebid.chinatowercom.cn"
    ]
  },
  {
    "id": "pbc",
    "category": "buyers",
    "name": "中国人民银行集中采购中心",
    "url": "https://jzcg.pbc.gov.cn/",
    "mode": "public",
    "note": "买方采购原始披露；区分预算、成交及软件服务金额。",
    "hosts": [
      "jzcg.pbc.gov.cn"
    ]
  },
  {
    "id": "nankai",
    "category": "buyers",
    "name": "南开大学招投标管理办公室",
    "url": "https://nkzbb.nankai.edu.cn/",
    "mode": "public",
    "note": "高校服务器与智算采购；跟踪更正、成交及验收。",
    "hosts": [
      "nkzbb.nankai.edu.cn"
    ]
  },
  {
    "id": "huawei",
    "category": "vendors",
    "name": "华为计算",
    "url": "https://e.huawei.com/cn/products/computing",
    "mode": "public",
    "note": "产品、方案、案例；厂商声称需买方证据交叉核验。",
    "hosts": [
      "e.huawei.com",
      "www.huawei.com",
      "e-file.huawei.com"
    ]
  },
  {
    "id": "h3c",
    "category": "vendors",
    "name": "新华三",
    "url": "https://www.h3c.com/cn/",
    "mode": "public",
    "note": "服务器、超节点、液冷及解决方案动态。",
    "hosts": [
      "www.h3c.com",
      "wwwsg.h3c.com"
    ]
  },
  {
    "id": "ieisystem",
    "category": "vendors",
    "name": "浪潮信息",
    "url": "https://www.ieisystem.com/",
    "mode": "public",
    "note": "产品与新闻，注意区分浪潮信息与浪潮集团。",
    "hosts": [
      "www.ieisystem.com"
    ]
  },
  {
    "id": "lenovo",
    "category": "vendors",
    "name": "联想企业购 · ISG",
    "url": "https://biz.lenovo.com.cn/isg/whitepaper.html",
    "mode": "public",
    "note": "白皮书、产品资料与案例；相关品牌官网纳入同一来源。",
    "hosts": [
      "biz.lenovo.com.cn",
      "brand.lenovo.com.cn"
    ]
  },
  {
    "id": "wechat",
    "category": "wechat",
    "name": "微信公众号原文",
    "url": "https://mp.weixin.qq.com/",
    "mode": "manual",
    "note": "粘贴分享文章链接尝试读取，或粘贴正文导入。账号历史、阅读量不自动获取。",
    "hosts": [
      "mp.weixin.qq.com"
    ]
  },
  {
    "id": "caict-wechat",
    "category": "wechat",
    "name": "中国信通院官方微信矩阵",
    "url": "https://service.caict.ac.cn/wxq/",
    "mode": "manual",
    "note": "以官网二维码核实账号主体；从微信分享原文链接导入。",
    "hosts": [
      "service.caict.ac.cn"
    ]
  },
  {
    "id": "c114",
    "category": "wechat",
    "name": "C114通信网 · 滚动资讯",
    "url": "https://www.c114.com.cn/news/roll.asp",
    "mode": "public",
    "note": "全部滚动新闻已回采并纳入市场风向；本站检查按钮仅读取当前栏目页。",
    "hosts": [
      "www.c114.com.cn"
    ]
  },
  {
    "id": "doit",
    "category": "wechat",
    "name": "DOIT · 全站新闻",
    "url": "https://www.doit.com.cn/",
    "mode": "public",
    "note": "全站新闻历史批次已纳入市场风向；本站按需检查仅读取当前页。",
    "hosts": [
      "www.doit.com.cn"
    ]
  },
  {
    "id": "zhiding",
    "category": "wechat",
    "name": "至顶科技 · 最新文章",
    "url": "https://www.zhiding.cn/list-35-1-1-0-0.htm",
    "mode": "public",
    "note": "包含同一出版方的至顶网与科技行者；历史批次已纳入市场风向，本站检查仅当前页。",
    "hosts": [
      "www.zhiding.cn",
      "www.techwalker.com"
    ]
  },
  {
    "id": "cbinews",
    "category": "wechat",
    "name": "电脑商情在线 · 全部新闻栏目",
    "url": "https://www.cbinews.com/",
    "mode": "manual",
    "note": "12个新闻栏目历史批次已纳入市场风向；动态目录请打开官网或导入，不在本站自动遍历历史。",
    "hosts": [
      "www.cbinews.com"
    ]
  },
  {
    "id": "kunpeng",
    "category": "vendors",
    "name": "鲲鹏社区 · 官方新闻",
    "url": "https://www.hikunpeng.com/zh/activities/news",
    "mode": "manual",
    "note": "已取得官网历史批次，单列观察；6—9月覆盖不完整，不并入媒体合计。",
    "hosts": [
      "www.hikunpeng.com"
    ]
  },
  {
    "id": "hygon",
    "category": "vendors",
    "name": "海光官网",
    "url": "https://www.hygon.cn/",
    "mode": "manual",
    "note": "主站目录不完整；补采光合组织、智源及上市公司原始披露，CPU与DCU分开标记。",
    "hosts": [
      "www.hygon.cn",
      "www.hieco.com.cn",
      "hub.baai.ac.cn"
    ]
  },
  {
    "id": "metax",
    "category": "vendors",
    "name": "沐曦股份 · 官方新闻",
    "url": "https://www.metax-tech.com/news.html",
    "mode": "public",
    "note": "已核对11页2026年目录；本站可检查当前栏目。产品适配与采购分开，不计入市场风向分母。",
    "hosts": [
      "www.metax-tech.com"
    ]
  },
  {
    "id": "mthreads",
    "category": "vendors",
    "name": "摩尔线程 · 官方新闻",
    "url": "https://www.mthreads.com/news",
    "mode": "manual",
    "note": "目录可读，动态正文通过正常浏览器补采；本批三篇原文已补齐，未遇验证时无需手动提供。",
    "hosts": [
      "www.mthreads.com"
    ]
  },
  {
    "id": "univista",
    "category": "vendors",
    "name": "合见工软 · 官方新闻",
    "url": "https://www.univista-isg.com/site/news",
    "mode": "public",
    "note": "已核对3页目录，本站可检查当前栏目；同次发布会归并，EDA动态补充月度研究。",
    "hosts": [
      "www.univista-isg.com"
    ]
  },
  {
    "id": "idcquan",
    "category": "wechat",
    "name": "中国IDC圈 · 建设月报与新闻",
    "url": "https://cloud.idcquan.com/",
    "mode": "manual",
    "note": "深化数据中心、建设月报及云计算栏目，逐项目核对公开原文；不以月报项目总数代替可读取明细。仅保留必要摘要、事实与原文链接，不镜像全文；付费或受限内容需合法授权。",
    "hosts": [
      "news.idcquan.com",
      "www.idcquan.com",
      "cloud.idcquan.com",
      "dc.idcquan.com"
    ]
  },
  {
    "id": "eet_china",
    "category": "wechat",
    "name": "电子工程专辑 · 数据中心与服务器",
    "url": "https://www.eet-china.com/",
    "mode": "public",
    "note": "跟踪公开数据中心、服务器与芯片报道；同一事件去重，报道与采购证据分开。仅保留必要摘要、事实与原文链接，不镜像全文；会员或授权内容不自动读取。",
    "hosts": [
      "www.eet-china.com",
      "eet-china.com"
    ]
  },
  {
    "id": "trendforce",
    "category": "wechat",
    "name": "TrendForce集邦咨询 · 新闻中心",
    "url": "https://www.trendforce.cn/presscenter/",
    "mode": "public",
    "note": "跟踪公开服务器、AI芯片、存储及产业新闻；预测与已发生事实分开，付费研究及数据库需另行授权。仅保留必要摘要、事实与原文链接，不镜像全文。",
    "hosts": [
      "www.trendforce.cn",
      "trendforce.cn",
      "www.trendforce.com.tw",
      "trendforce.com.tw",
      "www.trendforce.com",
      "trendforce.com"
    ]
  },
  {
    "id": "zhidx",
    "category": "wechat",
    "name": "智东西 · 芯东西",
    "url": "https://zhidx.com/",
    "mode": "public",
    "note": "同一出版方的智东西与芯东西合并为一个来源；关注服务器、芯片、算力和液冷，按原始发布去重。仅保留公开必要摘要、事实与原文链接，不镜像全文；受限内容需合法授权。",
    "hosts": [
      "zhidx.com",
      "www.zhidx.com"
    ]
  },
  {
    "id": "siat",
    "category": "buyers",
    "name": "中科院深圳先进院 · 采购公示",
    "url": "https://siat.cas.cn/jggl/tzgg/",
    "mode": "manual",
    "note": "部分原件连接异常；已补合同索引，金额单位冲突暂留空，待原合同附件确认。",
    "hosts": [
      "siat.cas.cn",
      "www.siat.cas.cn",
      "www.siat.ac.cn"
    ]
  },
  {
    "id": "ecust",
    "category": "buyers",
    "name": "华东理工大学 · 采购信息",
    "url": "https://czzx.ecust.edu.cn/ejdwcggg/index.chtml",
    "mode": "public",
    "note": "公开采购栏目已通过本站读取；本批6月原文、9月索引已补录，后续继续查中选结果。",
    "hosts": [
      "czzx.ecust.edu.cn"
    ]
  },
  {
    "id": "d1net",
    "category": "wechat",
    "name": "企业网 D1Net",
    "url": "https://www.d1net.com/datacenter/",
    "mode": "manual",
    "note": "公开栏目可供研究补查，本站读取器尚未确认有效robots；未纳入市场风向固定分母。",
    "hosts": [
      "www.d1net.com"
    ]
  },
  {
    "id": "newrank",
    "category": "wechat",
    "name": "新榜",
    "url": "https://www.newrank.cn/",
    "mode": "license",
    "note": "未授权 API；现阶段仅导入合法取得的公开信息或数据导出。",
    "hosts": [
      "www.newrank.cn"
    ]
  },
  {
    "id": "gsdata",
    "category": "wechat",
    "name": "清博智能",
    "url": "https://www.gsdata.cn/",
    "mode": "license",
    "note": "未授权 API；传播指标缺失或显示上限时不估算精确阅读量。",
    "hosts": [
      "www.gsdata.cn"
    ]
  },
  {
    "id": "qianlima",
    "category": "commercial",
    "name": "千里马招标网",
    "url": "https://www.qianlima.com/",
    "mode": "license",
    "note": "公开检索与导出导入；未开通会员、订阅或 API。",
    "hosts": [
      "www.qianlima.com"
    ]
  },
  {
    "id": "bidcenter",
    "category": "commercial",
    "name": "采招网数据服务",
    "url": "https://shuju.bidcenter.com.cn/zhuanti/shuju/api.shtml",
    "mode": "license",
    "note": "已提供文件导入；API 需另行取得服务授权和接口文档。",
    "hosts": [
      "shuju.bidcenter.com.cn",
      "www.bidcenter.com.cn"
    ]
  },
  {
    "id": "cninfo",
    "category": "disclosures",
    "name": "巨潮资讯 · 上市公司公告",
    "url": "https://www.cninfo.com.cn/new/commonUrl/pageOfSearch?url=disclosure/list/search",
    "mode": "manual",
    "note": "动态公告查询；可采集 static.cninfo.com.cn 的公开 PDF 链接。",
    "hosts": [
      "www.cninfo.com.cn",
      "list.cninfo.com.cn",
      "static.cninfo.com.cn"
    ]
  },
  {
    "id": "odcc",
    "category": "industry",
    "name": "开放数据中心委员会 ODCC",
    "url": "https://www.odcc.org.cn/index.html",
    "mode": "public",
    "note": "标准、白皮书、会议资料；会员内容不自动读取。",
    "hosts": [
      "www.odcc.org.cn"
    ]
  },
  {
    "id": "caict",
    "category": "industry",
    "name": "中国信息通信研究院",
    "url": "https://www.caict.ac.cn/",
    "mode": "public",
    "note": "研究报告、标准和产业动态；公开 PDF 可导入。",
    "hosts": [
      "www.caict.ac.cn"
    ]
  },
  {
    "id": "guangzhou",
    "category": "projects",
    "name": "广州市发展和改革委员会",
    "url": "https://fgw.gz.gov.cn/",
    "mode": "public",
    "note": "项目审批、节能审查、建设线索；投资额不等于设备采购额。",
    "hosts": [
      "fgw.gz.gov.cn"
    ]
  },
  {
    "id": "beijing-et",
    "category": "projects",
    "name": "北京经济技术开发区",
    "url": "https://kfqgw.beijing.gov.cn/",
    "mode": "public",
    "note": "智算中心、项目建设和投产披露。",
    "hosts": [
      "kfqgw.beijing.gov.cn"
    ]
  },
  {
    "id": "beijing",
    "category": "projects",
    "name": "北京市人民政府",
    "url": "https://www.beijing.gov.cn/",
    "mode": "public",
    "note": "规划、政策与项目动态；政府网站转载仍按原发布者识别。",
    "hosts": [
      "www.beijing.gov.cn"
    ]
  },
  {
    "id": "shanghai-fin",
    "category": "projects",
    "name": "上海市金融管理局",
    "url": "https://jrj.sh.gov.cn/",
    "mode": "public",
    "note": "金融科技和建设线索，需识别实际买方。",
    "hosts": [
      "jrj.sh.gov.cn"
    ]
  },
  {
    "id": "changzhou",
    "category": "projects",
    "name": "常州国家高新区",
    "url": "https://www.cznd.gov.cn/",
    "mode": "public",
    "note": "项目建设、落地与运行披露。",
    "hosts": [
      "www.cznd.gov.cn"
    ]
  },
  {
    "id": "shaoguan",
    "category": "projects",
    "name": "韶关市人民政府",
    "url": "https://www.sg.gov.cn/",
    "mode": "public",
    "note": "算力项目建设、政策和投产。",
    "hosts": [
      "www.sg.gov.cn"
    ]
  },
  {
    "id": "changning",
    "category": "projects",
    "name": "上海市长宁区",
    "url": "https://www.shcn.gov.cn/",
    "mode": "public",
    "note": "区域项目与产业动态。",
    "hosts": [
      "www.shcn.gov.cn"
    ]
  },
  {
    "id": "wuxi",
    "category": "projects",
    "name": "无锡市人民政府",
    "url": "https://www.wuxi.gov.cn/",
    "mode": "public",
    "note": "项目审批、建设、投产；规划需后续采购证据。",
    "hosts": [
      "www.wuxi.gov.cn"
    ]
  },
  {
    "id": "shanghai_drc",
    "category": "projects",
    "name": "上海市发展和改革委员会 · 项目审批",
    "url": "https://fgw.sh.gov.cn/",
    "mode": "public",
    "note": "公开项目审批、节能审查及建设披露；核对项目主体、批复日期与建设阶段，投资额不等于设备采购额。仅保留必要摘要、事实与原文链接，不镜像全文。",
    "hosts": [
      "fgw.sh.gov.cn"
    ]
  },
  {
    "id": "gt_procurement",
    "category": "operators",
    "name": "通用技术集团 · 采购平台",
    "url": "https://cg.gt.cn/",
    "mode": "public",
    "note": "公开采购、候选人及成交公告按阶段核对；识别委托买方和标包，不把平台或代理计为买方。仅保留必要摘要、事实与原文链接，不镜像全文；登录或验证内容转人工。",
    "hosts": [
      "cg.gt.cn"
    ]
  },
  {
    "id": "gds_ir",
    "category": "disclosures",
    "name": "万国数据 · 投资者关系",
    "url": "https://investors.gds-services.com/",
    "mode": "public",
    "note": "公开业绩、公告及数据中心建设披露；区分公司规划、在建、投产和实际设备采购。仅保留必要摘要、事实与原文链接，不镜像全文。",
    "hosts": [
      "investors.gds-services.com"
    ]
  },
  {
    "id": "hkex",
    "category": "disclosures",
    "name": "港交所披露易 · 上市公司公告",
    "url": "https://www.hkexnews.hk/",
    "mode": "public",
    "note": "公开上市公司公告及附件；按发行人、公告日期与项目原文核对，动态查询受限时导入公开文件。仅保留必要摘要、事实与原文链接，不镜像全文。",
    "hosts": [
      "www.hkexnews.hk",
      "hkexnews.hk"
    ]
  },
  {
    "id": "jiangsu_ggzy",
    "category": "procurement",
    "name": "江苏省公共资源交易平台",
    "url": "https://jsggzy.jszwfw.gov.cn/",
    "mode": "manual",
    "note": "候选公开来源，自动读取尚未确认可用；动态检索、验证或访问限制时手动打开官方入口并导入合法取得的公告。仅保留必要摘要、事实与原文链接，不镜像全文。",
    "hosts": [
      "jsggzy.jszwfw.gov.cn"
    ]
  },
  {
    "id": "zycg",
    "category": "procurement",
    "name": "中央政府采购网",
    "url": "https://www.zycg.gov.cn/",
    "mode": "manual",
    "note": "候选公开来源，自动读取尚未确认可用；公开招标、成交及更正公告从官方入口手动核对或导入，不绕过访问验证。仅保留必要摘要、事实与原文链接，不镜像全文。",
    "hosts": [
      "www.zycg.gov.cn",
      "zycg.gov.cn"
    ]
  },
  {
    "id": "zzcg",
    "category": "procurement",
    "name": "中共中央直属机关采购中心",
    "url": "https://www.zzcg.gov.cn/",
    "mode": "manual",
    "note": "候选公开来源，自动读取尚未确认可用；公开采购公告从官方入口手动核对或导入，受限查询不自动登录或绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文。",
    "hosts": [
      "www.zzcg.gov.cn",
      "zzcg.gov.cn"
    ]
  },
  {
    "id": "citc",
    "category": "procurement",
    "name": "中招国际招标",
    "url": "https://www.cntcitc.com.cn/",
    "mode": "public",
    "note": "采购代理公告，识别委托买方而非把代理机构计为买方。",
    "hosts": [
      "www.cntcitc.com.cn"
    ]
  },
  {
    "id": "gcc",
    "category": "industry",
    "name": "全球计算联盟 GCC",
    "url": "https://www.gccorg.com/lists/18.html",
    "mode": "public",
    "note": "AIDC/supernode standards, liquid cooling and named financial buyer practice。Group GCC subdomains; dedup member reposts to vendor originals。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "gccorg.com",
      "www.gccorg.com",
      "openaiinfra.gccorg.com",
      "icidg.gccorg.com"
    ]
  },
  {
    "id": "octc",
    "category": "industry",
    "name": "OCTC开放计算标准工作委员会 / CESA",
    "url": "https://www.octc.net/index.php?a=lists&c=index&catid=144&m=content",
    "mode": "public",
    "note": "Liquid cooling, CDU, NPO standards primary evidence。OCTC/CESA onefamily; CESI secretariat affiliation; shared OCP events dedup。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.octc.net",
      "octc.net"
    ]
  },
  {
    "id": "ocp",
    "category": "industry",
    "name": "Open Compute Project / China Day",
    "url": "https://www.opencompute.org/events/past-events/",
    "mode": "public",
    "note": "China open-compute engineering presentations。Independent from OCTC but cohosted events not independent corroboration; staging hosts excluded。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.opencompute.org",
      "opencompute.org",
      "ocpasia.org"
    ]
  },
  {
    "id": "nda",
    "category": "projects",
    "name": "国家数据局",
    "url": "https://www.nda.gov.cn/sjj/swdt/xwfb/list/index_pc_1.html",
    "mode": "public",
    "note": "National compute-grid policy。Track original publisher credit; example repost credited中国政府网。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.nda.gov.cn"
    ]
  },
  {
    "id": "nea",
    "category": "projects",
    "name": "国家能源局及派出监管机构",
    "url": "https://www.nea.gov.cn/",
    "mode": "public",
    "note": "Storage,power,grid energization and construction constraints。URLJuly20 differs from issueJune26; separate datefields; regional subdomains onefamily。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.nea.gov.cn",
      "xbj.nea.gov.cn",
      "nfj.nea.gov.cn",
      "hdj.nea.gov.cn"
    ]
  },
  {
    "id": "ndrc",
    "category": "projects",
    "name": "国家发展改革委",
    "url": "https://www.ndrc.gov.cn/fggz/hjyzy/jnhnx/wap_index.html",
    "mode": "public",
    "note": "Compute grid and energy-efficiency policy。Example is commentary, not binding policy; preserve original credit。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.ndrc.gov.cn"
    ]
  },
  {
    "id": "miit",
    "category": "projects",
    "name": "工业和信息化部",
    "url": "https://www.miit.gov.cn/zwgk/zcwj/wjfb/tz/",
    "mode": "manual",
    "note": "Original national green-DC standards/criteria。PublishedJuly7,issuedJune28; current2026 automated route unverified。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.miit.gov.cn"
    ]
  },
  {
    "id": "samr_standards",
    "category": "industry",
    "name": "国家标准全文公开 / 全国标准信息公共服务平台",
    "url": "https://openstd.samr.gov.cn/bzgk/std/index",
    "mode": "manual",
    "note": "National standard metadata for server, rack, compute engineering。Onefamily across official standard portals; not news denominator; GB/T46979-2025 releasedDec31 effective2026July1。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "openstd.samr.gov.cn",
      "std.samr.gov.cn",
      "sacinfo.org.cn"
    ]
  },
  {
    "id": "cnis_group_standards",
    "category": "industry",
    "name": "全国团体标准信息平台 / 中国标准化研究院",
    "url": "https://www.ttbz.org.cn/",
    "mode": "manual",
    "note": "Association standards searchable original metadata。Registry publisher differs from issuing中国通信工业协会; loginfulltext not assumed available。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.ttbz.org.cn",
      "ndls.cnis.ac.cn"
    ]
  },
  {
    "id": "cace",
    "category": "industry",
    "name": "中国通信企业协会",
    "url": "https://www.cace.org.cn/",
    "mode": "manual",
    "note": "IDC operator and communications industry standards。hy subsite samefamily。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.cace.org.cn",
      "hy.cace.org.cn"
    ]
  },
  {
    "id": "ccsa",
    "category": "industry",
    "name": "中国通信标准化协会",
    "url": "https://www.ccsa.org.cn/yjbg/",
    "mode": "manual",
    "note": "1.6Tbps optics and infrastructure standards。Fulltext membership access may be restricted; not verified automatic collection。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.ccsa.org.cn"
    ]
  },
  {
    "id": "ceesta",
    "category": "industry",
    "name": "中国电子节能技术协会 / GDC",
    "url": "https://www.ceesta.org.cn/tzgg/",
    "mode": "manual",
    "note": "Green data-center energy and engineering standards。CEESTA/GDC/legacycommittee onefamily; legacy gdctech sample2024。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.ceesta.org.cn",
      "gdc-gdcc.com",
      "gdctech.cn"
    ]
  },
  {
    "id": "ccua",
    "category": "industry",
    "name": "中国计算机用户协会数据中心分会",
    "url": "https://m.cra-ccua.org.cn/site/term/18.html",
    "mode": "public",
    "note": "Financial buyers and data-center engineering。CCUA/division onefamily; T/CCUA064-2026 issuedApril20 effectiveMay20 postedMay9; PDF https://www.cra-ccua.org.cn/upload/jsjyh/69fe9b160c8d9.pdf。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "m.cra-ccua.org.cn",
      "www.cra-ccua.org.cn"
    ]
  },
  {
    "id": "cdb_procurement",
    "category": "buyers",
    "name": "国家开发银行采购网",
    "url": "https://cg.cdb.com.cn/cmscaigou/index.html",
    "mode": "public",
    "note": "政策性金融买方的国产智算路线与预算原始证据。。2025是项目名，发布年份实际2026。；框架预算不等于最终采购额；招标文件另需注册/付费。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "cg.cdb.com.cn"
    ]
  },
  {
    "id": "csair_procurement",
    "category": "buyers",
    "name": "中国南方航空采购招标网",
    "url": "https://csbidding.csair.cn/cms/nfhk/webfile/zbcg/zbgg/index.html",
    "mode": "manual",
    "note": "航空仿真/HPC、数据库及存储采购，更正公告可避免虚增数量。。采用更正后的设备清单。；框架预估采购量不是承诺。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "csbidding.csair.cn"
    ]
  },
  {
    "id": "chinapost_procurement",
    "category": "buyers",
    "name": "中国邮政集团·采购公告",
    "url": "https://www.chinapost.com.cn/cn/category/1813/137331-1.html",
    "mode": "public",
    "note": "物流央企数据中心与IT运维买方信号。。维保与新增硬件分开统计。；目录可能混入候选人公示，按正文阶段归类。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.chinapost.com.cn"
    ]
  },
  {
    "id": "szse_procurement",
    "category": "buyers",
    "name": "深圳证券交易所·电子招投标系统",
    "url": "https://ebs.szse.cn/cmscaigougg/index.html",
    "mode": "public",
    "note": "金融市场基础设施买方的芯片架构和数量；不同于证券公告披露。。交易所不是一般工商类国企，按金融基础设施买方扩展列入。；与中国招标投标公共服务平台、深圳阳光采购等镜像按项目去重。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "ebs.szse.cn"
    ]
  },
  {
    "id": "abc_procurement",
    "category": "buyers",
    "name": "中国农业银行·公开采购公告",
    "url": "https://www.abchina.com/cn/branch/tj/CG/BM/",
    "mode": "public",
    "note": "大型国有银行存量设备维保、技术栈和更新线索。。维保不是新增设备采购。；分行与集团门户归同一家族，不重复计数。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.abchina.com",
      "jc.abchina.com.cn"
    ]
  },
  {
    "id": "bocd_procurement",
    "category": "buyers",
    "name": "成都银行·电子采购系统",
    "url": "https://pcms.bocd.com.cn/cms/cmszonghangcg/index.html",
    "mode": "public",
    "note": "区域银行服务器数量/预算、机柜供应商及数据中心采购。。地方金融买方；本分支未重新核查最新股权控制关系。；注册/支付获取招标文件未尝试。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "pcms.bocd.com.cn"
    ]
  },
  {
    "id": "cib_procurement",
    "category": "buyers",
    "name": "兴业银行·集中采购管理平台",
    "url": "https://cg.cib.com.cn/cms/default/webfile/gyszj/index.html",
    "mode": "manual",
    "note": "贵安金融数据中心接近建设验收环节的买方信号。。测量采购不等于规划验收通过。；作为金融买方扩展列入；最新控制关系未独立核实。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "cg.cib.com.cn"
    ]
  },
  {
    "id": "crc_procurement",
    "category": "buyers",
    "name": "华润守正采购交易平台",
    "url": "https://szecp.com.cn/index.html",
    "mode": "manual",
    "note": "综合央企集团算力与IT项目，同时聚合其他委托买方。。平台并非全部为华润买方，应按公告采购人辨认。；不能把搜索可读等同正文抓取成功。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "szecp.com.cn",
      "www.crpsz.com"
    ]
  },
  {
    "id": "ccb_procurement",
    "category": "buyers",
    "name": "中国建设银行·龙集采与公开征集",
    "url": "https://ibuy.ccb.com/",
    "mode": "manual",
    "note": "国有银行服务器存储维保与供应商征集。。标题2026是服务年度，实际发布2025-09-25。；样本为维保，非新增硬件。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "ibuy.ccb.com",
      "sinfo3.ccb.com"
    ]
  },
  {
    "id": "boc_procurement",
    "category": "buyers",
    "name": "中国银行·中银智采",
    "url": "https://ctpch.fmscop.bankofchina.com/pcm#/first-page",
    "mode": "manual",
    "note": "大型国有银行采购源，但迁移后访问链需处理。。不得用2021样本包装为当前有效监测。；旧站公告未更新不等于没有采购。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "ctpch.fmscop.bankofchina.com",
      "www.boc.cn"
    ]
  },
  {
    "id": "guangdong_energy",
    "category": "projects",
    "name": "广东省能源局·通知公告/节能审查",
    "url": "https://drc.gd.gov.cn/snyj/tzgg/index.html",
    "mode": "public",
    "note": "机柜功率、液冷数量、计划PUE与投产日，为建设需求先行指标。。计划/授权不等于实际投产及耗电。；与基线广州、韶关为不同发布机关；省发改与省能源局合并同家族。；站点有禁止镜像提示，仅总结事实和链接。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "drc.gd.gov.cn"
    ]
  },
  {
    "id": "inner_mongolia_energy",
    "category": "projects",
    "name": "内蒙古自治区能源局·通知公告",
    "url": "https://nyj.nmg.gov.cn/tzgg/",
    "mode": "public",
    "note": "内蒙古算力集群电力获取、绿电与开发建设规则。。本样本是规则，不是具体项目设备采购或施工批准。；页面发布日期1月14日，URL含1月15日，签署日1月13日，不能混用。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "nyj.nmg.gov.cn"
    ]
  },
  {
    "id": "wuhu_data",
    "category": "projects",
    "name": "芜湖市数据资源管理局·部门文件",
    "url": "https://sjzyj.wuhu.gov.cn/public/column/6596821?catIds=6732121,6732131&type=6",
    "mode": "public",
    "note": "长三角芜湖集群建设准入、项目管理要求。。指南不是逐项批准目录。；2026-02-14为发布，2月12日为签署。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "sjzyj.wuhu.gov.cn"
    ]
  },
  {
    "id": "chongqing_drc",
    "category": "projects",
    "name": "重庆市发展改革委·审批核准备案信息",
    "url": "https://fzggw.cq.gov.cn/zwgk/zfxxgkml/sphzbaxx/",
    "mode": "manual",
    "note": "成渝地区数据中心节能审批、规模与PUE。。批准能耗不等于实际能耗。；旧正文成功不能替代新正文核验。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "fzggw.cq.gov.cn"
    ]
  },
  {
    "id": "qingyang_natural_resources",
    "category": "projects",
    "name": "庆阳市自然资源局·公告公示",
    "url": "https://zrzy.zgqingyang.gov.cn/xwzx/gggs/",
    "mode": "manual",
    "note": "庆阳国家集群实际用地、建设方案变更。。批前公示不等于最终批准。；403未绕过。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "zrzy.zgqingyang.gov.cn"
    ]
  },
  {
    "id": "ningxia_miit_energy",
    "category": "projects",
    "name": "宁夏工信厅·工业节能",
    "url": "https://gxt.nx.gov.cn/zwgk/fdzdgknr/zdlygk/gyjn/",
    "mode": "manual",
    "note": "宁夏数据中心节能审查主管部门，单查发改会漏掉。。发布日期据页面搜索全文为2025-03-13；URL202512不是发布日期。；公开版能耗数值省略，不能补造。；405未绕过。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "gxt.nx.gov.cn"
    ]
  },
  {
    "id": "zhongwei_planning",
    "category": "projects",
    "name": "中卫市自然资源局·规划许可",
    "url": "https://www.nxzw.gov.cn/zwgk/bmxxgkml/szrzyj/fdzdgknr_49539/zsydys_zrzyj/",
    "mode": "manual",
    "note": "中卫枢纽实际建设许可，以及数据中心供电配套项目。。日期尚待正文确认。；许可不是竣工或机柜上架。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.nxzw.gov.cn"
    ]
  },
  {
    "id": "guian_environment",
    "category": "projects",
    "name": "贵安新区生态环境局·项目环评",
    "url": "https://www.gaxq.gov.cn/zfbm/gaxqsthjj_5790529/zfxxgk_5790514/fdzdgknr_5790517/xmhp_5791889/",
    "mode": "manual",
    "note": "贵安数据中心建设范围、环保设施及配套审批线索。。不能用文件URL推断正式发布日期。；尚不符合精确日期+可读原文的合格新增标准。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.gaxq.gov.cn"
    ]
  },
  {
    "id": "sinopec_procurement",
    "category": "buyers",
    "name": "中国石化物资采购电子商务平台",
    "url": "https://ec.sinopec.com/supp/index.shtml",
    "mode": "manual",
    "note": "石化研发与油气HPC买方、国产CPU与GPU搭配及采购—预成交阶段链。。同组公告号关联，9月26日仅预成交，不能当最终合同。；搜索可读不等于正文直链可抓；不得将重定向首页的HTTP成功当正文验证。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "ec.sinopec.com",
      "epec.com"
    ]
  },
  {
    "id": "picc_procurement",
    "category": "buyers",
    "name": "中国人保·人保e采",
    "url": "https://ec.picc.com/cms/default/webfile/index.html",
    "mode": "manual",
    "note": "国有保险集团AI算力买方，超节点规格及各子公司需求可分层。。招标计划数量不等于交付数量。；首页截止时间不能替代公告发布日期。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "ec.picc.com"
    ]
  },
  {
    "id": "sugon",
    "category": "vendors",
    "name": "中科曙光",
    "url": "https://www.sugon.com/about/news?category_id=1&time=0",
    "mode": "public",
    "note": "国产整机、超节点、HPC、存储、Token效率一手发布。。厂商性能主张需核实；dataenergy.sugon.com及cloud.sugon.com归同族。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。 SCNet超算互联网归为同一出版家族的备用入口，不独立计数。",
    "hosts": [
      "www.sugon.com",
      "www.scnet.cn",
      "scnet.cn"
    ]
  },
  {
    "id": "xfusion",
    "category": "vendors",
    "name": "超聚变",
    "url": "https://www.xfusion.com/cn/news",
    "mode": "public",
    "note": "服务器、液冷、AI/HPC产品与客户案例。。入口读取有波动，不能宣称自动采集完整。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.xfusion.com"
    ]
  },
  {
    "id": "zte",
    "category": "vendors",
    "name": "中兴通讯",
    "url": "https://www.zte.com.cn/china/about/news.html",
    "mode": "public",
    "note": "服务器、OEX超节点、运营商算力、互联技术一手资料。。新闻、OpenLab与期刊归一出版族。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "openlab.zte.com.cn",
      "www.zte.com.cn"
    ]
  },
  {
    "id": "phytium",
    "category": "vendors",
    "name": "飞腾",
    "url": "https://www.phytium.com.cn/homepage/news/list",
    "mode": "public",
    "note": "国产服务器CPU生态与运营商落地线索。。厂商中标自述不等于采购附件或确认收入。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.phytium.com.cn"
    ]
  },
  {
    "id": "biren",
    "category": "vendors",
    "name": "壁仞科技",
    "url": "https://www.birentech.com/news/",
    "mode": "public",
    "note": "国产GPU供应与算力云合作一手线索。。合作不代表采购量；查看更多需要采集验证。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.birentech.com"
    ]
  },
  {
    "id": "huaqin",
    "category": "vendors",
    "name": "华勤技术",
    "url": "https://www.huaqin.com/about/news",
    "mode": "public",
    "note": "ODM/ODMM服务器、AI超节点、800G交换机与制造供给。。公司陈述与市场份额需独立验证。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.huaqin.com"
    ]
  },
  {
    "id": "digitalchina",
    "category": "vendors",
    "name": "神州数码／神州鲲泰",
    "url": "https://shenzhoukuntai.com/news.html",
    "mode": "public",
    "note": "国产整机、AI一体机、AICC、渠道生态。。digitalchina/shenzhoukuntai及企业镜像同族；同事件不算多方独立证实。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "shenzhoukuntai.com",
      "www.digitalchina.com"
    ]
  },
  {
    "id": "baidu_cloud",
    "category": "vendors",
    "name": "百度智能云",
    "url": "https://cloud.baidu.com/news/news",
    "mode": "public",
    "note": "云算力与存储价格、百舸/天池、国产XPU产品。。开发者UGC须排除；云价不等于服务器硬件ASP。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "cloud.baidu.com"
    ]
  },
  {
    "id": "athub",
    "category": "vendors",
    "name": "数据港",
    "url": "https://www.athub.com/index/Lists/index/catid/22.html?page=1",
    "mode": "public",
    "note": "AIDC运营商的点亮、集群及项目进度。。建设、投运、负载、签约与收入分阶段记录。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.athub.com"
    ]
  },
  {
    "id": "chindata",
    "category": "vendors",
    "name": "秦淮数据",
    "url": "https://www.chindatagroup.com/media/news.html",
    "mode": "public",
    "note": "IDC建设、算电协同、项目开工、供配电。。开工不等于运营容量；PRNewswire镜像同族。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.chindatagroup.com"
    ]
  },
  {
    "id": "vnet",
    "category": "vendors",
    "name": "世纪互联",
    "url": "https://ir.21vianet.com/",
    "mode": "public",
    "note": "IDC规模、利用率、资本支出、AIDC需求原始披露。。保留指标定义；订单、使用MW、预订容量不能混算。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "ir.21vianet.com"
    ]
  },
  {
    "id": "chinabyte",
    "category": "wechat",
    "name": "比特网／天极传媒",
    "url": "https://server.chinabyte.com/",
    "mode": "public",
    "note": "服务器、存储、企业IT媒体补充。。例为全球预测而非中国实际支出；天极/比特归同族。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "server.chinabyte.com",
      "soft.chinabyte.com",
      "ai.chinabyte.com",
      "storage.chinabyte.com",
      "cloud.chinabyte.com",
      "network.chinabyte.com"
    ]
  },
  {
    "id": "it168",
    "category": "wechat",
    "name": "IT168／ITPUB",
    "url": "https://server.it168.com/",
    "mode": "manual",
    "note": "服务器产品、渠道技术与产业采访。。datacenter频道样本为2022至2023旧文，使用server频道；IT168/ITPUB/泡泡网一盛拓传媒族。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "server.it168.com"
    ]
  },
  {
    "id": "leiphone",
    "category": "wechat",
    "name": "雷峰网",
    "url": "https://m.leiphone.com/category/chips",
    "mode": "manual",
    "note": "算力、芯片、SSD与企业深度采访。。搜索辅助人工来源，不能保证详情稳定采集或全站公开。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "m.leiphone.com"
    ]
  },
  {
    "id": "cena",
    "category": "wechat",
    "name": "中国电子报",
    "url": "https://epaper.cena.com.cn/",
    "mode": "manual",
    "note": "专业报纸整机、国产算力、供应链报道。。与CCIDNet保留独立编辑入口，保守同一CCID出版族。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "epaper.cena.com.cn",
      "www.ccidnet.com"
    ]
  },
  {
    "id": "cww",
    "category": "wechat",
    "name": "通信世界",
    "url": "https://www.cww.com.cn/index.jsp",
    "mode": "manual",
    "note": "运营商云、算网、设备与应用需求。。cww两个域同族；人邮出版社主办/信通传媒出版，不因同属工信行业与CENA归并。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.cww.com.cn",
      "www.cww.net.cn"
    ]
  },
  {
    "id": "dcd",
    "category": "wechat",
    "name": "DataCenterDynamics",
    "url": "https://www.datacenterdynamics.com/en/news/",
    "mode": "public",
    "note": "中国IDC项目国际专业报道及海外供应背景。。规划200MW与一期40MW分清，追溯GLP原始材料。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.datacenterdynamics.com"
    ]
  },
  {
    "id": "intel",
    "category": "vendors",
    "name": "英特尔",
    "url": "https://www.intel.cn/content/www/cn/zh/newsroom/home.html",
    "mode": "public",
    "note": "Xeon、AI推理/CPU路线与产业生态。。全球发布标地域，不等于中国需求。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "newsroom.intel.com",
      "www.intel.cn"
    ]
  },
  {
    "id": "nvidia",
    "category": "vendors",
    "name": "英伟达",
    "url": "https://blogs.nvidia.cn/",
    "mode": "public",
    "note": "GPU、NVLink、AI工厂、网络与供应路线。。例为全球未来部署计划，不是中国订单；全球/中文/开发者站同族。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "blogs.nvidia.cn",
      "www.nvidia.cn"
    ]
  },
  {
    "id": "amd",
    "category": "vendors",
    "name": "AMD",
    "url": "https://www.amd.com/zh-cn/newsroom/press-releases.html",
    "mode": "manual",
    "note": "EPYC、Instinct、机架级AI供给。。国际供给背景，不等于在中国可买或实际采购。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.amd.com"
    ]
  },
  {
    "id": "arm",
    "category": "vendors",
    "name": "Arm",
    "url": "https://newsroom.arm.com/news",
    "mode": "manual",
    "note": "云服务器CPU、AI数据中心架构原始信号。。发布时间与美国dateline分开；全球路线不等于中国需求。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "newsroom.arm.com",
      "www.arm.com"
    ]
  },
  {
    "id": "kunlunxin",
    "category": "vendors",
    "name": "昆仑芯",
    "url": "https://www.kunlunxin.com/news",
    "mode": "public",
    "note": "国产XPU、超节点、模型适配、可信计算。。公司介绍确认百度芯片部起源、2021独立融资，不证明目前控制关系；百度联合事件去重。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.kunlunxin.com"
    ]
  },
  {
    "id": "iluvatar",
    "category": "vendors",
    "name": "天数智芯",
    "url": "https://www.iluvatar.com/news",
    "mode": "manual",
    "note": "国产GPU架构、客户部署和软件生态。。保留发布日冲突，不能断言1月25日已发生活动；路线及性能为厂商主张。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.iluvatar.com"
    ]
  },
  {
    "id": "loongson",
    "category": "vendors",
    "name": "龙芯中科",
    "url": "https://www.loongson.cn/news/list",
    "mode": "public",
    "note": "LoongArch服务器CPU、适配、云产品、安全公告。。汇总覆盖3/4月、6月1日发表，分开记；模板登录框未阻断公开新闻。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.loongson.cn"
    ]
  },
  {
    "id": "kunlunit",
    "category": "vendors",
    "name": "河南昆仑技术",
    "url": "https://www.kunlunit.com/news",
    "mode": "public",
    "note": "整机、液冷及国产服务器供给。。与昆仑芯不是同公司；自有官网出版方明确，未建立与超聚变当前股权关系，不推断联合发布独立佐证。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.kunlunit.com"
    ]
  },
  {
    "id": "inspurcloud",
    "category": "vendors",
    "name": "浪潮云／浪潮集团",
    "url": "https://cloud.inspur.com/about-inspurcloud/about-us/news/index.html",
    "mode": "public",
    "note": "行业云与词元工厂需求侧，补充IEISystem硬件发布。。baseline已区分浪潮信息与浪潮集团；关联主体事件仍须去重。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "cloud.inspur.com"
    ]
  },
  {
    "id": "aliyun",
    "category": "vendors",
    "name": "阿里云／平头哥",
    "url": "https://ue.aliyun.com/",
    "mode": "manual",
    "note": "自研CPU/AI芯片/网卡、智算集群、交付线索。。阿里/平头哥/阿里云同族；搜索索引不等于原网页可解析。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "ue.aliyun.com"
    ]
  },
  {
    "id": "sinnet",
    "category": "vendors",
    "name": "光环新网／光环云",
    "url": "https://www.sinnet.com.cn/news.html",
    "mode": "public",
    "note": "IDC转AIDC、智算运营和AWS生态。。原文明确光环云为子公司，归一族；奖项/活动不等于已部署容量。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.sinnet.com.cn"
    ]
  },
  {
    "id": "supermicro",
    "category": "vendors",
    "name": "Supermicro",
    "url": "https://www.supermicro.com/en/newsroom/pressreleases",
    "mode": "public",
    "note": "机架系统、液冷、服务器和交付路线。。全球公司主张不等于中国采购；混合新闻室中区分外媒报道和自有稿件。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.supermicro.com"
    ]
  },
  {
    "id": "hpe",
    "category": "vendors",
    "name": "HPE",
    "url": "https://www.hpe.com/us/en/newsroom.html",
    "mode": "public",
    "note": "AI/HPC服务器、网络、液冷、客户订单与国际供给。。与baseline新华三是不同编辑出版入口；全球订单按地域隔离。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.hpe.com"
    ]
  },
  {
    "id": "dell",
    "category": "vendors",
    "name": "Dell Technologies",
    "url": "https://www.dell.com/en-us/dt/corporate/newsroom.htm",
    "mode": "public",
    "note": "PowerEdge、AI Factory、OCP机架与交付日期。。所述产品全球供应时间为明年初，非已交付；国内转载同事件去重。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.dell.com"
    ]
  },
  {
    "id": "ithome",
    "category": "wechat",
    "name": "IT之家／软媒",
    "url": "https://www.ithome.com/list/",
    "mode": "public",
    "note": "广义科技媒体的服务器/AI芯片新品和国际背景。。过滤消费/购物前先采完整滚动；区分供应商PR和编辑稿。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.ithome.com"
    ]
  },
  {
    "id": "glp",
    "category": "vendors",
    "name": "普洛斯GLP",
    "url": "https://www.glp.com.cn/business/data_center.html",
    "mode": "public",
    "note": "中国IDC项目、运营、PUE与水资源实践。。获奖及厂商主张不是独立确认建设完工；排除staging/preweb域。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.glp.com.cn"
    ]
  },
  {
    "id": "aofei",
    "category": "vendors",
    "name": "奥飞数据",
    "url": "https://www.ofidc.com/",
    "mode": "manual",
    "note": "IDC与Equinix跨境算力合作。。华为合作搜索稿是2023-12-22而非2026；财务以baseline巨潮为准。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.ofidc.com"
    ]
  },
  {
    "id": "eworks",
    "category": "wechat",
    "name": "e-works",
    "url": "https://news.e-works.net.cn/",
    "mode": "manual",
    "note": "制造业IT采访、工业HPC/AI应用需求。。区分原创和PR转载：8月28日news138192来源曙光；搜索命中不是采集分母。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "news.e-works.net.cn"
    ]
  },
  {
    "id": "dfsx",
    "category": "vendors",
    "name": "东方算芯",
    "url": "https://www.dfsx.com/news",
    "mode": "public",
    "note": "近存计算AI芯片、液冷服务器、64卡超节点和集群。。按e-works线索追原站；产品/路线/伙伴数是公司陈述，不等于订单。。公开目录与代表原文已核查；本站按需检查仅当前页，历史覆盖以逐月回执为准。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.dfsx.com"
    ]
  },
  {
    "id": "evas",
    "category": "vendors",
    "name": "奕行智能 EVAS",
    "url": "https://www.evas.ai/newsroom",
    "mode": "manual",
    "note": "RISC-V云端AI芯片、Epoch超节点与运营商部署。。不与温州奕行智能装备wismove混淆；详情提取缺口，目录可用；企业PR非独立佐证。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.evas.ai"
    ]
  },
  {
    "id": "ksyun",
    "category": "vendors",
    "name": "金山云",
    "url": "https://www.ksyun.com/cms/noticelist_p1_t1",
    "mode": "manual",
    "note": "云服务器租用、云硬盘及供给成本价格通知。。9月20日发布，10月20日生效；价格表是图片待另核。云价不是硬件ASP。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.ksyun.com"
    ]
  },
  {
    "id": "tencent",
    "category": "vendors",
    "name": "腾讯／腾讯云",
    "url": "https://www.tencent.com/newsroom/all-news/",
    "mode": "manual",
    "note": "T-AIDC、PUE、绿电、算电协同的云厂商原始披露。。2026年6月稿回顾2025年数据；企业与云产品同族，排除developer社区UGC。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "cloud.tencent.com",
      "www.tencent.com"
    ]
  },
  {
    "id": "cctime",
    "category": "wechat",
    "name": "飞象网",
    "url": "https://www.cctime.com/",
    "mode": "manual",
    "note": "运营商、整机与智算基础设施专业采访。。搜索全文只是人工研究途径，不保证稳定生产采集；搜索命中不作月分母。。自动读取尚未确认可用；动态、授权或访问受限时从官方入口手动核对或导入，不绕过验证。仅保留必要摘要、事实与原文链接，不镜像全文；目录登记不代表全月采集完整。",
    "hosts": [
      "www.cctime.com"
    ]
  }
];

export function sourceForUrl(url){try{const host=new URL(url).hostname;return sourcePanel.find(s=>s.hosts.includes(host))||null;}catch{return null;}}
