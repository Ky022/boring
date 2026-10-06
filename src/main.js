import "./style.css";
import { portrait } from "./art.js";
import {
  heroes,
  rarities,
  fresh,
  power,
  enemyPower,
  migrate,
  applyAction,
  level,
  upgradeCost,
  gear,
  teamPower,
} from "./game.js";
import {
  cloud,
  api,
  connect,
  signIn,
  signOut,
  refreshCloud,
  mutate,
  bootCloud,
} from "./cloud.js";
const key = "astral-cards-v1";
let state = fresh(),
  tab = "summon",
  results = [],
  report = null,
  notice = "",
  storageWarning = "";
try {
  const saved = JSON.parse(localStorage.getItem(key));
  const restored = migrate(saved);
  if (restored) state = restored;
} catch {
  storageWarning = "浏览器存储不可用，进度可能无法保存。";
}
function save() {
  if (cloud.user) return;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    storageWarning = "无法保存进度，请检查浏览器存储权限。";
  }
}
const $ = document.querySelector("#app");
function card(h, compact = false) {
  return `<article class="card ${h.rarity} ${compact ? "compact" : ""}" style="--accent:${rarities[h.rarity].color}"><span class="rarity">${h.rarity}</span><span class="card-stars">${"✦".repeat({ R: 2, SR: 3, SSR: 4, UR: 5 }[h.rarity])}</span><div class="portrait">${portrait(h)}<div class="portrait-shine"></div></div><div class="card-info"><small>${h.title} · Lv.${level(state, h.id)}</small><h3>${h.name}</h3><div class="stats">⚔ ${power(state, h.id)} <span>${state.collection[h.id] ? `已拥有 ×${state.collection[h.id]}` : "未拥有"}</span></div></div></article>`;
}
let busy = false,
  socialData = { messages: [], opponents: [], history: [] },
  chatChannel = "world",
  chatError = "";
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
async function dispatch(action) {
  if (cloud.user) {
    const data = await mutate(action);
    state = data.state;
    return data.result;
  }
  const result = applyAction(state, action);
  save();
  return result;
}
async function run(task) {
  if (busy) return;
  busy = true;
  $.querySelectorAll("button").forEach((b) => (b.disabled = true));
  try {
    await task();
  } catch (e) {
    notice = e.message;
    if (e.status === 409 && cloud.user) {
      try {
        state = (await refreshCloud()).state;
      } catch {}
    }
  } finally {
    busy = false;
    render();
  }
}
function render() {
  const total = Object.keys(state.collection).length;
  $.innerHTML = `<header><a class="brand" href="#"><span>✧</span> 星辉召唤 <small>ASTRAL CHRONICLES</small></a><button class="sound-toggle" id="sound-toggle" aria-label="切换音效">${soundOn ? "♫ 音效开" : "♪ 音效关"}</button><div class="wallet">✦ <b>${state.gems.toLocaleString()}</b><span>星钻</span></div></header><main><div class="account-strip"><button data-tab="account">${cloud.user ? "☁ " + esc(cloud.user.username) + " · 云端账号" : "◉ 游客试玩 · 仅此设备"}</button><span>◈ ${state.coins.toLocaleString()} 金币</span></div><div class="eyebrow">THE STARS ARE CALLING</div><div class="heading"><div><h1>让星光，成为你的力量。</h1><p>召唤命定的伙伴，踏上未知的冒险。</p></div><div class="progress"><b>${total}<span> / ${heroes.length}</span></b><small>已收集角色</small></div></div><nav>${[
    ["summon", "✧", "召唤"],
    ["collection", "▦", "角色"],
    ["adventure", "⚔", "冒险"],
    ["social", "♜", "公会"],
    ["arena", "⚑", "竞技"],
    ["account", "☁", "账号"],
  ]
    .map(
      ([id, icon, label]) =>
        `<button class="${tab === id ? "active" : ""}" data-tab="${id}">${icon} ${label}</button>`,
    )
    .join(
      "",
    )}</nav>${storageWarning ? `<p class="notice">${storageWarning}</p>` : ""}${notice ? `<p class="notice" role="status">${esc(notice)}</p>` : ""}<section id="content">${tab === "summon" ? summonView() : tab === "collection" ? collectionView() : tab === "adventure" ? adventureView() : tab === "social" ? socialView() : tab === "arena" ? arenaView() : accountView()}</section><footer>✦ 星辉召唤 · 幻境纪元 <span>${cloud.user ? "账号存档保存在数据库" : "游客进度仅保存在浏览器"} · 无付费抽卡</span></footer></main>`;
  $.querySelector("#sound-toggle").onclick = () => {
    soundOn = !soundOn;
    render();
    if (soundOn) tone(660, 0.16);
  };
  $.querySelectorAll("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        tab = b.dataset.tab;
        notice = "";
        render();
        if (cloud.user && ["social", "arena"].includes(tab)) loadSocial();
      }),
  );
  $.querySelectorAll("[data-pull]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          results = await dispatch({ type: "summon", count: +b.dataset.pull });
          notice = `召唤完成，获得 ${results.length} 位伙伴！`;
          showSummon(results);
        })),
  );
  $.querySelectorAll("[data-team]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const id = +b.dataset.team;
          let team = state.team.includes(id)
            ? state.team.filter((x) => x !== id)
            : [...state.team, id];
          if (team.length > 3)
            throw new Error("队伍最多 3 人，请先移除一位角色");
          await dispatch({ type: "team", team });
          notice = "队伍已更新";
        })),
  );
  $.querySelectorAll("[data-stage]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          await dispatch({ type: "stage", stage: +b.dataset.stage });
          report = null;
        })),
  );
  $.querySelectorAll("[data-upgrade]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const result = await dispatch({
            type: "upgrade",
            id: +b.dataset.upgrade,
          });
          notice = `${heroes[result.id].name} 升至 Lv.${result.level}`;
        })),
  );
  $.querySelectorAll("[data-buy]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const g = await dispatch({ type: "buy", item: b.dataset.buy });
          notice = `获得装备：${g.name}`;
        })),
  );
  $.querySelectorAll("[data-equip]").forEach(
    (b) => (b.onclick = () => openEquipment(+b.dataset.equip)),
  );
  $.querySelectorAll("[data-duel]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const duel = await dispatch({
            type: "arena",
            opponent: b.dataset.duel,
          });
          notice = `${duel.won ? "竞技胜利" : "竞技落败"}：${duel.dealt} vs ${duel.target}，金币 +${duel.coins}，积分 ${duel.ratingDelta > 0 ? "+" : ""}${duel.ratingDelta}`;
          await loadSocial(false);
        })),
  );
  const fight = $.querySelector("#fight");
  if (fight)
    fight.onclick = () =>
      run(async () => {
        report = await dispatch({ type: "battle" });
        notice = `${report.won ? "挑战成功，金币 +" + report.coins : "挑战失败，再接再厉"}`;
        showBattle(report);
      });
  const next = $.querySelector("#next");
  if (next)
    next.onclick = () =>
      run(async () => {
        await dispatch({ type: "stage", stage: state.stage + 1 });
        report = null;
      });
  wireOnline();
}
function summonView() {
  return `<div class="banner"><div class="banner-copy"><div class="pill">常驻召唤 · 星之祈愿</div><h2>穿越星海<br>与你相遇</h2><p>每一道光芒，都藏着一段新的故事。<br>召唤稀有伙伴，组建你的专属队伍。</p><div class="featured-label">UR · 月光祭司 露米</div></div><div class="banner-art">${portrait(heroes[0])}<div class="art-name">LUMI <span>月光的誓约</span></div></div><div class="banner-particles"><i style="--i:0"></i><i style="--i:1"></i><i style="--i:2"></i><i style="--i:3"></i><i style="--i:4"></i><i style="--i:5"></i><i style="--i:6"></i><i style="--i:7"></i><i style="--i:8"></i><i style="--i:9"></i><i style="--i:10"></i><i style="--i:11"></i><i style="--i:12"></i><i style="--i:13"></i><i style="--i:14"></i><i style="--i:15"></i></div></div><div class="summon-controls"><div><h3>星辉召唤</h3><p>十连至少获得一位 SR 或更高角色</p></div><div class="pull-buttons"><button class="secondary" data-pull="1" ${state.gems < 150 ? "disabled" : ""}>召唤 1 次 <span>✦ 150</span></button><button class="primary" data-pull="10" ${state.gems < 1500 ? "disabled" : ""}>召唤 10 次 <span>✦ 1,500</span></button></div></div><div class="rates"><span>R <b>70%</b></span><span>SR <b>24%</b></span><span>SSR <b>5%</b></span><span>UR <b>1%</b></span><span class="pity">${state.pity} / 50 · 第 50 抽保底 SSR，SSR / UR 会重置计数</span></div>${results.length ? `<h3 class="section-title">你的召唤结果 <small>重复角色自动提升战力，最多提升 10 次</small></h3><div class="cards results">${results.map((h) => card(h, true)).join("")}</div>` : `<h3 class="section-title">星海中的伙伴 <small>等待与你相遇</small></h3><div class="cards">${[heroes[0], heroes[3], heroes[5], heroes[8]].map((h) => card(h)).join("")}</div>`}`;
}
function collectionView() {
  return `<div class="section-heading"><div><h2>伙伴与装备</h2><p>培养等级、搭配武器与饰品，组建最多三人的队伍。</p></div><span class="pill">队伍 ${state.team.length} / 3 · 战力 ${teamPower(state)}</span></div><div class="cards collection">${heroes
    .filter((h) => state.collection[h.id])
    .sort((a, b) => power(state, b.id) - power(state, a.id))
    .map(
      (h) =>
        `<div>${card(h)}<div class="hero-details"><p>${h.role} · ${h.skill}</p><div class="level-line"><b>Lv.${level(state, h.id)} / 50</b><span>战力 ${power(state, h.id)}</span></div><div class="hero-actions"><button class="secondary" data-upgrade="${h.id}" ${level(state, h.id) >= 50 || state.coins < upgradeCost(state, h.id) ? "disabled" : ""}>升级 · ◈ ${upgradeCost(state, h.id)}</button><button class="secondary" data-equip="${h.id}">装备</button></div><small>${
          Object.values(state.equipment[h.id] || {})
            .map((item) => gear.find((g) => g.id === item).name)
            .join(" · ") || "尚未装备"
        }</small></div><button class="team-button ${state.team.includes(h.id) ? "selected" : ""}" data-team="${h.id}">${state.team.includes(h.id) ? "✓ 已上阵 · 点击移除" : "+ 加入队伍"}</button></div>`,
    )
    .join(
      "",
    )}</div><h3 class="section-title">星辉装备商店 <small>金币来自关卡、公会 Boss 与竞技</small></h3><div class="gear-shop">${gear.map((g) => `<article class="gear-item" style="--accent:${rarities[g.rarity].color}"><span>${g.icon}</span><div><b>${g.name}</b><small>${g.rarity} · ${g.slot === "weapon" ? "武器" : "饰品"} · 战力 +${g.bonus} · 拥有 ${state.inventory.filter((x) => x === g.id).length}</small></div><button class="secondary" data-buy="${g.id}" ${state.coins < g.cost ? "disabled" : ""}>◈ ${g.cost}</button></article>`).join("")}</div>`;
}
function openEquipment(id) {
  const current = state.equipment[id] || {};
  const m = modal(
    `<h2>${heroes[id].name} · 装备配置</h2><p>每位角色可装备一把武器与一件饰品。</p><div class="equip-list">${[
      "weapon",
      "charm",
    ]
      .map(
        (slot) =>
          `<h3>${slot === "weapon" ? "武器" : "饰品"}</h3><button class="secondary" data-item="" data-slot="${slot}">卸下${slot === "weapon" ? "武器" : "饰品"}</button>${gear
            .filter((g) => g.slot === slot && state.inventory.includes(g.id))
            .map(
              (g) =>
                `<button class="secondary ${current[slot] === g.id ? "selected" : ""}" data-item="${g.id}" data-slot="${slot}">${g.icon} ${g.name} · +${g.bonus}${current[slot] === g.id ? " ✓" : ""}</button>`,
            )
            .join("")}`,
      )
      .join(
        "",
      )}</div><p class="equip-error" role="status"></p><button class="primary" data-close>完成</button>`,
    "角色装备",
  );
  m.dialog.classList.add("equipment-dialog");
  m.dialog.querySelectorAll("[data-item]").forEach(
    (b) =>
      (b.onclick = async () => {
        if (busy) return;
        busy = true;
        m.dialog
          .querySelectorAll("[data-item]")
          .forEach((el) => (el.disabled = true));
        try {
          await dispatch({
            type: "equip",
            id,
            item: b.dataset.item || null,
            slot: b.dataset.slot,
          });
          m.end();
          render();
          openEquipment(id);
        } catch (e) {
          m.dialog.querySelector(".equip-error").textContent = e.message;
          m.dialog
            .querySelectorAll("[data-item]")
            .forEach((el) => (el.disabled = false));
        } finally {
          busy = false;
        }
      }),
  );
}
function adventureView() {
  const strength = state.team.reduce((n, id) => n + power(state, id), 0);
  return `<div class="section-heading"><div><h2>星境远征</h2><p>首通获得 350 星钻，重复挑战获得 60 星钻。</p></div><span class="pill">已通关 ${state.cleared} / 12</span></div><div class="stages">${Array.from(
    { length: 12 },
    (_, i) => i + 1,
  )
    .map(
      (n) =>
        `<button data-stage="${n}" class="stage ${state.stage === n ? "current" : ""}" ${n > state.cleared + 1 ? "disabled" : ""}><small>CHAPTER ${String(n).padStart(2, "0")}</small><b>${["萤火森林", "月影古城", "流沙秘境", "霜雪之巅"][Math.floor((n - 1) / 3)]}</b><span>${n <= state.cleared ? "✓ 已通关" : n > state.cleared + 1 ? "🔒 未解锁" : "⚔ 等待挑战"}</span></button>`,
    )
    .join(
      "",
    )}</div><div class="battle-panel"><div><div class="eyebrow">CHAPTER ${state.stage}</div><h2>第 ${state.stage} 关 · 星境守卫</h2><p>队伍战力 <b>${strength}</b> / 敌方战力 <b>${enemyPower(state.stage)}</b></p><p>战斗为自动结算，伤害会在队伍战力的 90%–110% 之间波动。</p><div class="team-icons">${state.team.map((id) => `<span title="${heroes[id].name}">${portrait(heroes[id])}<b>${heroes[id].name}</b></span>`).join("") || "尚未选择角色"}</div></div><button id="fight" class="primary" ${!state.team.length ? "disabled" : ""}>⚔ 开始挑战</button></div>${report ? `<div class="battle-result ${report.won ? "win" : "loss"}" role="status"><h2>${report.won ? "✦ 挑战成功！" : "挑战失败"}</h2><p>造成 ${report.dealt} 点伤害 / 目标 ${report.target} 点。${report.won ? `获得 ${report.reward} 星钻、${report.coins} 金币。` : "尝试召唤更强的伙伴，或通过重复挑战积攒星钻。"}</p>${report.won && state.stage < 12 ? '<button id="next" class="secondary">前往下一关 →</button>' : ""}${report.won && state.stage === 12 ? "<p>恭喜通关全部星境！你仍然可以继续收集角色。</p>" : ""}</div>` : ""}`;
}
function accountView() {
  return `<div class="section-heading"><div><h2>旅人账号</h2><p>游客存档保留在此设备；云端账号使用独立存档，注册从初始队伍开始。</p></div><span class="pill">${cloud.user ? "☁ 云端已连接" : "本地试玩模式"}</span></div><div class="online-panel">${cloud.user ? `<h3>${esc(cloud.user.username)}</h3><p>金币、星钻、角色、装备与关卡进度保存在云端数据库。账号可在朋友手机上重新登录。请保管昵称和密码；当前没有邮件找回功能。</p><p>竞技积分 ${cloud.rating} · 存档版本 ${cloud.revision}</p><button class="secondary" id="refresh-cloud">刷新云端存档</button> <button class="secondary" id="logout">退出账号</button>` : `<div class="auth-intro"><span>☁</span><h3>把星光带到每一台设备</h3><p>${cloud.base ? "服务器已配置，注册后即可使用联网功能。" : "当前公开网站仍是游客版本。数据库上线后，连接服务器即可与朋友一起玩。"}</p></div><form id="auth-form"><label>昵称<input name="username" autocomplete="username" minlength="2" maxlength="20" required placeholder="例如：星海旅人"></label><label>密码<input name="password" type="password" autocomplete="current-password" minlength="8" maxlength="72" required placeholder="至少 8 个字符，请记好"></label><div class="hero-actions"><button class="primary" name="mode" value="login" ${!cloud.base ? "disabled" : ""}>登录</button><button class="secondary" name="mode" value="register" ${!cloud.base ? "disabled" : ""}>注册新账号</button></div></form>`}<details class="connection-settings"><summary>服务器连接设置</summary><p>这里需要已部署的游戏服务器网址。Cloudflare 网站可以直接自动连接。</p><form id="connect-form"><label>游戏服务器 HTTPS 网址<input name="endpoint" type="url" placeholder="https://astral-cards-online.你的账号.workers.dev" value="${esc(cloud.base)}" required></label><button class="secondary">连接并检查</button></form></details></div>`;
}
function loginRequired(title) {
  return `<div class="online-panel auth-intro"><span>☁</span><h2>${title}</h2><p>此功能需要云端账号和已部署的数据库。游客进度仍可继续游玩。</p><button class="primary" data-tab="account">前往账号</button></div>`;
}
function messagesHTML() {
  return socialData.messages.length
    ? socialData.messages
        .map(
          (m) =>
            `<div class="chat-message ${m.sender === cloud.user?.id ? "mine" : ""}"><div><b>${esc(m.name)}</b><time>${new Date(m.time).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</time></div><p>${esc(m.text)}</p></div>`,
        )
        .join("")
    : '<p class="chat-empty">星海安静，发出第一条消息吧。</p>';
}
function socialView() {
  if (!cloud.user) return loginRequired("公会与聊天");
  const g = cloud.guild;
  return `<div class="section-heading"><div><h2>星海公会</h2><p>分享邀请码，与朋友一起挑战守卫。</p></div><span class="pill">${g ? g.members.length + " / 30 位成员" : "尚未加入公会"}</span></div>${g ? `<div class="guild-banner"><span class="guild-crest">♜</span><div><h2>${esc(g.name)}</h2><p>邀请码 <b>${esc(g.code)}</b> <button id="copy-code" class="secondary">复制</button></p><small>所有成员的伤害共同累计，击败后立即开启下一轮。</small></div><button id="leave-guild" class="secondary">退出</button></div><div class="boss-panel"><div><small>GUILD RAID · ROUND ${g.bossRound}</small><h3>远古星渊守卫</h3><div class="hp-track"><div class="hp-fill" style="width:${(g.bossHp / g.bossMax) * 100}%"></div></div><p>${g.bossHp.toLocaleString()} / ${g.bossMax.toLocaleString()} HP</p><p>入场 100 金币 · 每次奖励 150 金币 + 20 星钻，最后一击获得 200 星钻。</p></div><button id="boss-attack" class="primary">⚔ 合作挑战</button></div><div class="member-list">${g.members.map((m) => `<div><b>${esc(m.name)} ${m.id === g.owner ? "♛" : ""}</b><span>战力 ${m.power} · 贡献 ${m.contribution}</span></div>`).join("")}</div>` : `<div class="guild-forms"><form id="create-guild"><h3>创建你的公会</h3><label>公会名称<input name="name" minlength="2" maxlength="20" required placeholder="例如：月光冒险团"></label><button class="primary">创建公会</button></form><form id="join-guild"><h3>加入朋友的公会</h3><label>8 位邀请码<input name="code" minlength="8" maxlength="8" required placeholder="输入朋友的邀请码"></label><button class="secondary">加入公会</button></form></div>`}<div class="chat-panel"><div class="chat-top"><h3>旅人聊天室</h3><div><button class="secondary ${chatChannel === "world" ? "selected" : ""}" data-channel="world">世界</button><button class="secondary ${chatChannel === "guild" ? "selected" : ""}" data-channel="guild" ${!g ? "disabled" : ""}>公会</button><button id="refresh-chat" class="secondary">刷新</button></div></div><p class="chat-status" role="status">${esc(chatError) || "每 5 秒更新 · 最多显示最近 60 条消息"}</p><div class="chat-messages" aria-live="polite">${messagesHTML()}</div><form id="chat-form"><input name="message" maxlength="300" required placeholder="和朋友说点什么…" aria-label="聊天消息" autocomplete="off"><button class="primary">发送</button></form></div>`;
}
function arenaView() {
  if (!cloud.user) return loginRequired("星辉竞技场");
  return `<div class="section-heading"><div><h2>星辉竞技场</h2><p>异步挑战其他玩家已保存的队伍；并非双方同时操作的实时对战。</p></div><span class="pill">积分 ${cloud.rating} · UTC 每日 5 次</span></div><p>当前队伍战力 ${teamPower(state)} · 今日已挑战 ${state.arenaDay === new Date().toISOString().slice(0, 10) ? state.arenaAttempts : 0} / 5 · 胜利奖励 200 金币，失败也获得 80 金币。</p><button class="secondary" id="refresh-arena">刷新对手</button><div class="arena-list">${socialData.opponents.length ? socialData.opponents.map((o) => `<article><div class="opponent-team">${o.team.map((h) => portrait(h)).join("")}</div><div><h3>${esc(o.name)}</h3><p>战力 ${o.power} · 积分 ${o.rating}</p></div><button class="primary" data-duel="${esc(o.id)}">挑战</button></article>`).join("") : "<p>暂无对手，请邀请朋友注册账号，再刷新。</p>"}</div><h3 class="section-title">最近对战</h3><div class="member-list">${socialData.history.map((h) => `<div><b>${h.won ? "胜利" : "落败"} · ${esc(h.opponent)}</b><span>${h.dealt} vs ${h.target} · 金币 +${h.coins}</span></div>`).join("") || "<p>还没有对战记录。</p>"}</div>`;
}
async function loadSocial(repaint = true) {
  if (!cloud.user) return;
  const current = tab;
  const userId = cloud.user.id;
  try {
    if (current === "social") {
      const [guild, chat] = await Promise.all([
        api("/guild"),
        api("/chat?channel=" + chatChannel),
      ]);
      if (tab !== current || cloud.user?.id !== userId || (busy && repaint))
        return;
      cloud.guild = guild.guild;
      socialData.messages = chat.messages;
      chatError = "";
    } else if (current === "arena") {
      const data = await api("/arena");
      if (tab !== current || cloud.user?.id !== userId || (busy && repaint))
        return;
      socialData.opponents = data.opponents;
      socialData.history = data.history;
    }
    if (repaint && !document.activeElement?.closest("form")) render();
  } catch (e) {
    chatError = e.message;
    notice = e.message;
    if (repaint) render();
  }
}
function wireOnline() {
  const authForm = $.querySelector("#auth-form");
  if (authForm)
    authForm.onsubmit = (e) => {
      e.preventDefault();
      const data = new FormData(authForm),
        mode = e.submitter?.value || "login";
      run(async () => {
        const result = await signIn(
          mode,
          data.get("username"),
          data.get("password"),
        );
        state = result.state;
        results = [];
        report = null;
        socialData = { messages: [], opponents: [], history: [] };
        notice =
          mode === "register" ? "账号已创建，云端存档已建立" : "已载入云端存档";
      });
    };
  const connectForm = $.querySelector("#connect-form");
  if (connectForm)
    connectForm.onsubmit = (e) => {
      e.preventDefault();
      const endpoint = new FormData(connectForm).get("endpoint");
      run(async () => {
        if (cloud.user) throw new Error("请先退出当前账号再切换服务器");
        connect(endpoint);
        await api("/health");
        notice = "数据库连接成功，可以注册或登录";
      });
    };
  const logout = $.querySelector("#logout");
  if (logout)
    logout.onclick = () =>
      run(async () => {
        await signOut();
        try {
          state = migrate(JSON.parse(localStorage.getItem(key))) || fresh();
        } catch {
          state = fresh();
        }
        results = [];
        report = null;
        notice = "已退出云端账号，返回原有游客存档";
      });
  const refresh = $.querySelector("#refresh-cloud");
  if (refresh)
    refresh.onclick = () =>
      run(async () => {
        state = (await refreshCloud()).state;
        notice = "已载入最新云端存档";
      });
  const create = $.querySelector("#create-guild");
  if (create)
    create.onsubmit = (e) => {
      e.preventDefault();
      const name = new FormData(create).get("name");
      run(async () => {
        cloud.guild = (await api("/guild/create", { name })).guild;
        notice = "公会已建立，分享邀请码给朋友";
      });
    };
  const join = $.querySelector("#join-guild");
  if (join)
    join.onsubmit = (e) => {
      e.preventDefault();
      const code = new FormData(join).get("code");
      run(async () => {
        cloud.guild = (await api("/guild/join", { code })).guild;
        notice = "已加入公会";
      });
    };
  const leave = $.querySelector("#leave-guild");
  if (leave)
    leave.onclick = () =>
      run(async () => {
        await api("/guild/leave", {});
        cloud.guild = null;
        chatChannel = "world";
        socialData.messages = [];
        await loadSocial(false);
        notice = "已退出公会";
      });
  const copy = $.querySelector("#copy-code");
  if (copy)
    copy.onclick = async () => {
      try {
        await navigator.clipboard.writeText(cloud.guild.code);
        notice = "邀请码已复制";
      } catch {
        notice = "邀请码：" + cloud.guild.code;
      }
      render();
    };
  const attack = $.querySelector("#boss-attack");
  if (attack)
    attack.onclick = () =>
      run(async () => {
        const result = await dispatch({ type: "boss" });
        notice = `造成 ${result.damage} 点伤害！${result.defeated ? "守卫击败，新一轮已开启。" : ""}获得 ${result.reward} 星钻、150 金币`;
      });
  $.querySelectorAll("[data-channel]").forEach(
    (b) =>
      (b.onclick = () => {
        chatChannel = b.dataset.channel;
        socialData.messages = [];
        render();
        loadSocial();
      }),
  );
  const chat = $.querySelector("#chat-form");
  if (chat)
    chat.onsubmit = (e) => {
      e.preventDefault();
      const text = new FormData(chat).get("message");
      run(async () => {
        const result = await api("/chat", { channel: chatChannel, text });
        socialData.messages = result.messages;
        chatError = "";
        notice = "";
      });
    };
  for (const id of ["refresh-chat", "refresh-arena"]) {
    const button = $.querySelector("#" + id);
    if (button) button.onclick = () => loadSocial();
  }
}
setInterval(async () => {
  if (!cloud.user || tab !== "social" || busy || document.hidden) return;
  try {
    const channel = chatChannel;
    const userId = cloud.user.id;
    const [data, guildData] = await Promise.all([
      api("/chat?channel=" + channel),
      api("/guild"),
    ]);
    if (
      tab === "social" &&
      chatChannel === channel &&
      cloud.user?.id === userId &&
      !busy
    ) {
      const g = guildData.guild;
      cloud.guild = g;
      if (g) {
        const boss = $.querySelector(".boss-panel");
        if (boss) {
          boss.querySelector(".hp-fill").style.width =
            (g.bossHp / g.bossMax) * 100 + "%";
          boss.querySelector("p").textContent =
            g.bossHp.toLocaleString() +
            " / " +
            g.bossMax.toLocaleString() +
            " HP";
          boss.querySelector("small").textContent =
            "GUILD RAID · ROUND " + g.bossRound;
        }
        const members = $.querySelector(".member-list");
        if (members)
          members.innerHTML = g.members
            .map(
              (m) =>
                `<div><b>${esc(m.name)} ${m.id === g.owner ? "♛" : ""}</b><span>战力 ${m.power} · 贡献 ${m.contribution}</span></div>`,
            )
            .join("");
        const count = $.querySelector(".section-heading .pill");
        if (count) count.textContent = g.members.length + " / 30 位成员";
      }
      socialData.messages = data.messages;
      const node = $.querySelector(".chat-messages");
      if (node) {
        const bottom =
          node.scrollHeight - node.scrollTop - node.clientHeight < 45;
        node.innerHTML = messagesHTML();
        if (bottom) node.scrollTop = node.scrollHeight;
      }
      const status = $.querySelector(".chat-status");
      if (status) status.textContent = "每 5 秒更新 · 最多显示最近 60 条消息";
    }
  } catch (e) {
    const status = $.querySelector(".chat-status");
    if (status) status.textContent = e.message;
  }
}, 5000);
let soundOn = false,
  audio;
