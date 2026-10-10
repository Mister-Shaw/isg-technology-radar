import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalSourceUrl, eventDisposition, normalizeSourceReceipt, preciseDay, validateSourceAudit } from '../lib/source-audit.js';
import { checkSourceAudit } from '../scripts/check-source-audit.mjs';
const window = { start: '2026-01-01', end: '2026-10-09' };
const candidate = { title: '九月项目的十月报道', url: 'https://example.org/news', displayed_date: '2026-10-01', original_event_date: '2026-09-29', reason: '不计十月新增' };
const receipt = normalizeSourceReceipt({ source_id: 'a', checked_on: '2026-10-09', status: 'blocked', actually_verified_window: 'Only the entry point was attempted; historical enumeration remains incomplete.' });
test('cross-month news remains queued until linked, never silently dropped', () => {
  const d = eventDisposition(candidate, [], window);
  assert.equal(d.outcome, 'pending_verification'); assert.equal(d.within_research_window, true);
  assert.throws(() => eventDisposition(candidate, [], window, { outcome: 'out_of_scope', scope_basis: 'outside_research_window', reason: '仅因不属于十月而排除本事件' }));
  const bad = { ...d, outcome: 'out_of_scope', scope_basis: 'outside_research_window', reason: 'This event is outside October.' };
  assert.ok(validateSourceAudit({ exclusion_dispositions: [bad] }, []).some(e => e.includes('跨月')));
});
test('backfills must resolve to persisted IDs and retain disclosure and original candidate dates', () => {
  const d = eventDisposition(candidate, [{ id: 'a', url: candidate.url }], window, { outcome: 'backfilled' });
  assert.deepEqual(d.record_ids, ['a']); assert.equal(d.published_date, '2026-10-01');
  assert.throws(() => eventDisposition(candidate, [], window, { outcome: 'backfilled' }));
  assert.deepEqual(validateSourceAudit({ exclusion_dispositions: [d] }, [{ id: 'a' }]), []);
  assert.equal(validateSourceAudit({ exclusion_dispositions: [d] }, []).length, 1);
});
test('month-only dates stay uncertain; malformed calendar dates are rejected', () => {
  for (const date of ['2026-09', '2026-10-00', '2026-02-30']) assert.equal(preciseDay(date), false);
  const d = eventDisposition({ ...candidate, original_event_date: '2026-09' }, [], window);
  assert.equal(d.event_date_precision, 'unresolved'); assert.equal(d.within_research_window, null);
});
test('SPA record fragments survive canonicalization and do not merge distinct records', () => {
  const first = 'https://sbgysfw.sysc.tsinghua.edu.cn/?utm_source=test#/publish/ONE';
  const second = 'https://sbgysfw.sysc.tsinghua.edu.cn/#/publish/TWO';
  assert.equal(canonicalSourceUrl(first), 'https://sbgysfw.sysc.tsinghua.edu.cn/#/publish/ONE');
  assert.notEqual(canonicalSourceUrl(first), canonicalSourceUrl(second));
  const d = eventDisposition({ ...candidate, url: first }, [{ id: 'two', url: second }], window);
  assert.equal(d.outcome, 'pending_verification'); assert.deepEqual(d.record_ids, []);
});
test('receipt normalization preserves day precision and verification limits without inventing coverage', () => {
  assert.equal(receipt.checked_at, '2026-10-09'); assert.equal(receipt.checked_at_precision, 'day');
  assert.equal(receipt.checked, true); assert.equal(receipt.history_complete, false); assert.equal(receipt.verified_window, null);
  assert.equal(receipt.verified_window_limits, receipt.actually_verified_window);
  assert.deepEqual(validateSourceAudit({ source_checks: [receipt] }, [], ['a'], { requireReady: true }), []);
});
test('missing, duplicate, unregistered and in-progress source receipts fail the gate', () => {
  assert.equal(validateSourceAudit({ source_checks: [] }, [], ['a']).length, 1);
  assert.ok(validateSourceAudit({ source_checks: [receipt, receipt] }, [], ['a']).some(e => e.includes('重复')));
  assert.ok(validateSourceAudit({ source_checks: [receipt] }, [], ['b']).some(e => e.includes('未登记')));
  assert.ok(validateSourceAudit({ source_checks: [{ ...receipt, status: 'partial_or_running' }] }, [], ['a'], { requireReady: true }).length);
});
test('complete-history claims require enumeration, date validation, evidence and the requested window', () => {
  const audit = { requested_window: window, source_checks: [{ ...receipt, history_complete: true }] };
  assert.ok(validateSourceAudit(audit, [], ['a']).length);
  const complete = { ...receipt, history_complete: true, verified_window: window, enumeration_complete: true, date_validation_complete: true, evidence_urls: ['https://example.org/archive'] };
  assert.deepEqual(validateSourceAudit({ ...audit, source_checks: [complete] }, [], ['a']), []);
  assert.ok(validateSourceAudit({ ...audit, source_checks: [{ ...complete, verified_window: { start: '2026-09-01', end: '2026-10-09' } }] }, [], ['a']).length);
  assert.ok(validateSourceAudit({ full_coverage: true, source_checks: [receipt] }, [], ['a']).length);
});
test('partial current day may coexist with verified complete prior days but must be explicit', () => {
  const prior = { ...receipt, history_complete: true, verified_window: { start: window.start, end: '2026-10-08' }, enumeration_complete: true, date_validation_complete: true, evidence_urls: ['https://example.org/archive'] };
  assert.ok(validateSourceAudit({ requested_window: window, source_checks: [prior] }, [], ['a']).length);
  assert.deepEqual(validateSourceAudit({ requested_window: window, source_checks: [{ ...prior, partial_current_day: true, complete_calendar_days_through: '2026-10-08', snapshot_window: window }] }, [], ['a']), []);
});
test('every original exclusion needs exactly one disposition and cannot be silently rewritten', () => {
  const d = eventDisposition(candidate, [], window);
  const options = { candidates: [candidate] };
  assert.deepEqual(validateSourceAudit({ requested_window: window, exclusion_dispositions: [d] }, [], [], options), []);
  assert.ok(validateSourceAudit({ exclusion_dispositions: [] }, [], [], options).length);
  assert.ok(validateSourceAudit({ exclusion_dispositions: [d, d] }, [], [], options).length);
  assert.ok(validateSourceAudit({ exclusion_dispositions: [{ ...d, event_date: '2026-10-01' }] }, [], [], options).length);
  assert.ok(validateSourceAudit({ exclusion_dispositions: [{ ...d, reason: '待核' }] }, []).length);
});
test('persisted audit snapshot validates against the actual research ledger and source registry', async () => {
  const result = await checkSourceAudit();
  assert.deepEqual(result.errors, [], result.errors.join('\n'));
});
