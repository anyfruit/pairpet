# PairPet (微信小程序 MVP)

双人绑定共同养宠物的小程序 MVP。  
用户通过任务打卡提升亲密值，触发宠物成长（等级/阶段/心情变化）。

## 当前完成进度

- Phase 0：项目初始化、页面骨架、mock 数据
- Phase 1：云开发接入、用户初始化、邀请码绑定
- Phase 2：任务创建与按日期任务列表
- Phase 3：任务打卡、幂等防重复、共同任务 bonus、亲密值与宠物成长闭环
- Phase 4：Dashboard 首页聚合展示（作品展示主页面）

## 技术栈

- 微信小程序原生（WXML/WXSS/JS）
- 微信云开发（CloudBase）
- 云函数（Node.js 18）
- 云数据库集合（users/pairs/pets/tasks/task_logs/intimacy_logs）

## 主要功能

- 双人绑定：
  - 生成邀请码
  - 邀请码绑定
  - 防止绑定自己、重复绑定
- 任务系统：
  - 创建自定义任务（共同/个人、每日/一次性、基础分与 bonus）
  - 按今天日期查看任务状态
- 打卡与积分：
  - 完成任务写入 `task_logs`
  - 基础加分写入 `intimacy_logs`
  - 共同任务双方都完成时触发 bonus（且只触发一次）
  - 幂等保护：同用户+同任务+同日不可重复计分
- 宠物成长：
  - `exp` 与亲密值 1:1 增长
  - 每 20 exp 升 1 级
  - stage：`egg(1-2)` / `baby(3-5)` / `grow(6+)`
- Dashboard 首页：
  - 宠物卡片（等级/阶段/心情/exp 进度）
  - 总亲密值
  - 今日任务完成进度
  - 今日共同任务双方状态
  - 未绑定/无任务空态引导

## 云函数列表

- `initUser`
- `generateInviteCode`
- `bindPair`
- `createTask`
- `getTasksByDate`
- `completeTask`
- `getDashboard`
- `devSetupSoloPair`（开发辅助，可删除）

## 本地运行与云开发配置

1. 用微信开发者工具导入项目根目录。
2. 绑定云开发环境（与 `app.js` 中环境 ID 保持一致）。
3. 创建数据库集合：
   - `users`
   - `pairs`
   - `pets`
   - `tasks`
   - `task_logs`
   - `intimacy_logs`
4. 集合权限建议（当前架构）：
   - `仅创建者可读写`
   - 前端不直连数据库，统一走云函数
5. 部署云函数：
   - 在 `cloudfunctions` 下逐个右键函数目录
   - 选择“创建并部署（云端安装依赖）”或“所有文件”
6. 清缓存并编译。

## MVP 演示流程

### 双人真实流程

1. A 账号进入绑定页生成邀请码
2. B 账号输入邀请码完成绑定
3. 创建任务（个人/共同）
4. 任务页打卡
5. 回首页观察：
   - 今日进度变化
   - 亲密值变化
   - 宠物 exp/level/stage/mood 变化

### 单人开发流程（无第二账号）

1. 进入绑定页
2. 点击“开发：单人建立可测试绑定”
3. 创建任务并打卡
4. 在首页验证亲密值和宠物成长

> `devSetupSoloPair` 仅用于开发测试，发布前可删除。

## 目录结构（核心）

- `pages/`：页面（home/tasks/task-create/pair/profile）
- `services/`：页面调用服务层（cloud/task/dashboard）
- `cloudfunctions/`：云函数核心逻辑
- `types/`：类型定义
- `utils/`：工具函数（如 `dateKey`）
- `constants/`：常量（如宠物展示文案）

## 已知说明

- 当前为 MVP，视觉样式保持简洁。
- 打卡、积分、bonus、成长计算均在云函数侧，前端不做积分计算。
- `task_logs` 与 `intimacy_logs` 为后续做排行榜/连续打卡/日历视图预留。