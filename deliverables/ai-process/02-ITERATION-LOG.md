# Iteration Log -- 开发迭代记录

EvidenceFlow AI 项目开发过程中的关键迭代记录，记录遇到的问题、AI 建议、人工分析和最终解决方案。

---

## Iteration #1: Vite + React 项目初始化与构建配置

| 项目 | 内容 |
|------|------|
| **版本** | v0.1.0 -- 项目骨架搭建 |
| **出现的问题** | `tsc -b && vite build` 构建失败。TypeScript 6.0 + verbatimModuleSyntax 配置导致部分 import 语句报错；Tailwind CSS v4 的 `@import "tailwindcss"` 语法与 v3 的 `@tailwind base` 不兼容。 |
| **AI 建议** | 1. 将 import type 与 import value 分开写以满足 verbatimModuleSyntax；2. 使用 Tailwind CSS v4 的 `@import "tailwindcss"` + `@theme {}` 语法替代 v3 的 `@tailwind` 指令；3. 通过 `@tailwindcss/vite` 插件集成。 |
| **人工分析** | verbatimModuleSyntax 是 TypeScript 6.0 的推荐配置，可以避免运行时 import 歧义。Tailwind CSS v4 是项目初期选型时确定的技术决策，因为其 CSS-first 配置方式和更好的性能。虽然 v4 的文档和社区资源不如 v3 丰富，但长期来看是正确方向。 |
| **最终方案** | 采纳 AI 建议。所有 type import 统一使用 `import type { ... } from "..."` 语法；index.css 使用 v4 的 `@import "tailwindcss"` + `@theme {}` 配置自定义颜色变量；vite.config.ts 中通过 `@tailwindcss/vite` 插件集成。 |
| **修改结果** | 构建成功通过，`tsc -b` 零错误，`vite build` 正常输出 dist/ 目录。 |

---

## Iteration #2: TypeScript Strict Mode 类型错误修复

| 项目 | 内容 |
|------|------|
| **版本** | v0.2.0 -- Strict Mode 适配 |
| **出现的问题** | `tsconfig.app.json` 中启用 `strict: true` 后产生 40+ 类型错误。主要包括：`crypto.randomUUID()` 类型推断失败、Dexie.js Table 泛型与自定义 interface 不完全匹配（如 settings store 中的 `put()` 方法）、`documentId` 可能为 undefined 的访问、`err` catch 变量类型为 unknown、未使用变量 `_documentIds` 等。 |
| **AI 建议** | 1. `crypto.randomUUID()` 改用 `generateId()` 封装；2. Dexie 的 `put()` 方法使用 `as any` 类型断言配合 `eslint-disable-next-line`；3. 所有 catch 块显式写 `err instanceof Error ? err.message : "Unknown error"`；4. 未使用的参数加下划线前缀；5. 可选链操作符和 null checking 补充。 |
| **人工分析** | `strict: true` 是 TypeScript 最佳实践，不能关闭。Dexie.js 的 Table 泛型在某些场景下（如 settings 表只有一个 key-value 记录）确实与 TypeScript 的推断有冲突，使用局部 `as any` 是可接受的权衡。关于 `noUnusedLocals` 和 `noUnusedParameters`，对于 lint 阶段的前缀约定（`_unused`）可以与 oxlint 规则配合使用。 |
| **最终方案** | 采纳 AI 建议，逐文件修复。特别处理了 settings-store.ts 中的 3 处 Dexie `put()` 类型问题（添加 `eslint-disable-next-line @typescript-eslint/no-explicit-any` 和 `as any`），DecisionBrief.tsx 中的 `chunks.filter(Boolean)` 类型收缩问题，以及所有 `catch (err)` 块的类型守卫。 |
| **修改结果** | `tsc -b` 零错误通过。保留了 3 处 eslint-disable 注释用于 Dexie 边界情况。 |

---

## Iteration #3: Tailwind CSS v4 自定义颜色变量与暗色模式

