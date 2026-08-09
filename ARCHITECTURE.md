# 围达网技术架构

## 当前技术决策

- Web：Next.js App Router、React、TypeScript strict。
- 样式：CSS Modules + 全局 CSS variables，避免工具类把视觉推向现代 Dashboard。
- 数据访问：页面只依赖 typed service，不直接读取存储；Phase 1 使用种子数据和 Route Handler，后续切 PostgreSQL/Prisma。
- 棋盘：Canvas；视图组件只负责渲染和输入映射。
- 测试：Vitest + Testing Library；规则引擎阶段增加纯函数单元测试。

## 目标边界

```text
Browser UI
  ├─ Server Components：门户数据、排行榜、棋谱列表
  ├─ Client Components：大厅筛选、匹配、棋盘、聊天
  └─ typed client service
          │ HTTP / Socket.IO
Application API
  ├─ Auth / Profile / Ranking / Records
  ├─ Matchmaking / Room lifecycle
  └─ Game gateway (server authoritative)
          │
Domain packages
  ├─ packages/go-engine
  ├─ packages/rating
  └─ packages/sgf
          │
PostgreSQL + Redis + object/log storage
```

## 路由规划

- 当前体验版：`/`、`/hall`、`/game/[id]`、`/watch/[id]`、`/match`、`/rooms`、`/ranking`、`/players/[username]`、`/games`、`/game-record/[id]`、`/settings`、`/help`、`/about`、`/announcements`。
- 账号阶段：`/login`、`/register`、`/profile`。
- 治理阶段：`/admin`。

## 服务端权威棋局

客户端只能发送意图：`PLAY_MOVE`、`PASS`、`RESIGN`、`REQUEST_UNDO`。服务端校验身份、回合、落子合法性、时钟和终局，再广播增量 `GAME_STATE`。胜负、提子和 Rating 不接受客户端直接写入。

Socket 事件预留：`JOIN_GAME`、`LEAVE_GAME`、`PLAY_MOVE`、`PASS`、`RESIGN`、`REQUEST_UNDO`、`ACCEPT_UNDO`、`DECLINE_UNDO`、`GAME_STATE`、`CLOCK_UPDATE`、`GAME_END`、`CHAT_MESSAGE`、`SPECTATOR_JOIN`、`SPECTATOR_LEAVE`、`MATCH_START`、`MATCH_FOUND`、`PLAYER_RECONNECT`、`PLAYER_DISCONNECT`。

## 数据模型

核心实体：User、Profile、Game、GamePlayer、Move、GameRecord、Room、RatingHistory、Session。社区实体：Friend、Follow、Block、Message、Notification。治理与扩展：Ban、Report、AIAnalysis、Announcement、SystemAccount。

## 安全基线

- 输出默认转义，不渲染用户 HTML；消息长度、频率和字符集在服务端复验。
- Session Cookie 采用 HttpOnly、Secure、SameSite；写操作使用 CSRF 防护。
- WebSocket 握手鉴权、事件 schema 校验、nonce/序号防重放、房间级权限校验。
- 登录和消息限流；Rating 对局审计；管理员采用独立 RBAC。
- Prisma 参数化查询；密码使用 Argon2id；日志不记录凭据和完整会话。

## AI 扩展

GameState 和 SGF 是 AI 分析的稳定输入。KataGo 通过异步分析服务接入，不侵入棋盘组件或规则引擎。系统棋手有显式账号类型；公开运营时机器人政策必须可见，机器人对局不得隐蔽操纵真人排名。
