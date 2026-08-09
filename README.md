# 围达网

参考 2000 年代中文围棋客户端视觉、面向现代浏览器实现的在线围棋社区。

当前版本：`0.3.0` 怀旧体验版。

```bash
npm install
npm run dev
```

- `/`：围棋门户首页、实时统计、热门棋局和排行榜
- `/hall`：玩家/房间列表、筛选、创建房间和快速匹配
- `/game/[id]`、`/watch/[id]`：Canvas 对弈与观战
- `/players/[username]`：棋手资料与最近棋谱
- `/games`、`/game-record/[id]`、`/ranking`：棋谱和排行
- `/settings`：怀旧画质、建房偏好、BGM 与操作音效
- `/announcements`：当前版本公告和历史公告

当前对局为前端体验流程，支持落子、Pass、认输、聊天和 SGF 下载；气、提子、劫、终局数目、账号与实时同步将在后续阶段接入。

```bash
npm run lint
npm run test
npm run build
```

视觉研究和后续架构见 `REFERENCE_UI_ANALYSIS.md`、`ARCHITECTURE.md`、`IMPLEMENTATION_PLAN.md`。
