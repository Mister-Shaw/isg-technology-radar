import {publishedResearchKeys} from '../data/published-research-keys.js';

const publishedRows = new Map();
for (const [section, snapshotKey, storageKey] of publishedResearchKeys) {
 const row = {section, snapshotKey, storageKey};
 publishedRows.set(snapshotKey, row);
 publishedRows.set(storageKey, row);
}

export const publishedResearchRow = key => publishedRows.get(key);

export function changedResearchFields(previous, next) {
 return Object.fromEntries(Object.entries(next).filter(([field, value]) =>
  field !== 'id' && JSON.stringify(value) !== JSON.stringify(previous[field])));
}

// The public editor created revision 1 before this richer snapshot was published.
// Replay subsequent changes against the preceding editor revision to preserve explicit clears and reversions.
export function projectPublishedHistory(identity, snapshotRow, edits) {
 let previous, value = snapshotRow, previousRevision = 0;
 return edits.map(edit => {
  if (edit.revision !== previousRevision + 1) throw Error('503:研究条目缺少历史版本，无法还原共享修改。');
  if (edit.snapshot_key === identity.snapshotKey) {
   value = {...snapshotRow, ...edit.value};
  } else if (previous) {
   value = {...value, ...changedResearchFields(previous, edit.value)};
  }
  previous = edit.value;
  previousRevision = edit.revision;
  return {...edit, key:identity.snapshotKey, value:{...value, id:identity.snapshotKey}};
 });
}
