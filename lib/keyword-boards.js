// Standalone keyword classifier. Source vocabulary is kept separately from aliases.
// No network, dependencies, mutations of records, or reliance on a Site runtime.
export const KEYWORD_RULE_VERSION = 'three-boards-2026-10-08.v1';

const category = (id, name, keywords, source_name = name) => ({ id, name, source_name, keywords });
export const BOARDS = [
  { id: 'business', name: '业务方向', categories: [
    category('business_heterogeneous_ai', '万全异构智算方案', ['模型工厂', '模型车间', '词元工厂', '词元车间', 'AI一体机', '异构智算', 'Token工厂', 'Token车间', 'AI工厂', 'AI加速'], '异构智算'),
    category('business_servers', '服务器', ['通算', '超算', '超融合', '天数天算', '智算', '超节点']),
    category('business_storage', '存储', ['传统存储', '软件定义存储', 'AI存储', 'CXL', 'CMX', '分层存储']),
    category('business_network', '数据网络', ['IP网络', 'IB网络', '光模块'], '网络'),
  ] },
  { id: 'components', name: '核心部件', categories: [
    category('components_cpu', 'CPU芯片', ['X86', 'ARM']),
    category('components_accelerators', '加速芯片', ['GPU', 'TPU', 'LPU', 'RPU', 'ASIC']),
    category('components_storage', '存储部件', ['Mem', 'SSD', 'CXL']),
    category('components_liquid_cooling', '液冷散热', ['冷板', 'CDU', '液冷']),
    category('components_interconnect', '高速互联', ['光互联', '光交换芯片', '光模块', 'CPO', 'NPO', 'LPO']),
    category('components_power_systems', '电源系统', ['电源设备', '储能系统']),
    category('components_power_modules', '供电模块', ['VRM', 'MLCC']),
    category('components_signal', '信号传输', ['PCB', 'Pcle Switch']),
    category('components_management', '管理&控制', ['BMC', 'CPLD']),
  ] },
  { id: 'scenarios', name: '场景生态', categories: [
    category('scenarios_compute_field', '算力场', ['算力场']),
    category('scenarios_eda', 'EDA', ['EDA']),
    category('scenarios_compute_rental', '算力租赁', ['算力租赁']),
    category('scenarios_token_factory', 'Token工厂', ['Token工厂']),
    category('scenarios_aidc', 'AIDC', ['AIDC']),
    category('scenarios_modular_dc', '模块化数据中心', ['模块化数据中心']),
    category('scenarios_pilot_field', '中试场', ['中试场']),
    category('scenarios_turing_town', '图灵小镇', ['图灵小镇']),
  ] },
];

