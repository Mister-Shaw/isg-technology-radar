import {readMarket} from './market-fixture.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {presentPanelMatrix,panelSampleLabel} from '../lib/panel-presentation.js';
import {panelMatrix,panelColors,panelCsv} from '../lib/panel.js';
const data=readMarket(),source=data.sources.find(s=>s.id==='media_all');
const raw=panelMatrix(data,source,'attention','month','all',{aidc:'AIDC'}),snapshot=JSON.stringify(raw),shown=presentPanelMatrix(raw,'news'),oct=shown[0].points.at(-1);
assert.equal(oct.value,1000*oct.n/oct.N);assert.equal(oct.complete,false);assert.equal(oct.partial,true);assert.equal(oct.observedPresentation,true);assert.equal(oct.status,'已采样本');
assert.notEqual(panelColors(shown).background(oct.value),'#f1f3f6');
// A rolling month's share can fall below another month; color scale uses all observed points.
const expectedMax=Math.max(...shown.flatMap(row=>row.points).map(point=>point.value).filter(Number.isFinite));
assert.equal(panelColors(shown).max,expectedMax);assert(panelColors(shown).max>=oct.value);
assert.equal(JSON.stringify(raw),snapshot,'Raw quality/statistical state unchanged');assert.equal(raw[0].points.at(-1).value,null);
assert(panelCsv(raw).includes('覆盖不完整'),'Export keeps the auditable coverage status');
assert.strictEqual(presentPanelMatrix(raw,'procurement'),raw,'Do not promote unverified procurement demand to complete data');
const absent=[{points:[{N:0,value:null,sample_value:null,status:'覆盖不完整'}]}];assert.equal(presentPanelMatrix(absent,'news')[0].points[0].value,null);
const unreviewed=[{points:[{N:20,value:null,sample_value:null,status:'行为复核未完成'}]}];assert.equal(presentPanelMatrix(unreviewed,'news')[0].points[0].value,null);
const zero=[{points:[{N:20,value:null,sample_value:0,sample_upper:0,sample_unknown:0,complete:false}]}];assert.equal(presentPanelMatrix(zero,'news')[0].points[0].value,0);
console.log('PASS: observed news normal colors, zero versus missing, raw quality/export preserved, procurement unchanged');

assert.equal(panelSampleLabel({n:0,N:0}),"暂无样本");
assert.equal(panelSampleLabel({n:0,N:12}),"0/12");
assert.equal(panelSampleLabel({n:2,N:12}),"2/12");