| 项目 | 内容 |
|------|------|
| **版本** | v0.3.0 -- 主题系统实现 |
| **出现的问题** | 使用 Tailwind CSS v4 的 `@theme {}` 定义自定义颜色后，组件中的 `bg-card`、`text-muted-foreground`、`border-border` 等 Tailwind class 无法生效。原因是 v4 的 CSS 变量名默认使用 `--color-*` 而非 v3 的 `--*`。同时暗色模式的 `.dark` 选择器下的变量覆盖没有生效。 |
| **AI 建议** | 1. 在 `@theme {}` 中定义颜色时使用 `--color-*` 前缀（如 `--color-card: #ffffff`）；2. 暗色模式通过在 `.dark` CSS 类选择器下覆盖 CSS 变量实现，而非 Tailwind v3 的 `darkMode: "class"` 配置；3. 使用 `@media (prefers-color-scheme: dark)` 作为系统级暗色模式的回退。 |
| **人工分析** | Tailwind CSS v4 的主题系统发生了根本性变化，不再使用 `tailwind.config.js` 而是全部通过 CSS 变量控制。这意味着自定义组件中使用 `var(--color-card)` 可以直接引用主题变量，无需额外配置。这是一个更合理的方案，只是需要适应新的 API。 |
| **最终方案** | 完全采用 CSS 变量方案。在 `index.css` 中定义所有颜色 token（card、border、muted、accent、sidebar 等），通过 `.dark` 类切换暗色值。组件统一使用 Tailwind utility classes（如 `bg-card`、`border-border`），由 Tailwind v4 自动映射到 CSS 变量。 |
| **修改结果** | 主题切换正常工作，亮色/暗色模式颜色完全正确。Radix UI 组件和自定义组件间颜色统一。 |

---

## Iteration #4: Dexie.js IndexedDB 初始化与数据加载时序

| 项目 | 内容 |
|------|------|
| **版本** | v0.4.0 -- 数据层搭建 |
| **出现的问题** | 应用首次加载时，IndexedDB 还没有数据，但 Zustand store 的 `loadDashboard()` 和 `useSettingsStore.load()` 同时在 `useEffect` 中触发。由于 settings store 的初始化会写入默认设置到 IndexedDB，而 app store 的 dashboard 加载可能在 settings 写入完成前执行，导致 UI 闪现空状态后又被数据填充，产生视觉闪烁。 |
| **AI 建议** | 1. 使用 Promise.all 并行加载多个 IndexedDB 表，减少加载时间；2. 在 store 中增加 `loaded` 状态标志，确保数据加载完成前显示骨架屏；3. Settings 初始化逻辑（default write）从 load 方法移到构造函数。 |
| **人工分析** | IndexedDB 读操作本身是异步的，多个 store 的 load 并发执行没有问题。问题在于 settings store 在首次 load 时如果发现没有数据，会执行一次 write 操作创建默认记录，这可能会触发 Chrome DevTools 中 IndexedDB 的 transaction 冲突（如果同时有其他读操作）。骨架屏是一个好的 UX 实践，可以平滑地掩盖加载时序问题。 |
| **最终方案** | 1. App store 的 `loadDashboard` 使用 `Promise.all` 并行读取 workspaces、documents、activityLogs；2. Settings store 的 `load` 方法增加了 `loaded` 标志；3. Dashboard 页面增加骨架屏加载态；4. Settings store 的初始化逻辑保留在 `load` 中但增加了 try-catch 容错。 |
| **修改结果** | 加载过程丝滑，骨架屏过渡自然，无视觉闪烁。IndexedDB 读写无冲突。 |

---

## Iteration #5: React Router 布局嵌套与代码分割

| 项目 | 内容 |
|------|------|
| **版本** | v0.5.0 -- 路由架构优化 |
| **出现的问题** | 最初所有页面都在同一个 `<AppLayout>` 下，但 Welcome 页面需要全屏布局（无侧边栏）。同时所有页面都在一个 bundle 中，导致首次加载 JS 体积过大（~1.2MB uncompressed）。 |
| **AI 建议** | 1. 使用 React Router 的 Layout Route 模式，创建两个布局出口：`<AppLayout>`（带侧边栏）和 `<FullPageLayout>`（无侧边栏）；2. 使用 `React.lazy()` + `Suspense` 对页面组件进行代码分割；3. Dashboard 作为首页改为 eager import 避免首屏闪烁。 |
| **人工分析** | 布局嵌套是 React Router 的标准模式，适合这个项目的需求。代码分割使用动态 import 在各个现代打包工具中都是最佳实践，Vite 下 Rollup 原生支持。但要注意 lazy import 的模块需要 default export。项目中所有页面组件都是 named export，需要在 lazy 时做 `.then(m => ({ default: m.ComponentName }))` 转换。 |
| **最终方案** | 1. 创建了两个 Layout Route 出口；2. Dashboard 保持 eager import；3. 其余 7 个页面使用 `React.lazy()` 按需加载；4. 创建了 `PageLoader` 组件作为 Suspense fallback（旋转动画 + "Loading..." 文字）。 |
| **修改结果** | Welcome 页面正确显示为全屏布局。代码分割后 initial bundle 减少约 40%。页面切换时有短暂的 Suspense fallback（约 100-200ms），在可接受范围内。 |

