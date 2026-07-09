# Prompt Register -- AI 提示语登记表

EvidenceFlow AI 项目开发过程中使用的 AI 提示语记录。

---

## 项目初始化与架构设计阶段

| # | 阶段 | 目标 | Prompt 摘要 | AI 工具 | AI 输出结果 | 人工判断 | 后续修改 |
|---|------|------|------------|---------|------------|---------|---------|
| 1 | 项目启动 | 确定技术栈选型 | "我需要构建一个纯前端的文档分析与证据溯源工具，目标用户是不懂编程的普通用户。请比较 Vite vs Next.js vs CRA，IndexedDB/Dexie.js vs PostgreSQL，Zustand vs Redux，并推荐最适合的技术栈组合。" | Claude Code | 推荐 Vite + IndexedDB(Dexie.js) + Zustand + Tailwind CSS v4 + Radix UI 的组合方案，理由是纯前端架构无需 SSR、IndexedDB 适合本地优先、Zustand 足够轻量。 | Adopted | 采纳了全部技术栈建议；Radix UI 仅用于交互组件（Dialog/Select/Tabs），其他 UI 均手写 |
| 2 | 架构设计 | 设计数据模型 | "基于这个文档分析工具的需求，帮我设计完整的数据模型，包括文档、工作区、AI对话、引用、证据链、冲突检测、共识分析、决策简报等实体及其关系。输出 TypeScript interface 定义。" | Claude Code | 输出了 10+ 个 TypeScript interface，覆盖 Document、Chunk、Citation、Claim、Evidence、ConflictItem、ConsensusTopic、DecisionBrief 等核心实体，以及对应的类型别名。 | Adopted | 补充了 ActivityLog 实体用于操作审计；Claim 增加了 confidence 和 evidenceCount 字段 |
| 3 | 架构设计 | 设计系统架构图 | "根据这个项目的架构，用 Mermaid 画出系统架构图、AI 交互流程图和数据模型 ER 图。" | Claude Code | 生成了 system-architecture.mmd、ai-flow.mmd、data-model.mmd 三个 Mermaid 文件 | Adopted | 文件存放于 deliverables/architecture/ 目录 |

## UI 组件与页面开发阶段

| # | 阶段 | 目标 | Prompt 摘要 | AI 工具 | AI 输出结果 | 人工判断 | 后续修改 |
|---|------|------|------------|---------|------------|---------|---------|
| 4 | UI 开发 | 创建基础 UI 组件库 | "我需要一套基于 Tailwind CSS v4 + Radix UI + CVA 的基础 UI 组件库。请创建 button、card、input、textarea、dialog、select、tabs、badge、tooltip、dropdown-menu、switch、skeleton、scroll-area 13 个组件，每个组件使用 forwardRef 并支持 className 覆盖。" | Claude Code | 生成了 13 个基础设施 UI 组件，风格统一，支持 Tailwind 颜色系统 | Adopted | button 组件增加了 size variant；card 组件参考 Radix 增加了 CardHeader/CardContent/CardFooter 子组件 |
| 5 | UI 开发 | 创建整体布局框架 | "请创建 AppLayout（侧边栏+顶部导航+内容区）、Sidebar（可折叠导航栏，含7个主路由入口）、TopNav、CommandPalette 和 EvidenceDrawer 组件。使用 Framer Motion 实现侧边栏的动画折叠效果。" | Claude Code | 创建了完整的布局组件系统，Sidebar 支持动画折叠、CommandPalette 支持 ⌘K 快捷唤醒、EvidenceDrawer 从右侧滑出显示证据详情 | Adopted | Sidebar 增加了 Search 入口和 Upload 快捷按钮；EvidenceDrawer 增加了 relation 颜色标识 |
| 6 | 页面开发 | 开发 Welcome 页 | "创建一个 Welcome 着陆页，分为 Hero 区（标题+副标题+CTA按钮）、四项核心能力卡片展示区（证据链/冲突雷达/共识地图/决策简报）、文件拖拽上传区。使用 Framer Motion 做渐进式动画。CTA 按钮分别为'开始分析资料'和'体验示例工作区'。" | Claude Code | 完整的 Welcome 页，含 Hero、Capabilities Grid、Upload Zone 三个 section | Adopted | 标题从英文改为中文"Slogan: 让每一个结论都有证据可循"；增加了"体验示例工作区"按钮一键加载 demo 数据 |
| 7 | 页面开发 | 开发 Dashboard 页 | "创建仪表盘页面，包含：数据统计卡片（文档数/冲突数/共识数/简报数）、关键洞察区（带图标和快捷链接的洞察卡片）、最近文档列表、工作区信息栏、快捷操作区和最近活动日志。" | Claude Code | 完整的 Dashboard 页，三列响应式布局，含 loading/empty/loaded 三种状态 | Adopted | 活动日志从假数据改为从 IndexedDB 异步加载；增加了 Privacy Badge 显示"数据仅在本地处理" |

