#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourcePanel } from '../data/sources.js';
import { eventDisposition, normalizeSourceReceipt, validateSourceAudit } from '../lib/source-audit.js';
// This command validates the immutable Oct 9 cohort; later registrations have their own audits.
const expansionIds=new Set(['eet_china','trendforce','zhidx','shanghai_drc','gt_procurement','gds_ir','hkex','jiangsu_ggzy','zycg','zzcg']);
const historicalSourceIds=sourcePanel.filter(s=>!expansionIds.has(s.id)).map(s=>s.id);
const auditUrl = new URL('../data/source-audit-20261009.json', import.meta.url);
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const researchUrl = new URL('../data/research-2026.json', import.meta.url);
const requestedWindow = { start: '2026-01-01', end: '2026-10-09' };
// Receipts are intentionally external inputs. The checked-in snapshot is self-contained.
// Usage: node scripts/check-source-audit.mjs --refresh-receipts /path/to/audit-bundle
function publicReceipt(value) {
  if (Array.isArray(value)) return value.map(publicReceipt);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !/(^|_)(path|file)$/.test(key)).map(([key, v]) => [key, publicReceipt(v)]));
  return typeof value === 'string' && /\/workspace\//.test(value) ? '[local evidence reference omitted]' : value;
}
export async function refreshSourceAudit(bundle) {
  const research = await read(researchUrl), records = [...research.events, ...research.leads];
  const alias = { doit_all: 'doit', c114_roll_all: 'c114', zhiding_latest: 'zhiding', cbinews_all_news: 'cbinews' };
  const inputs = (await Promise.all(['vendors', 'projects', 'media'].map(group => read(resolve(bundle, group, 'source-receipts.json'))))).flat();
  const sourceChecks = inputs.map(raw => normalizeSourceReceipt(publicReceipt({ ...raw, ...(alias[raw.source_id] ? { archive_source_id: raw.source_id, source_id: alias[raw.source_id] } : {}) })));
  const reasonList = [
    '转载项目号和原文标识被遮挡，金额文本存在缺位；保留9月候选等待原始结果，不推算金额。',
    '', '', '',
    '现有页面为技术解读且仅称9月底；需要采购原公告、项目编号和确切节点，不能将报道日视为招标日。',
    '目前为商业关键词汇总页，尚未关联买方或代理机构候选原文；9月30日与公示期分别保留待核。',
    '',
    '转载买方为泰国实体，但供货地点及大陆关联未取得原件确认；保留范围待核，不仅凭公司名排除。',
    '原发布日期线索为9月10日，需核采购原始正文及项目编号，区分页面更新时间与采购发生时间。',
    '新加坡展示不属于大陆采购，但可能属于中国厂商技术供给；保留供给栏目适配与展会日期核验队列。',
    '原始设备清单明确为两台Dell Precision塔式工作站，排除于严格服务器和数据中心设备研究范围。',
  ];
  const baselineUrls = [
  "https://m.yfbzb.com/winbid/detail/20261003_636167633.html",
  "https://www.ccgp.gov.cn/cggg/dfgg/gkzb/202610/t20261001_27437043.htm",
  "https://bbda.com/wordlist/1004149_0.html",
  "https://www.shanghai.gov.cn/nw4411/20261001/bebfc6af5c4046f78b84b42e618cccc0.html",
  "https://hwcomputing.csdn.net/6ac30ac005257b085714bf76.html",
  "https://www.qianlima.com/gjxx/82984_30_4",
  "https://ggzyfw.beijing.gov.cn/xtggtjzbjh/20260903/5697031.html",
  "https://www.bid360.com.cn/zbgs/U-vzBpouv.html",
  "https://chinazbcgou.com.cn/index/index/article/id/10666474",
  "https://www.haiwu.com/news/dynamic/2155.html",
  "https://sbgysfw.sysc.tsinghua.edu.cn/#/publish/1A0F9F70F1222CB77370171EE44F6986"
];
  const reasons = new Map(baselineUrls.map((url, i) => [url, reasonList[i]]));
  const dispositions = research.october_refresh.excluded.map(candidate => {
    if (!reasons.has(candidate.url)) throw Error('Unreviewed exclusion candidate: ' + candidate.url);
    const decision = candidate.backfill_record_id
      ? { outcome: 'backfilled', record_ids: [candidate.backfill_record_id], reason: candidate.date_correction || '已回填全年研究台账；记录自身保留证据等级与事件日期不确定性，不按十月窗口删除。' }
      : candidate.url === baselineUrls[10] ? { outcome: 'out_of_scope', scope_basis: 'equipment_scope', reason: reasons.get(candidate.url) }
      : { outcome: 'pending_verification', reason: reasons.get(candidate.url) };
    return { ...eventDisposition(candidate, records, requestedWindow, decision), event_date_basis: 'original_candidate_date_not_independent_verification', ...(candidate.date_correction ? { date_correction: candidate.date_correction, pending_original_date_verification: true } : {}) };
  });
  const audit = {
    schema_version: 1, id: 'source-audit-20261009', checked_on: '2026-10-09', requested_window: requestedWindow,
    full_coverage: false,
    coverage_statement: '47个登记来源的逐源检查与历史完整性分别统计。入口可读、定向抽查或现有记录数量均不代表全年全量覆盖；媒体当前日仅为采集时点快照。',
    summary: { registered_sources: historicalSourceIds.length, source_receipts: sourceChecks.length, sources_checked: sourceChecks.filter(r => r.checked === true).length, historically_complete_sources: sourceChecks.filter(r => r.history_complete === true).length, exclusion_candidates: dispositions.length },
    source_checks: sourceChecks, exclusion_dispositions: dispositions,
  };
  await writeFile(auditUrl, JSON.stringify(audit, null, 2) + '\n');
}
export async function checkSourceAudit() {
  const [audit, research] = await Promise.all([read(auditUrl), read(researchUrl)]);
  const records = [...research.events, ...research.leads];
  const errors = validateSourceAudit(audit, records, historicalSourceIds, { candidates: research.october_refresh.excluded, requireReady: true });
  if (historicalSourceIds.length !== 47) errors.push('Original registered source panel must contain 47 sources; review baseline changes explicitly.');
  if (research.october_refresh.excluded.length !== 11) errors.push('Original October exclusion baseline must contain 11 candidates.');
  if (audit.requested_window?.start !== requestedWindow.start || audit.requested_window?.end !== requestedWindow.end) errors.push('Unexpected audit research window.');
  if (/\/workspace\//.test(JSON.stringify(audit))) errors.push('Public audit snapshot must not expose local working paths.');
  return { errors, summary: audit.summary };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === '--refresh-receipts') {
      if (!process.argv[3]) throw Error('Expected audit bundle directory.');
      await refreshSourceAudit(process.argv[3]);
    } else if (process.argv[2]) throw Error('Unknown option.');
    const result = await checkSourceAudit();
    console.log(JSON.stringify(result, null, 2));
    if (result.errors.length) process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
