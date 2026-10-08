# 星辉小队 · 像素冒险

原创像素主城与六人回合战斗的手机浏览器卡牌游戏：R / SR / SSR / UR 抽卡、十二章、36 关主线与精英冒险、38 位原创像素伙伴、升星、六部位独立装备、日常副本、福利与邮件、每日委托、三十层试炼塔、公会与竞技。前端为 JavaScript + Vite，联网后端为 Cloudflare Workers + D1。

## 当前可用范围

- GitHub Pages：游客抽卡、关卡、等级、装备、不同角色造型和战斗演出。游客进度保存在当前浏览器。
- 正式 Worker 已部署到 https://astral-cards-online.astral-cards.workers.dev ，D1 数据库保存账号进度，迁移保留已有玩家数据。公网健康接口已通过 HTTPS 验证。
- 联网版本包含：昵称/密码账号、持久存档、世界与公会聊天、公会邀请码、共同攻击 Boss、异步竞技场。朋友通过同一服务器网址登录各自账号。
- 竞技场挑战对手已保存的队伍，不是双方同步操作的实时战斗。

## 本地开发

云端提供 Node.js 24。项目固定 Vite 7.3.1、Wrangler 4.147.0。

```sh
npm ci --cache /workspace/.npm-cache
npm test
npm run build
npm run db:local
npm run dev:online
```

在限制用户目录写入的云环境中，先设置工具目录：

```sh
export XDG_CONFIG_HOME=/workspace/.config
export XDG_CACHE_HOME=/workspace/.cache
export WRANGLER_LOG_PATH=/workspace/.wrangler-logs
export WRANGLER_SEND_METRICS=false
```

`dev:online` 在 8787 端口运行真实本地 Workers 和 D1，网页自动连接同源后端。数据库保留在忽略的 `.wrangler/state`，进程重启不会重置。`npm run dev` 运行独立前端游客模式。

## 全屏手机界面

主城使用三个原创卡通浮空岛区域，可触控左右滑动、点击位置指示或使用方向键，默认停在中央广场。顶部资源与底部导航固定，浏览器页面不整体滚动；角色头像列表、地图与其他面板独立滚动。英雄展示、召唤与战斗占据游戏屏幕，养成、阵容与工坊独立切换，任务和挂机奖励从主城面板打开。支持设备安全区域；浏览器支持时可点击右上角全屏按钮。全屏布局不要求浏览器必须提供隐藏地址栏的系统全屏能力。

## 美术与养成改版

- 英雄列表采用浅色四列竖向卡牌，展示完整像素角色、属性、实际星级、等级和上阵/助战状态；可切换已拥有英雄与 38 位英雄图鉴，按属性和职业筛选。点击卡牌进入独立全屏详情，以原创大立绘呈现角色，并保留对应像素小人、真实战力/基础生命/暴击、四个技能说明入口、培养与六部位装备入口。返回列表保留浏览位置。全部 38 位英雄使用独立 1024×1536 高清立绘，详情不再放大多人拼图的小格。成年角色可采用成熟性感服装，学徒保持普通冒险装。主城、阵容与战斗始终使用像素角色；支持系统减少动态效果。角色 ID 与已有养成存档保持不变，无外部图片依赖。
- 六个独立站位（包括空位）可点击替换、交换或卸下，卸下不会挤动其他站位，底部选择面板提供职业筛选、等级、战力与已上阵标记。推荐阵容优先选择骑士和治疗，再补强力输出。
- 主线成功后自动选中下一未通关关卡，刷新与重新登录保持该选择；也能手动选择旧关重打。
- 六部位装备为武器、衣服、头盔、裤子、鞋子、饰品。每件有独立编号、品质、强化等级、套装和锁定状态，穿戴占用独立检查。旧同名装备按份转换，并继承原强化等级与战力，不重复迁移。
- 装备最高 +10，强化花费目标等级 ×100 金币与目标等级数量的强化石。基础新装备 +6 战力，各品质再 +9，每强化 +3；旧装备保留原数值及每级 +6。武器提高攻击，衣服/头盔/裤子提高生命，鞋子提高暴击，饰品提高治疗。套装：焰羽两件攻击 +8%，月泉两件治疗 +15%，坚岩两件生命 +12%、四件护盾 +20%。
- 装备可比较替换战力、单件锁定/分解或批量分解未穿戴、未锁定、未强化的普通装备。一键穿戴仅调整指定英雄或当前队伍，保护其他英雄装备。
- 冒险分为主线、日常副本、试炼塔三个入口。金币、经验、装备、材料四种副本，各每日三次成功奖励；难度二/三需通关六/十二关，先通关对应难度才能扫荡，失败不消耗奖励次数。
- 福利有七日连续签到、每日免费补给、新手七日任务、成就及一键领取邮件/成长奖励。新手任务逐日开放，并要求实际完成。系统欢迎邮件三十天到期，附件一次领取；无需新增玩家表或清库。
- 召唤券使用同一抽卡概率与保底，不扣星钻。经验药剂每瓶提升两级，技能培养最高五次，每次技能强度 +6%；三星解锁职业被动。主线掉落材料与装备，技能切入和受击特效可跳过或遵从减少动态效果。
- 状态保留版本 2，并添加 `edition:1` 兼容字段；Cloudflare D1 玩家 JSON 在下一次有效操作中持久化迁移，不覆盖旧收藏和关卡。