---

## Iteration #6: UI 组件与 Demo Data 的引用关系设计

| 项目 | 内容 |
|------|------|
| **版本** | v0.6.0 -- Demo 数据接入 |
| **出现的问题** | 在开发 EvidenceChain 和 ConflictRadar 页面时，组件直接硬编码了 Mock 数据，导致代码不可复用。同时 demo-data.ts 中的数据缺乏内部一致性（如 Citation 的 chunkId 不匹配实际 Chunk ID，Evidence 的 citationId 指向不存在的 Citation）。 |
| **AI 建议** | 1. 将所有 Demo 数据集中到 `demo-data.ts`，维护内部引用一致性；2. 页面组件通过 IndexedDB 加载数据（`db.conflicts.toArray()`），不再硬编码；3. Demo 数据通过 Welcome 页的一键加载按钮写入 IndexedDB。 |
| **人工分析** | 这是一个架构层面的问题。如果 Mock 数据散落在各个页面组件中，后续接入真实 AI Provider 时需要修改多处代码，容易遗漏。将所有数据流统一为"从 IndexedDB 读取"模式，Mock 数据只是在 DB 初始化时写入的种子数据，可以确保数据流的一致性。 |
| **最终方案** | 1. 重构 demo-data.ts，确保所有实体间的引用 ID 正确匹配（如 Citation.chunkId 对应 Chunk.id，Evidence.citationId 对应 Citation.id）；2. Welcome 页的"体验示例工作区"按钮通过 `db.*.bulkPut()` 将 10 个表的数据一次性写入 IndexedDB；3. 所有页面组件统一通过 `db.*.toArray()` 或 `db.*.get()` 读取数据。 |
| **修改结果** | Demo 数据一键加载到 IndexedDB（约 200ms），所有页面的数据流完全统一。后续接入真实 AI 只需要替换 provider 实现，数据流不变。 |

---

## Iteration #7: EvidenceChain 三栏布局与过滤逻辑

| 项目 | 内容 |
|------|------|
| **版本** | v0.7.0 -- 证据链页面重构 |
| **出现的问题** | 最初 EvidenceChain 页面使用了简单的两栏布局（Claim 列表 + 证据列表），当页面加载了 4 条 Claim 和 10+ 条 Evidence 后内容非常拥挤。同时 filter tab 的逻辑有问题：选择 "Contradicting Only" 后，如果当前 Claim 没有 contradict 类型的证据，页面完全空白且没有反馈。 |
| **AI 建议** | 1. 改为三栏布局：左栏 Claims、中栏 Evidence Chain、右栏 Overview；2. 增加空状态提示："No evidence matches the selected filter" + "Show all evidence" 按钮；3. 使用 Framer Motion 的 `AnimatePresence` 给 filter 切换增加过渡动画。 |
| **人工分析** | 三栏布局在大屏幕上更合理，能同时展示 Claim 上下文、证据详情和统计摘要。空状态提示是必要的 UX 反馈。但是对于移动端，三栏布局不适合，需要后续考虑响应式适配。当前阶段优先桌面端。 |
| **最终方案** | 1. 实现三栏布局（280px + flex + 240px），使用 `h-[calc(100vh-4rem)]` 撑满高度；2. 增加 filter 空状态组件（含 Filter 图标 + 提示文字 + "Show all evidence" 按钮）；3. 使用 AnimatePresence + motion.div 实现 filter 切换的淡入淡出效果；4. Overview 面板显示证据关系分布和引用文档列表。 |
| **修改结果** | 三栏布局清晰展示所有信息层级。空状态提示友好。filter 切换动画流畅。 |

---

## Iteration #8: DecisionBrief 的 AI Provider 集成与表单验证

