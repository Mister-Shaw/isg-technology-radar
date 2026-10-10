import fs from 'node:fs';
import {mergeMarketAssets} from '../lib/market-data.js';
export function readMarket(){const read=p=>JSON.parse(fs.readFileSync(new URL('../public'+p,import.meta.url)));const base=read('/market-panel.json');return mergeMarketAssets(base,(base.expansion_assets||[]).map(read));}