function tone(freq, duration = 0.15) {
  if (!soundOn) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const osc = audio.createOscillator(),
      gain = audio.createGain();
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    osc.start();
    osc.stop(audio.currentTime + duration);
  } catch {}
}
function modal(content, label) {
  const dialog = document.createElement("dialog");
  dialog.className = "cinematic";
  dialog.setAttribute("aria-label", label);
  dialog.innerHTML = content;
  document.body.append(dialog);
  const timers = [];
  let closed = false;
  const end = () => {
    if (closed) return;
    closed = true;
    timers.forEach(clearTimeout);
    dialog.close();
    dialog.remove();
  };
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    end();
  });
  dialog.querySelector("[data-close]").onclick = end;
  dialog.showModal();
  const after = (fn, ms) =>
    timers.push(
      setTimeout(() => {
        if (!closed) fn();
      }, ms),
    );
  return { dialog, after, end };
}
function showSummon(pulls) {
  const best = pulls.reduce((a, b) =>
    ({ R: 0, SR: 1, SSR: 2, UR: 3 })[a.rarity] >
    { R: 0, SR: 1, SSR: 2, UR: 3 }[b.rarity]
      ? a
      : b,
  );
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const m = modal(
    `<div class="summon-cinema" style="--accent:${rarities[best.rarity].color}"><div class="cinema-heading"><small>STELLAR SUMMON</small><h2>星门已开启</h2><p>光芒之中，命运与你相遇</p></div><div class="summon-gate"><div class="gate-ring"></div><div class="gate-core">✧</div></div><div class="reveal-grid ${pulls.length === 1 ? "single" : ""}">${pulls.map((h, i) => `<button class="reveal-slot" data-reveal="${i}" aria-label="揭晓第 ${i + 1} 张卡牌"><div class="card-back"><span>✧</span><small>ASTRAL</small></div><div class="card-front">${card(h, true)}</div></button>`).join("")}</div><div class="cinema-actions"><button class="secondary" data-all>全部揭晓</button><button class="primary" data-close>收下伙伴</button></div></div>`,
    "召唤结果",
  );
  const reveal = (i) => {
    const el = m.dialog.querySelector(`[data-reveal="${i}"]`);
    if (el.classList.contains("revealed")) return;
    el.classList.add("revealed");
    tone({ R: 440, SR: 550, SSR: 740, UR: 880 }[pulls[i].rarity], 0.24);
  };
  m.dialog
    .querySelectorAll("[data-reveal]")
    .forEach((el) => (el.onclick = () => reveal(+el.dataset.reveal)));
  m.dialog.querySelector("[data-all]").onclick = () =>
    pulls.forEach((_, i) => reveal(i));
  pulls.forEach((_, i) =>
    m.after(() => reveal(i), reduced ? 0 : 650 + i * 180),
  );
}
function showBattle(outcome) {
  const team = state.team.map((id) => heroes[id]);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const m = modal(
    `<div class="battle-cinema"><div class="cinema-heading"><small>CHAPTER ${state.stage} · 星境远征</small><h2>命运交锋</h2></div><div class="combat-arena"><div class="combat-party">${team.map((h, i) => `<div class="combat-hero" data-attacker="${i}">${portrait(h)}<b>${h.name}</b></div>`).join("")}</div><div class="combat-vs">VS</div><div class="combat-enemy">${portrait(heroes[1], true)}<b>星境守卫</b><div class="hp-track"><div class="hp-fill"></div></div><small class="hp-text">${outcome.target} / ${outcome.target}</small><div class="damage-number"></div></div><div class="slash"></div></div><p class="combat-log" role="status">伙伴们已做好准备……</p><div class="combat-outcome" hidden><h2>${outcome.won ? "VICTORY" : "DEFEAT"}</h2><p>${outcome.won ? `星境突破 · 获得 ${outcome.reward} 星钻` : "未能突破守卫 · 强化伙伴，再次出发"}</p></div><button class="primary" data-close>返回冒险</button></div>`,
    "战斗演出",
  );
  const hit = (i) => {
    const damage =
      Math.round((outcome.dealt * (i + 1)) / team.length) -
      Math.round((outcome.dealt * i) / team.length);
    const remaining = Math.max(
      0,
      outcome.target - Math.round((outcome.dealt * (i + 1)) / team.length),
    );
    const el = m.dialog.querySelector(`[data-attacker="${i}"]`);
    el.classList.add("attacking");
    const enemy = m.dialog.querySelector(".combat-enemy");
    enemy.classList.remove("hit");
    void enemy.offsetWidth;
    enemy.classList.add("hit");
    const num = m.dialog.querySelector(".damage-number");
    num.textContent = "−" + damage;
    num.classList.remove("pop");
    void num.offsetWidth;
    num.classList.add("pop");
    m.dialog.querySelector(".hp-fill").style.width =
      (remaining / outcome.target) * 100 + "%";
    m.dialog.querySelector(".hp-text").textContent =
      remaining + " / " + outcome.target;
    m.dialog.querySelector(".combat-log").textContent =
      team[i].name + "发动星辉一击，造成 " + damage + " 点伤害！";
    tone(180 + i * 80, 0.2);
  };
  team.forEach((_, i) => m.after(() => hit(i), reduced ? 0 : 500 + i * 650));
  m.after(
    () => {
      m.dialog.querySelector(".combat-outcome").hidden = false;
      m.dialog
        .querySelector(".combat-outcome")
        .classList.add(outcome.won ? "victory" : "defeat");
      m.dialog.querySelector(".combat-log").textContent = outcome.won
        ? "所有伙伴凯旋归来。"
        : "守卫依然屹立，新的力量正在等待你。";
      tone(outcome.won ? 880 : 160, 0.4);
    },
    reduced ? 0 : 600 + team.length * 650,
  );
}
render();

bootCloud()
  .then((data) => {
    if (data) {
      state = data.state;
      render();
    }
  })
  .catch((e) => {
    notice = "云端连接失败：" + e.message;
    render();
  });
