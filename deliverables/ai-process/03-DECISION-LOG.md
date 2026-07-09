# Decision Log -- 关键技术决策记录

EvidenceFlow AI 项目开发过程中的关键技术决策，每个决策记录决策内容、替代方案、选择理由和影响。

---

## 决策 1: 为什么选择 Vite 而非 Next.js / CRA

| 维度 | 内容 |
|------|------|
| **决策内容** | 采用 Vite 作为构建工具和开发服务器，而非 Next.js 或 Create React App (CRA)。 |
| **考虑过的替代方案** | **Next.js**: React 全栈框架，支持 SSR/SSG/ISR，App Router 架构。**CRA**: React 官方推荐的入门构建工具（已不再维护）。 |
| **为什么选择 Vite** | 1. **纯前端 SPA 不需要 SSR**: EvidenceFlow 是一个浏览器端运行的纯前端应用，不需要服务端渲染。Next.js 的 SSR 能力是本项目的额外复杂度而非收益。2. **极速 HMR**: Vite 基于原生 ESM 的开发服务器提供毫秒级热更新，开发体验远优于 CRA 的 Webpack。3. **轻量配置**: Vite 的 `vite.config.ts` 仅 16 行，相比 Next.js 的复杂配置或 CRA 的 eject 机制，心智负担更小。4. **生产级构建**: Rollup 打包输出高效，且原生支持 TypeScript、CSS Modules 等。 |
| **为什么不选 Next.js** | Next.js 虽然生态强大，但其核心价值（SSR、文件路由、API Routes、Server Components）与 EvidenceFlow 的"本地优先、无服务端"架构理念相悖。引入 Next.js 意味着为了一个不需要的功能承担框架复杂度。 |
| **为什么不选 CRA** | CRA 已于 2023 年停止维护，React 官方文档已不再推荐。使用已弃用的工具会带来安全隐患和兼容性风险。 |
| **影响** | 构建配置简洁，开发服务器启动 < 1 秒，HMR 即时生效。前端部署只需静态文件托管（Vercel/Cloudflare Pages/Netlify），运维成本为零。 |

---

## 决策 2: 为什么选择 IndexedDB / Dexie.js 而非 PostgreSQL / MySQL

| 维度 | 内容 |
|------|------|
| **决策内容** | 使用浏览器端 IndexedDB（通过 Dexie.js 封装）作为数据持久层，而非服务器端数据库如 PostgreSQL 或 MySQL。 |
| **考虑过的替代方案** | **PostgreSQL / MySQL**: 传统服务器端关系型数据库。**SQLite (WASM)**: 浏览器端的 SQLite 编译到 WebAssembly。**LocalStorage / SessionStorage**: 最简单的浏览器存储方案。 |
| **为什么选择 IndexedDB / Dexie.js** | 1. **零服务器依赖**: 无需部署和维护数据库服务器，完全在用户浏览器中运行。2. **大容量**: IndexedDB 的存储上限（通常为磁盘可用空间的 50-60%）远超 LocalStorage 的 5MB 限制，适合存储解析后的文档 chunk。3. **结构化查询**: IndexedDB 支持索引和游标查询，Dexie.js 提供了类似 MongoDB 的链式查询 API。4. **离线优先**: 天然支持离线使用，无需网络连接即可访问所有历史数据。5. **Dexie.js 的 DX**: Dexie.js 封装了 IndexedDB 复杂的原生 API，提供 Promise-based 的异步操作和 TypeScript 类型支持。 |
| **为什么不选 PostgreSQL/MySQL** | 需要部署和维护服务器，引入网络延迟和安全风险。对于个人使用场景，本地存储更符合隐私优先的设计理念。 |
| **为什么不选 SQLite WASM** | SQLite WASM 需要在浏览器中加载约 1MB 的 WASM 文件，增加首屏加载时间。IndexedDB 是浏览器原生 API，无额外体积开销。 |
| **影响** | 数据完全存储在用户浏览器中，无服务器费用。Dexie.js 表定义简洁（4-5 行/表），查询直观。离线可用性完美实现。 |

---

## 决策 3: 为什么选择 Zustand 而非 Redux / Context API

