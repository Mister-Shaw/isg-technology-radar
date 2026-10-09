'use client';
import SegmentedControl from './segmented-control';
import {BOARDS,KEYWORD_BOARD_ROWS} from '@/lib/keyword-boards';
export const KEYWORD_LABELS=Object.fromEntries(KEYWORD_BOARD_ROWS.map(row=>[row.id,row.fullLabel]));
export function KeywordBoardTabs({board,onChange}){
 return <SegmentedControl className="keyword-board-tabs" label="三个关键词看板" options={BOARDS.map(b=>({id:b.id,label:b.name}))} value={board} onChange={onChange}/>;
}
export function KeywordBoardGuide({board}){
 const b=BOARDS.find(b=>b.id===board)||BOARDS[0];
 return <details className="card keyword-guide"><summary>{b.name} · 分类与关键词</summary><div className="table-scroll"><table><thead><tr><th>{board==='scenarios'?'观察条目':'分类'}</th>{board!=='scenarios'&&<th>关键词</th>}</tr></thead><tbody>{b.categories.map(c=><tr key={c.id}><th>{c.name}</th>{board!=='scenarios'&&<td>{c.keywords.join('、')}</td>}</tr>)}</tbody></table></div><p className="panel-note">新闻按标题、事件按标题与摘要识别；跨类不加总，命中不等于采购。</p></details>;
}
