import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {combineNumericalDomain}=require('recharts/lib/state/selectors/axisSelectors.js');
const axis={allowDataOverflow:false},domain=[0,max=>Math.max(1,Math.ceil(max*1.15))];
// Stacked all-zero series produce no stack domain in this Recharts version.
assert.equal(combineNumericalDomain(axis,domain,undefined,undefined,undefined,undefined,'horizontal','yAxis'),undefined);
assert.deepEqual(combineNumericalDomain(axis,domain,undefined,undefined,[0,0],undefined,'horizontal','yAxis'),[0,1]);
assert.deepEqual(combineNumericalDomain(axis,domain,undefined,undefined,undefined,[0,0],'horizontal','yAxis'),[0,1]);
const chart=fs.readFileSync(new URL('../app/trend-bar-chart.jsx',import.meta.url),'utf8');
assert(chart.includes('ifOverflow="extendDomain"'));
assert(chart.includes('r={0} fill="none" stroke="none"'));
assert(chart.includes("className:'chart-zero-value-label'"));
const market=fs.readFileSync(new URL('../app/market-panel.jsx',import.meta.url),'utf8');
const newsBars=market.match(/const NEWS_BARS=([^;]+);/)[1];assert(!newsBars.includes('stackId'));
console.log('PASS: all-zero domain established for measured zero; news series unstacked; marker domain fallback');
