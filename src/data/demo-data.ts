import type {
  Document,
  DocumentChunk,
  Workspace,
  AIConversation,
  Claim,
  Evidence,
  ConflictItem,
  ConsensusTopic,
  DecisionBrief,
  ActivityLog,
} from "@/types";

const WID = "demo-workspace-001";
const now = new Date().toISOString();

// ---- Demo Documents ----
export const demoDocuments: Document[] = [
  {
    id: "doc-001",
    workspaceId: WID,
    fileName: "01-校园AI创新项目需求说明.md",
    fileType: "md",
    fileSize: 15360,
    pageCount: 5,
    wordCount: 3200,
    parseStatus: "ready",
    tags: ["需求文档", "项目规划"],
    isFavorite: true,
    createdAt: "2026-06-15T08:00:00Z",
    updatedAt: "2026-06-15T08:00:00Z",
    lastOpenedAt: "2026-07-08T14:30:00Z",
    summary: "校园AI创新项目需求说明文档，定义了项目的核心目标、功能需求、技术约束和验收标准。",
    keywords: ["校园AI", "需求分析", "功能需求", "技术约束", "验收标准"],
    chunkCount: 18,
  },
  {
    id: "doc-002",
    workspaceId: WID,
    fileName: "02-技术方案A-全栈Web应用.pdf",
    fileType: "pdf",
    fileSize: 245760,
    pageCount: 12,
    wordCount: 6800,
    parseStatus: "ready",
    tags: ["技术方案", "Web应用"],
    isFavorite: true,
    createdAt: "2026-06-18T10:00:00Z",
    updatedAt: "2026-06-18T10:00:00Z",
    lastOpenedAt: "2026-07-08T15:00:00Z",
    summary: "技术方案A提出了基于React+Node.js的全栈Web应用架构，包含前端、后端和数据库的完整设计。",
    keywords: ["React", "Node.js", "全栈", "Web应用", "PostgreSQL"],
    chunkCount: 32,
  },
  {
    id: "doc-003",
    workspaceId: WID,
    fileName: "03-技术方案B-轻量前端+边缘计算.pdf",
    fileType: "pdf",
    fileSize: 198656,
    pageCount: 10,
    wordCount: 5500,
    parseStatus: "ready",
    tags: ["技术方案", "边缘计算"],
    isFavorite: false,
    createdAt: "2026-06-20T09:30:00Z",
    updatedAt: "2026-06-20T09:30:00Z",
    lastOpenedAt: "2026-07-08T15:30:00Z",
    summary: "技术方案B提出了轻量前端+边缘计算的架构方案，强调离线能力和本地优先策略。",
    keywords: ["前端优先", "边缘计算", "离线能力", "本地优先", "IndexedDB"],
    chunkCount: 26,
  },
  {
    id: "doc-004",
    workspaceId: WID,
    fileName: "04-项目风险评估报告.pdf",
    fileType: "pdf",
    fileSize: 102400,
    pageCount: 8,
    wordCount: 4100,
    parseStatus: "ready",
    tags: ["风险评估", "项目管理"],
    isFavorite: false,
    createdAt: "2026-06-25T14:00:00Z",
    updatedAt: "2026-06-25T14:00:00Z",
    lastOpenedAt: "2026-07-09T09:00:00Z",
    summary: "项目风险评估报告，从技术、进度、人员和预算四个维度分析了项目风险并给出了缓解建议。",
    keywords: ["风险评估", "技术风险", "进度风险", "预算风险", "缓解措施"],
    chunkCount: 20,
  },
];

// ---- Demo Workspace ----
export const demoWorkspace: Workspace = {
  id: WID,
  name: "校园AI创新项目方案评审",
  description:
    "针对校园AI创新项目的技术方案选型评审工作区，包含项目需求说明、两套候选技术方案和风险评估报告。需要对方案进行全面比较，识别共识与分歧，形成决策建议。",
  documentIds: ["doc-001", "doc-002", "doc-003", "doc-004"],
  isDemo: true,
  createdAt: "2026-06-15T08:00:00Z",
  updatedAt: "2026-07-09T09:00:00Z",
};

// ---- Document Chunks (simplified for demo) ----
function makeChunks(docId: string, texts: string[]): DocumentChunk[] {
  return texts.map((content, i) => ({
    id: `chunk-${docId}-${i}`,
    documentId: docId,
    content,
    pageNumber: Math.floor(i / 3) + 1,
    sectionTitle: i === 0 ? "概述" : i < 5 ? "核心内容" : "补充说明",
    position: i,
    keywords: content.slice(0, 20).split(/\s+/),
    createdAt: now,
  }));
}

