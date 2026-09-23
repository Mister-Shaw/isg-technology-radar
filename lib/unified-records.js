import {researchReview,summary,dateWindow} from './model.js';
import {eventKey} from './monthly.js';

// Reviewed event-level aliases. A shared URL is not sufficient: announcements can contain multiple lots.
export const LEGACY_ALIASES={
 'ARCH-TF-01':'carry-ARCH-TF-01','ARCH-TF-02':'svc-20260805-yizhuang-token-policy',
 'ARCH-TF-03':'carry-ARCH-TF-03','ARCH-TF-04':'carry-ARCH-TF-04','ARCH-TF-05':'carry-ARCH-TF-05',
 'ARCH-SN-01':'compute-007','ARCH-SN-02':'carry-ARCH-SN-02','ARCH-SN-03':'carry-ARCH-SN-03','ARCH-SN-04':'carry-ARCH-SN-04',
 'AD-LC-001':'carry-AD-LC-001','AD-LC-002':'carry-AD-LC-002','AD-LC-003':'carry-AD-LC-003',
 'AD-AI-001':'carry-AD-AI-001','AD-AI-002':'carry-AD-AI-002',
 'AD-HE-001':'carry-AD-HE-001','AD-HE-002':'carry-AD-HE-002','AD-HE-003':'carry-AD-HE-003','AD-HE-004':'carry-AD-HE-004'
};
export function workspaceResearch(e){
 return {...e,categories:e.categories||e.techs||[],tags:e.tags||[],amount_cny:e.value_cny??null,
  amount_kind:e.amount_kind||'none',amount_eligible:e.amount_eligible??false,
  evidence_status:e.review_status==='quarantine'?'conflict':e.review_status==='accepted'?(e.evidence_status||'primary'):(['reported','lead'].includes(e.evidence_status)?e.evidence_status:'lead'),
  project_id:e.id==='ARCH-SN-05'&&e.project_id==='nucc-2026-deep-compute-server-package2-202511435027'?'CG2026050032/202511435027-包2':e.project_id,
  _revision:e.revision||0,_ref:{source:'workspace',key:e.id}};
}
function projectRow(e,section,legacy){
 const extras=legacy?{legacy_record_id:legacy.id,legacy_project_id:legacy.project_id,classification_note:legacy.classification_note,competitors:legacy.competitors,note:legacy.note||'',implication:legacy.implication||'',followup_on:legacy.followup_on||null}:{};
 const row={...extras,...e};
 return {...row,event_key:eventKey(row),techs:row.categories||[],value_cny:row.amount_cny??null,
  review_status:researchReview(row),revision:row._revision||0,
  _ref:row._ref||{source:'research',section,key:row.id}};
}
// Read projection only: every row retains one writable source and its original revision history.
export function unifyRecords(research,workspace){
 const legacyByTarget=new Map(workspace.filter(e=>LEGACY_ALIASES[e.id]).map(e=>[LEGACY_ALIASES[e.id],e]));
 const known=new Set([...research.events,...research.leads].map(e=>e.id)),mergedIds=new Set();
 const result={...research,events:research.events.map(e=>projectRow(e,'events',legacyByTarget.get(e.id))),leads:research.leads.map(e=>projectRow(e,'leads',legacyByTarget.get(e.id)))};
 for(const e of workspace){
  if(known.has(LEGACY_ALIASES[e.id])){mergedIds.add(e.id);continue;}
  const row=workspaceResearch(e),section=researchReview(row)==='accepted'?'events':'leads';
  result[section].push(projectRow(row,section));
 }
 const records=[...result.events,...result.leads],{start,end}=dateWindow(research),s=summary(records,start,end),included=summary(records,start,end,true);
 return {records,research:result,sync:{total:records.length,included:included.docs,included_events:included.events,included_projects:included.demand,verified:s.docs,events:s.events,pending:s.pending,quarantine:s.quarantine,history:records.filter(e=>e.review_status==='accepted').length-s.docs,projects:s.demand,merged:mergedIds.size,supplemental:workspace.length-mergedIds.size,as_of:research.as_of||research.period_end}};
}