## 其他已实现玩法

- 每位英雄有独立技能配置与说明，包含灼烧、吸血、复活、净化、持续恢复、追击、反击、破盾等效果。
- 三位同阵营英雄增加攻击与生命 10%，五位增加 20%；借用英雄也参与阵营计算。
- 十二章共 36 关，章节 Boss 有反击、吸血、护盾、冰冻、灼烧与恢复机制。精英模式需先通关对应主线，敌方战力为普通的 1.5 倍；首次奖励 150 星钻与 600 + 关卡 ×20 金币，重复奖励 20 星钻与 180 + 关卡 ×10 金币。
- 战斗支持 ×1 / ×2 / ×4、跳过演出、伤害/治疗/护盾/承伤统计与失败建议；速度仅改变播放，不能改变服务器结果或奖励。
- 一键穿戴为当前队伍按顺序分配最佳可用六部位装备，保留未上阵角色的装备；可保存三套命名阵容。角色支持按战力、等级、星级和稀有度排序及职业筛选，升星展示前后战力。
- 好友申请需对方接受，可拒绝、取消或移除。每人最多 50 个好友与申请；好友双方只能看到各自列表。英雄详情可指定支援角色，默认第一位上阵英雄。
- 每天可借用三次好友英雄用于主线、精英或试炼塔。未满六人则追加，满六人替换最后一位；支援战力最多为自己最强上阵英雄的 1.5 倍。借用不改变收藏与永久阵容。次数由服务器按 UTC 日计算，竞技与公会 Boss 不可借用。
- 公会周任务共同累计 3,000 伤害、十次挑战与击败一轮 Boss，分别奖励 150/150/300 星钻与 500/500/800 金币。周一 UTC 零点（马来西亚早上 8 点）刷新；本周在该公会参与过至少一次 Boss 挑战的成员可领奖，每人每任务每周仅一次，换公会也不能重复领取。

## 游戏规则