export const demoChunks: DocumentChunk[] = [
  ...makeChunks("doc-001", [
    "# 校园AI创新项目需求说明\n\n## 项目背景\n本项目的目标是开发一个面向校园场景的AI助手应用，帮助学生和教职工提高日常工作和学习效率。项目周期为3个月（12周），团队规模为5人。",
    "## 核心功能需求\n\n### 1. 智能文档处理\n系统需要支持PDF、Word和Markdown格式的文档解析。用户上传文档后，系统能够进行智能分析、摘要生成和关键信息提取。所有文件处理必须在用户设备本地完成，不得将敏感文件上传至第三方服务器。",
    "### 2. AI对话交互\n用户可以通过自然语言与文档内容进行交互，包括提问、总结、翻译等功能。AI模型需要能够引用文档原文作为回答依据，确保回答的可信度和可验证性。",
    "### 3. 多文档分析\n系统需支持同时对多份文档进行比较分析，识别不同文档之间的观点异同。这一功能对于方案评审和资料研究非常重要。",
    "### 4. 数据安全与隐私\n所有用户上传的文件必须本地处理。如果需要调用远程AI服务，仅发送经过脱敏的文本片段，不得传输完整文件。用户应能够清楚地看到哪些数据被发送到了远程服务。",
    "## 技术约束\n\n1. 前端使用React或Vue框架\n2. 需要支持桌面端和移动端浏览器\n3. 首屏加载时间不超过3秒\n4. 支持离线使用核心功能\n5. 开发周期为12周",
    "## 项目预算\n\n项目总预算为人民币15万元，其中：\n- 云服务费用：3万元\n- 开发工具和第三方服务：2万元\n- 服务器和基础设施：4万元\n- 测试和运维：2万元\n- 预留应急资金：4万元",
    "## 非功能需求\n\n- 系统可用性要求为99.5%\n- 文档解析单文件不超过50MB\n- 同时支持最多100并发用户\n- AI响应时间不超过10秒",
  ]),
  ...makeChunks("doc-002", [
    "# 技术方案A：全栈Web应用\n\n## 总体架构\n本方案采用经典的前后端分离架构。前端使用React 18 + TypeScript构建SPA应用，后端使用Node.js + Express提供RESTful API服务，数据库采用PostgreSQL + Redis的组合方案。\n\n### 技术栈\n- 前端：React 18, TypeScript, Tailwind CSS, Zustand\n- 后端：Node.js 20, Express 4, Prisma ORM\n- 数据库：PostgreSQL 15 + Redis 7\n- 部署：Docker + Nginx反向代理\n- CI/CD：GitHub Actions",
    "## 开发周期估算\n根据需求文档，本方案预计需要14周完成全部开发和测试工作：\n- 第1-2周：项目搭建，基础架构\n- 第3-6周：核心功能开发\n- 第7-8周：AI集成与优化\n- 第9-10周：多文档分析功能\n- 第11-12周：测试与修复\n- 第13-14周：部署上线与文档\n\n总工期14周，接近但略超需求文档中12周的要求。项目团队认为可以通过适当增加人力投入在12周内完成。",
    "## 数据库选择理由\n选择PostgreSQL是因为：\n1. 成熟稳定，社区支持强大\n2. 支持全文搜索，满足文档检索需求\n3. 支持JSON字段，灵活存储分析结果\n4. 事务支持完善，保证数据一致性\n\nRedis用于缓存热点数据和AI分析结果，显著提升响应速度。",
    "## 安全方案\n- 所有API请求使用HTTPS传输\n- 用户认证使用JWT Token\n- 文件上传后进行病毒扫描\n- 数据库使用加密存储敏感字段\n- 定期安全审计和渗透测试",
    "## 预算估算\n技术方案A的总成本估算为12万元：\n- 云服务器（2台）：6万元/年\n- 数据库服务：3万元/年\n- CDN和其他服务：1万元/年\n- 运维监控：2万元/年",
  ]),
  ...makeChunks("doc-003", [
    "# 技术方案B：轻量前端 + 边缘计算\n\n## 总体架构\n本方案采用轻量前端+边缘计算的架构设计。前端使用React + TypeScript构建纯静态应用，利用浏览器端IndexedDB进行数据持久化，通过Edge Functions处理需要服务端能力的场景。\n\n### 技术栈\n- 前端：React 18, TypeScript, Tailwind CSS, Dexie.js\n- 边缘计算：Cloudflare Workers / Vercel Edge Functions\n- 本地数据库：IndexedDB (Dexie.js)\n- 向量存储：浏览器端Transformers.js\n- 部署：Vercel / Cloudflare Pages",
    "## 开发周期估算\n本方案预计需要12周完成全部开发工作：\n- 第1-2周：项目搭建，本地存储架构\n- 第3-5周：核心功能开发（文档解析等）\n- 第6-7周：AI集成与本地检索\n- 第8-9周：多文档分析功能\n- 第10-11周：测试与边缘部署\n- 第12周：文档与交付\n\n总工期12周，完全符合需求文档的要求。方案B省去了后端开发工作量，开发周期更可控。",
    "## 为什么不需要传统数据库\n方案B选择不依赖PostgreSQL等传统数据库，原因如下：\n1. 文档分析和AI对话的核心数据流是：用户文件→浏览器处理→AI分析→本地存储\n2. IndexedDB完全可以满足文档存储、分析结果缓存和用户设置的需求\n3. 不需要用户系统，每个用户的数据独立存储在各自的浏览器中\n4. 减少了服务器运维成本和安全风险\n5. 天然支持离线使用，不需要网络连接即可访问历史数据",
    "## 隐私与安全\n- 所有文档在浏览器本地解析，不上传到任何服务器\n- AI请求仅发送经过处理的关键文本片段\n- 不存储任何用户文件在服务端\n- 用户可随时清除所有本地数据\n- 无需用户注册或登录",
    "## 预算估算\n技术方案B的总成本估算为8万元：\n- Edge Functions调用费用：2万元/年\n- AI API调用费用：4万元/年\n- 域名和CDN：0.5万元/年\n- 监控和分析服务：1.5万元/年",
  ]),
  ...makeChunks("doc-004", [
    "# 项目风险评估报告\n\n## 评估概述\n本报告针对校园AI创新项目进行系统性风险评估。评估时间：2026年6月25日。评估范围涵盖技术风险、进度风险、人员风险和预算风险四个维度。",
    "## 技术风险\n\n### TR-01：AI模型稳定性\n风险等级：中\n描述：AI模型的输出质量和稳定性直接影响用户体验。如果模型出现幻觉或回答质量不稳定，将严重影响产品可信度。\n建议：建立引用溯源机制，每个AI结论必须关联原文证据。同时提供\"置信度\"指标帮助用户判断。",
    "### TR-02：文档解析兼容性\n风险等级：高\n描述：不同格式和来源的文档可能存在解析兼容问题，特别是复杂排版的PDF和包含图表表格的DOCX文件。\n建议：初期优先支持TXT和Markdown格式，PDF和DOCX解析作为核心功能但要预留容错机制。",
    "### TR-03：离线功能实现复杂度\n风险等级：中\n描述：需求要求支持离线使用核心功能，这需要在浏览器端实现完整的文档处理和检索能力。\n建议：使用IndexedDB作为本地存储，实现简化的BM25检索算法。离线功能不需要达到在线版本的完整度。",
    "## 进度风险\n\n### SR-01：开发周期紧张\n风险等级：高\n描述：12周的开发周期对于包含文档解析、AI集成和多文档分析的完整应用来说较为紧张。技术方案A（14周）已超出需求要求的12周。技术方案B（12周）相对更可行。\n建议：优先完成核心功能（文档处理、AI问答、证据溯源），多文档分析等高级功能可在后续版本迭代。",
    "### SR-02：测试时间可能不足\n风险等级：中\n描述：如果开发阶段出现延期，测试时间容易被压缩。对于要求高可靠性的AI应用，测试不充分可能导致生产环境出现严重问题。\n建议：采用敏捷开发模式，每周进行回归测试。关键模块（文档解析、AI调用）优先编写自动化测试。",
    "## 人员风险\n\n### PR-01：AI集成经验不足\n风险等级：中\n描述：团队在AI API调用和Prompt Engineering方面经验有限，可能影响AI功能的开发效率和质量。\n建议：在前期安排1周时间进行AI集成技术调研和原型验证。使用成熟的AI SDK降低集成难度。",
    "## 预算风险\n\n### BR-01：AI API费用超支\n风险等级：中\n描述：AI API调用费用与用户使用量直接相关，如果用户增长超出预期或单次调用Token消耗过高，可能导致预算超支。\n建议：实现本地缓存机制，避免重复AI调用。设置每日Token使用上限。技术方案B的AI费用估算（4万元/年）比方案A更保守合理。",
    "## 综合建议\n综合评估后，建议：\n1. 优先考虑技术方案B（轻量前端+边缘计算），因其开发周期（12周）符合需求且成本更低（8万元）\n2. 第一阶段重点实现核心功能，确保文档处理、AI问答和证据溯源稳定可用\n3. 建立完善的测试体系，关键模块自动化测试覆盖率不低于80%\n4. 设置AI API使用监控和预警机制\n5. 预留至少2周的缓冲时间用于修复关键Bug",
  ]),
];

