import{c as e,r as t}from"./index-CCNPhRsY.js";var n=[`support`,`complement`];function r(t,r,i){if(t.length===0||r.length===0)return[];let a=[];for(let o=0;o<Math.min(i,t.length);o++){let i=t[o%t.length],s=r.find(e=>e.id===i.documentId)||r[0];a.push({id:e(),chunkId:i.id,documentId:i.documentId,documentName:s.fileName,text:i.content.slice(0,200),pageNumber:i.pageNumber,sectionTitle:i.sectionTitle,relation:n[o%2],relevanceScore:.9-o*.05})}return a}var i=class{name=`Mock Demo Provider`;id=`mock`;async testConnection(){return await new Promise(e=>setTimeout(e,300+Math.random()*400)),{ok:!0,message:`Mock provider is always available`,latencyMs:350}}async chat(e,t){await new Promise(e=>setTimeout(e,300+Math.random()*400));let n=t?.chunks||[],i=t?.documents||[],a=e.filter(e=>e.role===`user`).pop()?.content||``,o=[`你好`,`nihao`,`hello`,`hi`,`嗨`,`在吗`,`你是谁`,`你能做什么`,`介绍一下自己`,`怎么用`,`帮助`,`help`],s=a.toLowerCase().replace(/[\s,，。.！!？?]/g,``);if((o.some(e=>s===e.toLowerCase().replace(/[\s,，。.！!？?]/g,``))||s===``)&&i.length>0)return{content:`你好！我是证流 AI 文档助手。\n\n当前已加载 ${i.length} 份文档：${i.map(e=>`《${e.fileName}》`).join(`、`)}\n\n你可以直接问我文档相关的问题，比如："总结一下这些文档的主要内容"、"这几份文档有什么共同点"、"文档中有哪些不同的观点"\n\n注意：当前是 Mock 演示模式，回答基于本地分析。在设置中配置 DeepSeek API Key 可获得更智能的 AI 分析。`,citations:[]};if(n.length===0)return{content:`我在当前文档中没有找到与"${a.slice(0,50)}"直接相关的内容。请尝试上传更多文档，或换个方式提问。`,citations:[]};let c=r(n,i,Math.min(5,n.length)),l=[...new Set(n.map(e=>i.find(t=>t.id===e.documentId)?.fileName||`未知`))].join(`、`),u=a.replace(/[?？,，。.！!]/g,``).split(/\s+/).filter(e=>e.length>1),d=[];for(let e of n.slice(0,4)){let t=i.find(t=>t.id===e.documentId),n=e.content.split(/[。.！!？?\n]/).filter(e=>e.trim().length>5),r=n.filter(e=>u.some(t=>e.includes(t)));r.length>0?d.push(`来自《${t?.fileName||`未知`}》${e.pageNumber?`第${e.pageNumber}页`:``}：${r[0].trim()}`):n.length>0&&d.push(`来自《${t?.fileName||`未知`}》${e.pageNumber?`第${e.pageNumber}页`:``}：${n[0].trim()}`)}let f=`分析范围：${i.length} 份文档（${l}），共 ${n.length} 个文本片段。\n\n`,p=d.length>0?`根据文档内容提取的关键信息：\n\n${d.map((e,t)=>`${t+1}. ${e}`).join(`

`)}\n\n`:`文档内容摘要：

`+n.slice(0,3).map((e,t)=>{let n=i.find(t=>t.id===e.documentId);return`${t+1}. [《${n?.fileName||`未知`}》] ${e.content.slice(0,200)}...`}).join(`

`)+`

`,m=``;return m=i.length>=2?`跨文档分析：

这些文档从不同角度涉及了相关问题。上方引用展示了各文档的关键观点。请注意对比不同文档之间的异同，点击引用编号可查看原文出处。`:`分析说明：

以上内容根据文档原文提取。点击引用编号可跳转到出处原文进行验证。这是本地 Mock 分析结果，配置 DeepSeek API 可获得更深度的 AI 分析。`,{content:`关于"${a.slice(0,80)}"\n\n${f}${p}${m}`,citations:c}}async streamChat(e,t,n){let r=await this.chat(e,t);if(n){let e=r.content.split(` `);for(let t=0;t<e.length;t++)n(e[t]+(t<e.length-1?` `:``)),await new Promise(e=>setTimeout(e,30))}return r}async summarize(e,t,n){await new Promise(e=>setTimeout(e,600+Math.random()*600));let i=r(t.slice(0,3),[e],3);return{content:`**${{quick:`Quick Summary`,standard:`Standard Summary`,deep:`Deep Analysis`,exam:`Exam Review`,requirement:`Requirements Summary`,meeting:`Meeting Minutes`}[n]||`Summary`} of "${e.fileName}"**

**One-sentence Summary:**
This document covers key information related to ${e.tags.join(`, `)||`various topics`}.

**Core Points:**
${t.slice(0,5).map((e,t)=>`${t+1}. ${e.content.slice(0,120)}...`).join(`
`)}

**Key Data:**
- Document: ${e.wordCount} words, ${e.pageCount} pages
- Topics: ${e.keywords.slice(0,5).join(`, `)}`,citations:i}}async compareDocuments(e,t){await new Promise(e=>setTimeout(e,800+Math.random()*1e3));let n=t.flat(),i=r(n,e,Math.min(5,n.length));return{content:`**Multi-Document Comparison**
Comparing ${e.length} documents:
${e.map(e=>`- ${e.fileName} (${e.wordCount} words, ${e.pageCount} pages)`).join(`
`)}

**Common Keywords:**
${e.flatMap(e=>e.keywords).filter((e,t,n)=>n.indexOf(e)===t).slice(0,5).map((e,t)=>`${t+1}. ${e}`).join(`
`)}

**Analysis:** The documents share common ground in their objectives but differ in implementation details and assumptions.`,citations:i}}async detectConflicts(t,n,r){return await new Promise(e=>setTimeout(e,1e3+Math.random()*1200)),n.length>=2?[{id:e(),topic:`Implementation Timeline`,level:`high`,type:`data`,documents:n.slice(0,2).map((e,t)=>({documentId:e.id,documentName:e.fileName,viewpoint:t===0?`Estimated 14 weeks for completion`:`Estimated 12 weeks for completion`,evidence:r.filter(t=>t.documentId===e.id).slice(0,1).map(e=>e.content.slice(0,150)).join(` `),pageNumber:r.find(t=>t.documentId===e.id)?.pageNumber})),aiAnalysis:`The two documents present different timeline estimates. "${n[0].fileName}" suggests a longer timeline, while "${n[1].fileName}" proposes a shorter schedule. This discrepancy should be investigated to understand the underlying assumptions.`,suggestedVerification:`Compare detailed work breakdown structures and verify underlying assumptions about team capacity and scope.`,createdAt:new Date().toISOString()},{id:e(),topic:`Technical Architecture Approach`,level:`medium`,type:`methodology`,documents:n.slice(0,2).map((e,t)=>({documentId:e.id,documentName:e.fileName,viewpoint:t===0?`Full-stack with traditional backend and database`:`Lightweight frontend with edge computing`,evidence:`Architecture choice differs between the two proposals.`,pageNumber:1})),aiAnalysis:`The fundamental architectural approaches differ significantly. This represents a strategic decision point that will affect development cost, maintenance complexity, and future scalability.`,suggestedVerification:`Evaluate both architectures against specific project requirements: data persistence needs, offline capability, scalability requirements, and team expertise.`,createdAt:new Date().toISOString()}]:[]}async generateConsensusTopics(t,n,r){return await new Promise(e=>setTimeout(e,800+Math.random()*1e3)),n.length>=2?[{id:e(),topic:`Frontend Technology Choice`,level:`strong`,description:`Both documents agree on using React as the primary frontend framework, indicating team alignment on the frontend technology stack.`,supportingDocuments:n.slice(0,2).map(e=>({documentId:e.id,documentName:e.fileName,excerpt:`Uses React as the frontend framework for building the user interface.`})),opposingDocuments:[],coveragePercentage:50},{id:e(),topic:`Privacy-First Design`,level:`moderate`,description:`Multiple documents emphasize the importance of local document processing and privacy protection.`,supportingDocuments:n.slice(0,2).map(e=>({documentId:e.id,documentName:e.fileName,excerpt:`Emphasizes the need for local document processing and data privacy.`})),opposingDocuments:[],coveragePercentage:50}]:[]}async generateDecisionBrief(t,n,i){await new Promise(e=>setTimeout(e,1200+Math.random()*1500));let a=r(i.slice(0,3),n,3);return{id:e(),projectId:t.projectId,title:t.title,target:t.target,audience:t.audience,detail:t.detail,sections:[{id:e(),title:`I. Problem Definition`,content:`This decision brief analyzes ${n.length} documents to support decision-making for: ${t.title}. The analysis examines key facts, areas of consensus and conflict, and provides evidence-based recommendations.`,citations:a,order:1},{id:e(),title:`II. Key Facts`,content:n.map((e,t)=>`${t+1}. ${e.fileName}: ${e.summary||`No summary available`}`).join(`

`),citations:[],order:2},{id:e(),title:`III. Recommendations`,content:`Based on the document analysis, the following recommendations are made. Configure a production AI provider for more detailed, context-specific recommendations tailored to your documents.`,citations:[],order:3},{id:e(),title:`IV. Next Steps`,content:`1. Review key findings with stakeholders
2. Verify critical data points across source documents
3. Address identified information gaps
4. Schedule follow-up analysis for any unresolved questions`,citations:[],order:4}],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}}},a=class{name;id;config;constructor(e,t,n){this.config=e,this.name=t,this.id=n}async testConnection(){let e=Date.now();try{let t=await fetch(`${this.config.baseUrl}/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${this.config.apiKey}`},body:JSON.stringify({model:this.config.model,messages:[{role:`user`,content:`Hello, respond with just 'ok'.`}],max_tokens:10})}),n=Date.now()-e;if(!t.ok){let e=await t.text();return{ok:!1,message:`HTTP ${t.status}: ${e.slice(0,200)}`,latencyMs:n}}return{ok:!0,message:`Connected (${n}ms)`,latencyMs:n}}catch(t){return{ok:!1,message:t instanceof Error?t.message:`Connection failed`,latencyMs:Date.now()-e}}}async chat(e,t){let n=[{role:`system`,content:this.buildSystemPrompt(t)},...e.map(e=>({role:e.role,content:e.content}))],r=await fetch(`${this.config.baseUrl}/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${this.config.apiKey}`},body:JSON.stringify({model:this.config.model,messages:n,temperature:.3,max_tokens:4096})});if(!r.ok){let e=await r.text();throw Error(`AI API error (${r.status}): ${e.slice(0,300)}`)}let i=(await r.json()).choices?.[0]?.message?.content||`No response from AI.`;return{content:i,citations:this.parseCitations(i,t)}}async streamChat(e,t,n){let r=[{role:`system`,content:this.buildSystemPrompt(t)},...e.map(e=>({role:e.role,content:e.content}))],i=await fetch(`${this.config.baseUrl}/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${this.config.apiKey}`},body:JSON.stringify({model:this.config.model,messages:r,temperature:.3,max_tokens:4096,stream:!0})});if(!i.ok){let e=await i.text();throw Error(`AI API error (${i.status}): ${e.slice(0,300)}`)}let a=i.body?.getReader(),o=new TextDecoder,s=``;if(a)for(;;){let{done:e,value:t}=await a.read();if(e)break;let r=o.decode(t,{stream:!0}).split(`
`).filter(e=>e.startsWith(`data: `));for(let e of r){let t=e.slice(6);if(t!==`[DONE]`)try{let e=JSON.parse(t).choices?.[0]?.delta?.content||``;s+=e,n&&n(e)}catch{}}}let c=this.parseCitations(s,t);return{content:s,citations:c}}async summarize(e,t,n){let r=t.map((e,t)=>`[${t+1}] ${e.content}`).join(`

`),i=await fetch(`${this.config.baseUrl}/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${this.config.apiKey}`},body:JSON.stringify({model:this.config.model,messages:[{role:`system`,content:`你是一个文档分析师。请提供一份${n}摘要，包括关键要点、重要数据和建议行动。引用来源时使用文档名称，如"《文档名》中提到..."。`},{role:`user`,content:`文档：${e.fileName}\n\n内容：\n${r}\n\n请提供一份${n}摘要。`}],temperature:.3,max_tokens:2048})});if(!i.ok)throw Error(`Summarization failed: ${i.status}`);let a=(await i.json()).choices?.[0]?.message?.content||``;return{content:a,citations:this.parseCitations(a,{chunks:t,documents:[e]})}}async compareDocuments(e,t){let n=t.flat(),r=e.map((e,n)=>{let r=t[n]||[];return`Document ${n+1}: ${e.fileName}\n${r.map((e,t)=>`[${n+1}-${t+1}] ${e.content}`).join(`
`)}`}).join(`

`),i=await fetch(`${this.config.baseUrl}/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${this.config.apiKey}`},body:JSON.stringify({model:this.config.model,messages:[{role:`system`,content:`你是一个文档分析师。比较多份文档，找出相似之处、差异、共同主题和独特观点。`},{role:`user`,content:`请比较多份文档：\n\n${r}`}],temperature:.3,max_tokens:4096})});if(!i.ok)throw Error(`Comparison failed: ${i.status}`);let a=(await i.json()).choices?.[0]?.message?.content||``;return{content:a,citations:this.parseCitations(a,{chunks:n,documents:e})}}async detectConflicts(t,n,r){let i=new Map;for(let e of r){let t=n.find(t=>t.id===e.documentId);t&&(i.has(t.id)||i.set(t.id,{name:t.fileName,texts:[]}),i.get(t.id).texts.push(e.content.slice(0,500)))}let a=Array.from(i.entries()).map(([,e])=>`【${e.name}】\n${e.texts.join(`
`)}`).join(`

========

`),s=await fetch(`${this.config.baseUrl}/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${this.config.apiKey}`},body:JSON.stringify({model:this.config.model,messages:[{role:`system`,content:`你是一个专业的文档分析专家。你的任务是找出多份文档之间的所有差异和潜在冲突。

重要：即使文档看起来一致，也要找出以下类型的差异：
1. 数据差异 - 数字、日期、数量、百分比不同
2. 观点差异 - 对同一问题的不同看法或结论
3. 定义差异 - 对同一术语的不同定义或理解
4. 范围差异 - 涵盖范围、侧重点不同
5. 方法论差异 - 不同的方法、步骤、方案
6. 细节差异 - 任何细节上的不一致

即使差异很小，也要列出来。用户需要看到所有可能的分歧点。

返回 JSON 数组（不要markdown代码块）：
[
  {
    "topic": "冲突主题（中文）",
    "level": "high" | "medium" | "low",
    "type": "data" | "definition" | "opinion" | "timeline" | "methodology",
    "documents": [
      {
        "documentRef": "文档名称",
        "viewpoint": "该文档的观点（中文）",
        "evidence": "原文引用"
      }
    ],
    "aiAnalysis": "差异分析和影响（中文）",
    "suggestedVerification": "验证建议（中文）"
  }
]

至少返回2-3个差异。如果实在找不到任何差异，说明文档可能在讨论不同主题。`},{role:`user`,content:`请分析以下 ${n.length} 份文档之间的所有差异和冲突：\n\n${a}\n\n找出所有差异点，返回 JSON 数组。`}],temperature:.3,max_tokens:4096})});if(!s.ok)throw Error(`Conflict detection failed: ${s.status}`);let c=(await s.json()).choices?.[0]?.message?.content||`[]`;try{let t=c.replace(/```json\n?/g,``).replace(/```\n?/g,``).replace(/```/g,``).trim(),r=t.indexOf(`[`),i=t.lastIndexOf(`]`)+1,a=r>=0?t.slice(r,i):t;return JSON.parse(a||`[]`).map(t=>({...t,id:e(),createdAt:new Date().toISOString(),documents:t.documents.map(e=>{let t=n.find(t=>{if(!e.documentRef)return!1;if(t.fileName===e.documentRef)return!0;let n=t.fileName.toLowerCase().trim(),r=e.documentRef.toLowerCase().trim();return!!(n===r||r.length>=3&&n.includes(r)||n.length>=3&&r.includes(n))});return{documentId:t?.id||n[0]?.id||``,documentName:e.documentRef||t?.fileName||``,viewpoint:e.viewpoint||``,evidence:e.evidence||``}})}))}catch(e){return console.warn(`[detectConflicts] Parse failed, using local analysis:`,e),o(n,r)}}async generateConsensusTopics(t,n,r){let i=r.map((e,t)=>{let r=n.find(t=>t.id===e.documentId);return`[Chunk ${t+1}] From "${r?.fileName}":\n${e.content}`}).join(`

---

`),a=await fetch(`${this.config.baseUrl}/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${this.config.apiKey}`},body:JSON.stringify({model:this.config.model,messages:[{role:`system`,content:`你是文档共识分析器。找出多份文档之间达成共识的主题。

返回 JSON 数组：
[
  {
    "topic": "共识主题（中文）",
    "level": "strong" | "moderate" | "weak" | "contested",
    "description": "共识描述（中文）",
    "supportingDocuments": [
      {"documentRef": "文档引用", "excerpt": "支持原文"}
    ],
    "opposingDocuments": [],
    "coveragePercentage": 75
  }
]

只返回 JSON 数组。所有内容用中文。`},{role:`user`,content:`分析以下文档片段的共识：\n\n${i}\n\n返回 JSON 数组。`}],temperature:.2,max_tokens:4096})});if(!a.ok)throw Error(`Consensus analysis failed: ${a.status}`);let o=(await a.json()).choices?.[0]?.message?.content||`[]`;try{let t=o.replace(/```json\n?/g,``).replace(/```\n?/g,``).trim();return JSON.parse(t).map(t=>({...t,id:e(),supportingDocuments:t.supportingDocuments.map(e=>{let t=e.documentRef||``,r=n.find(e=>t&&(e.fileName===t||e.fileName.includes(t)||t.includes(e.fileName)));return{documentId:r?.id||n[0]?.id||``,documentName:r?.fileName||t||n[0]?.fileName||``,excerpt:e.excerpt||``}}),opposingDocuments:(t.opposingDocuments||[]).map(e=>{let t=e.documentRef||``,r=n.find(e=>t&&(e.fileName===t||e.fileName.includes(t)||t.includes(e.fileName)));return{documentId:r?.id||n[0]?.id||``,documentName:r?.fileName||t||n[0]?.fileName||``,excerpt:e.excerpt||``}})}))}catch{return[]}}async generateDecisionBrief(t,n,r){let i=r.map((e,t)=>{let r=n.find(t=>t.id===e.documentId);return`[Chunk ${t+1}] From "${r?.fileName}":\n${e.content}`}).join(`

---

`),a=await fetch(`${this.config.baseUrl}/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${this.config.apiKey}`},body:JSON.stringify({model:this.config.model,messages:[{role:`system`,content:`你是决策简报生成器。根据文档分析生成结构化中文决策简报。

返回 JSON 对象：
{
  "sections": [
    {"title": "一、问题定义", "content": "...", "order": 1},
    {"title": "二、关键事实", "content": "...", "order": 2},
    {"title": "三、主要共识", "content": "...", "order": 3},
    {"title": "四、核心争议", "content": "...", "order": 4},
    {"title": "五、方案比较", "content": "...", "order": 5},
    {"title": "六、风险评估", "content": "...", "order": 6},
    {"title": "七、信息缺口", "content": "...", "order": 7},
    {"title": "八、建议方案", "content": "...", "order": 8},
    {"title": "九、下一步行动", "content": "...", "order": 9}
  ]
}

所有内容必须用中文写。每节 50-200 字。引用来源时标注 [Chunk N]。`},{role:`user`,content:`请生成决策简报，标题："${t.title}"。\n\n文档内容：\n${i}`}],temperature:.3,max_tokens:4096})});if(!a.ok)throw Error(`Brief generation failed: ${a.status}`);let o=(await a.json()).choices?.[0]?.message?.content||`{}`;try{let n=o.replace(/```json\n?/g,``).replace(/```\n?/g,``).trim(),r=JSON.parse(n);return{id:e(),projectId:t.projectId,title:t.title,target:t.target,audience:t.audience,detail:t.detail,sections:(r.sections||[]).map(t=>({id:e(),title:String(t.title||``),content:String(t.content||``),citations:[],order:Number(t.order||0)})),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}}catch{return{id:e(),projectId:t.projectId,title:t.title,target:t.target,audience:t.audience,detail:t.detail,sections:[{id:e(),title:`I. Analysis`,content:o.slice(0,2e3),citations:[],order:1}],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}}}buildSystemPrompt(e){let t=`你是一个智能文档分析助手。基于提供的文档内容回答用户问题。

原则：
1. 引用来源时使用文档名称，如"《文档名》中提到..."
2. 诚实说明文档中有和没有的内容
3. 多份文档分歧时客观指出
4. 区分事实和分析推断
5. 信息缺失时明确告知
6. 用中文回答
7. 禁止使用 Markdown 格式（不用**加粗**、不用表格、不用分隔线、不用标题、不用Emoji）。用自然的段落文字。

`;if(e?.chunks&&e.chunks.length>0){t+=`
--- 参考文档内容 ---
`;for(let n=0;n<e.chunks.length;n++){let r=e.chunks[n],i=e.documents?.find(e=>e.id===r.documentId);t+=`\n【${i?.fileName||`未知文档`}】`,r.pageNumber&&(t+=` 第${r.pageNumber}页`),r.sectionTitle&&(t+=` ${r.sectionTitle}`),t+=`:\n${r.content}\n`,r.sectionTitle&&(t+=` - ${r.sectionTitle}`),t+=`:\n${r.content}\n`}}return t}parseCitations(t,n){if(!n?.chunks||n.chunks.length===0)return[];let r=[],i=new Set;for(let a of[/\[Chunk\s*(\d+)\]/gi,/\[(\d+)\]/g,/【(\d+)】/g,/片段\s*(\d+)/gi,/Chunk\s*(\d+)/gi]){let o;for(;(o=a.exec(t))!==null;){let t=parseInt(o[1])-1;if(t>=0&&t<n.chunks.length&&!i.has(t)){i.add(t);let a=n.chunks[t],o=n.documents?.find(e=>e.id===a.documentId);r.push({id:e(),chunkId:a.id,documentId:a.documentId,documentName:o?.fileName||`未知`,text:a.content.slice(0,300),pageNumber:a.pageNumber,sectionTitle:a.sectionTitle||`正文`,relation:`support`,relevanceScore:.9})}}}if(n.documents){for(let a of n.documents)if(RegExp(`《${a.fileName.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}》`,`g`).test(t)&&!i.has(-1)){let t=n.chunks.filter(e=>e.documentId===a.id);for(let o of t.slice(0,3)){if(r.length>=10)break;let t=n.chunks.indexOf(o);t>=0&&!i.has(t)&&(i.add(t),r.push({id:e(),chunkId:o.id,documentId:o.documentId,documentName:a.fileName,text:o.content.slice(0,300),pageNumber:o.pageNumber,sectionTitle:o.sectionTitle||`正文`,relation:`support`,relevanceScore:.85}))}}}if(r.length===0&&n.chunks.length>0)for(let t=0;t<Math.min(n.chunks.length,5);t++){let i=n.chunks[t],a=n.documents?.find(e=>e.id===i.documentId);r.push({id:e(),chunkId:i.id,documentId:i.documentId,documentName:a?.fileName||`未知`,text:i.content.slice(0,300),pageNumber:i.pageNumber,sectionTitle:i.sectionTitle||`正文`,relation:`support`,relevanceScore:.8-t*.1})}return r.slice(0,10)}};function o(t,n){let r=[];if(t.length<2)return r;let i=new Map;for(let e of n)i.has(e.documentId)||i.set(e.documentId,[]),i.get(e.documentId).push(e.content);let a=Array.from(i.entries()).map(([e,n])=>({id:e,name:t.find(t=>t.id===e)?.fileName||e,length:n.join(` `).length,wordCount:n.join(` `).split(/\s+/).length}));if(a.length>=2){let t=a.reduce((e,t)=>e.length>t.length?e:t),n=a.reduce((e,t)=>e.length<t.length?e:t);t.length>n.length*1.5&&r.push({id:e(),topic:`文档篇幅差异`,level:`low`,type:`data`,documents:[{documentId:t.id,documentName:t.name,viewpoint:`${t.wordCount} 词`,evidence:`文档内容较多`},{documentId:n.id,documentName:n.name,viewpoint:`${n.wordCount} 词`,evidence:`文档内容较少`}],aiAnalysis:`两份文档篇幅差异较大（${t.wordCount} vs ${n.wordCount} 词），可能覆盖范围不同或详略程度不同。`,suggestedVerification:`检查文档是否涵盖相同主题范围，确认是否需要补充内容。`,createdAt:new Date().toISOString()})}let o=t.flatMap(e=>e.keywords.slice(0,5)),s=[...new Set(o)];for(let n of s.slice(0,3)){let i=t.filter(e=>e.keywords.includes(n)),a=t.filter(e=>!e.keywords.includes(n));i.length>0&&a.length>0&&r.push({id:e(),topic:`关键词覆盖差异：${n}`,level:`low`,type:`definition`,documents:[{documentId:i[0].id,documentName:i[0].fileName,viewpoint:`提及"${n}"`,evidence:`该文档涉及${n}相关内容`},{documentId:a[0].id,documentName:a[0].fileName,viewpoint:`未提及"${n}"`,evidence:`该文档未涉及该主题`}],aiAnalysis:`"${n}" 在部分文档中出现，其他文档未涉及，可能说明文档侧重点不同。`,suggestedVerification:`检查各文档的主题覆盖范围，确认是否存在信息缺失。`,createdAt:new Date().toISOString()})}return r.slice(0,5)}function s(){let e=t.getState().settings;if(!e.aiApiKey||e.aiProvider===`mock`)return new i;let n={openai:`https://api.openai.com/v1`,deepseek:`https://api.deepseek.com/v1`,claude:`https://api.anthropic.com/v1`,gemini:`https://generativelanguage.googleapis.com/v1beta/openai`,groq:`https://api.groq.com/openai/v1`,mistral:`https://api.mistral.ai/v1`,together:`https://api.together.xyz/v1`,openrouter:`https://openrouter.ai/api/v1`,siliconflow:`https://api.siliconflow.cn/v1`,qwen:`https://dashscope.aliyuncs.com/compatible-mode/v1`,glm:`https://open.bigmodel.cn/api/paas/v4`,moonshot:`https://api.moonshot.cn/v1`,doubao:`https://ark.cn-beijing.volces.com/api/v3`,minimax:`https://api.minimax.chat/v1`,stepfun:`https://api.stepfun.com/v1`,modelscope:`https://api-inference.modelscope.cn/v1`,baidu:`https://qianfan.baidubce.com/v2`,nvidia:`https://integrate.api.nvidia.com/v1`,github:`https://api.githubcopilot.com`,custom:e.aiBaseUrl||``},r={openai:`gpt-4o`,deepseek:`deepseek-v4-pro`,claude:`claude-sonnet-4-20250514`,gemini:`gemini-2.0-flash`,groq:`llama-3.3-70b-versatile`,mistral:`mistral-large-latest`,together:`meta-llama/Llama-3.3-70B-Instruct-Turbo`,openrouter:`anthropic/claude-sonnet-4`,siliconflow:`deepseek-ai/DeepSeek-V3`,qwen:`qwen-plus`,glm:`glm-4-plus`,moonshot:`moonshot-v1-8k`,doubao:`doubao-pro-32k`,minimax:`abab6.5s-chat`,stepfun:`step-2-16k`,modelscope:`qwen/Qwen2.5-72B-Instruct`,baidu:`ernie-4.0-8k`,nvidia:`meta/llama-3.3-70b-instruct`,github:`gpt-4o`},o=n[e.aiProvider]||``;return o?new a({apiKey:e.aiApiKey,baseUrl:o,model:e.aiModel||r[e.aiProvider]||`gpt-4o`},e.aiProvider,e.aiProvider):new i}function c(){return s()}export{c as t};