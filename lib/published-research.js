import {publishedResearchKeys} from '../data/published-research-keys.js';

const publishedRows = new Map();
for (const [section, snapshotKey, storageKey, storageSection=section] of publishedResearchKeys) {
 const row = {section, snapshotKey, storageKey, storageSection};
 publishedRows.set(snapshotKey, row);
 publishedRows.set(storageKey, row);
}

export const publishedResearchRow = key => publishedRows.get(key);

export function changedResearchFields(previous, next) {
 return Object.fromEntries(Object.entries(next).filter(([field, value]) =>
  !['id','_revision','board_matches','keyword_rule_version','collection_batch'].includes(field) &&
  JSON.stringify(value) !== JSON.stringify(previous[field])));
}

// The public editor created revision 1 before this richer snapshot was published.
// Replay subsequent changes against the preceding editor revision to preserve explicit clears and reversions.
export function projectPublishedHistory(identity, snapshotRow, edits, initialSnapshot=snapshotRow) {
 let previous, changes = {}, previousRevision = 0;
 return edits.map(edit => {
  if (edit.revision !== previousRevision + 1) throw Error('503:研究条目缺少历史版本，无法还原共享修改。');
  if (edit.snapshot_key === identity.snapshotKey && edit.snapshot_changes) {
   changes = edit.snapshot_changes;
  } else if (edit.snapshot_key === identity.snapshotKey || identity.storageKey === identity.snapshotKey) {
   // Older canonical saves contain a full copy of the snapshot's then-current fields.
   const previousWasSnapshot = previous && (previous.snapshot_key === identity.snapshotKey || identity.storageKey === identity.snapshotKey);
   const base = previousWasSnapshot ? previous.value : {...initialSnapshot,...changes};
   changes = {...changes, ...changedResearchFields(base, edit.value)};
  } else if (previous) {
   changes = {...changes, ...changedResearchFields(previous.value, edit.value)};
  }
  previous = edit;
  previousRevision = edit.revision;
  return {...edit, section:identity.section, key:identity.snapshotKey, value:{...snapshotRow,...changes,id:identity.snapshotKey}};
 });
}
