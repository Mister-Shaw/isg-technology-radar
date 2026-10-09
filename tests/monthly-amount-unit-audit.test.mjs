import assert from 'node:assert/strict';import fs from'node:fs';
import{combinedAmountRows,combinedAmountSummary}from'../lib/monthly.js';
const d=JSON.parse(fs.readFileSync(new URL('../data/research-2026.json',import.meta.url))),all=[...d.events,...d.leads],lot=all.find(r=>r.id==='rec-svc-20260514-ningxia-token-lot2'),parent=all.find(r=>r.id==='exp-compute-393b43322eae');
assert.equal(lot.amount_cny,1494600000);assert.equal(parent.amount_cny,17438060000);assert(lot.combined_amount_exclusion);
const combined=combinedAmountRows(all);assert(!combined.some(r=>r.id===lot.id));assert(combined.some(r=>r.id===parent.id));
assert.equal(combinedAmountSummary([{_amount_min:8200000000,_amount_max:8200000000}]).total_amount,820000);
assert.equal(combinedAmountSummary([{_amount_min:1494600000,_amount_max:1494600000}]).total_amount,149460);
console.log('PASS: yuan-to-wan conversion and Ningxia inclusive total/lot duplicate excluded without deleting evidence');
