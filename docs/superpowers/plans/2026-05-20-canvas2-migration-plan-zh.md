# Canvas 2.0 迁移方案整理

## 目标

把 `C:\Users\Administrator\code\banana` 里的 Canvas 2.0 画布能力迁移到当前 `C:\Users\Administrator\code\banan-react` 项目里，并尽量复用旧后端与数据库协议，避免前后端一起重做。

## 一句话结论

这次迁移最适合走“前端渐进替换，后端接口和数据库先保持兼容”的路线。

- 后端和数据库已经具备画布 2.0 的核心能力，不建议先改协议
- 当前 React 项目已经有项目列表页、详情页、基础画布读写能力，不是从零开始
- 真正的迁移重点在前端节点体系、抽屉面板、批量保存、高频交互、协作 UI
- 建议优先迁移高频节点和持久化链路，再迁移协作和高级生产能力

## 旧项目现状

### 前端

旧画布主入口在：

- `C:\Users\Administrator\code\banana\frontend-vue3\src\views\canvas\Sora2WorkflowCanvas.vue`

项目列表入口在：

- `C:\Users\Administrator\code\banana\frontend-vue3\src\views\canvas\Canvas2Projects.vue`

配套 API 在：

- `C:\Users\Administrator\code\banana\frontend-vue3\src\api\canvas2Collaboration.js`

配套持久化与节点工作流能力主要在：

- `C:\Users\Administrator\code\banana\frontend-vue3\src\composables\workflow\useWorkflowPersistence.js`
- `C:\Users\Administrator\code\banana\frontend-vue3\src\composables\workflow\nodeConfig.js`
- `C:\Users\Administrator\code\banana\frontend-vue3\src\composables\workflow\useNodeFactory.js`
- `C:\Users\Administrator\code\banana\frontend-vue3\src\composables\workflow\useNodeOperations.js`
- `C:\Users\Administrator\code\banana\frontend-vue3\src\composables\workflow\useNodeEventHandlers.js`
- `C:\Users\Administrator\code\banana\frontend-vue3\src\composables\workflow\useUndoRedo.js`
- `C:\Users\Administrator\code\banana\frontend-vue3\src\composables\workflow\useVideoGeneration.js`
- `C:\Users\Administrator\code\banana\frontend-vue3\src\composables\workflow\useDirectorWorkflow.js`

节点组件非常多，集中在：

- `C:\Users\Administrator\code\banana\frontend-vue3\src\components\canvas\sora2`

这里面不只是“展示卡片”，而是把业务操作、生成按钮、参数编辑、抽屉联动、引用图、视频轮询等能力都塞进了节点组件里。所以迁移难点不是把 Vue Flow 换成 React Flow，而是把这些节点业务重新拆出来。

### 后端

画布主 API 在：

- `C:\Users\Administrator\code\banana\backend\app\api\sora2_workflow.py`

实时协作 WebSocket 在：

- `C:\Users\Administrator\code\banana\backend\app\api\sora2_workflow_realtime.py`

核心 CRUD 在：

- `C:\Users\Administrator\code\banana\backend\app\crud\sora2_workflow.py`
- `C:\Users\Administrator\code\banana\backend\app\crud\sora2_workflow_collaboration.py`

当前后端已经支持：

- 画布项目列表、详情、创建、删除
- `PUT /api/sora2-workflow/:id` 整包保存 `canvas_nodes`
- `POST /api/sora2-workflow/:id/nodes:batchActions` 高频轻量保存
- 协作开启、关闭、邀请、成员列表、成员移除、操作日志
- 批注写入
- WebSocket 协作房间权限控制
- 自动从 `canvas_nodes` 提取缩略图
- 保存时清洗本地路径、`blob:`、base64 等不可持久化媒体地址

结论：后端协议已经够完整，React 端最好先按现有协议对齐，不要先设计新接口。

### 数据库

主表模型在：

- `C:\Users\Administrator\code\banana\backend\app\models\sora2_workflow.py`

协作相关表在：

- `C:\Users\Administrator\code\banana\backend\app\models\sora2_workflow_collaboration.py`

当前数据库核心结构：

- `sora2_workflow_progress`
  - `id`
  - `user_id`
  - `name`
  - `current_step`
  - `novel_content`
  - `workflow_state`
  - `canvas_nodes`
  - `thumbnail`
  - `project_type`
  - `created_at`
  - `updated_at`
- `sora2_workflow_collaborations`
  - 协作开关、邀请码、默认角色、创建人
- `sora2_workflow_members`
  - 项目成员和角色
- `sora2_workflow_operation_logs`
  - 协作操作日志

重要点：

- 画布主体数据都在 `canvas_nodes` JSON 里
- 批注也直接存回 `canvas_nodes.annotations`
- 节点 schema 没有强约束，前端新增字段时只要兼容 JSON 即可
- 这意味着前端迁移可以分阶段做，不需要数据库先改表

## 当前 React 项目现状

当前 React 项目相关代码在：