// ---- Demo AI Conversation ----
export const demoConversation: AIConversation = {
  id: "conv-demo-001",
  documentId: "doc-003",
  messages: [
    {
      id: "msg-001",
      role: "user",
      content: "技术方案B相比方案A有哪些优势？",
      citations: [],
      createdAt: "2026-07-09T09:05:00Z",
    },
    {
      id: "msg-002",
      role: "assistant",
      content: `根据资料分析，技术方案B相比方案A主要有以下优势：

**1. 开发周期更短（12周 vs 14周）**
方案B预计12周完成，完全符合需求文档的12周要求；方案A需要14周，存在2周的延期风险。

**2. 成本更低（8万元 vs 12万元）**
方案B总成本8万元，比方案A的12万元节省33%。主要是省去了服务器和数据库运维成本。

**3. 隐私保护更强**
方案B的所有文档在浏览器本地处理，不上传至服务器。方案A需要将文件上传至后端服务器处理。

**4. 天然支持离线使用**
方案B基于IndexedDB的本地存储架构天然支持离线使用。方案A依赖服务器端数据库，离线支持需要额外开发。

**5. 运维复杂度更低**
方案B无需管理服务器、数据库和Redis集群，运维工作量显著减少。

综合来看，方案B在开发效率、成本控制和隐私保护方面都具有明显优势。`,
      citations: [
        {
          id: "cite-001",
          chunkId: "chunk-doc-003-2",
          documentId: "doc-003",
          documentName: "03-技术方案B-轻量前端+边缘计算.pdf",
          text: "本方案预计需要12周完成全部开发工作。总工期12周，完全符合需求文档的要求。",
          pageNumber: 2,
          sectionTitle: "开发周期估算",
          relation: "support",
          relevanceScore: 0.95,
        },
        {
          id: "cite-002",
          chunkId: "chunk-doc-003-4",
          documentId: "doc-003",
          documentName: "03-技术方案B-轻量前端+边缘计算.pdf",
          text: "方案B选择不依赖PostgreSQL等传统数据库...减少了服务器运维成本和安全风险。天然支持离线使用。",
          pageNumber: 3,
          sectionTitle: "为什么不需要传统数据库",
          relation: "support",
          relevanceScore: 0.92,
        },
        {
          id: "cite-003",
          chunkId: "chunk-doc-003-5",
          documentId: "doc-003",
          documentName: "03-技术方案B-轻量前端+边缘计算.pdf",
          text: "技术方案B的总成本估算为8万元：Edge Functions调用费用2万元/年，AI API调用费用4万元/年。",
          pageNumber: 4,
          sectionTitle: "预算估算",
          relation: "support",
          relevanceScore: 0.90,
        },
        {
          id: "cite-004",
          chunkId: "chunk-doc-002-0",
          documentId: "doc-002",
          documentName: "02-技术方案A-全栈Web应用.pdf",
          text: "本方案预计需要14周完成全部开发和测试工作。总工期14周，接近但略超需求文档中12周的要求。",
          pageNumber: 2,
          sectionTitle: "开发周期估算",
          relation: "complement",
          relevanceScore: 0.85,
        },
      ],
      createdAt: "2026-07-09T09:05:05Z",
    },
    {
      id: "msg-003",
      role: "user",
      content: "风险评估报告对两个方案有什么建议？",
      citations: [],
      createdAt: "2026-07-09T09:06:00Z",
    },
    {
      id: "msg-004",
      role: "assistant",
      content: `风险评估报告对两个技术方案进行了综合评估，主要建议如下：

**推荐方案B**
报告明确建议优先考虑技术方案B，原因是：
- 开发周期（12周）完全符合需求
- 成本更低（8万元 vs 12万元）
- AI费用估算更保守合理

**关键风险提示**
报告指出了几个需要重点关注的风险：
- 开发周期紧张是最高等级风险
- 文档解析兼容性需要预留容错机制
- 测试时间可能被压缩

**建议措施**
报告建议建立引用溯源机制，每个AI结论关联原文证据，同时关键模块的自动化测试覆盖率不低于80%。`,
      citations: [
        {
          id: "cite-005",
          chunkId: "chunk-doc-004-2",
          documentId: "doc-004",
          documentName: "04-项目风险评估报告.pdf",
          text: "综合评估后，建议优先考虑技术方案B（轻量前端+边缘计算），因其开发周期（12周）符合需求且成本更低（8万元）。",
          pageNumber: 7,
          sectionTitle: "综合建议",
          relation: "support",
          relevanceScore: 0.96,
        },
        {
          id: "cite-006",
          chunkId: "chunk-doc-004-0",
          documentId: "doc-004",
          documentName: "04-项目风险评估报告.pdf",
          text: `建议：建立引用溯源机制，每个AI结论必须关联原文证据。同时提供"置信度"指标帮助用户判断。`,
          pageNumber: 2,
          sectionTitle: "技术风险",
          relation: "support",
          relevanceScore: 0.93,
        },
      ],
      createdAt: "2026-07-09T09:06:03Z",
    },
  ],
  createdAt: "2026-07-09T09:05:00Z",
  updatedAt: "2026-07-09T09:06:03Z",
};

