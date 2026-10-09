import {keywordRowById,KEYWORD_BOARD_ROWS} from './keyword-boards.js';

export function collapsibleParents(ids){
 return [...new Set(ids.map(id=>keywordRowById(id)?.parentId).filter(Boolean))];
}
export function keywordRowVisible(id,collapsed){
 const parent=keywordRowById(id)?.parentId;
 return !parent||!collapsed.has(parent);
}
export function toggleKeywordParent(collapsed,id){
 const next=new Set(collapsed);
 if(next.has(id))next.delete(id);else next.add(id);
 return next;
}
export function setKeywordParentsCollapsed(collapsed,parents,value){
 const next=new Set(collapsed);
 for(const id of parents){if(value)next.add(id);else next.delete(id);}
 return next;
}

export function defaultCollapsedKeywordParents(){
 return new Set(collapsibleParents(KEYWORD_BOARD_ROWS.map(row=>row.id)));
}