- 共 38 位伙伴：6 UR、9 SSR、11 SR、12 R，旧角色编号与已拥有的角色保持不变。初始三位 R 角色、3,000 星钻、1,000 金币。
- 单抽 150 星钻；十连 1,500，至少一位 SR 或更高。
- 基础概率 R 70%、SR 24%、SSR 5%、UR 1%。第 50 抽至少 SSR；SSR / UR 重置保底。
- 重复角色最多十次，每次 +8 战力；每升一级 +5 战力。等级上限 50，升级费用为当前等级 ×100 金币。
- 重复角色可用于五星突破；第 n 星消耗 n 位重复角色与 n×500 金币，保留最后一位，每星 +60 基础战力。
- 六部位装备独立强化，规则见美术与养成改版；原装备按份迁移并保留原强化效果。
- 每日签到获得 150 星钻、300 金币；召唤、战斗、升级委托各可领奖一次，UTC 零点刷新（马来西亚早上 8 点）。三十层试炼塔逐层一次性奖励。
- 每位角色有六个装备栏，每件装备只供一位角色使用，可卸下转移。
- 关卡首通奖励 350 星钻、350 金币；重复通关奖励 60 星钻、120 金币。
- 最多六人上阵，双方自动回合战斗。每三回合释放职业技能：治疗、法师群攻、战士强击；骑士减伤并为队友提供护盾、游侠技能优先攻击后排、法师有机会束缚敌人。火克风、风克水、水克火，光暗互克，克制伤害 +25%。六个独立站位分别保存前后三格，可点击换人或交换，空位保留。最多二十回合，击败全部敌人才能获胜。像素人物、血条、暴击与治疗特效、抽卡翻牌、音效和减少动态效果均支持。
- 挂机收益最多累积八小时，每分钟金币为 5 + 已通关数 ×2，每五分钟一颗星钻。联网账号的领奖时间由服务器校验。
- 公会最多 30 人，邀请码 8 位。聊天每 5 秒轮询，最近 60 条，每条最多 300 字符。
- 公会 Boss 挑战入场 100 金币，奖励 150 金币与 20 星钻；最后一击奖励 200 星钻。所有成员共享血量，每次击败后立即开始更强的一轮。
- 异步竞技 UTC 每日 5 次（马来西亚时间早上 8 点刷新）。胜利 +200 金币、+15 积分，失败 +80 金币、−8 积分。

## 账号与存档

旧版 `astral-cards-v1` 游客存档会自动迁移到新结构并保留已有收藏、星钻、队伍与关卡。云端账号使用独立的新存档，**不会上传游客数据覆盖服务器**；退出后回到原游客存档。

线上玩家状态只能通过服务器校验的操作修改，抽卡与战斗随机数由服务器生成。操作有存档版本校验和请求编号去重，防止并发覆盖、重复扣款和重复领奖。密码使用随机盐 PBKDF2-SHA256 100,000 次派生，登录令牌仅以摘要保存在 D1。会话有效七天，退出会撤销该会话。接口限制操作频率，公会聊天要求成员身份，所有玩家文字以文本显示。

清除浏览器数据后，云端账号可以用昵称/密码恢复进度；游客数据不能恢复。游戏邮箱用于系统奖励，当前没有绑定登录邮箱或密码找回，请记好账号密码。数据库持续保存不等于永远不会丢失；应保留 D1 Time Travel 与定期导出备份，不能删除生产数据库后期待进度自动恢复。

## 公网部署

详见 [Cloudflare 部署步骤](DEPLOYMENT.md)。需要 Cloudflare 免费账号和部署授权，免费方案受平台额度限制。当前不要求付费功能，也不加入充值。

GitHub Pages 更新：

```sh
npm run build:pages
```

生成 `docs/index.html`、`docs/online-config.json` 与 `docs/art`，提交推送到 `main`，Pages 从 `/docs` 自动部署。联网服务器上线后，将 `public/online-config.json` 中的 `apiBase` 设置为真实 Worker HTTPS 根网址，再运行 `build:pages`。这些是公开连接地址，不能填密码或管理员令牌。

## 验证

`npm test` 覆盖旧存档迁移、抽卡与保底、装备占用、升级、账号隔离、并发操作、请求去重、私有公会聊天、合作 Boss、竞技次数限制和退出会话。测试后端使用 Node SQLite 适配 D1 接口；同时另行完成真实 Wrangler/D1 双浏览器测试。外部浏览器检查脚本保留在云端 `/workspace/card-game-ui-check/check-revamp.mjs` 与 `check-revamp-online.mjs`（外部验证辅助文件，不保证新环境保留）。