// ---- Demo Claims ----
export const demoClaims: Claim[] = [
  {
    id: "claim-001",
    conversationId: "conv-demo-001",
    content: "技术方案B的开发周期（12周）短于方案A（14周），更符合项目需求",
    confidence: "high",
    evidenceCount: 3,
    supportCount: 3,
    contradictCount: 0,
    createdAt: now,
  },
  {
    id: "claim-002",
    conversationId: "conv-demo-001",
    content: "方案B的总成本（8万元）低于方案A（12万元）",
    confidence: "high",
    evidenceCount: 2,
    supportCount: 2,
    contradictCount: 0,
    createdAt: now,
  },
  {
    id: "claim-003",
    conversationId: "conv-demo-001",
    content: "方案B在隐私保护和离线支持方面优于方案A",
    confidence: "medium",
    evidenceCount: 3,
    supportCount: 2,
    contradictCount: 1,
    createdAt: now,
  },
  {
    id: "claim-004",
    conversationId: "conv-demo-001",
    content: "风险评估报告明确推荐采用方案B",
    confidence: "high",
    evidenceCount: 1,
    supportCount: 1,
    contradictCount: 0,
    createdAt: now,
  },
];

// ---- Demo Evidence ----
export const demoEvidences: Evidence[] = [
  {
    id: "evi-001",
    claimId: "claim-001",
    citationId: "cite-001",
    documentId: "doc-003",
    documentName: "03-技术方案B-轻量前端+边缘计算.pdf",
    text: "本方案预计需要12周完成全部开发工作。总工期12周，完全符合需求文档的要求。",
    pageNumber: 2,
    sectionTitle: "开发周期估算",
    relation: "support",
    createdAt: now,
  },
  {
    id: "evi-002",
    claimId: "claim-001",
    citationId: "cite-004",
    documentId: "doc-002",
    documentName: "02-技术方案A-全栈Web应用.pdf",
    text: "本方案预计需要14周完成全部开发和测试工作。总工期14周，接近但略超需求文档中12周的要求。",
    pageNumber: 2,
    sectionTitle: "开发周期估算",
    relation: "complement",
    createdAt: now,
  },
  {
    id: "evi-003",
    claimId: "claim-002",
    citationId: "cite-003",
    documentId: "doc-003",
    documentName: "03-技术方案B-轻量前端+边缘计算.pdf",
    text: "技术方案B的总成本估算为8万元。",
    pageNumber: 4,
    sectionTitle: "预算估算",
    relation: "support",
    createdAt: now,
  },
  {
    id: "evi-004",
    claimId: "claim-004",
    citationId: "cite-005",
    documentId: "doc-004",
    documentName: "04-项目风险评估报告.pdf",
    text: "综合评估后，建议优先考虑技术方案B（轻量前端+边缘计算），因其开发周期（12周）符合需求且成本更低（8万元）。",
    pageNumber: 7,
    sectionTitle: "综合建议",
    relation: "support",
    createdAt: now,
  },
];