| 维度 | 内容 |
|------|------|
| **决策内容** | 采用 Zustand 作为全局状态管理库，而非 Redux Toolkit 或 React Context API。 |
| **考虑过的替代方案** | **Redux Toolkit**: 成熟的 Flux 风格状态管理库。**React Context API**: React 内置的跨组件状态共享方案。**Jotai / Recoil**: 原子化状态管理。 |
| **为什么选择 Zustand** | 1. **极简 API**: 创建 store 只需 `create((set) => ({...}))`，无需 Provider、Reducer、Action Creator 模板代码。2. **TypeScript 友好**: 类型推断自然，不需要像 Redux 那样为 action 和 reducer 编写额外类型。3. **无 Provider 嵌套**: Zustand 不依赖 React Context，不会引起不必要的重渲染。4. **体积小**: ~1KB gzipped，远小于 Redux Toolkit (~11KB) 和 Redux (~2KB)。5. **支持异步**: 内置支持 async/await 在 action 中直接使用。 |
| **为什么不选 Redux** | 对于本项目这种中等复杂度的应用（2 个 store，约 50 行/个），Redux Toolkit 的模板代码量（slice + store + Provider + useSelector）远超 Zustand。过度工程化是小型项目的常见陷阱。 |
| **为什么不选 Context API** | Context API 在多个不相关的状态片段更新时会引起大范围的重渲染，需要额外的 memoization 优化。Zustand 的选择性订阅 `useStore(selector)` 在性能上更优。 |
| **影响** | 2 个 store 文件（app-store.ts 56 行，settings-store.ts 55 行），总计约 110 行代码覆盖全部状态管理需求。学习成本几乎为零。 |

---

## 决策 4: 为什么选择 Tailwind CSS v4 而非 CSS Modules / Styled Components

| 维度 | 内容 |
|------|------|
| **决策内容** | 采用 Tailwind CSS v4 作为样式方案，而非 CSS Modules 或 Styled Components。 |
| **考虑过的替代方案** | **CSS Modules**: 组件级样式隔离。**Styled Components / Emotion**: CSS-in-JS 方案。**Vanilla CSS**: 原生 CSS 文件。 |
| **为什么选择 Tailwind CSS v4** | 1. **一致的设计系统**: 内置颜色、间距、字体等设计 Token，无需手动定义。2. **零运行时开销**: utility-first CSS 在构建时生成，比 CSS-in-JS 方案快。3. **v4 的新特性**: CSS-first 配置（`@theme` 指令）、更小的 CSS bundle、原生暗色模式支持。4. **与 Radix UI 的兼容性**: Tailwind 的 utility class 可以直接覆盖 Radix 组件的默认样式。5. **自定义主题简单**: 通过 CSS 变量定义 `--color-*`，自动映射为 `bg-card`、`text-primary` 等语义化 class。 |
| **为什么不选 CSS Modules** | CSS Modules 需要为每个组件创建独立的 `.module.css` 文件，增加文件数量和维护成本。设计一致性较难保证。 |
| **为什么不选 Styled Components** | CSS-in-JS 在 React 19 和 Server Components 趋势下面临性能挑战和兼容性问题。运行时注入 CSS 增加 bundle 体积和首屏时间。 |
| **影响** | 全局 CSS 文件仅 106 行（含主题变量、暗色模式、动画定义）。组件样式通过 utility class 内联表达，无需单独的样式文件。 |

---

## 决策 5: 为什么选择手写 UI 组件而非引入完整的 UI 组件库

| 维度 | 内容 |
|------|------|
| **决策内容** | 项目基于 Radix UI 无样式原语手写 UI 组件，而非直接引入 Ant Design / MUI / shadcn/ui 等完整组件库。 |
| **考虑过的替代方案** | **Ant Design**: 阿里巴巴企业级 UI 组件库。**MUI (Material UI)**: Google Material Design 组件库。**shadcn/ui**: 基于 Radix + Tailwind 的组件集合。**Chakra UI**: 可访问性优先的组件库。 |
| **为什么选择手写** | 1. **完全的样式控制**: 使用 Radix UI 原语可以完全控制样式，通过 Tailwind 和 CVA 灵活定制，不会出现覆盖组件库默认样式的情况。2. **按需引入**: 只编写项目实际需要的 13 个组件（button、card、dialog、select、tabs 等），没有冗余代码。3. **学习价值**: 理解底层实现而非仅仅调用封装好的组件。4. **与 Tailwind v4 无缝集成**: 自写组件的 className 机制天然支持 Tailwind utility。 |
| **为什么不选 Ant Design / MUI** | 完整组件库体积庞大（数百 KB），引入大量本项目不需要的组件。且 Ant Design 的默认视觉效果偏企业后台，与 EvidenceFlow 的产品调性不匹配。样式覆盖困难（通常需要 `!important` 或深层选择器）。 |
| **为什么不选 shadcn/ui** | shadcn/ui 确实是最接近本项目方案的选项（Radix + Tailwind + CVA），但它的组件是复制到项目目录而非 npm 依赖。考虑到本项目只是毕业设计 Demo，直接参考 shadcn/ui 的实现思路自行编写更可控。 |
| **影响** | 13 个 UI 组件总计约 800 行代码，bundle 体积小型且可控。组件样式完全自定义，与项目视觉风格统一。 |