## 全屏世界界面

主城采用三个可左右滑动的原创卡通浮空岛区域，以独立建筑作为功能入口，常用福利、邮箱、任务与挂机入口分列两侧。底部五个导航使用原创彩色游戏图标。主线地图使用原创森林场景，布阵和战斗使用浅色卡通庭院与像素角色、像素敌人。英雄列表和详情保留独立美术布局。阵容页展示双方前后排战位和真实战力，下方五列英雄卡牌标记已上阵角色，可按属性、职业筛选，换人、卸下并直接挑战当前关卡；装备背包与基础商店分开，背包可按部位、品质筛选。福利和邮箱显示图标奖励，公会分页查看 Boss、每周任务和成员，聊天拥有独立消息区域。

本次更新仅调整客户端界面与原画，继续使用原有账号、存档和生产 D1 数据库。

### 手机界面与召唤券

全页面使用 `src/soft-ui.css` 的浅色、低装饰样式，英雄高清立绘与像素战斗角色分开显示。阵容页长按英雄约 0.2 秒后拖动：拖到站位上阵或交换，从站位拖回英雄库卸下。直接点击站位和英雄仍然可用；英雄库空隙与文字区域可上下滚动。

召唤页分别提供券单抽、券十连和星钻单抽、十连。券十连消耗 10 张召唤券，不扣星钻，与星钻十连共用 SR 保底、50 抽 SSR 保底及每日抽卡进度。召唤券不足 10 张时券十连禁用，服务端也校验数量。

### 整体体验调整

`src/journey.js` 提供从存档推导的成长目标、英雄定位、队伍搭配提示与新角色识别，不新增或重置存档字段。主城目标可以直接跳转至阵容、培养或副本。十二章有十二个不同首领；第三章之后的普通敌人随章节变化。破盾先于技能攻击生效，灼烧中的敌人受到收割技能时额外提高 20% 技能伤害；净化可以消除灼烧。

全部页面由 `src/journey-ui.css` 统一触摸反馈与轻幻想配色。角色高清立绘继续使用现有独立原图，像素小人用于列表、抽卡结果、阵容和战斗。装备显示属性与战力替换差值、当前套装激活状态。十连结果标明新英雄与重复角色，可直接进入最稀有角色培养页。

### 远征篇 V3

手机营地、召唤与主线采用新布局；其余系统共用独立的绿色营地主题。左右滑动街区，阵容支持拖入、换位及拖回列表下阵。

- 每日遗迹远征：六场连续战斗、生命继承、途中祝福、三种难度，通关 12 / 24 关解锁高难度。主题与奖励次数在 UTC 00:00（马来西亚 08:00）刷新，各难度共用一次领奖机会；可无奖励重试练习。
- 主线评级：胜利、全员存活、8 回合内各一星。三星关卡可每日扫荡共 10 次，每次花费 50 金币获取强化石与经验，不产出星钻或召唤券。章节首次收集奖励独立记录。
- 招募心愿：最多三名 SSR / UR，同稀有度出现时 50% 取自心愿列表；原稀有度概率与保底不变。重复角色获得碎片，SSR 80 / UR 250 碎片可指定兑换。召唤券支持一次及十次使用。
- 培养重置按本版本记录的金币、技能书、药剂准确返还，旧存档等级及技能作为保留基线；星级与装备保留。自动装备优先职业对应套装，同时考虑品质和强化战力。

新增数据位于现有存档 JSON 的 `odyssey` 字段，由服务端原有事务、请求去重及版本检查保存；无需重建 D1 或清除旧账号。单元与 API 检查覆盖迁移、返还、防重复领奖、远征健康继承和云端恢复。

### 伙伴营地 V4