// ---- Demo Conflicts ----
export const demoConflicts: ConflictItem[] = [
  {
    id: "conflict-001",
    topic: "项目开发周期",
    level: "high",
    type: "data",
    documents: [
      {
        documentId: "doc-002",
        documentName: "02-技术方案A-全栈Web应用.pdf",
        viewpoint: "预计需要14周完成全部开发测试工作",
        evidence: "第1-2周搭建、第3-6周核心开发、第7-8周AI集成、第9-10周多文档分析、第11-12周测试、第13-14周部署上线",
        pageNumber: 2,
      },
      {
        documentId: "doc-003",
        documentName: "03-技术方案B-轻量前端+边缘计算.pdf",
        viewpoint: "预计需要12周完成全部开发工作",
        evidence: "第1-2周搭建、第3-5周核心开发、第6-7周AI集成、第8-9周多文档分析、第10-11周测试部署、第12周文档交付",
        pageNumber: 2,
      },
    ],
    aiAnalysis:
      "两个方案在项目开发周期上存在明显差异。方案A需要14周，方案B需要12周。需求文档要求为12周。方案A虽然声称可以通过增加人力来压缩到12周，但这会带来额外的人员成本和协调风险。方案B的12周计划更切合实际，且省去了后端开发的工作量。",
    suggestedVerification:
      "建议要求两个方案的制定团队分别提供详细的工作量估算表（WBS），逐项对比每项任务的工时估算依据。同时检查方案A的\"增加人力压缩周期\"计划是否具体可行。",
    createdAt: now,
  },
  {
    id: "conflict-002",
    topic: "是否需要后端数据库",
    level: "high",
    type: "methodology",
    documents: [
      {
        documentId: "doc-002",
        documentName: "02-技术方案A-全栈Web应用.pdf",
        viewpoint: "需要PostgreSQL + Redis，用于数据持久化、全文搜索和缓存",
        evidence: "选择PostgreSQL因为成熟稳定、支持全文搜索、支持JSON字段、事务支持完善。Redis用于缓存热点数据。",
        pageNumber: 3,
      },
      {
        documentId: "doc-003",
        documentName: "03-技术方案B-轻量前端+边缘计算.pdf",
        viewpoint: "不需要传统数据库，使用浏览器端IndexedDB即可",
        evidence: "核心数据流都在浏览器端完成。IndexedDB可以满足文档存储、缓存和设置需求。不需要用户系统和服务器存储。",
        pageNumber: 3,
      },
    ],
    aiAnalysis:
      "这是两个方案最根本的架构分歧。方案A依赖传统服务器端数据库架构，方案B采用浏览器端存储方案。选择哪种方案取决于对数据持久性、多设备同步和团队协作的需求。如果项目第一阶段不需要多设备同步和团队协作，方案B的浏览器端存储更简洁且成本更低。",
    suggestedVerification:
      "建议明确项目第一阶段的协作需求：是否需要多用户协作？是否需要跨设备访问？如果不需要，浏览器端存储完全可行。同时评估未来如果引入后端数据库的迁移成本。",
    createdAt: now,
  },
  {
    id: "conflict-003",
    topic: "项目预算估算",
    level: "medium",
    type: "data",
    documents: [
      {
        documentId: "doc-002",
        documentName: "02-技术方案A-全栈Web应用.pdf",
        viewpoint: "总成本估算为12万元/年",
        evidence: "云服务器6万、数据库3万、CDN 1万、运维监控2万",
        pageNumber: 5,
      },
      {
        documentId: "doc-003",
        documentName: "03-技术方案B-轻量前端+边缘计算.pdf",
        viewpoint: "总成本估算为8万元/年",
        evidence: "Edge Functions 2万、AI API 4万、域名CDN 0.5万、监控1.5万",
        pageNumber: 4,
      },
    ],
    aiAnalysis:
      "两个方案的预算差异主要来自基础设施选择。方案A的成本大头是服务器和数据库（9万元），方案B的成本大头是AI API调用（4万元）。考虑到需求文档总预算为15万元，两个方案都在预算范围内。但方案B的8万元更接近风险评估报告中建议的保守AI费用估算。",
    suggestedVerification:
      "建议获取更详细的AI API费用估算依据。方案B的4万元AI费用估算是否基于实际测试数据还是粗略估计？同时考虑未来用户增长对AI费用的影响。",
    createdAt: now,
  },
];

