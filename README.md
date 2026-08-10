# 围达网

参考 2000 年代中文围棋客户端视觉、面向现代浏览器实现的在线围棋社区。

当前版本：`0.8.0` 终局怀旧强化版。

```bash
npm install
npm run dev
```

在线地址：<https://hanazar-games.github.io/Go/>

- `/`：围棋门户首页、实时统计、热门棋局和排行榜
- `/hall`：玩家/房间列表、筛选、创建房间和快速匹配
- `/game/[id]`、`/watch/[id]`：Canvas 对弈与观战
- `/players/[username]`：棋手资料与最近棋谱
- `/games`、`/game-record/[id]`、`/ranking`：棋谱和排行
- `/settings`：怀旧画质、建房偏好、BGM 与操作音效
- `/announcements`：当前版本公告和历史公告

当前对局为前端体验流程，支持建房参数带入、房主执黑、合法落子、提子、禁自杀、简单劫、Pass、认输、本地悔棋、主时与读秒、超时判负、死子整组标记、终局确认、恢复行棋、聊天和 SGF 下载。多人死子协商、账号与实时同步将在后续服务端阶段接入。

GitHub Pages 只托管静态前端。创建房间、匹配和聊天保留为本次浏览的本地体验，不会写入仓库或服务器。后端可在后续独立部署并接入。

```bash
npm run lint
npm run test
npm run build
```

`npm run build` 会将可部署文件输出到 `out/`。推送 `main` 后，GitHub Actions 会自动部署 Pages；仓库 Settings → Pages 的 Source 需选择 **GitHub Actions**。

视觉研究和后续架构见 `REFERENCE_UI_ANALYSIS.md`、`ARCHITECTURE.md`、`IMPLEMENTATION_PLAN.md`。