## 核心功能开发阶段

| # | 阶段 | 目标 | Prompt 摘要 | AI 工具 | AI 输出结果 | 人工判断 | 后续修改 |
|---|------|------|------------|---------|------------|---------|---------|
| 8 | 功能开发 | 实现文档解析器 | "请实现一个浏览器端的文档解析器，支持 TXT、Markdown、PDF、DOCX 四种格式。TXT/MD 直接读取文本；PDF 使用 pdfjs-dist 解析；DOCX 使用 mammoth 解析。解析结果要分 chunk（按标题分段），每个 chunk 提取 keywords。注意处理各种边界情况（空文件、大文件、损坏文件）。" | Claude Code | 完整的 DocumentParser 模块，包含格式检测、文本解析、PDF 二进制提取、DOCX mammoth 集成、关键词提取（TF 算法+停用词过滤）和 chunk 分片逻辑 | Adopted | 增加了文件大小上限 50MB 的校验；PDF 解析初期用简化的正则提取方法，后续可接入完整 pdfjs-dist |
| 9 | 功能开发 | 实现 Mock AI Provider | "创建 MockProvider 实现 AIProvider 接口（testConnection、chat、streamChat、summarize、compareDocuments、detectConflicts、generateConsensusTopics、generateDecisionBrief 共 8 个方法）。每个方法模拟真实的 API 延迟（300-1500ms），返回结构化的模拟数据用于 Demo 演示。" | Claude Code | 完整的 MockProvider 实现，含模拟延迟、基于上下文构造引用数组、根据问题类型生成不同风格的 Mock 回答 | Adopted | detectConflicts 和 generateConsensusTopics 改为基于实际传入的 documents 动态生成结果，而非返回固定数据 |
| 10 | 功能开发 | 实现关键字检索引擎 | "实现一个基于 TF-IDF 的关键字检索引擎 retrieveRelevantChunks。输入查询文本和 chunk 数组，输出 Top-K 排序结果。需要实现词条分词（支持英文和中文）、TF-IDF 加权计算、短语精确匹配加分、关键词重叠加分。另外实现 searchChunksByKeyword 用于文档级搜索。" | Claude Code | 完整的检索模块，含 tokenize（中英文分词）、retrieveRelevantChunks（TF-IDF算法+多因子加权）、searchChunksByKeyword（精确匹配+计数打分）三个核心函数 | Adopted | 增加了 searchChunksByKeyword 函数用于 DocumentLibrary 的搜索功能；tokenize 改为 split on whitespace 和标点，不区分中英文 |

## 核心功能页面开发阶段