// ---- Demo Consensus Topics ----
export const demoConsensusTopics: ConsensusTopic[] = [
  {
    id: "consensus-001",
    topic: "本地优先处理敏感文件",
    level: "strong",
    description: "三份核心文档（需求说明、方案A、方案B）均明确要求对用户上传的文档进行本地处理，不得将完整文件上传至第三方服务器。这是项目的基本安全原则。",
    supportingDocuments: [
      {
        documentId: "doc-001",
        documentName: "01-校园AI创新项目需求说明.md",
        excerpt: "所有文件处理必须在用户设备本地完成，不得将敏感文件上传至第三方服务器。",
      },
      {
        documentId: "doc-003",
        documentName: "03-技术方案B-轻量前端+边缘计算.pdf",
        excerpt: "所有文档在浏览器本地解析，不上传到任何服务器。",
      },
    ],
    opposingDocuments: [],
    coveragePercentage: 75,
  },
  {
    id: "consensus-002",
    topic: "必须保留AI回答来源",
    level: "strong",
    description: "需求文档和风险评估报告都强调了AI回答的可追溯性。风险评估报告甚至明确建议建立引用溯源机制。",
    supportingDocuments: [
      {
        documentId: "doc-001",
        documentName: "01-校园AI创新项目需求说明.md",
        excerpt: "AI模型需要能够引用文档原文作为回答依据，确保回答的可信度和可验证性。",
      },
      {
        documentId: "doc-004",
        documentName: "04-项目风险评估报告.pdf",
        excerpt: "建议建立引用溯源机制，每个AI结论必须关联原文证据。",
      },
    ],
    opposingDocuments: [],
    coveragePercentage: 50,
  },
  {
    id: "consensus-003",
    topic: "移动端不是第一阶段重点",
    level: "moderate",
    description: "虽然需求文档提到需要支持移动端浏览器，但两套技术方案都将移动端适配列为非第一阶段的核心任务。",
    supportingDocuments: [
      {
        documentId: "doc-001",
        documentName: "01-校园AI创新项目需求说明.md",
        excerpt: "需要支持桌面端和移动端浏览器",
      },
    ],
    opposingDocuments: [],
    coveragePercentage: 25,
  },
  {
    id: "consensus-004",
    topic: "React作为前端框架",
    level: "strong",
    description: "两套技术方案不约而同选择了React作为前端框架，表明团队对React生态的认可度较高。",
    supportingDocuments: [
      {
        documentId: "doc-002",
        documentName: "02-技术方案A-全栈Web应用.pdf",
        excerpt: "前端使用React 18 + TypeScript构建SPA应用",
      },
      {
        documentId: "doc-003",
        documentName: "03-技术方案B-轻量前端+边缘计算.pdf",
        excerpt: "前端使用React 18 + TypeScript构建纯静态应用",
      },
    ],
    opposingDocuments: [],
    coveragePercentage: 50,
  },
  {
    id: "consensus-005",
    topic: "AI功能是项目核心差异化优势",
    level: "moderate",
    description: "需求文档将AI对话和多文档分析列为核心功能，风险评估报告也围绕AI稳定性展开讨论。",
    supportingDocuments: [
      {
        documentId: "doc-001",
        documentName: "01-校园AI创新项目需求说明.md",
        excerpt: "用户可以通过自然语言与文档内容进行交互...系统需支持同时对多份文档进行比较分析",
      },
    ],
    opposingDocuments: [],
    coveragePercentage: 25,
  },
];