- `C:\Users\Administrator\code\banan-react\src\features\workflow\workflow-projects-page.tsx`
- `C:\Users\Administrator\code\banan-react\src\features\workflow\workflow-canvas-page.tsx`
- `C:\Users\Administrator\code\banan-react\src\features\workflow\workflow-api.ts`
- `C:\Users\Administrator\code\banan-react\src\features\workflow\workflow-types.ts`
- `C:\Users\Administrator\code\banan-react\src\features\workflow\workflow-node-catalog.ts`
- `C:\Users\Administrator\code\banan-react\src\features\workflow\workflow-node-renderers.tsx`

已经具备：

- 画布项目列表页
- 新建项目、删除项目
- 详情页加载 `GET /api/sora2-workflow/:id`
- React Flow 渲染 `nodes / edges / viewport`
- 基础新增节点、连线、删除、导入 JSON、整包保存
- 保存时保留未知 `canvas_nodes` 字段
- 已有基础节点目录和部分节点展示

还缺：

- 节点专用编辑器和完整节点渲染
- 高频批量保存接口接入
- 自动保存、撤销重做、退出兜底保存
- 协作成员、日志、邀请 UI
- WebSocket/Yjs 协作层
- 批注能力
- 抽屉面板体系
- 图片/视频生成链路
- Director 工作流、分组节点、导出等高级能力

## 迁移边界

### 建议直接复用

- 旧后端 REST API 协议
- 旧后端 WebSocket 房间协议
- 旧数据库表和 `canvas_nodes` JSON 结构
- 节点类型命名
- 旧项目里的 payload 清洗规则
- 缩略图提取和项目类型规则

### 建议在 React 里重写

- 画布页面壳子
- 节点渲染组件
- 抽屉与面板 UI
- 事件编排和本地状态管理
- 自动保存调度
- 协作状态展示

### 不建议原样搬运

- 把 `Sora2WorkflowCanvas.vue` 整页硬翻译成一个 React 大组件
- 把每个 Vue composable 按 1:1 语义照抄成一个巨型 hook
- 继续把所有节点业务都堆在节点组件里

原因很简单：旧实现已经偏“大页面 + 大组件 + 大 hook”，直接照搬到 React 只会把维护成本复制过去。

## 迁移建议

### 阶段 1：先把数据层补全

目标：让 React 画布先和旧后端“说同一种语言”。

需要补的内容：

- 在 React 里补 `nodes:batchActions` API
- 增加位置补丁、视口补丁、结构补丁的构造器
- 增加 `canvas_nodes` 保存前清洗逻辑
- 接入自动保存和离开页面兜底保存
- 保存时继续保留未知字段，避免覆盖旧数据

优先参考：

- `C:\Users\Administrator\code\banana\frontend-vue3\src\composables\workflow\useWorkflowPersistence.js`
- `C:\Users\Administrator\code\banana\frontend-vue3\src\utils\workflowCanvasPayload.js`

这一步完成后，React 端即使节点 UI 还不完整，也能安全读写旧项目数据。

### 阶段 2：建立 React 节点目录和节点 schema

目标：把“旧节点类型很多、字段很散”的问题先收敛。

建议做法：

- 在 React 里建立统一 node schema 映射层
- 区分“节点基础外壳”和“节点业务内容”
- 每个节点类型拆成：
  - renderer
  - inspector/form
  - serializer
  - actions

首批建议先迁高频节点：

- `textNode`
- `novelInput`
- `storyPrompt`
- `shotPrompt`
- `imageNode`
- `storyVideo`

原因：

- 这是当前项目里最常用的一条内容生产主链
- 这几类节点覆盖了文本输入、分镜、出图、出视频
- 先打通它们，就已经能承载大部分主流程

### 阶段 3：把“整包保存”升级为“高频轻量保存 + 低频整包保存”

目标：解决拖拽、视口移动、频繁编辑时整包 `PUT` 太重的问题。

建议策略：

- 节点拖拽结束后走 `nodes:batchActions`
- 视口变化做防抖后走 `updateViewport`
- 新增/删除节点与边走结构补丁
- 节点复杂字段编辑仍可先走整包保存
- 定时或关键动作做一次 full save，当作兜底

这样能兼顾：

- 后端兼容
- 操作性能
- 数据安全

### 阶段 4：迁移协作

目标：先有“多人可见与权限可控”，再追求更细的实时体验。

建议顺序：

1. 先补协作管理 UI
2. 再补 WebSocket 房间接入
3. 最后再考虑是否补 Yjs 层

需要的前端能力：

- 协作状态标识
- 成员列表
- 邀请用户
- 移除成员
- 操作日志
- 当前房间在线用户展示
- 远端快照合并

优先参考：

- `C:\Users\Administrator\code\banana\frontend-vue3\src\api\canvas2Collaboration.js`
- `C:\Users\Administrator\code\banana\backend\app\api\sora2_workflow.py`
- `C:\Users\Administrator\code\banana\backend\app\api\sora2_workflow_realtime.py`
- `C:\Users\Administrator\code\banana\comic-electron\src\composables\canvas2\useCanvas2Collaboration.js`

这里要特别注意：

