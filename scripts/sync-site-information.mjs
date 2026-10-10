import fs from 'node:fs';
import {sourcePanel} from '../data/sources.js';
import {buildSiteInformation} from '../lib/source-information.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const write=(p,x)=>fs.writeFileSync(new URL('../'+p,import.meta.url),JSON.stringify(x,null,2)+'\n');
const audits=fs.readdirSync(new URL('../data/',import.meta.url)).filter(name=>/^source-audit-\d{8}\.json$/.test(name)).map(name=>read('data/'+name));
const publishedAudits=fs.readdirSync(new URL('../public/',import.meta.url)).filter(name=>/^source-audit-\d{8}\.json$/.test(name)).map(name=>read('public/'+name));
const result=buildSiteInformation({panel:read('public/market-panel.json'),research:read('data/research-2026.json'),audits,publishedAudits,registry:sourcePanel,monitor:read('data/weekly-monitor.json')});
write('data/latest-update.json',result.latest);
write('public/latest-update.json',result.latest);
write('public/'+result.publicAudit.id+'.json',result.publicAudit);
write('data/weekly-monitor.json',result.monitor);
write('public/report-monitor.json',read('data/report-monitor.json'));
// Historical audit files, refresh manifests, alerts and complete-week cutoffs are
// never rewritten by this synchronization step.
console.log(JSON.stringify({...result.latest,source_checks:`${result.latest.source_checks.length} current receipts`}));