// ---- Demo Decision Brief ----
export const demoBrief: DecisionBrief = {
  id: "brief-demo-001",
  projectId: "project-demo-001",
  title: "校园AI创新项目技术方案选型决策简报",
  target: "project_evaluation",
  audience: "team",
  detail: "standard",
  sections: [
    {
      id: "brief-sec-001",
      title: "一、问题定义",
      content:
        "校园AI创新项目需要在两套候选技术方案（方案A：全栈Web应用 vs 方案B：轻量前端+边缘计算）之间做出选择。\n\n核心决策问题：\n1. 选择哪套技术方案作为项目的基础架构？\n2. 是否需要引入后端数据库？\n3. 如何在预算、开发周期和功能完整性之间取得平衡？\n\n项目约束条件：\n- 开发周期：12周\n- 总预算：15万元\n- 团队规模：5人\n- 核心需求：文档处理、AI问答、多文档分析、隐私保护",
      citations: [
        {
          id: "brief-cite-001",
          chunkId: "chunk-doc-001-0",
          documentId: "doc-001",
          documentName: "01-校园AI创新项目需求说明.md",
          text: "项目周期为3个月（12周），团队规模为5人。项目总预算为人民币15万元。",
          pageNumber: 1,
          relation: "support",
          relevanceScore: 1.0,
        },
      ],
      order: 1,
    },
    {
      id: "brief-sec-002",
      title: "二、关键事实",
      content:
        "基于四份文档的分析，确认以下关键事实：\n\n1. 两套方案都选择了React + TypeScript作为前端技术栈\n2. 方案A需要14周开发，方案B需要12周\n3. 方案A总成本12万元/年，方案B总成本8万元/年\n4. 方案A需要服务器和数据库，方案B仅需浏览器端存储\n5. 风险评估报告推荐方案B\n6. 三份文档都强调本地优先的隐私保护原则\n7. AI回答可追溯性被列为关键需求",
      citations: [
        {
          id: "brief-cite-002",
          chunkId: "chunk-doc-004-2",
          documentId: "doc-004",
          documentName: "04-项目风险评估报告.pdf",
          text: "综合评估后，建议优先考虑技术方案B",
          pageNumber: 7,
          relation: "support",
          relevanceScore: 0.96,
        },
      ],
      order: 2,
    },
    {
      id: "brief-sec-003",
      title: "三、主要共识",
      content:
        "四份文档在以下方面达成共识：\n\n1. 本地隐私保护是基本原则（3/4文档明确支持）\n2. AI回答必须可追溯原文依据（2/4文档明确要求）\n3. React是合适的前端框架（2/2技术方案一致选择）\n4. 第一阶段不需要重点投入移动端（各方案均将移动端放在次要位置）",
      citations: [],
      order: 3,
    },
    {
      id: "brief-sec-004",
      title: "四、核心争议",
      content:
        "存在以下三个关键争议需要决策：\n\n争议1：开发周期\n方案A（14周）vs 方案B（12周）vs 需求（12周）\n→ 方案B在时间上更匹配需求\n\n争议2：是否需要后端数据库\n方案A（需要PostgreSQL+Redis）vs 方案B（不需要）\n→ 取决于协作需求和未来扩展计划\n\n争议3：预算分配\n方案A（12万元）vs 方案B（8万元）\n→ 方案B节省的4万元可用于AI API调用",
      citations: [],
      order: 4,
    },
    {
      id: "brief-sec-005",
      title: "五、方案比较",
      content:
        "| 维度 | 方案A（全栈Web） | 方案B（轻量+边缘） |\n|------|-----------------|-------------------|\n| 开发周期 | 14周 ⚠️ | 12周 ✅ |\n| 年成本 | 12万元 | 8万元 ✅ |\n| 隐私保护 | 中等 | 优秀 ✅ |\n| 离线支持 | 需额外开发 | 天然支持 ✅ |\n| 扩展性 | 高 ✅ | 中等 |\n| 运维复杂度 | 高 | 低 ✅ |\n| 团队协作 | 容易 ✅ | 需额外方案 |\n\n方案B在5个维度占优，方案A在2个维度占优。",
      citations: [],
      order: 5,
    },
    {
      id: "brief-sec-006",
      title: "六、风险评估",
      content:
        "主要风险：\n\n1. 开发周期紧张（高风险）：如果选择方案A，有2周的延期风险\n2. AI API费用超支（中风险）：需要设置用量上限和缓存策略\n3. 文档解析兼容性（高风险）：需要预留充分的容错和降级方案\n4. 未来扩展需求（中风险）：方案B的浏览器端存储可能在未来需要协作功能时需要迁移\n\n建议的缓解措施：\n- 第一周进行技术原型验证\n- 设置AI API每日使用上限\n- 优先支持TXT/MD格式，PDF/DOCX逐步完善\n- 预留2周缓冲时间",
      citations: [
        {
          id: "brief-cite-003",
          chunkId: "chunk-doc-004-0",
          documentId: "doc-004",
          documentName: "04-项目风险评估报告.pdf",
          text: "建议：建立引用溯源机制，每个AI结论必须关联原文证据。设置每日Token使用上限。",
          pageNumber: 2,
          relation: "support",
          relevanceScore: 0.93,
        },
      ],
      order: 6,
    },
    {
      id: "brief-sec-007",
      title: "七、信息缺口",
      content:
        "在做出最终决策前，需要补充以下信息：\n\n1. AI API费用的详细测算依据（方案B的4万元估算是基于什么假设？）\n2. 团队成员的React和TypeScript实际经验水平\n3. 是否需要多设备数据同步（影响是否需要后端存储）\n4. 是否有第二阶段的协作功能规划\n5. 用户对于离线使用的实际需求强度\n6. 目标用户群体的浏览器类型分布（确认IndexedDB兼容性）",
      citations: [],
      order: 7,
    },
    {
      id: "brief-sec-008",
      title: "八、建议方案",
      content:
        "基于对四份文档的综合分析，建议如下：\n\n推荐方案：技术方案B（轻量前端 + 边缘计算）\n\n推荐理由：\n1. 开发周期（12周）精确匹配项目要求\n2. 成本更低（8万元），预算余量更大\n3. 隐私保护设计最强，符合项目核心原则\n4. 天然支持离线使用，无需额外开发\n5. 运维简单，团队可专注功能开发\n6. 风险评估报告也推荐方案B\n\n补充建议：\n- 保留方案A作为第二阶段的参考架构，当需要引入协作功能时参考其数据库设计\n- 在方案B中预留给未来引入后端服务的接口设计\n- 第一个迭代（前4周）重点验证文档解析和AI集成的可行性",
      citations: [
        {
          id: "brief-cite-004",
          chunkId: "chunk-doc-004-2",
          documentId: "doc-004",
          documentName: "04-项目风险评估报告.pdf",
          text: "综合评估后，建议优先考虑技术方案B（轻量前端+边缘计算），因其开发周期（12周）符合需求且成本更低（8万元）。",
          pageNumber: 7,
          relation: "support",
          relevanceScore: 0.96,
        },
      ],
      order: 8,
    },
    {
      id: "brief-sec-009",
      title: "九、下一步行动计划",
      content:
        "立即行动（本周）：\n1. □ 召开技术方案评审会，确认选择方案B\n2. □ 要求方案B团队提供AI API费用详细测算\n3. □ 团队成员进行React+TypeScript技能评估\n4. □ 搭建项目脚手架和技术原型\n\n第一阶段（第1-4周）：\n5. □ 完成文档解析模块开发（优先TXT/MD）\n6. □ 完成IndexedDB数据层搭建\n7. □ 集成AI Provider并进行原型验证\n8. □ 实现基础的问答和引用功能\n\n第二阶段（第5-9周）：\n9. □ 完成多文档分析功能\n10. □ 实现证据链和冲突检测\n11. □ 开发决策简报功能\n12. □ 进行第一轮用户测试\n\n第三阶段（第10-12周）：\n13. □ 完善UI/UX和响应式适配\n14. □ 编写完整测试用例\n15. □ 性能优化和安全审查\n16. □ 部署上线和文档交付",
      citations: [],
      order: 9,
    },
  ],
  createdAt: now,
  updatedAt: now,
};