// Finite, inspectable aliases, never an unconstrained synonym/substring expansion.
// A space within an alias permits zero or more spaces, including full-width ones.
export const KEYWORD_ALIASES = {
  '模型工厂': ['model factory'], '模型车间': ['model workshop'],
  '词元工厂': [], '词元车间': [],
  'AI一体机': ['AI 一体机', 'AI all-in-one', 'AI all in one', 'AI appliance'],
  '异构智算': ['heterogeneous AI computing', 'heterogeneous intelligent computing'],
  'Token工厂': ['Token 工厂', 'token factory', '词元工厂'], 'Token车间': ['Token 车间', 'token workshop'],
  'AI工厂': ['AI 工厂', 'AI factory'], 'AI加速': ['AI 加速', 'AI acceleration', 'AI accelerator', 'AI accelerators'],
  '通算': ['general-purpose computing', 'general purpose computing'],
  '超算': ['supercomputing', 'supercomputer', 'supercomputers'],
  '超融合': ['hyperconverged', 'hyper-converged', 'hyper converged'],
  '天数天算': [], '智算': ['intelligent computing'], '超节点': ['supernode', 'super node'],
  '传统存储': ['traditional storage'],
  '软件定义存储': ['software-defined storage', 'software defined storage'],
  'AI存储': ['AI 存储', 'AI storage'], 'CXL': [], 'CMX': [], '分层存储': ['tiered storage', 'storage tiering'],
  'IP网络': ['IP 网络', 'IP network', 'IP networks'],
  'IB网络': ['IB 网络', 'IB network', 'IB networks', 'InfiniBand network', 'InfiniBand networks', 'InfiniBand 网络'],
  '光模块': ['optical module', 'optical modules', 'optical transceiver', 'optical transceivers'],
  'X86': [], 'ARM': [], 'GPU': ['GPUs'], 'TPU': ['TPUs'], 'LPU': ['LPUs'], 'RPU': ['RPUs'], 'ASIC': ['ASICs'],
  'Mem': ['memory', '内存'], 'SSD': ['SSDs', 'solid-state drive', 'solid state drive', '固态硬盘'],
  '冷板': ['cold plate', 'cold plates'], 'CDU': ['coolant distribution unit'], '液冷': ['liquid cooling', 'liquid-cooled', 'liquid cooled'],
  '光互联': ['optical interconnect', 'optical interconnects'],
  '光交换芯片': ['optical switch chip', 'optical switching chip'],
  'CPO': ['co-packaged optics', 'co packaged optics'], 'NPO': ['near-packaged optics', 'near packaged optics'], 'LPO': ['linear pluggable optics'],
  '电源设备': ['power supply equipment'], '储能系统': ['energy storage system', 'energy storage systems'],
  'VRM': ['voltage regulator module'], 'MLCC': ['multilayer ceramic capacitor', 'multi-layer ceramic capacitor'],
  'PCB': ['printed circuit board'],
  // Preserve the uploaded spelling while also accepting the standard spelling.
  'Pcle Switch': ['PCIe Switch', 'PCIe交换机', 'PCIe 交换机', 'PCIe交换芯片', 'PCIe 交换芯片'],
  'BMC': ['baseboard management controller'], 'CPLD': ['complex programmable logic device'],
  '算力场': [], 'EDA': ['electronic design automation', '电子设计自动化'],
  '算力租赁': ['compute rental', 'computing power rental', 'GPU rental', '算力租用', 'GPU租赁', 'GPU 租赁', '智算租赁'],
  'AIDC': ['AI data center', 'AI data centre', 'AI 数据中心', '人工智能数据中心', '智算中心', '智能计算中心'],
  '模块化数据中心': ['modular data center', 'modular data centre'],
  '中试场': [], '图灵小镇': ['Turing town'],
};

export function definitionsForBoard(boardId) {
  return Object.fromEntries((BOARDS.find(board => board.id === boardId)?.categories ?? []).map(item => [item.id, item.name]));
}
export function boardCategoryIds(boardId) {
  return Object.keys(definitionsForBoard(boardId));
}

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// ASCII lookarounds avoid JS \b treating a Chinese-adjacent acronym as a boundary problem.
// They also block charm→ARM, member→Mem, rapid→IP, and AIDCare→AIDC.
const literalPattern = phrase => {
  const normalized = phrase.normalize('NFKC').toLowerCase();
  const body = normalized.trim().split(/\s+/u).map(escapeRegExp).join('\\s*');
  return `${/^[a-z0-9_]/.test(normalized) ? '(?<![a-z0-9_])' : ''}${body}${/[a-z0-9_]$/.test(normalized) ? '(?![a-z0-9_])' : ''}`;
};
const compiledRules = BOARDS.flatMap(board => board.categories.flatMap(item => item.keywords.map(keyword => ({
  board: board.id, category: item.id, keyword,
  // Longest alternatives first preserve the most informative original span.
  regex: new RegExp([...new Set([keyword, ...(KEYWORD_ALIASES[keyword] ?? [])])].sort((a, b) => b.length - a.length).map(literalPattern).join('|'), 'gu'),
}))));

function normalizeWithOffsets(value) {
  const source = typeof value === 'string' ? value : '';
  let text = ''; const starts = []; const ends = [];
  let offset = 0;
  for (const char of source) {
    const normalized = char.normalize('NFKC').toLowerCase();
    for (let index = 0; index < normalized.length; index++) { starts.push(offset); ends.push(offset + char.length); }
    text += normalized; offset += char.length;
  }
  return { source, text, starts, ends };
}

const consumerContext = /running\s*shoes|跑鞋|运动鞋|手机|智能手机|游戏(?:本|笔记本|电脑|主机|显卡)|电竞(?:本|电脑|显卡)|家用(?:电脑|主机)|装机|台式机|个人电脑|水冷(?:机箱|散热器)|PC.{0,12}(?:水冷|液冷)|smartphone|iphone|ipad|mobile\s*phone|gaming\s*(?:pc|laptop|computer|gpu|graphics)|consumer\s*(?:pc|laptop)|desktop\s*pc|geforce|radeon\s*rx|automotive|车载|汽车|乘用车|电动汽车/iu;
const enterpriseContext = /服务器|数据中心|资料中心|智算|超算|超节点|算力(?:集群|中心|租赁|场)|异构|企业级|企业客户|商用|b2b|server|data\s*cent(?:er|re)|enterprise|hyperscal|supercomput|rack.scale|cloud\s*(?:comput|infrastructure)|(?<![a-z0-9_])aidc(?![a-z0-9_])/iu;

