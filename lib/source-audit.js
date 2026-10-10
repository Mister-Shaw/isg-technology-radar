// Source access checks and historical enumeration are independent claims.
export const AUDIT_OUTCOMES = new Set(['linked_existing', 'backfilled', 'pending_verification', 'out_of_scope']);
export const SCOPE_BASES = new Set(['equipment_scope', 'geography_scope', 'outside_research_window', 'not_an_event']);
export function canonicalSourceUrl(value) {
  try {
    const u = new URL(value);
    for (const key of [...u.searchParams.keys()]) if (/^(utm_|spm$|from$)/i.test(key)) u.searchParams.delete(key);
    // The fragment can identify a real record in an SPA. Never remove it.
    return u.href;
  } catch { return String(value || '').trim(); }
}
export function preciseDay(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
}
const substantive = value => typeof value === 'string' && value.trim().length >= 12;
const previousDay = (day, end) => preciseDay(day) && preciseDay(end) && Date.parse(end) - Date.parse(day) === 86400000;
const validWindow = w => w && preciseDay(w.start) && preciseDay(w.end) && w.start <= w.end;
const monthOnlyExclusion = reason => /仅.*(本月|十月)|不计十月|不属于十月|月份不同|cross.month|outside October|not.*October/i.test(reason || '');
export function normalizeSourceReceipt(receipt) {
  const checkedAt = receipt.checked_at || receipt.checked_on || null;
  return {
    ...receipt,
    checked_at: checkedAt,
    checked_at_precision: preciseDay(checkedAt) ? 'day' : 'timestamp',
    checked: receipt.checked ?? Boolean(checkedAt && (receipt.status || receipt.access_status)),
    status: receipt.status || receipt.access_status || 'not_ready',
    history_complete: receipt.history_complete ?? receipt.full_requested_history_verified ?? false,
    // Keep prose limits intact; never turn the requested window or local row span into proof.
    verified_window: receipt.verified_window || null,
    verified_window_limits: (Array.isArray(receipt.verified_window_limits) ? receipt.verified_window_limits.join(' ') : receipt.verified_window_limits) || receipt.actually_verified_window || receipt.coverage_limit || receipt.note || (receipt.limitations || []).join(' ') || null,
  };
}
export function eventDisposition(candidate, records, { start, end }, decision = {}) {
  const url = canonicalSourceUrl(candidate.url), ids = new Set(decision.record_ids || []);
  if ([...ids].some(id => !records.some(r => r.id === id))) throw Error('Explicit backfill record ID is missing');
  const linked = records.filter(r => ids.has(r.id) || (url && canonicalSourceUrl(r.url) === url) || r.corroborating_sources?.some(s => canonicalSourceUrl(typeof s === 'string' ? s : s.url) === url));
  const date = candidate.original_event_date || candidate.event_date;
  const within = preciseDay(date) ? date >= start && date <= end : null;
  const outcome = decision.outcome || (linked.length ? 'linked_existing' : 'pending_verification');
  if (!AUDIT_OUTCOMES.has(outcome)) throw Error('Unknown source-audit outcome');
  if (['linked_existing', 'backfilled'].includes(outcome) && !linked.length) throw Error('Backfill disposition needs an existing record');
  if (outcome === 'out_of_scope' && (!substantive(decision.reason) || !SCOPE_BASES.has(decision.scope_basis))) throw Error('Exclusion needs a substantive scope reason and scope basis');
  if (outcome === 'out_of_scope' && within && monthOnlyExclusion(decision.reason)) throw Error('A month boundary cannot exclude an in-window event');
  return {
    title: candidate.title, url: candidate.url,
    published_date: candidate.displayed_date || candidate.published_date || null,
    event_date: date || null, event_date_precision: preciseDay(date) ? 'day' : date ? 'unresolved' : 'unknown',
    within_research_window: within, outcome, record_ids: linked.map(r => r.id),
    reason: decision.reason || (linked.length ? '已关联研究台账；保留原排除记录便于追溯。' : '需要核对原文、项目与日期；保留待核队列，不因跨月丢弃。'),
    ...(decision.scope_basis ? { scope_basis: decision.scope_basis } : {}),
    original_reason: candidate.reason || null,
  };
}
export function validateSourceAudit(audit, records, sourceIds = [], { candidates, requireReady = false } = {}) {
  const ids = new Set(records.map(r => r.id)), errors = [], dispositions = audit.exclusion_dispositions || [];
  const receiptRows = audit.source_checks || [], seen = new Set();
  for (const c of dispositions) {
    if (!AUDIT_OUTCOMES.has(c.outcome)) errors.push('缺少候选处置：' + c.title);
    if (['linked_existing', 'backfilled'].includes(c.outcome) && (!c.record_ids?.length || c.record_ids.some(id => !ids.has(id)))) errors.push('补录关联失效：' + c.title);
    if (['pending_verification', 'out_of_scope'].includes(c.outcome) && !substantive(c.reason)) errors.push('处置缺少实质原因：' + c.title);
    if (c.outcome === 'out_of_scope') {
      if (!SCOPE_BASES.has(c.scope_basis)) errors.push('排除缺少范围依据：' + c.title);
      if (c.within_research_window !== false && monthOnlyExclusion(c.reason)) errors.push('不得仅因跨月排除：' + c.title);
      if (c.scope_basis === 'outside_research_window' && c.within_research_window !== false) errors.push('研究窗口排除无日期依据：' + c.title);
    }
    if (c.event_date_precision === 'day' && !preciseDay(c.event_date)) errors.push('事件日期无效：' + c.title);
  }
  if (candidates) {
    const keys = candidates.map(c => canonicalSourceUrl(c.url));
    const actual = dispositions.map(c => canonicalSourceUrl(c.url));
    for (const url of keys) if (actual.filter(u => u === url).length !== 1) errors.push('原排除候选必须恰有一个处置：' + url);
    for (const url of actual) if (!keys.includes(url)) errors.push('处置不属于原排除候选：' + url);
    for (const c of dispositions) {
      const original = candidates.find(row => canonicalSourceUrl(row.url) === canonicalSourceUrl(c.url));
      if (original && (c.event_date !== (original.original_event_date || original.event_date || null) || c.original_reason !== (original.reason || null))) errors.push('处置未保留原始日期或原因：' + c.title);
      if (validWindow(audit.requested_window)) {
        const within = preciseDay(c.event_date) ? c.event_date >= audit.requested_window.start && c.event_date <= audit.requested_window.end : null;
        if (c.within_research_window !== within) errors.push('处置窗口标识失实：' + c.title);
      }
    }
  }
  for (const r of receiptRows) {
    if (seen.has(r.source_id)) errors.push('重复逐源回执：' + r.source_id);
    seen.add(r.source_id);
    if (sourceIds.length && !sourceIds.includes(r.source_id)) errors.push('未登记的逐源回执：' + r.source_id);
    if (!r.checked_at || Number.isNaN(Date.parse(r.checked_at)) || (/^\d{4}-\d{2}-\d{2}$/.test(r.checked_at) && !preciseDay(r.checked_at)) || !r.status) errors.push('回执信息不全：' + r.source_id);
    if (requireReady && (r.checked !== true || ['not_ready', 'partial_or_running'].includes(r.status))) errors.push('逐源检查未完成：' + r.source_id);
    if (typeof r.history_complete !== 'boolean') errors.push('回执未区分历史完整性：' + r.source_id);
    if (!substantive(r.verified_window_limits)) errors.push('回执未保留核验限制：' + r.source_id);
    const claimsComplete = r.history_complete || r.full_requested_history_verified || r.status === 'complete';
    if (claimsComplete && r.history_complete !== true) errors.push('完整覆盖声明与历史标识冲突：' + r.source_id);
    if (claimsComplete && (!validWindow(r.verified_window) || r.enumeration_complete !== true || r.date_validation_complete !== true || !r.evidence_urls?.length)) errors.push('完整覆盖缺少已核时间窗或枚举证据：' + r.source_id);
    if (claimsComplete && validWindow(audit.requested_window) && validWindow(r.verified_window) && (r.verified_window.start > audit.requested_window.start || (r.verified_window.end < audit.requested_window.end && !(r.partial_current_day === true && r.complete_calendar_days_through === r.verified_window.end && previousDay(r.verified_window.end, audit.requested_window.end) && r.snapshot_window?.start === audit.requested_window.start && r.snapshot_window?.end === audit.requested_window.end)))) errors.push('已核时间窗不足以支持完整历史：' + r.source_id);
    if (r.verified_window && !validWindow(r.verified_window)) errors.push('核验窗口日期无效：' + r.source_id);
  }
  for (const id of sourceIds) if (!seen.has(id)) errors.push('缺少逐源回执：' + id);
  if (audit.full_coverage === true && (receiptRows.length !== sourceIds.length || receiptRows.some(r => !r.history_complete))) errors.push('不能将逐源检查标为全量历史覆盖');
  if (audit.summary) {
    const expected = { registered_sources: sourceIds.length, source_receipts: receiptRows.length, sources_checked: receiptRows.filter(r => r.checked === true).length, historically_complete_sources: receiptRows.filter(r => r.history_complete === true).length, exclusion_candidates: dispositions.length };
    for (const [key, value] of Object.entries(expected)) if (audit.summary[key] !== value) errors.push('审计汇总不符：' + key);
  }
  return errors;
}