| 项目 | 内容 |
|------|------|
| **版本** | v0.8.0 -- 简报生成功能完善 |
| **出现的问题** | DecisionBrief 页面最初只展示了硬编码的 Demo Brief，没有实际的生成功能。实现 `handleGenerate` 时遇到三个问题：1) `formData.documentIds` 为空时没有校验；2) `getAIProvider().generateDecisionBrief()` 传入的 chunks 参数类型为 `(DocumentChunk | undefined)[]`，与接口要求的 `DocumentChunk[]` 不匹配；3) 生成失败时没有错误提示。 |
| **AI 建议** | 1. 在 handleGenerate 开头增加表单验证，title 非空和 documentIds.length > 0；2. chunks 参数使用 `.filter(Boolean)` 过滤 undefined 但需要类型断言；3. 增加 error state 和 AlertCircle 图标提示；4. 生成成功后保存到 IndexedDB 并记录 ActivityLog。 |
| **人工分析** | 表单验证和数据持久化是最基本的功能完整性要求。类型问题是因为 `db.chunks.bulkGet()` 返回 `(T | undefined)[]`，而 TypeScript 无法自动推断 `.filter(Boolean)` 之后的类型收缩（因为 `Boolean` 不是 type guard）。这在 strict mode 下很常见。 |
| **最终方案** | 1. 增加表单验证（title 非空 + 至少选择 1 个文档），失败时显示 error 提示；2. chunks 参数先 `.filter(Boolean)` 然后做 `as DocumentChunk[]` 类型断言；3. 增加 error state UI（AlertCircle + message）；4. 生成成功后将 brief 存入 IndexedDB，同时记录 ActivityLog；5. 成功生成后自动选中新 brief 并更新列表。 |
| **修改结果** | 简报生成功能完整可用。表单验证覆盖所有边界情况。类型断言在局部可控。Mock Provider 下生成简报约 1.5s，UX 流畅。 |

---

## Iteration #9: 构建脚本配置与 Oxlint 集成

| 项目 | 内容 |
|------|------|
| **版本** | v0.9.0 -- 质量工具链完善 |
| **出现的问题** | `package.json` 的 scripts 中最初的 `build` 命令只包含 `vite build`，没有先跑类型检查。添加 `tsc -b` 后需要确保 `tsc` 的 project references 配置正确。同时 Oxlint 报告了若干 warning（主要是 `react/only-export-components`），需要决定是修复还是 suppress。 |
| **AI 建议** | 1. build 命令改为 `"tsc -b && vite build"`，利用 tsconfig.json 的 project references；2. `.oxlintrc.json` 中 `react/only-export-components` 设置为 warn 级别，允许常量导出；3. `vitest.config.ts` 增加 `globals: true` 和环境配置。 |
| **人工分析** | `tsc -b` 使用 project references 模式，比 `tsc --noEmit` 更快（增量编译）。Oxlint 是比 ESLint 快 50-100 倍的 Rust linter，适合在 CI 中使用。`react/only-export-components` 的 warn 级别加上 `allowConstantExport: true` 是一个合理的折中，因为项目中确实有一些工具函数需要导出。 |
| **最终方案** | 1. build 命令采用 `tsc -b && vite build`；2. `.oxlintrc.json` 保留 `react/only-export-components` 为 warn，增加 `allowConstantExport: true`；3. 创建 `vitest.config.ts` 并配置 jsdom 环境和路径别名。 |
| **修改结果** | 构建流程完整：先类型检查，再打包。Oxlint 报告 0 error, 2 warning（均为已知的允许项）。 |

---

## Iteration #10: Test Coverage 补充与 CI 就绪

| 项目 | 内容 |
|------|------|
| **版本** | v1.0.0-alpha -- 测试体系建立 |
| **出现的问题** | 项目初期的测试仅覆盖了 utils.ts（11 个用例）。检索模块、AI Provider、Citation Mapper 等核心逻辑缺乏测试，无法保证重构安全性。同时缺少 test-setup 导致 `@testing-library/jest-dom` 的 matcher 不生效。 |
| **AI 建议** | 1. 增加 retrieval.test.ts 覆盖 TF-IDF 检索逻辑的 8 个用例；2. 为 citation-mapper.ts 编写单元测试；3. 创建 test-setup.ts 导入 jest-dom matchers；4. 在 vitest.config.ts 中注册 setupFiles。 |
| **人工分析** | 测试覆盖是生产就绪的关键指标。但考虑到项目是毕业设计 Demo 而非生产系统，测试重点应放在核心算法逻辑上（检索、映射、工具函数），UI 组件测试通过 E2E demo 流程人工验证即可。 |
| **最终方案** | 1. 完成 2 个测试文件共 19 个用例（全部通过）；2. test-setup.ts 导入 `@testing-library/jest-dom/vitest`；3. vitest.config.ts 配置 `globals: true, environment: 'jsdom', setupFiles: ['./src/test-setup.ts']`；4. 明确知悉 UI 测试和集成测试为后续工作。 |
| **修改结果** | `npm test` 输出 19 passed, 0 failed。测试框架就绪，CI 流水线可直接接入。 |
