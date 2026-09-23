import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['tests/import-http.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,RADAR_BASE_URL:'https://example.invalid'},encoding:'utf8'});
assert.notEqual(result.status,0);
assert.match(result.stderr,/Write tests require a local HTTP server/);
console.log('PASS: configurable write tests reject non-local destinations before network access');