- 界面统一为奶油白与灰蓝主题；英雄保留高清立绘及像素战斗形象。营地伙伴在有限区域走动、停留，点击显示职业对话并进入详情；详情支持横向滑动切换英雄。轻量模式保存在设备上，关闭环境动画并直接结算战斗播放。
- 装备工作区围绕角色显示六部位，支持在同页比较、穿戴和强化。阵容站位可直接拖动换位；列表卡角的拖动柄直接拾起，卡片本体仍可滚动与点选。
- 每场远征可选标准小路、精英哨站（敌方强度 +25%，最终结算额外金币和碎片）或泉水（恢复15%生命，敌方 +10%）。泉水每场只能选择一次，路线附加奖励仍共用每日一次结算。
- 每周挑战共五层，周一马来西亚早上8点重置挑战进度并轮换护盾、冰霜、灼烧规则，失败可重试。首领在半血以下进入攻击 +15% 的第二阶段；主线第三章起的 Boss 同样适用。
- 公会 Boss 使用实际阵容模拟像素战斗，轮次变化护盾、控制和灼烧机制。每账号每日最多5次，伤害转换为共同血量贡献；服务端仍原子保存贡献、奖励与轮次。竞技场优先展示战力、积分接近的玩家。
- 已完成日常任务支持一键领取。未确认云端操作保存原请求 ID，重连或重启后以原 ID 核对，再载入最新存档，避免响应丢失造成重复消费。账号提供轻量模式与保存反馈。

此版本继续使用原数据库和账号，无 SQL 表结构迁移。自动检查覆盖路线防重复恢复、每周轮换与奖励、Boss阶段、每日公会次数、旧存档校验及服务端请求去重。

### Core presentation update (V5)

Cultivation now uses separate level, skill and breakthrough workspaces with real resource costs, five-level previews, cap-aware batch leveling, dungeon resource links and recorded refund previews. Batch upgrades validate the complete cost before changing the save. Equipment replacement previews use actual character power. Initial companions 8–10 have frame-based pixel idle, walking, attack and recovery artwork; the other characters retain their existing sprites. Combat adds a one-round boss skill warning and contribution highlights computed from actual battle statistics. Existing saves and D1 schemas remain compatible.

Visual references: official App Store screenshots and descriptions for Pixel Heroes, AFK Arena, NIKKE and Mobile Legends Adventure; these are presentation references, not a verified current ranking or complete in-game walkthrough.

### V6 mobile UI release

All game screens now share a restrained forest/paper presentation. Camp destinations occupy less of the world; hero details use the entire screen with readable names; cultivation tools are secondary; equipment has six pixel item icons and empty-slot acquisition links. Battles have a live party portrait/health strip and a full-height encounter field. Campaign, summon, dungeons, rewards, guild, chat, friends, arena and account use matching controls and typography. See `UI-REDESIGN.md` for coverage and validation. Existing saves and database schemas are retained; no reward or cultivation balance changes are introduced in this UI release.

### V7 original art and combat presentation

The central camp now uses original pixel environment artwork with functional building shortcuts. Hero skills use an original twelve-icon atlas mapped to role and element. Static card poses are consistent with the original hero atlas; timed action frames begin at the first pose. Combat plays contiguous area effects together and adds travelling role effects, on-target healing/shields and lower-contrast backgrounds. Cultivation includes computed basic-life improvement previews. All existing saves and the database schema remain unchanged. Level sharing and expanded endgame mechanics are not part of this release.

### V8 refinement

Existing features are polished without new systems: stable original pixel sprites replace prototype action-sheet switching, attacks land before health/damage feedback, grouped skills play one sound, and skipping prevents pending hits from changing the final result. Cultivation retains its tab; equipment highlights its selected slot and guards enhancement costs. Phone layouts and touch surfaces are simplified. Saves, combat balance and reward rules are retained.

### V9 cute pixel presentation

The approved camp concept is implemented as a playable scene with separate building controls, companions and an adventure button. Original camp scenery, a twelve-icon atlas and a forty-cell chibi atlas replace the central environment and small hero sprites. Camp, summon, hero collection, cultivation, workshop, formation, campaign, combat, rewards and social screens share warm wood/paper controls with turquoise primary actions. Existing full-size hero portraits are retained. Assets are included in both the Worker build and standalone GitHub Pages build.