/**
 * News is title-only. Research additionally uses factual fact_summary, never body,
 * limitations, speculation, source URLs, or existing classification tags.
 * exclusions are structured diagnostics with severity=exclude|warning; warnings
 * never remove a match. Unsupported modes throw instead of silently widening scope.
 */
export function classifyBoards(record, mode = 'news') {
  if (!['news', 'research'].includes(mode)) throw new TypeError(`Unsupported classification mode: ${mode}`);
  const input = typeof record === 'string' ? { title: record } : (record ?? {});
  const fields = (mode === 'research' ? ['title', 'fact_summary'] : ['title']).map(field => ({ field, ...normalizeWithOffsets(input[field]) }));
  const result = { business: [], components: [], scenarios: [], matches: [], exclusions: [] };
  const context = fields.map(field => field.text).join('\n');
  // Clear consumer/automotive-only records are outside server infrastructure scope.
  // AIDC/enterprise/servers explicitly restore eligibility; ordinary B2B chip news
  // with no consumer cue is eligible without requiring a second server keyword.
  if (consumerContext.test(context) && !enterpriseContext.test(context)) {
    result.exclusions.push({ reason: 'consumer_or_automotive_only', severity: 'exclude', fields: fields.filter(field => consumerContext.test(field.text)).map(field => field.field), rule_version: KEYWORD_RULE_VERSION });
    return result;
  }
  for (const rule of compiledRules) {
    for (const field of fields) {
      rule.regex.lastIndex = 0;
      for (const found of field.text.matchAll(rule.regex)) {
        const start = field.starts[found.index];
        const end = field.ends[found.index + found[0].length - 1];
        result.matches.push({ board: rule.board, category: rule.category, keyword: rule.keyword, matched: field.source.slice(start, end), field: field.field, rule_version: KEYWORD_RULE_VERSION });
        if (!result[rule.board].includes(rule.category)) result[rule.board].push(rule.category);
        if (rule.keyword === 'CMX') result.exclusions.push({ reason: 'CMX_needs_context', severity: 'warning', field: field.field, matched: field.source.slice(start, end), rule_version: KEYWORD_RULE_VERSION });
      }
    }
  }
  return result;
}

export function compactBoardMatches(record,mode='news'){
 const result=classifyBoards(record,mode);
 return Object.fromEntries(BOARDS.map(board=>[board.id,result[board.id]]));
}

// Only boards 1/2 have a category -> keyword hierarchy. Board 3 is single-level.
export const KEYWORD_BOARD_ROWS=BOARDS.flatMap(board=>board.categories.flatMap(category=>[
 {id:category.id,board:board.id,level:'category',name:category.name,fullLabel:category.name,parentId:null,keywords:category.keywords},
 ...(board.id==='scenarios'?[]:category.keywords.map((keyword,index)=>({id:category.id+'__kw_'+index,board:board.id,level:'keyword',name:keyword,fullLabel:category.name+' / '+keyword,parentId:category.id,keyword,keywords:[keyword]})))
]));
const keywordRowMap=new Map(KEYWORD_BOARD_ROWS.map(row=>[row.id,row]));
export const keywordRowById=id=>keywordRowMap.get(id);
export const rowsForBoard=board=>KEYWORD_BOARD_ROWS.filter(row=>row.board===board);
export const definitionsForRows=board=>Object.fromEntries(rowsForBoard(board).map(row=>[row.id,row.fullLabel]));
export const termsForKeywordRow=id=>keywordRowById(id)?.keywords||[];
const keywordMatchCache=new WeakMap();
export function matchesKeywordRow(record,id,mode='news'){
 const row=keywordRowById(id);if(!row)return false;
 let cached=keywordMatchCache.get(record);if(!cached){cached={};keywordMatchCache.set(record,cached);}
 const matches=cached[mode]??=(classifyBoards(record,mode));
 return row.level==='category'?matches[row.board].includes(row.id):matches.matches.some(hit=>hit.category===row.parentId&&hit.keyword===row.keyword);
}
