-- Preserve the original version before merging the two retired categories.
INSERT OR IGNORE INTO history (owner, id, revision, data, at)
SELECT owner, id, revision, data, updated FROM records
WHERE EXISTS (SELECT 1 FROM json_each(records.data, '$.techs') WHERE value IN ('ai_appliance', 'heterogeneous'));
--> statement-breakpoint
UPDATE records SET
  data = json_set(data,
    '$.techs', json((SELECT json_group_array(DISTINCT CASE WHEN value IN ('ai_appliance', 'heterogeneous') THEN 'compute_field' ELSE value END) FROM json_each(records.data, '$.techs'))),
    '$.classification_note', COALESCE(json_extract(data, '$.classification_note') || char(10), '') || '按2026-09-20确认口径，原AI一体机与通用异构智算并入算力场，涵盖资源池、统一调度及AI一体机采购与部署；保留其他标签，不据此推定芯片类型。',
    '$.classification_migration', '2026-09-20-v2.3',
    '$.revision', revision + 1,
    '$.updated_at', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  revision = revision + 1,
  updated = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE EXISTS (SELECT 1 FROM json_each(records.data, '$.techs') WHERE value IN ('ai_appliance', 'heterogeneous'));
--> statement-breakpoint
INSERT OR IGNORE INTO history (owner, id, revision, data, at)
SELECT owner, id, revision, data, updated FROM records
WHERE json_extract(data, '$.classification_migration') = '2026-09-20-v2.3';
