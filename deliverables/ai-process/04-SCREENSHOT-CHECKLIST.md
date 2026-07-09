# Screenshot Checklist -- 截图清单

EvidenceFlow AI 毕业设计答辩所需的产品截图与 AI 交互截图清单。

---

## 一、产品功能截图

### 01-welcome-page.png
- **描述**: 产品着陆页（Welcome Page）
- **应该可见的内容**:
  - 顶部标签: "From Documents to Evidence. From Evidence to Insight. From Insight to Decision."
  - 主标题: "让每一个结论都有证据可循"（中文 Slogan）
  - 副标题: 产品定位说明（上传统资料，发现共识、识别冲突、追踪证据）
  - 两个 CTA 按钮: "开始分析资料"（蓝色主按钮）+ "体验示例工作区"（边框按钮）
  - 四项核心能力卡片: Evidence Chain / Conflict Radar / Consensus Map / Decision Brief（各带图标、颜色标识和描述）
  - 底部拖拽上传区 + Footer
- **状态**: [ ] TODO: 准备好 Demo 数据后截图

### 02-dashboard.png
- **描述**: 仪表盘首页（Dashboard）
- **应该可见的内容**:
  - 左侧 Sidebar（7 个导航入口 + Upload 按钮 + Search 快捷入口）
  - 顶部统计卡片: Documents: 4 / Conflicts Found: 3 / Consensus Topics: 5 / Decision Briefs: 1
  - 关键洞察区: 3 个洞察卡片（冲突、共识、缺少来源）
  - "Recent Documents" 区域: 4 篇 Demo 文档列表
  - 右侧 "Workspace Info" + "Quick Actions" + "Recent Activity" 面板
  - 底部 Privacy Badge: "All documents processed locally."
- **状态**: [ ] TODO: 加载 Demo 数据后截图

### 03-document-library.png
- **描述**: 文档库页面（Document Library）
- **应该可见的内容**:
  - 4 篇 Demo 文档的网格卡片
  - 每个卡片显示: 文件图标、文件名、页数和文件大小、解析状态（ready）、chunk 数量
  - 搜索框和标签过滤栏
  - Grid/List 视图切换按钮
  - "Upload" 按钮
  - 鼠标悬停显示操作按钮（Favorite / Details / Delete）
- **状态**: [ ] TODO: 加载 Demo 数据后截图

### 04-ai-reader.png
- **描述**: AI 阅读器对话页（AI Reader）
- **应该可见的内容**:
  - 左侧文档列表面板（可选择 "All Documents" 或单个文档）
  - 中间对话区: 至少展示 2 轮完整的问答
  - AI 回答中包含引用来源（编号圆圈 + 文档名 + 页码 + 关系标识）
  - 引用关系标识颜色（绿色 Support / 蓝色 Complement）
  - 底部输入框 + 发送按钮 + 上下文提示（"Searching across 4 documents"）
  - Welcome 引导消息
- **状态**: [ ] TODO: 点击 Demo 对话后截图

### 05-citation-evidence.png
- **描述**: 引用证据详情弹出（Evidence Drawer）
- **应该可见的内容**:
  - 从右侧滑出的 Evidence Drawer 面板
  - 引用文本的完整展示（引号格式）
  - 来源文档名、页码、章节标题
  - 证据关系标识（支持/反对/补充/不确定）
  - 关联的其他 Claim 和 Evidence
- **状态**: [ ] TODO: 在 AI Reader 中点击引用来源后截图

### 06-evidence-chain.png
- **描述**: 证据链页面（Evidence Chain）
- **应该可见的内容**:
  - 三栏布局: Claims 左栏 + Evidence 中栏 + Overview 右栏
  - 4 个 Claim 列表（各带置信度标识和 Support/Contradict 计数）
  - 选中一个 Claim 后中间面板显示关联的 Evidence 卡片
  - Evidence 卡片包含文档名、关系标识、引用文本、页码、章节
  - 上方的 Filter Tab（All / Supporting Only / Contradicting Only / Needs Verification）
  - 右栏 Overview: Evidence Breakdown 统计和 Referenced Documents 列表
- **状态**: [ ] TODO: 展开证据链详情后截图

### 07-conflict-radar.png
- **描述**: 冲突雷达页面（Conflict Radar）
- **应该可见的内容**:
  - 顶部摘要统计: Total Conflicts: 3 / High: 2 / Medium: 1 / Low: 0
  - 等级筛选栏（All / High / Medium / Low）
  - 至少 1 个展开的冲突卡片，显示:
    - 冲突主题 + 严重等级标签 + 类型标签（Data / Methodology）
    - 多文档观点对比（左侧文档 A 观点 vs 右侧文档 B 观点）
    - AI Analysis 分析文字
    - Suggested Verification Steps 建议
  - Comparison Matrix 表格（行=冲突主题，列=文档名，单元格=观点摘要）
- **状态**: [ ] TODO: 运行冲突分析后截图