| # | 阶段 | 目标 | Prompt 摘要 | AI 工具 | AI 输出结果 | 人工判断 | 后续修改 |
|---|------|------|------------|---------|------------|---------|---------|
| 11 | 页面开发 | 开发 AI Reader 页 | "创建 AI Reader 聊天页面，左侧文档列表+大纲，中间消息对话区，底部输入框。支持选择单个文档或全部文档提问。AI 回答需显示引用来源（点击可打开 EvidenceDrawer）。消息支持复制，placeholder 根据上下文动态变化。" | Claude Code | 完整的 AI Reader 页面，三栏布局，支持文档选择切换、消息自动滚动到底部、引用来源展示、loading/streaming/error 三种状态处理 | Adopted | 补充了空状态引导文案；引用编号使用数字图标；增加了无选择文档时的上下文提示 |
| 12 | 页面开发 | 开发 Evidence Chain 页 | "创建 Evidence Chain 证据链页面，三栏布局：左栏为 Claim 列表（带置信度标识和支持/反对计数），中栏为选中 Claim 的证据卡片（支持/反对/补充/不确定 四种关系类型、过滤标签），右栏为 Overview 面板（证据分布、引用文档）。使用 filter tab 实现证据关系筛选。" | Claude Code | 完整的证据链页面，三栏布局，含 Claim 选择、证据关系标识、过滤标签栏、引用文档汇总面板 | Adopted | 增加了 empty state（无证据时引导用户先去 AI Reader）；补充了提示卡片指导用户点击查看详细证据 |
| 13 | 页面开发 | 开发 Conflict Radar 页 | "创建 Conflict Radar 冲突雷达页面。核心流程：选择需要分析的文档（2-5 个）→ 点击分析 → 显示冲突卡片列表。每个冲突卡片包含冲突主题、严重等级（高/中/低）、冲突类型（数据/定义/观点/时间线/方法论）、多文档观点对比、AI 分析和验证建议。还需要一个 Comparison Matrix 表格（行=主题，列=文档，单元格=观点）。" | Claude Code | 完整的 Conflict Radar，含文档选择器（checkbox+select all/clear）、分析状态机（idle→selecting→analyzing→results→no-results→error）、冲突卡片（可展开/折叠）、Comparison Matrix 表格、摘要统计卡片、等级筛选 | Adopted | 增加了文档数量上限为 5 个避免 UI 过载；文档选择器增加了 disabled 样式；Comparison Matrix 增加了 sticky 首列 |
| 14 | 页面开发 | 开发 Consensus Map 页 | "创建 Consensus Map 共识地图页面。左侧：共识覆盖率水平柱状图（Recharts）+ Document x Topic 矩阵表格。右侧：共识主题列表 + 选中主题的详情面板（含覆盖率进度条、支持文档列表、反对文档列表）。共识等级分为强/中/弱/争议 四档。" | Claude Code | 完整的 Consensus Map，含 Recharts 水平柱状图、Matrix 表格（check/cross/empty 图标）、主题详情面板、覆盖率统计卡片 | Adopted | Matrix 表格增加了图例说明；柱状图颜色按共识等级映射（绿/蓝/灰/琥珀） |
| 15 | 页面开发 | 开发 Decision Brief 页 | "创建 Decision Brief 决策简报页面。左侧：简报生成表单（标题、目标类型、目标受众、文档选择 checkboxes）+ 已保存简报列表。右侧：选中简报的完整内容展示（可折叠 section、每 section 的引用来源、Markdown/TXT 导出、打印、复制全文功能）。生成时先调用 AI Provider 获取结构化的决策简报。" | Claude Code | 完整的 Decision Brief 页，含表单验证（标题非空、至少选择 1 个文档）、异步生成（AI Provider + DB 存储+活动日志）、section 折叠展开、导出（Markdown/TXT/Print）、复制功能 | Adopted | 增加了表单错误提示（AlertCircle 图标）；导出文件名使用简报标题；补充了空状态引导 |

## TypeScript 修复与测试阶段

| # | 阶段 | 目标 | Prompt 摘要 | AI 工具 | AI 输出结果 | 人工判断 | 后续修改 |
|---|------|------|------------|---------|------------|---------|---------|
| 16 | 修复 | 修复 TypeScript 编译错误 | "运行 tsc -b 后出现了以下错误列表，请逐一修复：（列出 strict mode 下的所有类型错误，包括 possibly undefined、implicit any、unused variables 等）" | Claude Code | 逐文件修复了 strict mode 下的类型错误：为可选链增加了 null checks、修复了未使用变量警告、补全了 missing return types、解决了 settings store 中的 any cast 问题 | Adopted | settings store 中保留了两处 eslint-disable 注释（因为 Dexie 的 put 方法类型要求与 UserSettings 不完全匹配） |
| 17 | 测试 | 编写单元测试 | "为 utils.ts 和 keyword-retrieval.ts 编写 Vitest 测试用例。utils 测试覆盖 cn、formatDate、formatFileSize、generateId、truncate。检索测试覆盖空查询、空 chunks、TopK 限制、精确匹配排序、关键词搜索。" | Claude Code | 创建了两个测试文件：utils.test.ts（5 个 describe 块，11 个测试用例）和 retrieval.test.ts（2 个 describe 块，8 个测试用例），全部 19 个测试通过 | Adopted | 增加了边界条件测试（空字符串、空数组、超长截断） |

## 文档与交付物阶段

| # | 阶段 | 目标 | Prompt 摘要 | AI 工具 | AI 输出结果 | 人工判断 | 后续修改 |
|---|------|------|------------|---------|------------|---------|---------|
| 18 | 文档 | 生成项目 README | "为 EvidenceFlow AI 项目生成 README.md，包含项目简介、技术栈、功能特性、快速开始、项目结构、贡献指南。" | Claude Code | 生成了基础 README | Modified | 精简为模板格式，重点保留技术栈和功能特性说明 |
| 19 | 文档 | 生成架构文档 | "将 Mermaid 架构图转换为可读的文字说明，描述系统的分层架构、数据流和核心模块职责。" | Claude Code | 生成了架构文档 | Modified | 保留为 Mermaid 格式存放在 deliverables/architecture/，更直观 |
| 20 | 文档 | 生成 PPT 讲稿内容 | "为毕业设计答辩生成 12-15 页 PPT 内容大纲（中文），涵盖问题定义、产品方案、创新点、技术架构、AI 协作过程、总结展望。" | Claude Code | 生成了 15 页 PPT 内容大纲 | Adopted | 保存为 PPT_CONTENT.md，后续人工补充具体演讲备注 |
