# EvidenceFlow AI

> **证流 AI — 可验证文档智能分析与决策工作台**
>
> 不是替你读文档，而是帮你从资料中找到可信答案。
>
> *From Documents to Evidence. From Evidence to Insight. From Insight to Decision.*

---

## 项目背景

AI 文档助手已经很多了，但它们大多只能"上传 → 总结 → 聊天"。

EvidenceFlow AI 解决的是更深层的问题：
- 资料来源太多，观点不一致时该相信谁？
- AI 给出的回答，依据在哪里？能否验证？
- 多份资料之间的共识和冲突如何系统化地发现？
- 从阅读到决策，中间缺少系统化的分析过程。

## 四项核心创新

### 🔗 Evidence Chain 证据链
每一个 AI 结论都绑定来源文档、页码、原文片段、证据类型和相关程度。用户点击引用编号即可打开证据侧边栏，查看原文依据。

### ⚡ Conflict Radar 观点冲突雷达
选择 2～5 份文档后，系统自动识别观点冲突：数据冲突、定义差异、时间变化等。使用冲突卡片、对比矩阵和证据对照表展示。

### 🌐 Consensus Map 共识地图
识别多份资料之间的共识主题，按共识强度分类（强/中/弱/争议），使用矩阵图和分布图可视化展示。

### 📋 Decision Brief 决策简报
将多文档分析结果转化为结构化决策简报，包含问题定义、关键事实、共识、争议、风险、信息缺口和建议方案。

## 核心功能

- 📄 多格式文档解析（PDF、DOCX、TXT、Markdown）
- 💬 AI 智能问答（引用溯源）
- 🔗 证据链与引用映射
- ⚡ 多文档冲突检测
- 🌐 共识分析可视化
- 📋 结构化决策简报生成
- 🎨 深色/浅色模式
- ⌨️ Command Palette（⌘K）
- 🔒 本地优先隐私保护
- 🎭 Demo 演示模式（无需 API Key）

## 技术架构

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 8 |
| 样式 | Tailwind CSS v4 |
| 状态管理 | Zustand |
| 本地数据库 | Dexie.js + IndexedDB |
| 路由 | React Router 7 |
| 图表 | Recharts |
| 测试 | Vitest + Testing Library |
| 图标 | Lucide React |
| 动画 | Framer Motion |

**为什么选择 IndexedDB 而不是 PostgreSQL/MySQL？**
本项目的核心数据流在浏览器端完成：文件解析 → 分块 → 检索 → AI 调用。IndexedDB 支持本地持久化、离线使用，无需用户注册和服务器存储，天然符合隐私优先的设计原则。

**为什么选择 Mock Provider？**
确保没有 API Key 时仍能完整演示所有功能，降低演示和评审的风险。

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 pnpm

### 安装与运行

```bash
# 克隆项目
cd evidenceflow-ai

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run test` | 运行测试 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run lint` | 代码检查 |
| `npm run preview` | 预览生产构建 |

## Demo 模式

默认启用 Mock Demo Provider，无需配置任何 API Key 即可完整演示所有功能。

1. 打开应用，点击「体验示例工作区」
2. 加载 4 份模拟资料（项目需求、技术方案A/B、风险评估报告）
3. 进入 AI Reader 提问
4. 点击引用编号查看证据来源
5. 查看 Conflict Radar 的 3 个冲突主题
6. 查看 Consensus Map 的 5 个共识主题
7. 生成 Decision Brief

## AI Provider 配置

在 Settings → AI Provider 中配置：

| Provider | 需要 Key | 需要 Base URL |
|----------|----------|---------------|
| Mock Demo | ❌ | ❌ |
| OpenAI Compatible | ✅ | ❌ |
| DeepSeek Compatible | ✅ | ❌ |
| Custom | ✅ | ✅ |

## 隐私设计

- ✅ 所有文档在浏览器本地解析
- ✅ 数据存储在浏览器 IndexedDB
- ✅ 远程 AI 调用仅发送文本片段
- ✅ API Key 仅存储在本地
- ✅ 可随时清除所有本地数据

## 项目目录

```
evidenceflow-ai/
├── src/
│   ├── components/     # UI 组件和布局
│   ├── pages/          # 9 个页面
│   ├── services/       # AI、文档、检索、引用、分析服务
│   ├── stores/         # Zustand 状态管理
│   ├── db/             # Dexie.js 数据库
│   ├── data/           # Demo 数据
│   ├── types/          # TypeScript 类型定义
│   ├── lib/            # 工具函数
│   └── __tests__/      # 测试文件
├── deliverables/       # 项目交付物
│   ├── docs/           # 五份核心文档
│   ├── architecture/   # 架构图
│   ├── ai-process/     # AI 辅助开发过程记录
│   ├── screenshots/    # 项目截图
│   ├── presentation/   # 答辩材料
│   └── review/         # 审查报告
└── dist/               # 构建输出
```

## 测试

```bash
# 运行所有测试
npm run test

# TypeScript 类型检查
npm run typecheck

# 构建
npm run build
```

## 提交物

最终提交物在 `deliverables/` 目录：
- 五份核心文档（规格说明、架构设计、审查报告、操作手册、协作文档）
- 架构图（Mermaid 源文件）
- AI 辅助开发过程记录
- 答辩 PPT 内容
- 现场演示脚本
- 代码审查报告
- 测试结果

## 未来规划

- OCR 图片文字识别
- 向量 Embedding 语义检索
- 知识图谱可视化
- PWA 离线支持
- 云端数据同步
- 团队协作功能

---

**EvidenceFlow AI** — From Documents to Evidence. From Evidence to Insight. From Insight to Decision.
