# 上线联网版本

目前 GitHub Pages 只提供静态前端。Cloudflare Workers 同时提供网页与 API，D1 提供持久数据库。正式联网后端尚未部署；本地数据库与测试账号不属于生产环境。

## 手机准备

在 https://dash.cloudflare.com/sign-up 注册免费 Cloudflare 账号。无需使用公司电脑，也无需先购买域名。

如果由 Codex 云环境代为部署，需要允许该环境访问 `dash.cloudflare.com`（登录）和 `api.cloudflare.com`（部署与数据库）。相关规则可在环境设置中保存。保存草稿不自动应用网络或发布应用。

推荐使用手机完成官方设备授权，无需在聊天中传送密码或 API Token。运行以下命令后，打开 Wrangler 返回的官方 Cloudflare 授权链接并确认；链接和代码会过期，必须使用当次生成的链接。

```sh
npx wrangler login --device --browser=false
npx wrangler whoami
```

若使用 API Token，应通过云环境的安全设置注入 `CLOUDFLARE_API_TOKEN`；按该账号限定 Workers Scripts Edit 与 D1 Edit 权限，不能写进仓库、公开前端或聊天。`CLOUDFLARE_ACCOUNT_ID` 仅在多账号选择等场景需要。

## 部署

从项目根目录执行：

```sh
npm ci
npm test
npm run deploy:online
```

固定的 Wrangler 4.147.0 支持在部署时为没有 `database_id` 的 DB 绑定自动配置资源。`wrangler.jsonc` 使用数据库名 `astral-cards`、绑定 `DB`、迁移目录 `server/migrations`。首次部署命令完成 Worker 上传后继续执行远程迁移；**迁移成功之前不能宣布应用上线**。不能使用 `--temporary` 预览账号代替需要长期保存数据的正式账号。

命令输出一个真实的 `https://astral-cards-online.<账号子域>.workers.dev` 地址。测试该地址：

1. `/api/health` 返回 HTTP 200、`ok: true` 和 `storage: Cloudflare D1`。
2. 用两个手机或独立浏览器账号注册；创建公会，另一人凭邀请码加入。
3. 发送公会消息，确认另一人收到；共同攻击 Boss，检查双方的血量一致。
4. 升级并装备角色，关闭浏览器后重新登录，确认进度保留。
5. 挑战朋友已保存的队伍，确认竞技记录与每日次数更新。

好友只需使用同一个 Worker 网址并注册各自的游戏账号。Workers 自带域名会自动连接同源 API。

如果仍希望从现有 GitHub Pages 打开，把真实 Worker 根网址放进 `public/online-config.json` 的 `apiBase`，执行 `npm run build:pages` 并提交生成的 `docs` 文件。CORS 已允许 `https://ky022.github.io`；若换前端域名，明确修改 `ALLOWED_ORIGIN`，不要放开到所有来源。

## 持久性和备份

D1 位于 Cloudflare 账号中，Worker 重启和前端刷新不会清空数据库。不要删除或重建生产 D1，也不要把本地测试库上传覆盖生产账号。

使用 Cloudflare 控制台的 D1 Time Travel 能力，并按需导出管理员备份：

```sh
npx wrangler d1 export DB --remote --output /安全目录/astral-backup.sql
```

导出包含玩家消息、账号密码摘要与会话摘要，是私有管理员备份，不能提交到公开仓库或发布到 `docs`。平台免费额度和恢复保留期以该账号控制台为准，不保证无限请求或永久备份。

后续结构变更添加新的编号迁移；不要修改已经在生产执行过的 `0001.sql`。更新先测试，再运行远程迁移和部署。
