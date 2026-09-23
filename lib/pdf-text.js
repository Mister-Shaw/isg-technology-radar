import {getDocument,GlobalWorkerOptions} from 'pdfjs-dist/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc=workerUrl;
export async function pdfText(bytes){
 if(bytes.byteLength>5000000)throw Error('PDF 最多 5 MB，请拆分后导入。');
 const task=getDocument({data:bytes,isEvalSupported:false,useSystemFonts:false,disableFontFace:true});
 try{
  const doc=await task.promise;let text='',pages=0;
  for(let n=1;n<=Math.min(doc.numPages,30);n++){const page=await doc.getPage(n),content=await page.getTextContent();text+=`\n[第 ${n} 页]\n`+content.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join('');pages=n;page.cleanup();if(text.length>=15000)break;}
  if(text.replace(/\[第 \d+ 页\]/g,'').trim().length<20)throw Error('未检测到可用文本，可能是扫描件。请识别文字后粘贴导入。');
  return {excerpt:`[PDF 文本提取：读取 ${pages}/${doc.numPages} 页；最多保留 15,000 字。表格和扫描图片需对照原件核验。]\n`+text.slice(0,15000),pages,totalPages:doc.numPages};
 }finally{await task.destroy();}
}