---

## 决策 6: 为什么 Mock Provider 作为默认 AI Provider

| 维度 | 内容 |
|------|------|
| **决策内容** | 系统默认配置 Mock AI Provider，用户无需 API Key 即可体验全部功能。 |
| **考虑过的替代方案** | **直接要求 API Key**: 首次使用即要求配置 OpenAI/DeepSeek API Key。**完全无 AI**: 不做 AI Provider 抽象，所有分析功能纯客户端算法实现。 |
| **为什么选择 Mock Provider** | 1. **降低体验门槛**: 毕业设计答辩和 Demo 演示时，评审老师不需要注册任何服务即可完整体验产品。2. **稳定的演示环境**: Mock Provider 不依赖网络，离线可用，不存在 API 限流或服务不可用的问题。3. **架构灵活性**: AIProvider 接口抽象了所有 AI 操作（chat、summarize、detectConflicts、generateBrief 等），后续接入真实 API 只需实现一个 Adapter。4. **Demo 数据可预测**: Mock Provider 的输出来自精心设计的 demo-data.ts，确保每次演示的结果一致。 |
| **为什么不选直接要求 API Key** | 对于毕业设计项目，要求评审老师注册第三方服务并获取 API Key 是不合理的体验门槛。且 API 调用存在费用、稳定性和延迟等不确定因素。 |
| **影响** | Settings 页面默认 AI Provider 为 "Mock (Demo)"。Mock Provider 实现了 8 个 AIProvider 接口方法，模拟真实延迟（300-1500ms）。"体验示例工作区"按钮一键加载全套 demo 数据到 IndexedDB。 |

---

## 决策 7: 为什么 Evidence Chain 优先于 Knowledge Graph

| 维度 | 内容 |
|------|------|
| **决策内容** | 功能优先级排序：证据链（Evidence Chain）作为核心功能优先实现，知识图谱（Knowledge Graph）放在 "Nice to Have" 后续规划。 |
| **考虑过的替代方案** | **知识图谱优先**: 构建文档实体和关系的知识图谱，提供图形化关系浏览。**两者并行**: 同时实现证据链和知识图谱。 |
| **为什么选择 Evidence Chain** | 1. **解决核心用户痛点**: 用户最需要的是"AI 说的结论有没有依据"，证据链直接回答了这个问题。2. **可验证性**: 每一条 Claim 关联具体的 Evidence，每条 Evidence 引用原文、页码和关系类型，构建了从结论到原文的完整信任链。3. **实现复杂度可控**: 证据链的数据模型是线性的（Claim → Evidence → Citation → Chunk → Document），相较于知识图谱的网状结构更容易实现和测试。4. **差异化竞争**: 主流 AI 文档工具大多提供聊天和摘要，但很少提供可点击溯源的证据链。 |
| **为什么不选知识图谱** | 知识图谱需要实体识别（NER）、关系抽取、图数据库和图可视化，实现复杂度远超当前阶段的范围。且对于项目 Demo 使用的 4 篇文档构建的知识图谱，节点和边数量不足以展示其价值。 |
| **影响** | 证据链页面实现了完整的三栏布局、四类证据关系过滤、置信度标注和证据摘要面板。Conflict Radar 和 Consensus Map 从侧面补充了关系分析。知识图谱作为后续方向记录在路线图中。 |

---

## 决策 8: 为什么冲突检测（Conflict Detection）是核心创新点

