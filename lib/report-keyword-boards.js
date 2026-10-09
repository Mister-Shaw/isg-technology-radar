import{classifyBoards}from'./keyword-boards.js';
const businessMap={solutions:'business_heterogeneous_ai',servers:'business_servers',storage:'business_storage',network:'business_network'};
export function reportBoardMatches(series){
 const matches=classifyBoards({title:series.title||'',fact_summary:[series.subtopic,series.scope].filter(Boolean).join('；')},'research');
 // Retain the already-reviewed business ownership of each market series.
 if(businessMap[series.group])matches.business=[businessMap[series.group]];
 return matches;
}