### 08-consensus-map.png
- **描述**: 共识地图页面（Consensus Map）
- **应该可见的内容**:
  - 顶部 4 个统计卡片: Strong Consensus / Moderate / Weak / Contested
  - Recharts 水平柱状图（Topic Coverage by Documents）
  - Document x Topic Matrix 表格（绿色对勾=支持，琥珀色三角=反对，横线=未提及）
  - 右侧共识主题列表（5 个 topics）
  - 选中一个主题后的详情面板: Consensus Level、描述、Coverage 进度条、Supporting Documents 列表
- **状态**: [ ] TODO: 加载共识数据后截图

### 09-decision-brief.png
- **描述**: 决策简报页面（Decision Brief）
- **应该可见的内容**:
  - 左侧简报生成表单（标题、目标类型、文档选择）
  - 左侧已保存简报列表
  - 右侧简报内容展示:
    - 简报标题 + 元信息（Type / Audience / Date）
    - 可折叠的 Section 列表（问题定义/关键事实/共识/争议/比较/风险/缺口/建议/行动）
    - 展开的 Section 显示内容 + 引用来源
    - 底部操作栏（Export Markdown / Export TXT / Print / Copy）
  - 顶部 Copy 和 Export 按钮
- **状态**: [ ] TODO: 生成 Demo Brief 后截图

### 10-settings-privacy.png
- **描述**: 设置与隐私中心页（Settings & Privacy Center）
- **应该可见的内容**:
  - AI Provider 配置区: Provider 下拉框（Mock）、API Key 输入框、Model 名称、Test Connection 按钮
  - Appearance 区: Theme 三选一（Light/Dark/System）+ Font Size 选择
  - Privacy Center 区:
    - "Local Processing" 卡片（绿色 Active Badge）
    - "Remote AI" 卡片（灰色 Inactive Badge -- 使用 Mock 时）
    - "Local Data" 状态条（Local Only Badge）
    - Export Data + Clear All Data 按钮
  - About 区: Technology Stack 标签
- **状态**: [ ] TODO: 切换到 Settings 页截图

---

## 二、AI 交互过程截图

每一张截图需要展示 AI 工具（Claude Code）在真实开发过程中的对话，体现"AI 辅助开发"的主题。

### 01-需求分析-AI交互.png
- **描述**: 与 Claude Code 讨论产品需求定位的对话截图
- **应该展示**: 用户描述问题 → AI 提出产品方向建议 → 用户确认 → AI 细化功能列表
- **状态**: [ ] TODO: 添加真实 Claude Code 对话截图

### 02-选题创新讨论-AI交互.png
- **描述**: 关于"冲突检测"创新点的讨论对话截图
- **应该展示**: 用户提出困惑（市面上太多 AI 文档工具）→ AI 分析竞品 → 建议定位冲突检测为差异化功能 → 用户认可
- **状态**: [ ] TODO: 添加真实 Claude Code 对话截图

### 03-技术选型分析-AI交互.png
- **描述**: 技术栈选型的 AI 辅助决策对话截图
- **应该展示**: 用户列出候选技术栈 → AI 逐一对比分析 → 给出推荐方案和理由
- **状态**: [ ] TODO: 添加真实 Claude Code 对话截图

### 04-数据模型设计-AI交互.png
- **描述**: TypeScript 数据模型设计的对话截图
- **应该展示**: 用户描述需求 → AI 输出 interface 定义 → 用户提出修改建议 → AI 迭代调整
- **状态**: [ ] TODO: 添加真实 Claude Code 对话截图

### 05-组件开发-AI交互.png
- **描述**: 页面组件开发过程的对话截图
- **应该展示**: 用户要求创建某个页面 → AI 输出完整代码 → 用户提出 UI 调整 → AI 修改
- **状态**: [ ] TODO: 添加真实 Claude Code 对话截图

### 06-TypeScript错误修复-AI交互.png
- **描述**: TypeScript 编译错误批量修复的对话截图
- **应该展示**: 用户贴出 tsc 错误日志 → AI 逐条分析原因 → 给出修复方案
- **状态**: [ ] TODO: 添加真实 Claude Code 对话截图

### 07-测试编写-AI交互.png
- **描述**: 编写测试用例的对话截图
- **应该展示**: 用户要求为某模块编写测试 → AI 输出完整测试代码 → 运行结果确认
- **状态**: [ ] TODO: 添加真实 Claude Code 对话截图

### 08-迭代优化-AI交互.png
- **描述**: 开发迭代中问题解决的对话截图
- **应该展示**: 用户报告 bug/问题 → AI 分析原因 → 给出修复代码 → 用户确认修复
- **状态**: [ ] TODO: 添加真实 Claude Code 对话截图

---

## 截图说明

1. **产品截图**: 运行 `npm run dev` 后在浏览器中截取（建议分辨率 1440x900 或 1920x1080）
2. **AI 交互截图**: 从 Claude Code 对话历史中截取有代表性的对话片段
3. **截图格式**: PNG，分辨率不低于 1920x1080
4. **命名规范**: 严格按照上方编号和文件名命名，放入 `/deliverables/screenshots/` 目录
5. **隐私注意**: AI 交互截图中涉及的 API Key 或个人敏感信息需打码处理