| 维度 | 内容 |
|------|------|
| **决策内容** | 将多文档冲突检测作为产品的核心差异化创新功能，优先于其他高级分析功能。 |
| **考虑过的替代方案** | **以 AI 对话为核心**: 类似 ChatPDF 的单一 AI 聊天体验。**以文档管理为核心**: 类似 Zotero/Mendeley 的知识管理工具。**以摘要生成为核心**: 类似 Notion AI 的自动摘要工具。 |
| **为什么选择冲突检测** | 1. **真实需求**: 在做方案评审、文献综述、合同审查等场景，用户最痛苦的不是读不完文档，而是面对不同文档的矛盾说法不知道该信谁。2. **竞品空白**: 市面上绝大多数 AI 文档工具只支持单文档聊天，少数支持多文档的工具也只做简单对比，没有专门做冲突检测的。3. **技术深度**: 冲突检测需要同时具备文档理解、引用溯源、观点提取和对比分析能力，是AI能力的综合体现。4. **决策支撑**: 冲突检测直接服务于决策场景，与"Decision Brief"功能形成闭环。 |
| **为什么不选纯 AI 对话** | ChatPDF 类产品已有大量竞品（ChatPDF、PDF.ai、ChatDOC 等），属于红海市场。仅做 AI 文档对话无法形成差异化。 |
| **影响** | Conflict Radar 实现了文档选择、分析状态机、冲突卡片（含 AI Analysis + 验证建议）、Comparison Matrix 表格、等级筛选等完整交互流程。Demo 数据设计了 3 个真实冲突案例（开发周期、数据库选择、预算估算）。 |

---

## 决策 9: 为什么采用 Local-First 架构

| 维度 | 内容 |
|------|------|
| **决策内容** | 系统设计为 Local-First 架构：所有文档处理在浏览器本地执行，数据存储在 IndexedDB 中，无需用户账号和云存储。 |
| **考虑过的替代方案** | **Cloud-First**: 文档上传到服务器，服务端处理并存储，通过 Web API 提供服务。**Hybrid**: 本地处理 + 云同步。 |
| **为什么选择 Local-First** | 1. **隐私强需求**: 用户上传的文档（方案文件、风险评估报告等）通常包含敏感信息，用户期望不被发送到第三方服务器。2. **降低法律风险**: 不存储用户文件意味着不需要处理数据合规（GDPR、个人信息保护法等）问题。3. **离线可用**: 核心功能不依赖网络，适合出差、会议等场景。4. **架构简单**: 无需用户认证、权限管理、文件存储、API 服务器等基础设施。5. **降低成本**: 零服务器运维费用，唯一的可变成本是用户的 AI API 调用（由用户自己配置 API Key）。 |
| **为什么不选 Cloud-First** | 需要搭建和维护后端服务器、数据库、对象存储、认证服务等基础设施，大幅增加开发和运维复杂度。且用户将敏感文档上传到第三方服务存在信任障碍。 |
| **影响** | 系统架构完全在浏览器端运行。Settings 的 Privacy Center 明确说明了数据处理方式。AI 请求仅发送文本片段（非完整文件），且需要用户主动配置 API Key。 |

---

## 决策 10: 为什么 "Nice to Have" 功能被延后

| 维度 | 内容 |
|------|------|
| **决策内容** | 多个有价值的功能被标记为 "Nice to Have" 并列入后续规划，未在当前版本实现。 |
| **延迟的功能清单** | 1. Knowledge Graph 知识图谱可视化；2. PDF.js 完整集成（当前使用简化文本提取）；3. 用户标注和高亮功能；4. 团队协作与多设备同步；5. WebSocket 流式 AI 对话（当前 http stream）；6. 移动端响应式适配；7. 浏览器扩展（右键直接分析网页）；8. Email Digest（AI 自动生成日报/周报）。 |
| **为什么选择延后** | 1. **聚焦核心价值**: 证据链、冲突雷达、共识地图、决策简报四个核心功能已经形成完整的"从文档到决策"闭环。2. **时间约束**: 毕业设计周期有限，优先保证核心功能的可用性和完整性。3. **MVP 原则**: 用最小可行产品验证核心假设——用户是否真的需要证据溯源和冲突检测。4. **技术 ROI**: 如知识图谱和团队协作等功能虽好，但在 Demo 场景（4 篇文档、单人使用）中价值有限。 |
| **为什么不现在做** | 同时做太多功能会导致每个功能都不够完善。在有限的开发周期内，与其 10 个功能各做 60%，不如 5 个功能各做 90%。 |
| **影响** | 当前版本功能完整且可用，4 个核心功能都实现了完整的交互流程。Nice to Have 功能记录在产品路线图中，为后续迭代提供了明确方向。 |