Validation: 88 domain tests; mobile interaction checks at 320×568 and 390×844 including ten-ticket summons, three formation drag operations, equipment, rewards and combat; impact timing, mid-flight skip and retained cultivation selection checks. Existing saves, database schema, rewards and combat balance are unchanged.

### V10 visual corrections

Rebuilt the hero atlas and measured the 40 individual opaque character bounds. Every small hero now has an explicit clip and a unique SVG clip ID, including equipment overlays, preventing adjacent sprites and duplicate-ID clipping artifacts. Camp companions occupy two separated rows with modest motion. Hero portrait artwork starts below the complete name/identity/star header, the main HUD hides during hero details, and the resource/action row uses a non-overlapping flex layout. Collections use three larger cards per row. Enemies and combat party indicators use matching cute pixel artwork. Existing full-size hero illustrations, saves, schema and game balance are retained.

Validation: 88 domain tests; mobile operation and combat regression checks at 320×568 and 390×844; geometry checks for separated camp touch targets, all 38 collection sprites, portrait/header separation and equipment clips; manual screenshots of camp, summon, collection, hero detail, growth, equipment, formation, campaign and battle.

### V11 endgame content

Adventure now includes an independent 36-stage Hard campaign and 36-stage Nightmare campaign, unlocked by clearing Normal and Hard respectively. Twelve chapter bosses rotate guard/counter, control/chain, burn/drain and pursuit/shield-break mechanics with mixed enemy roles and healing support. Nightmare bosses require victory within 12 rounds with at least three surviving heroes. First-clear rewards pay once; campaign difficulty progress never changes the selected Normal stage.

Weekly Random Relics unlock after chapter four: nine encounters, seeded enemy formations, three selectable routes, persistent per-hero health, and a combat boon after encounters three and six. Runs can restart after defeat or completion, but each node and weekly completion pay only once per week. Weekly progress resets Monday 08:00 Malaysia time; titles, cosmetics and campaigns remain. The previous five-floor weekly trial remains accessible from the relic page.

Eight Collection Trials check the actual selected team for faction, profession or rarity restrictions, including survival and speed objectives. First clears grant titles and three cosmetic avatar frames. Equip cosmetics in Collection Trials; they display in the player HUD and do not affect power. All state uses the existing authoritative JSON transaction and request deduplication; no database schema migration or save wipe is required.

Validation: 105 domain/API tests including unlock gates, first-clear and weekly reward deduplication, conditional victories, deterministic encounter seeds, real combat boon effects, legacy migration and server request replay/relogin. Phone checks at 320×568 and 390×844 cover challenge combat, cosmetic equip, three relic encounters, boon selection, reload, errors and overflow; original ten-ticket summons and three formation drag operations also pass.

### V12 coherent pixel presentation and team guidance

Camp, summon, hero details, cultivation, equipment, formation, adventure and combat share a restrained cream/forest palette with fewer ornate frames. Main hero displays now use the same original cute pixel characters as formation and combat; original illustration assets remain available in the repository. Hero profiles and cultivation show actual skill roles, suggested equipment sets and complementary partners. The camp has readable goals and separated companion touch targets.

Formation has visible quick recommendation and removal controls alongside drag-and-drop. Recommendations run through the authoritative action handler, include front-line and healing roles, and prefer trained shield-break or cleanse heroes when appropriate to the selected Normal campaign enemy. Short teams place rear-line heroes in rear slots. Battle results explain observed control, burn, shield absorption and casualties and provide direct formation/cultivation links. This is heuristic guidance, not an optimal-team solver. Existing rewards, save schema and combat balance are retained.

Validation: 109 domain/API tests, including recommendation validity, trained counter selection, actual-effect hero guidance and evidence-based battle advice. Both 320×568 and 390×844 phone checks cover ten-ticket summons, three formation drag operations and all principal screens.
