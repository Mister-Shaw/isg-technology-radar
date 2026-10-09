import assert from 'node:assert/strict';
import { BOARDS, KEYWORD_ALIASES, KEYWORD_RULE_VERSION, boardCategoryIds, definitionsForBoard, classifyBoards } from '../lib/keyword-boards.js';

let checks = 0;
const test = (name, check) => { try { check(); checks++; } catch (error) { console.error(`FAIL: ${name}`); throw error; } };
const has = (title, board, category) => classifyBoards({ title })[board].includes(category);
test('exact board/category counts', () => assert.deepEqual(BOARDS.map(board => [board.name, board.categories.length]), [['业务方向', 4], ['核心部件', 9], ['场景生态', 8]]));
test('stable category ID uniqueness', () => { const ids = BOARDS.flatMap(board => boardCategoryIds(board.id)); assert.equal(new Set(ids).size, 21); });
test('display/source name preservation', () => { assert.equal(BOARDS[0].categories[0].source_name, '异构智算'); assert.equal(BOARDS[0].categories[3].source_name, '网络'); assert.equal(definitionsForBoard('business').business_heterogeneous_ai, '万全异构智算方案'); });

for (const board of BOARDS) for (const category of board.categories) for (const keyword of category.keywords) {
  test(`literal ${board.id}/${category.id}/${keyword}`, () => {
    const result = classifyBoards({ title: `发布${keyword}技术` });
    assert.ok(result[board.id].includes(category.id));
    assert.ok(result.matches.some(match => match.keyword === keyword && match.category === category.id && match.matched === keyword && match.field === 'title' && match.rule_version === KEYWORD_RULE_VERSION));
  });
  for (const alias of KEYWORD_ALIASES[keyword] ?? []) test(`alias ${keyword}: ${alias}`, () => {
    const result = classifyBoards({ title: `发布${alias.toUpperCase()}技术` });
    assert.ok(result[board.id].includes(category.id));
    assert.ok(result.matches.some(match => match.keyword === keyword && match.category === category.id));
  });
}

for (const title of ['ARM架构服务器', '新一代ARM芯片', '国产GPU发布', '服务器Mem扩容', '存储CXL互联', '发布EDA工具', '建设AIDC园区']) {
  test(`Chinese-adjacent ASCII: ${title}`, () => assert.ok(classifyBoards({ title }).matches.length > 0));
}
for (const title of ['charm launch', 'member update', 'warm room', 'farm supply', 'memorable day', 'membership update', 'AIDCare app', 'cheddar cheese', 'asics running shoes', 'armchair review', 'IP address change', 'new network devices', 'CPLDynamics update', 'GPUtopia launch']) {
  test(`bounded negative: ${title}`, () => assert.equal(classifyBoards({ title }).matches.length, 0));
}
test('fullwidth, case and spacing with original span', () => {
  const result = classifyBoards({ title: '采用ＡＲＭ架构的服务器及ＰＣＩｅ　　Ｓｗｉｔｃｈ' });
  assert.ok(result.components.includes('components_cpu'));
  assert.ok(result.components.includes('components_signal'));
  assert.ok(result.matches.some(match => match.keyword === 'Pcle Switch' && match.matched === 'ＰＣＩｅ　　Ｓｗｉｔｃｈ'));
});
for (const alias of ['Pcle Switch', 'pcleSwitch', 'PCIeSwitch', 'PCIe Switch', 'PCIe交换机', 'PCIe 交换机']) {
  test(`uploaded typo/correction: ${alias}`, () => assert.ok(has(alias, 'components', 'components_signal')));
}
test('explicit IP/IB phrases only', () => { assert.ok(has('IP 网络升级', 'business', 'business_network')); assert.ok(has('InfiniBand networks', 'business', 'business_network')); });
test('cross-board CXL optical token overlap', () => {
  const result = classifyBoards({ title: 'Token工厂采用CXL与光模块' });
  for (const [board, id] of [['business', 'business_heterogeneous_ai'], ['business', 'business_storage'], ['business', 'business_network'], ['components', 'components_storage'], ['components', 'components_interconnect'], ['scenarios', 'scenarios_token_factory']]) assert.ok(result[board].includes(id));
});
for (const title of ['ARM手机新芯片', 'gaming PC GPU liquid cooling', 'GeForce GPU发布', 'PC液冷装机指南', '车载SSD存储升级', 'automotive SSD controller', 'iPhone ARM GPU']) {
  test(`consumer/automotive exclusion: ${title}`, () => { const result = classifyBoards({ title }); assert.equal(result.matches.length, 0); assert.equal(result.exclusions[0].reason, 'consumer_or_automotive_only'); });
}
for (const title of ['手机厂商发布服务器ARM芯片', 'automotive supplier builds AIDC', '企业级GPU兼容游戏显卡测试', 'AIDC新园区开工', 'AI accelerator launch', '国产GPU芯片量产']) {
  test(`enterprise eligibility or no consumer restriction: ${title}`, () => assert.ok(classifyBoards({ title }).matches.length > 0));
}
test('title-only news', () => {
  const result = classifyBoards({ title: '新产品发布', fact_summary: 'GPU与CXL', body: 'AIDC', limitations: 'SSD', speculation: 'ARM', tags: ['EDA'] });
  assert.equal(result.matches.length, 0);
});
test('research factual fields only and field provenance', () => {
  const result = classifyBoards({ title: 'GPU产品发布', fact_summary: '采用CXL技术', body: 'AIDC', limitations: 'SSD', speculation: 'ARM' }, 'research');
  assert.ok(result.matches.some(match => match.keyword === 'GPU' && match.field === 'title'));
  assert.ok(result.matches.some(match => match.keyword === 'CXL' && match.field === 'fact_summary'));
  assert.ok(!result.matches.some(match => ['AIDC', 'SSD', 'ARM'].includes(match.keyword)));
});
test('research does not join partial keywords across fields', () => assert.equal(classifyBoards({ title: 'Token', fact_summary: '工厂' }, 'research').matches.length, 0));
test('CMX is literal and flagged without invented expansion', () => {
  const result = classifyBoards({ title: 'CMX发布' });
  assert.ok(result.business.includes('business_storage'));
  assert.ok(result.exclusions.some(item => item.reason === 'CMX_needs_context' && item.severity === 'warning'));
  assert.equal(classifyBoards({ title: 'compute memory exchange' }).business.length, 0);
});
test('repeated mentions retain every occurrence but category unique', () => { const result = classifyBoards('GPU与GPU'); assert.equal(result.matches.length, 2); assert.equal(result.components.length, 1); });
test('no record mutation', () => { const record = Object.freeze({ title: 'GPU' }); assert.ok(classifyBoards(record).matches.length > 0); });
test('null/empty input is safe', () => { for (const value of [null, undefined, {}, { title: null }, { title: [] }]) assert.equal(classifyBoards(value).matches.length, 0); });
test('unknown board IDs return empty definitions', () => assert.deepEqual(definitionsForBoard('no-board'), {}));
test('unknown modes rejected', () => assert.throws(() => classifyBoards({ title: 'GPU' }, 'body'), TypeError));
test('regex state does not affect repeat calls', () => assert.deepEqual(classifyBoards('GPU GPU'), classifyBoards('GPU GPU')));
console.log(`PASS: ${checks} classification checks; rules ${KEYWORD_RULE_VERSION}`);