- Web 旧版 `frontend-vue3` 里协作管理接口是正式链路
- `comic-electron` 里的 `useCanvas2Collaboration.js` 更像协作原型/增强实现，可借鉴思路，但不建议整段照搬成正式 Web 实现

### 阶段 5：迁移节点业务能力

目标：让 React 端不只是“看节点”，而是能真的创作。

建议顺序：

1. `imageNode`
2. `storyVideo`
3. `shotPrompt`
4. `storyPrompt`
5. `novelInput`
6. 其他高级节点

原因：

- `imageNode` 和 `storyVideo` 的业务回报最高
- 这两类节点一旦能用，整条生产链就有实际价值
- 后续再补导演工作包、音色、情绪曲线、实体类别这些高级能力

### 阶段 6：最后迁移高级能力

包括：

- Director workflow
- group / package 节点
- panorama / grid / voice 等扩展节点
- 批注 UI
- CapCut 导出
- 复杂抽屉和任务面板

这一层不建议先做，因为它依赖前面几层稳定。

## 推荐的 React 目录拆分

建议把当前 `workflow-canvas-page.tsx` 继续拆开：

- `canvas-shell`
  - 顶栏、工具栏、右侧面板、保存状态
- `canvas-flow`
  - React Flow 实例、连线、拖拽、视口
- `canvas-persistence`
  - full save、batch actions、auto save、payload sanitize
- `canvas-collaboration`
  - room、presence、member、logs、annotations
- `canvas-node-types`
  - 各节点 renderer
- `canvas-node-forms`
  - 各节点配置表单/inspector
- `canvas-actions`
  - 出图、出视频、导出、轮询

这样后面迁移单个节点时，不会一直改一个超大页面文件。

## 后端与数据库迁移建议

### 后端

短期不建议改协议，只补前端缺失接入。

只有在下面情况才建议动后端：

- React 端需要更细粒度节点 patch，而现有 `update` 还不够
- 协作需要更可靠的 snapshot / presence 协议
- 需要把批注从 `canvas_nodes.annotations` 单独拆表

### 数据库

短期不建议动表。

原因：

- `canvas_nodes` 现在足够灵活
- 迁移风险主要不在表结构，而在前端状态一致性
- 先稳定 React 读写更重要

只有在这些场景才建议改库：

- 需要做复杂节点检索
- 需要做节点级审计
- `canvas_nodes` JSON 体积过大导致查询/保存成本明显上升

## 风险点

### 1. React 端整包保存覆盖旧字段

旧项目 `canvas_nodes` 字段很多，而且部分字段 React 还没理解。

如果保存时只序列化自己认识的字段，很容易把旧数据抹掉。

必须坚持：

- 加载后保留原始 `canvas_nodes`
- 保存时按增量覆盖 `nodes / edges / viewport / 已编辑字段`
- 未识别字段原样保留

### 2. 本地媒体地址不能直接入库

旧后端会清洗：

- `blob:`
- `file://`
- `local-image://`
- Windows 本地路径
- base64 图片/视频

React 端也要同步遵守这个规则，否则表现会变成：

- 页面看起来保存成功
- 但换设备或刷新后素材丢失

### 3. 不能只迁节点展示，不迁节点动作

很多旧节点不是静态展示卡片，而是业务控制器。

比如：

- 出图
- 出视频
- 参数编辑
- 参考图管理
- 任务轮询
- 结果回写

如果只做节点 UI，用户会觉得“画布能打开，但不能生产”。

### 4. 协作状态与本地编辑冲突

旧协作方案已经考虑了：

- 房间权限
- 远端快照
- 正在编辑节点的本地保护

React 端接协作时要特别小心：

- 本地输入框编辑状态不能被远端覆盖
- 远端快照合并不能导致选区抖动
- 批注保存不能被 full save 冲掉

## 推荐实施顺序

1. 补 React `workflow-api` 的 batch actions 和协作接口
2. 抽出 React 版 `canvas persistence` 层
3. 补自动保存、离开兜底、payload sanitize
4. 完成 `textNode / novelInput / storyPrompt / shotPrompt / imageNode / storyVideo`
5. 接入协作管理 UI
6. 接入实时协作房间
7. 迁移高级节点和抽屉
8. 最后补导出和导演工作流

## 当前最值得先做的三件事

### 1. 把保存链路补齐

这是整个迁移的地基，优先级最高。

### 2. 把 `imageNode` 和 `storyVideo` 做成真正可用节点

这是用户感知最强的一步。

### 3. 把协作管理 UI 先补上

即使实时协作还没完全补齐，项目列表和详情页先具备“转协作、邀请、看成员、看日志”，业务上已经能跑起来。

## 结论

这次迁移不是“把一个 Vue 页面改写成 React 页面”，而是“把旧画布系统拆成协议层、持久化层、节点层、协作层，再逐层在 React 里重建”。

最稳的路线是：

- 后端和数据库先不动
- React 先补保存协议和高频节点
- 再接协作
- 最后迁高级节点和导演能力

如果按这个顺序推进，风险最小，也最容易在中途持续交付可用版本。