// ---- Demo Activity Logs ----
export const demoActivityLogs: ActivityLog[] = [
  {
    id: "log-001",
    action: "created_workspace",
    entityType: "workspace",
    entityId: WID,
    entityName: "校园AI创新项目方案评审",
    timestamp: "2026-06-15T08:00:00Z",
    details: "创建了Demo工作区",
  },
  {
    id: "log-002",
    action: "uploaded_document",
    entityType: "document",
    entityId: "doc-001",
    entityName: "01-校园AI创新项目需求说明.md",
    timestamp: "2026-06-15T08:05:00Z",
    details: "上传并解析成功",
  },
  {
    id: "log-003",
    action: "uploaded_document",
    entityType: "document",
    entityId: "doc-002",
    entityName: "02-技术方案A-全栈Web应用.pdf",
    timestamp: "2026-06-18T10:05:00Z",
    details: "上传并解析成功",
  },
  {
    id: "log-004",
    action: "uploaded_document",
    entityType: "document",
    entityId: "doc-003",
    entityName: "03-技术方案B-轻量前端+边缘计算.pdf",
    timestamp: "2026-06-20T09:35:00Z",
    details: "上传并解析成功",
  },
  {
    id: "log-005",
    action: "uploaded_document",
    entityType: "document",
    entityId: "doc-004",
    entityName: "04-项目风险评估报告.pdf",
    timestamp: "2026-06-25T14:05:00Z",
    details: "上传并解析成功",
  },
  {
    id: "log-006",
    action: "ai_conversation",
    entityType: "conversation",
    entityId: "conv-demo-001",
    entityName: "技术方案B vs 方案A",
    timestamp: "2026-07-09T09:05:00Z",
    details: "发起了AI对话分析",
  },
  {
    id: "log-007",
    action: "conflict_analysis",
    entityType: "conflict",
    entityId: "conflict-001",
    entityName: "3个冲突主题",
    timestamp: "2026-07-09T09:10:00Z",
    details: "完成多文档冲突检测分析",
  },
  {
    id: "log-008",
    action: "consensus_analysis",
    entityType: "consensus",
    entityId: "consensus-001",
    entityName: "5个共识主题",
    timestamp: "2026-07-09T09:12:00Z",
    details: "完成共识分析",
  },
  {
    id: "log-009",
    action: "decision_brief",
    entityType: "brief",
    entityId: "brief-demo-001",
    entityName: "校园AI创新项目技术方案选型决策简报",
    timestamp: "2026-07-09T09:15:00Z",
    details: "生成了决策简报",
  },
];
