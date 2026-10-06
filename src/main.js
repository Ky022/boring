import "./style.css";
import { portrait, sprite, scenery, monster } from "./pixel.js";
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
  idleReward,
  starCost,
  dailyTasks,
  dailyState,
  chapters,
  maxStage,
  stageEnemies,
  formationBonuses,
  combatTeam,
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
  tab = "home",
  rosterFilter = "全部",
  rosterSort = "power",
  rosterRole = "全部",
  chapterPage = null,
  selectedFriend = "",
  friendsList = [],
  results = [],
  report = null,
  notice = "",
  storageWarning = "";
try {
  const saved = JSON.parse(localStorage.getItem(key));
  const restored = migrate(saved);
  if (restored) {
    state = restored;
    if (saved.idleClaimAt === undefined)
      localStorage.setItem(key, JSON.stringify(state));
  }
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
  return `<article class="card ${h.rarity} ${compact ? "compact" : ""}" style="--accent:${rarities[h.rarity].color}"><span class="rarity">${h.rarity}</span><span class="card-stars">${"★".repeat(state.stars?.[h.id] || 0) || "✦".repeat({ R: 2, SR: 3, SSR: 4, UR: 5 }[h.rarity])}</span><div class="portrait" data-detail="${h.id}" tabindex="0" role="button" aria-label="查看${h.name}详情">${portrait(h)}<div class="portrait-shine"></div></div><div class="card-info"><small>${h.title} · ${h.element} · Lv.${level(state, h.id)}</small><h3>${h.name}</h3><div class="stats">⚔ ${power(state, h.id)} <span>${state.collection[h.id] ? `已拥有 ×${state.collection[h.id]}` : "未拥有"}</span></div></div></article>`;
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
    if (selectedFriend && ["battle", "elite", "tower"].includes(action.type))
      action = { ...action, supportFriend: selectedFriend };
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
  $.innerHTML = `<header><a class="brand" href="#"><span>✧</span> 星辉小队 <small>PIXEL CHRONICLES</small></a><button class="sound-toggle" id="sound-toggle" aria-label="切换音效">${soundOn ? "♫ 音效开" : "♪ 音效关"}</button><div class="wallet">✦ <b>${state.gems.toLocaleString()}</b><span>星钻</span></div></header><main><div class="account-strip"><button data-tab="account">${cloud.user ? "☁ " + esc(cloud.user.username) + " · 云端账号" : "◉ 游客试玩 · 仅此设备"}</button><span>◈ ${state.coins.toLocaleString()} 金币</span></div><div class="eyebrow">PIXEL ADVENTURE · 像素冒险纪元</div><div class="heading"><div><h1>星辉小队</h1><p>每一位伙伴，都有自己的冒险故事。</p></div><div class="progress"><b>${total}<span> / ${heroes.length}</span></b><small>已收集角色</small></div></div><nav>${[
    ["home", "⌂", "主城"],
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
    )}</nav>${storageWarning ? `<p class="notice">${storageWarning}</p>` : ""}${notice ? `<p class="notice" role="status">${esc(notice)}</p>` : ""}<section id="content">${tab === "home" ? homeView() : tab === "summon" ? summonView() : tab === "collection" ? collectionView() : tab === "adventure" ? adventureView() : tab === "social" ? socialView() : tab === "arena" ? arenaView() : accountView()}</section><footer>✦ 星辉召唤 · 幻境纪元 <span>${cloud.user ? "账号存档保存在数据库" : "游客进度仅保存在浏览器"} · 无付费抽卡</span></footer></main>`;
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
        if (cloud.user && ["social", "arena", "adventure"].includes(tab))
          loadSocial();
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
          if (team.length > 6)
            throw new Error("队伍最多 6 人，请先移除一位角色");
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
          chapterPage = Math.floor((state.stage - 1) / 3);
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
          showBattle(duel);
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
        chapterPage = Math.floor((state.stage - 1) / 3);
        report = null;
      });
  $.querySelectorAll("[data-detail]").forEach((b) => {
    b.onclick = () => openHero(+b.dataset.detail);
    b.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openHero(+b.dataset.detail);
      }
    };
  });
  $.querySelectorAll("[data-filter]").forEach(
    (b) =>
      (b.onclick = () => {
        rosterFilter = b.dataset.filter;
        render();
      }),
  );
  $.querySelectorAll("[data-task]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const r = await dispatch({ type: "daily", task: b.dataset.task });
          notice = `领取成功：✦${r.gems} ◈${r.coins}`;
        })),
  );
  $.querySelectorAll("[data-forge]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const r = await dispatch({ type: "forge", item: b.dataset.forge });
          notice = `${r.name} 强化至 +${r.level}`;
        })),
  );
  $.querySelectorAll("[data-move]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const team = [...state.team],
            index = team.indexOf(+b.dataset.move),
            next = index + Number(b.dataset.direction);
          if (next < 0 || next >= team.length) return;
          [team[index], team[next]] = [team[next], team[index]];
          await dispatch({ type: "team", team });
          notice = "阵容顺序已调整：前三位前排，后三位后排";
        })),
  );
  const towerButton = $.querySelector("[data-tower]");
  if (towerButton)
    towerButton.onclick = () =>
      run(async () => {
        const r = await dispatch({ type: "tower" });
        notice = r.won
          ? `星灯塔第 ${r.floor} 层通关，✦${r.reward} ◈${r.coins}`
          : "星灯塔挑战失败，培养阵容后再战";
        showBattle(r);
      });
  const equipAll = $.querySelector("[data-auto-equip]");
  if (equipAll)
    equipAll.onclick = () =>
      run(async () => {
        const r = await dispatch({ type: "autoEquip" });
        notice = `一键装备完成，队伍战力 ${r.power}`;
      });
  $.querySelectorAll("[data-preset-form]").forEach(
    (form) =>
      (form.onsubmit = (e) => {
        e.preventDefault();
        run(async () => {
          const r = await dispatch({
            type: "presetSave",
            slot: Number(form.dataset.presetForm),
            name: new FormData(form).get("name"),
          });
          notice = `已保存 ${r.name}`;
        });
      }),
  );
  $.querySelectorAll("[data-preset-load]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const r = await dispatch({
            type: "presetLoad",
            slot: Number(b.dataset.presetLoad),
          });
          notice = `已切换到 ${r.name}`;
        })),
  );
  for (const [selector, key] of [
    ["#roster-sort", "sort"],
    ["#roster-role", "role"],
  ]) {
    const el = $.querySelector(selector);
    if (el)
      el.onchange = () => {
        if (key === "sort") rosterSort = el.value;
        else rosterRole = el.value;
        render();
      };
  }
  const chapterSelect = $.querySelector("#chapter-select");
  if (chapterSelect)
    chapterSelect.onchange = () => {
      chapterPage = Number(chapterSelect.value);
      render();
    };
  const supportSelect = $.querySelector("#support-select");
  if (supportSelect)
    supportSelect.onchange = () => {
      selectedFriend = supportSelect.value;
    };
  const elite = $.querySelector("[data-elite]");
  if (elite)
    elite.onclick = () =>
      run(async () => {
        const r = await dispatch({ type: "elite" });
        notice = r.won
          ? `精英通关：✦${r.reward} ◈${r.coins}`
          : "精英挑战失败，请查看战斗建议";
        showBattle(r);
      });
  $.querySelectorAll("[data-share-hero]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          await dispatch({
            type: "shareHero",
            id: Number(b.dataset.shareHero),
          });
          notice = "已更新好友支援英雄";
        })),
  );
  const friendForm = $.querySelector("#friend-form");
  if (friendForm)
    friendForm.onsubmit = (e) => {
      e.preventDefault();
      const username = new FormData(friendForm).get("username");
      run(async () => {
        friendsList = (await api("/friends/request", { username })).friends;
        notice = "好友申请已发送，对方接受后可以借用英雄";
      });
    };
  $.querySelectorAll("[data-friend-action]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const r = await api("/friends/" + b.dataset.friendAction, {
            id: b.dataset.friendId,
          });
          friendsList = r.friends;
          if (
            !friendsList.some(
              (f) => f.id === selectedFriend && f.status === "accepted",
            )
          )
            selectedFriend = "";
          notice =
            b.dataset.friendAction === "accept"
              ? "已成为好友"
              : "好友或申请已移除";
        })),
  );
  const refreshFriends = $.querySelector("[data-refresh-friends]");
  if (refreshFriends)
    refreshFriends.onclick = () =>
      run(async () => {
        friendsList = (await api("/friends")).friends;
        notice = "好友列表已刷新";
      });
  $.querySelectorAll("[data-weekly-claim]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const r = await dispatch({
            type: "guildClaim",
            task: b.dataset.weeklyClaim,
          });
          notice = `合作奖励：✦${r.reward} ◈${r.coins}`;
        })),
  );
  const idleButton = $.querySelector("#claim-idle");
  if (idleButton)
    idleButton.onclick = () =>
      run(async () => {
        const reward = await dispatch({ type: "idle" });
        notice = `放置收益已领取：金币 +${reward.coins}，星钻 +${reward.gems}`;
      });
  wireOnline();
}
function homeView() {
  const idle = idleReward(state);
  const night = new Date().getHours() < 7 || new Date().getHours() >= 19;
  return `<div class="town-view"><div class="town-title"><span>✦</span><div><small>CHAPTER ${String(state.stage).padStart(2, "0")}</small><h2>星灯镇 · 冒险者集结</h2></div><span class="weather">${night ? "☾ 夜" : "☀ 晴"}</span></div><div class="town-world">${scenery(night ? "town-night" : "town")}<button class="town-building guild" data-tab="social">♜ 公会大厅</button><button class="town-building portal" data-tab="summon">✧ 召唤圣殿</button><button class="town-building forge" data-tab="collection">⚒ 英雄工坊</button><div class="town-party">${state.team.map((id, i) => `<div class="town-unit" style="--unit:${i}">${sprite(heroes[id])}<span>${heroes[id].name}</span></div>`).join("")}</div><div class="world-firefly f1"></div><div class="world-firefly f2"></div><div class="world-firefly f3"></div></div><div class="town-quest"><div><small>MAIN QUEST · 主线冒险</small><h3>第 ${state.stage} 关 · ${chapters[Math.floor((state.stage - 1) / 3)]}</h3><p>首次通关 ✦350 + ◈350 · 你的战力 ${teamPower(state)}</p></div><button class="primary" data-tab="adventure">开始冒险 →</button></div></div><div class="idle-panel"><span class="pixel-chest">▣</span><div><h3>冒险者的放置宝箱</h3><p>◈ <b id="idle-coins">${idle.coins}</b> · ✦ <b id="idle-gems">${idle.gems}</b><small>随通关提升收益 · 最多积累 8 小时</small></p></div><button class="primary" id="claim-idle" ${idle.minutes < 1 ? "disabled" : ""}>领取</button></div>${dailyView()}<div class="home-shortcuts">${[
    ["summon", "✧", "英雄召唤", "召唤新的伙伴"],
    ["collection", "⚔", "英雄成长", "升级与装备"],
    ["social", "♜", "公会远征", "与朋友共战"],
    ["arena", "⚑", "竞技对决", "挑战玩家阵容"],
  ]
    .map(
      ([id, icon, name, text]) =>
        `<button data-tab="${id}"><span>${icon}</span><b>${name}</b><small>${text}</small></button>`,
    )
    .join(
      "",
    )}</div><div class="section-heading"><div><h2>出战阵容</h2><p>六人小队 · 点击阵容位置前往英雄编成</p></div><span class="pill">⚔ ${teamPower(state)}</span></div><div class="formation-board">${Array.from(
    { length: 6 },
    (_, i) => {
      const h = heroes[state.team[i]];
      return `<button data-tab="collection" class="formation-slot ${h ? "occupied" : ""}" style="--accent:${h ? rarities[h.rarity].color : "#9e987d"}"><small>${i < 3 ? "前排" : "后排"} ${(i % 3) + 1}</small>${h ? sprite(h) : '<span class="empty-slot">＋</span>'}<b>${h ? h.name : "等待伙伴"}</b><span>${h ? "Lv." + level(state, h.id) + " · " + h.rarity : "点击编成"}</span></button>`;
    },
  ).join("")}</div>`;
}
function summonView() {
  return `<div class="banner"><div class="banner-copy"><div class="pill">常驻召唤 · 星之祈愿</div><h2>穿越星海<br>与你相遇</h2><p>每一道光芒，都藏着一段新的故事。<br>召唤稀有伙伴，组建你的专属队伍。</p><div class="featured-label">UR · 月光祭司 露米</div></div><div class="banner-art">${portrait(heroes[0])}<div class="art-name">LUMI <span>月光的誓约</span></div></div><div class="banner-particles"><i style="--i:0"></i><i style="--i:1"></i><i style="--i:2"></i><i style="--i:3"></i><i style="--i:4"></i><i style="--i:5"></i><i style="--i:6"></i><i style="--i:7"></i><i style="--i:8"></i><i style="--i:9"></i><i style="--i:10"></i><i style="--i:11"></i><i style="--i:12"></i><i style="--i:13"></i><i style="--i:14"></i><i style="--i:15"></i></div></div><div class="summon-controls"><div><h3>星辉召唤</h3><p>十连至少获得一位 SR 或更高角色</p></div><div class="pull-buttons"><button class="secondary" data-pull="1" ${state.gems < 150 ? "disabled" : ""}>召唤 1 次 <span>✦ 150</span></button><button class="primary" data-pull="10" ${state.gems < 1500 ? "disabled" : ""}>召唤 10 次 <span>✦ 1,500</span></button></div></div><div class="rates"><span>R <b>70%</b></span><span>SR <b>24%</b></span><span>SSR <b>5%</b></span><span>UR <b>1%</b></span><span class="pity">${state.pity} / 50 · 第 50 抽保底 SSR，SSR / UR 会重置计数</span></div>${results.length ? `<h3 class="section-title">你的召唤结果 <small>重复角色可用于升星 · 共 38 位原创伙伴</small></h3><div class="cards results">${results.map((h) => card(h, true)).join("")}</div>` : `<h3 class="section-title">星海中的伙伴 <small>等待与你相遇</small></h3><div class="cards">${heroes.map((h) => card(h)).join("")}</div>`}`;
}
function heroSortValue(h) {
  return rosterSort === "level"
    ? level(state, h.id)
    : rosterSort === "stars"
      ? state.stars[h.id] || 0
      : rosterSort === "rarity"
        ? { R: 1, SR: 2, SSR: 3, UR: 4 }[h.rarity]
        : power(state, h.id);
}
function synergyView() {
  const b = formationBonuses(combatTeam(state));
  return `<div class="synergy-panel"><b>阵营共鸣</b><p>${b.length ? b.map((s) => `${s.faction} ${s.count}人 · 攻击与生命 +${s.bonus * 100}%`).join(" / ") : "同阵营三人 +10% 攻击与生命，五人 +20%。可在英雄详情查看阵营。"}</p></div>`;
}
function presetView() {
  return `<section class="preset-board"><div class="section-heading"><h3>小队方案</h3><button class="primary" data-auto-equip ${!state.team.length ? "disabled" : ""}>一键装备</button></div>${synergyView()}<p>按阵容顺序分配最佳空闲装备，保留未上阵角色的装备。</p><div class="preset-grid">${[0, 1, 2].map((i) => `<form data-preset-form="${i}"><input name="name" maxlength="12" aria-label="阵容 ${i + 1} 名称" value="${esc(state.presets?.[i]?.name || "阵容 " + (i + 1))}"><small>${state.presets?.[i]?.team.map((id) => heroes[id].name).join(" · ") || "空的阵容槽"}</small><div><button class="secondary" type="submit" ${!state.team.length ? "disabled" : ""}>保存当前阵容</button><button class="secondary" type="button" data-preset-load="${i}" ${!state.presets?.[i] ? "disabled" : ""}>切换</button></div></form>`).join("")}</div></section>`;
}
function collectionView() {
  return `<div class="section-heading"><div><h2>伙伴与装备</h2><p>38 位伙伴 · 升星、装备强化与属性搭配。</p></div><span class="pill">队伍 ${state.team.length} / 6 · 战力 ${teamPower(state)}</span></div>${presetView()}<div class="roster-tools"><label>排序<select id="roster-sort">${[
    ["power", "战力"],
    ["level", "等级"],
    ["stars", "星级"],
    ["rarity", "稀有度"],
  ]
    .map(
      ([v, n]) =>
        `<option value="${v}" ${v === rosterSort ? "selected" : ""}>${n}</option>`,
    )
    .join(
      "",
    )}</select></label><label>职业<select id="roster-role">${["全部", "骑士", "战士", "游侠", "法师", "治疗"].map((v) => `<option ${v === rosterRole ? "selected" : ""}>${v}</option>`).join("")}</select></label></div><div class="roster-filters">${["全部", "R", "SR", "SSR", "UR"].map((r) => `<button data-filter="${r}" class="secondary ${rosterFilter === r ? "selected" : ""}">${r}</button>`).join("")}</div><div class="cards collection">${heroes
    .filter(
      (h) =>
        state.collection[h.id] &&
        (rosterFilter === "全部" || h.rarity === rosterFilter) &&
        (rosterRole === "全部" || h.role === rosterRole),
    )
    .sort((a, b) => heroSortValue(b) - heroSortValue(a) || a.id - b.id)
    .map(
      (h) =>
        `<div>${card(h)}<div class="hero-details"><p>${h.element}属性 · ${h.role} · ${h.skill}</p><div class="level-line"><b>Lv.${level(state, h.id)} / 50</b><span>战力 ${power(state, h.id)}</span></div><div class="hero-actions"><button class="secondary" data-upgrade="${h.id}" ${level(state, h.id) >= 50 || state.coins < upgradeCost(state, h.id) ? "disabled" : ""}>升级 · ◈ ${upgradeCost(state, h.id)}</button><button class="secondary" data-equip="${h.id}">装备</button><button class="secondary" data-detail="${h.id}">详情 / 升星</button></div><small>${
          Object.values(state.equipment[h.id] || {})
            .map((item) => gear.find((g) => g.id === item).name)
            .join(" · ") || "尚未装备"
        }</small></div><button class="team-button ${state.team.includes(h.id) ? "selected" : ""}" data-team="${h.id}">${state.team.includes(h.id) ? "✓ 已上阵 · 点击移除" : "+ 加入队伍"}</button>${state.team.includes(h.id) ? `<div class="formation-move"><button class="secondary" data-move="${h.id}" data-direction="-1">← 前移</button><button class="secondary" data-move="${h.id}" data-direction="1">后移 →</button></div>` : ""}</div>`,
    )
    .join(
      "",
    )}</div><h3 class="section-title">星辉装备商店 <small>金币来自关卡、公会 Boss 与竞技</small></h3><div class="gear-shop">${gear.map((g) => `<article class="gear-item" style="--accent:${rarities[g.rarity].color}"><span>${g.icon}</span><div><b>${g.name}</b><small>${g.rarity} · ${g.slot === "weapon" ? "武器" : "饰品"} · 战力 +${g.bonus + (state.forge?.[g.id] || 0) * 6} · 强化 +${state.forge?.[g.id] || 0} · 拥有 ${state.inventory.filter((x) => x === g.id).length}</small></div><button class="secondary" data-buy="${g.id}" ${state.coins < g.cost ? "disabled" : ""}>购买 ◈ ${g.cost}</button>${state.inventory.includes(g.id) ? `<button class="secondary" data-forge="${g.id}" ${(state.forge?.[g.id] || 0) >= 10 ? "disabled" : ""}>强化 ◈ ${((state.forge?.[g.id] || 0) + 1) * 200}</button>` : ""}</article>`).join("")}</div>`;
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
function supportView() {
  if (!cloud.user)
    return `<div class="support-picker"><p>登录账号可添加好友，每天借用支援英雄三次。</p><button class="secondary" data-tab="account">登录</button></div>`;
  const remaining =
    state.supportDay === new Date().toISOString().slice(0, 10)
      ? 3 - state.supportUses
      : 3;
  if (
    remaining === 0 ||
    !friendsList.some((f) => f.id === selectedFriend && f.status === "accepted")
  )
    selectedFriend = "";
  return `<div class="support-picker"><label>好友支援 · 今日剩余 ${remaining} 次<select id="support-select" ${remaining === 0 ? "disabled" : ""}><option value="">使用自己的队伍</option>${friendsList
    .filter((f) => f.status === "accepted")
    .map(
      (f) =>
        `<option value="${esc(f.id)}" ${selectedFriend === f.id ? "selected" : ""}>${esc(f.name)} · ${esc(f.support.name)}</option>`,
    )
    .join(
      "",
    )}</select></label><p>未满六人则加入，满六人替换最后一位；战力上限为自己最强英雄的 1.5 倍。可用于主线、精英与试炼塔。</p><button class="secondary" data-tab="social">管理好友</button></div>`;
}
function adventureView() {
  const page = chapterPage ?? Math.floor((state.stage - 1) / 3),
    strength = teamPower(state),
    enemies = stageEnemies(state.stage),
    boss = state.stage % 3 === 0;
  return `<div class="section-heading"><div><h2>星境远征</h2><p>十二章 · 36 关主线与精英挑战</p></div><span class="pill">已通关 ${state.cleared} / ${maxStage}</span></div><label class="chapter-picker">章节地图<select id="chapter-select">${chapters.map((c, i) => `<option value="${i}" ${page === i ? "selected" : ""} ${i * 3 > state.cleared ? "disabled" : ""}>${i + 1}. ${c} ${state.cleared >= i * 3 + 3 ? "✓" : ""}</option>`).join("")}</select></label><div class="chapter-map">${scenery(page % 3 === 1 ? "night" : "forest")}<div class="stages">${[page * 3 + 1, page * 3 + 2, page * 3 + 3].map((n) => `<button data-stage="${n}" class="stage ${state.stage === n ? "current" : ""}" ${n > state.cleared + 1 ? "disabled" : ""}><small>CHAPTER ${String(n).padStart(2, "0")}</small><b>${n % 3 === 0 ? "♛ 章节 Boss" : "⚔ 第 " + n + " 关"}</b><span>${n <= state.cleared ? "✓ 已通关" : n > state.cleared + 1 ? "🔒 未解锁" : "等待挑战"}</span></button>`).join("")}</div></div>${synergyView()}${supportView()}<div class="battle-panel"><div><div class="eyebrow">CHAPTER ${state.stage}</div><h2>第 ${state.stage} 关 · ${boss ? enemies[0].name : chapters[Math.floor((state.stage - 1) / 3)]}</h2><p>队伍战力 <b>${strength}</b> / 敌方战力 <b>${enemyPower(state.stage)}</b></p><p>${boss ? enemies[0].hint : "第三回合释放专属技能；火克风、风克水、水克火，光暗互克。前排保护输出，六人阵容可激活阵营共鸣。"}</p><div class="team-icons">${state.team.map((id) => `<span>${portrait(heroes[id])}<b>${heroes[id].name}</b></span>`).join("") || "尚未选择角色"}</div></div><button id="fight" class="primary" ${!state.team.length ? "disabled" : ""}>⚔ 开始挑战</button></div><div class="elite-panel"><div><h3>精英远征 · 第 ${state.stage} 关</h3><p>敌人战力 ×1.5 · 首通 ✦150 ◈${600 + state.stage * 20}</p><small>${state.eliteCleared?.includes(state.stage) ? "已首通，重复挑战奖励较少" : "需要先通关对应主线"}</small></div><button class="secondary" data-elite ${state.stage > state.cleared || !state.team.length ? "disabled" : ""}>挑战精英</button></div><div class="tower-panel"><div><h2>星灯试炼塔</h2><p>已通关 ${state.tower || 0} / 30 层 · 每层奖励只可领取一次</p></div><button class="primary" data-tower ${!state.team.length || (state.tower || 0) >= 30 ? "disabled" : ""}>挑战第 ${Math.min(30, (state.tower || 0) + 1)} 层</button></div>${report ? `<div class="battle-result ${report.won ? "win" : "loss"}" role="status"><h2>${report.won ? "✦ 挑战成功！" : "挑战失败"}</h2><p>造成 ${report.dealt} 点伤害。${report.won ? "获得 " + report.reward + " 星钻、" + report.coins + " 金币。" : (report.tips || []).map(esc).join(" ")}</p>${report.won && state.stage < maxStage ? '<button id="next" class="secondary">前往下一关 →</button>' : ""}${report.won && state.stage === maxStage ? "<p>恭喜通关十二章星境！继续挑战精英、试炼塔与公会远征。</p>" : ""}</div>` : ""}`;
}
function dailyView() {
  const d = dailyState(state);
  return `<section class="daily-board"><div class="section-heading"><div><h2>冒险委托</h2><p>每日早上 8 点刷新 · 马来西亚时间</p></div><button class="primary" data-task="signin" ${d.signed ? "disabled" : ""}>${d.signed ? "✓ 已签到" : "签到 ✦150"}</button></div>${dailyTasks.map((t) => `<div class="daily-task"><div><b>${t.name}</b><small>${Math.min(d[t.key], t.goal)} / ${t.goal} · ✦${t.gems} ◈${t.coins}</small><progress value="${Math.min(d[t.key], t.goal)}" max="${t.goal}"></progress></div><button class="secondary" data-task="${t.id}" ${d.claimed.includes(t.id) || d[t.key] < t.goal ? "disabled" : ""}>${d.claimed.includes(t.id) ? "已领取" : "领取"}</button></div>`).join("")}</section>`;
}
function openHero(id) {
  const h = heroes[id],
    owned = !!state.collection[id],
    cost = starCost(state, id),
    stars = state.stars?.[id] || 0;
  const roles = {
    骑士: "前排减伤，技能为全队增加护盾。",
    法师: "技能攻击所有敌人，有机会控制前排。",
    游侠: "技能优先攻击敌方后排。",
    治疗: "技能恢复生命比例最低的伙伴。",
    战士: "技能造成强力单体伤害。",
  };
  const before = power(state, id),
    preview = structuredClone(state);
  preview.stars[id] = stars + 1;
  preview.collection[id] = Math.max(
    1,
    (state.collection[id] || 1) - cost.copies,
  );
  const after = power(preview, id);
  const m = modal(
    `<div class="hero-profile" style="--accent:${rarities[h.rarity].color}">${portrait(h)}<span class="pill">${h.rarity} · ${h.element} · ${h.role} · ${h.faction}</span><h2>${h.name} · ${h.title}</h2><p>${h.story}</p><h3>${h.skill}</h3><p>${roles[h.role]}</p><p class="skill-description">${h.skillDescription}</p><div class="profile-stats"><b>Lv.${level(state, id)}</b><b>⚔ ${power(state, id)}</b><b>${"★".repeat(stars) || "未升星"}</b></div><h3>升星突破 ${stars} / 5</h3>${owned && stars < 5 ? `<div class="growth-preview">⚔ ${before} → <b>${after}</b> <span>+${after - before}</span></div>` : ""}<p>每星 +60 基础战力，扣除重复角色后仍会提升战力。${owned ? `剩余 ${state.collection[id] - 1} 位重复角色` : "尚未招募"}</p><button class="primary" data-star ${!owned || stars >= 5 || state.collection[id] <= cost.copies || state.coins < cost.coins ? "disabled" : ""}>${stars >= 5 ? "已达五星" : `升星 · 重复 ${cost.copies} 位 + ◈${cost.coins}`}</button>${owned && cloud.user ? `<button class="secondary" data-profile-share>${state.supportHero === id ? "✓ 已设为好友支援" : "设为好友支援"}</button>` : ""}<p class="profile-status" role="status"></p><button class="secondary" data-close>返回</button></div>`,
    "英雄详情",
  );
  const share = m.dialog.querySelector("[data-profile-share]");
  if (share)
    share.onclick = async () => {
      if (busy) return;
      busy = true;
      try {
        await dispatch({ type: "shareHero", id });
        share.textContent = "✓ 已设为好友支援";
      } catch (e) {
        m.dialog.querySelector(".profile-status").textContent = e.message;
      } finally {
        busy = false;
      }
    };
  m.dialog.querySelector("[data-star]").onclick = async () => {
    if (busy) return;
    busy = true;
    try {
      const r = await dispatch({ type: "star", id });
      m.end();
      render();
      openHero(id);
      notice = `${h.name} 升至 ${r.stars} 星，战力 +${r.gain}`;
    } catch (e) {
      m.dialog.querySelector(".profile-status").textContent = e.message;
    } finally {
      busy = false;
    }
  };
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
function friendsView() {
  return `<section class="friends-panel"><div class="section-heading"><div><h2>冒险好友</h2><p>最多 50 位好友与申请 · 接受后开放英雄支援</p></div><button class="secondary" data-refresh-friends>刷新</button></div><form id="friend-form"><input name="username" minlength="2" maxlength="20" required placeholder="输入朋友的游戏昵称" aria-label="好友昵称"><button class="primary">添加好友</button></form><div class="friends-list">${friendsList.map((f) => `<article class="friend-card"><div class="friend-portrait">${portrait(f.support)}</div><div><b>${esc(f.name)}</b><small>${f.status === "accepted" ? "好友 · 战力 " + f.power : f.incoming ? "收到好友申请" : "等待对方接受"}</small><p>支援 ${esc(f.support.name)} · Lv.${f.support.level}</p><div>${f.status === "pending" && f.incoming ? `<button class="primary" data-friend-action="accept" data-friend-id="${esc(f.id)}">接受</button>` : ""}<button class="secondary" data-friend-action="remove" data-friend-id="${esc(f.id)}">${f.status === "accepted" ? "移除" : f.incoming ? "拒绝" : "取消申请"}</button></div></div></article>`).join("") || "<p>还没有好友，输入昵称向朋友发送申请。</p>"}</div></section>`;
}
function weeklyView(g) {
  const w = g.weekly;
  if (!w) return "";
  return `<section class="weekly-panel"><h3>公会每周委托</h3><p>周一早上 8 点刷新 · 本周参与一次 Boss 挑战后可领奖</p><div class="weekly-tasks">${w.tasks.map((t) => `<div class="daily-task"><div><b>${esc(t.name)}</b><small>${Math.min(t.progress, t.goal).toLocaleString()} / ${t.goal.toLocaleString()} · ✦${t.gems} ◈${t.coins}</small><progress value="${Math.min(t.progress, t.goal)}" max="${t.goal}"></progress></div><button class="secondary" data-weekly-claim="${t.id}" ${t.claimed || t.progress < t.goal || !w.participated ? "disabled" : ""}>${t.claimed ? "已领取" : "领取"}</button></div>`).join("")}</div></section>`;
}
function socialView() {
  if (!cloud.user) return loginRequired("公会与聊天");
  const g = cloud.guild;
  return `<div class="section-heading"><div><h2>星海公会</h2><p>分享邀请码，与朋友一起挑战守卫。</p></div><span class="pill">${g ? g.members.length + " / 30 位成员" : "尚未加入公会"}</span></div>${g ? `<div class="guild-banner"><span class="guild-crest">♜</span><div><h2>${esc(g.name)}</h2><p>邀请码 <b>${esc(g.code)}</b> <button id="copy-code" class="secondary">复制</button></p><small>所有成员的伤害共同累计，击败后立即开启下一轮。</small></div><button id="leave-guild" class="secondary">退出</button></div><div class="boss-panel"><div><small>GUILD RAID · ROUND ${g.bossRound}</small><h3>远古星渊守卫</h3><div class="hp-track"><div class="hp-fill" style="width:${(g.bossHp / g.bossMax) * 100}%"></div></div><p>${g.bossHp.toLocaleString()} / ${g.bossMax.toLocaleString()} HP</p><p>入场 100 金币 · 每次奖励 150 金币 + 20 星钻，最后一击获得 200 星钻。</p></div><button id="boss-attack" class="primary">⚔ 合作挑战</button></div>${weeklyView(g)}<div class="member-list">${g.members.map((m) => `<div class="guild-member"><div class="member-portraits">${(m.team || []).map((h) => sprite(h)).join("")}</div><b>${esc(m.name)} ${m.id === g.owner ? "♛" : ""}</b><span>战力 ${m.power} · 贡献 ${m.contribution}</span></div>`).join("")}</div>` : `<div class="guild-forms"><form id="create-guild"><h3>创建你的公会</h3><label>公会名称<input name="name" minlength="2" maxlength="20" required placeholder="例如：月光冒险团"></label><button class="primary">创建公会</button></form><form id="join-guild"><h3>加入朋友的公会</h3><label>8 位邀请码<input name="code" minlength="8" maxlength="8" required placeholder="输入朋友的邀请码"></label><button class="secondary">加入公会</button></form></div>`}${friendsView()}<div class="chat-panel"><div class="chat-top"><h3>旅人聊天室</h3><div><button class="secondary ${chatChannel === "world" ? "selected" : ""}" data-channel="world">世界</button><button class="secondary ${chatChannel === "guild" ? "selected" : ""}" data-channel="guild" ${!g ? "disabled" : ""}>公会</button><button id="refresh-chat" class="secondary">刷新</button></div></div><p class="chat-status" role="status">${esc(chatError) || "每 5 秒更新 · 最多显示最近 60 条消息"}</p><div class="chat-messages" aria-live="polite">${messagesHTML()}</div><form id="chat-form"><input name="message" maxlength="300" required placeholder="和朋友说点什么…" aria-label="聊天消息" autocomplete="off"><button class="primary">发送</button></form></div>`;
}
function arenaView() {
  if (!cloud.user) return loginRequired("星辉竞技场");
  return `<div class="section-heading"><div><h2>星辉竞技场</h2><p>异步挑战其他玩家已保存的队伍；并非双方同时操作的实时对战。</p></div><span class="pill">积分 ${cloud.rating} · UTC 每日 5 次</span></div><p>当前队伍战力 ${teamPower(state)} · 今日已挑战 ${state.arenaDay === new Date().toISOString().slice(0, 10) ? state.arenaAttempts : 0} / 5 · 胜利奖励 200 金币，失败也获得 80 金币。</p><button class="secondary" id="refresh-arena">刷新对手</button><p class="arena-ranking-note">对手按竞技积分排名 · 最多显示 30 位旅人</p><div class="arena-list">${socialData.opponents.length ? socialData.opponents.map((o, index) => `<article><div class="opponent-team">${o.team.map((h) => portrait(h)).join("")}</div><div><h3>#${index + 1} ${esc(o.name)}</h3><p>战力 ${o.power} · 积分 ${o.rating}</p></div><button class="primary" data-duel="${esc(o.id)}">挑战</button></article>`).join("") : "<p>暂无对手，请邀请朋友注册账号，再刷新。</p>"}</div><h3 class="section-title">最近对战</h3><div class="member-list">${socialData.history.map((h) => `<div><b>${h.won ? "胜利" : "落败"} · ${esc(h.opponent)}</b><span>${h.dealt} vs ${h.target} · 金币 +${h.coins}</span></div>`).join("") || "<p>还没有对战记录。</p>"}</div>`;
}
async function loadSocial(repaint = true) {
  if (!cloud.user) return;
  const current = tab;
  const userId = cloud.user.id;
  try {
    if (current === "social") {
      const [guild, chat, friends] = await Promise.all([
        api("/guild"),
        api("/chat?channel=" + chatChannel),
        api("/friends"),
      ]);
      if (tab !== current || cloud.user?.id !== userId || (busy && repaint))
        return;
      cloud.guild = guild.guild;
      friendsList = friends.friends;
      socialData.messages = chat.messages;
      chatError = "";
    } else if (current === "adventure") {
      const data = await api("/friends");
      if (tab !== current || cloud.user?.id !== userId) return;
      friendsList = data.friends;
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
        friendsList = [];
        selectedFriend = "";
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
        friendsList = [];
        selectedFriend = "";
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
                `<div class="guild-member"><div class="member-portraits">${(m.team || []).map((h) => sprite(h)).join("")}</div><b>${esc(m.name)} ${m.id === g.owner ? "♛" : ""}</b><span>战力 ${m.power} · 贡献 ${m.contribution}</span></div>`,
            )
            .join("");
        const weekly = $.querySelector(".weekly-panel");
        if (weekly) {
          weekly.outerHTML = weeklyView(g);
          $.querySelectorAll("[data-weekly-claim]").forEach(
            (b) =>
              (b.onclick = () =>
                run(async () => {
                  const r = await dispatch({
                    type: "guildClaim",
                    task: b.dataset.weeklyClaim,
                  });
                  notice = `合作奖励：✦${r.reward} ◈${r.coins}`;
                })),
          );
        }
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
setInterval(() => {
  if (tab !== "home" || busy) return;
  const reward = idleReward(state);
  const coins = $.querySelector("#idle-coins"),
    gems = $.querySelector("#idle-gems"),
    button = $.querySelector("#claim-idle");
  if (coins) coins.textContent = reward.coins;
  if (gems) gems.textContent = reward.gems;
  if (button) button.disabled = reward.minutes < 1;
}, 60000);
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
function combatStatsView(outcome) {
  const rows = outcome.stats || [];
  const side = (key) => {
    const list = rows.filter((r) => r.side === key),
      max = Math.max(1, ...list.map((r) => r.damage));
    return list
      .map(
        (r) =>
          `<div class="combat-stat-row"><div><b>${esc(r.name)}</b><span>伤害 ${r.damage.toLocaleString()} · 治疗 ${r.healing.toLocaleString()}</span><div class="stat-bar"><i style="width:${(r.damage / max) * 100}%"></i></div><small>护盾 ${r.shielding.toLocaleString()} · 承伤 ${r.taken.toLocaleString()}</small></div></div>`,
      )
      .join("");
  };
  return `<section class="combat-stats"><h3>本队战斗统计</h3>${side("p")}<details><summary>敌方战斗统计</summary>${side("e")}</details>${outcome.tips?.length ? `<div class="battle-advice"><h3>阵容建议</h3><ul>${outcome.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}</section>`;
}
function showBattle(outcome) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let speed = 1;
  try {
    speed = Number(localStorage.getItem("astral-combat-speed")) || 1;
  } catch {}
  if (![1, 2, 4].includes(speed)) speed = 1;
  const units = [...outcome.players, ...outcome.enemies];
  const unit = (u, enemy) =>
    `<div class="combat-unit ${enemy ? "enemy-unit" : "ally-unit"}" data-unit="${u.unitId}">${enemy && !outcome.opponent ? monster(u.kind || 0) : sprite(heroes[u.id])}<b>${esc(u.name)}${u.support ? " · 支援" : ""}</b><div class="hp-track"><div class="hp-fill"></div></div><small class="unit-hp">${u.maxHp}</small><span class="unit-damage"></span></div>`;
  const title = outcome.opponent
    ? "ARENA · " + esc(outcome.opponent)
    : outcome.floor
      ? "TOWER " + outcome.floor
      : outcome.elite
        ? "ELITE " + outcome.stage
        : "CHAPTER " + (outcome.stage || state.stage);
  const m = modal(
    `<div class="battle-cinema"><div class="cinema-heading"><small>${title}</small><h2>小队出击</h2></div><div class="combat-controls"><span>自动战斗</span>${[1, 2, 4].map((n) => `<button class="secondary ${speed === n ? "selected" : ""}" data-speed="${n}" aria-pressed="${speed === n}">×${n}</button>`).join("")}<button class="secondary" data-skip>跳过动画</button></div><div class="combat-arena">${scenery("forest")}<div class="combat-party">${outcome.players.map((u) => unit(u, false)).join("")}</div><div class="combat-enemies">${outcome.enemies.map((u) => unit(u, true)).join("")}</div><span class="round-counter">AUTO · ROUND 1</span></div><p class="combat-log" role="status">伙伴们已做好准备……</p><div class="combat-outcome" hidden><h2>${outcome.won ? "VICTORY" : "DEFEAT"}</h2><p>${outcome.won ? "伙伴们凯旋归来！" : "暂时撤退，培养伙伴后再战。"} ✦ +${outcome.reward || 0} · ◈ +${outcome.coins || 0}</p>${combatStatsView(outcome)}</div><button class="primary" data-close>返回${outcome.opponent ? "竞技场" : "冒险"}</button></div>`,
    "自动战斗与统计",
  );
  const labels = {
    control: "束缚",
    stun: "眩晕",
    ignite: "灼烧",
    counter: "反击",
    regen: "再生",
    purify: "净化",
    break: "破盾",
  };
  function animate(event) {
    const actor = m.dialog.querySelector(`[data-unit="${event.actor}"]`),
      target = m.dialog.querySelector(`[data-unit="${event.target}"]`);
    if (!actor || !target) return;
    actor.classList.remove("attacking");
    void actor.offsetWidth;
    actor.classList.add("attacking");
    target.querySelector(".hp-fill").style.width =
      Math.max(0, (event.hp / event.maxHp) * 100) + "%";
    target.querySelector(".unit-hp").textContent = Math.max(0, event.hp);
    target.classList.toggle("fallen", event.hp === 0);
    const number = target.querySelector(".unit-damage");
    number.textContent = event.revive
      ? "复活 +" + event.heal
      : event.shield
        ? "护盾 +" + event.shield
        : event.heal !== undefined
          ? "+" + event.heal
          : event.damage !== undefined
            ? (event.critical ? "暴击 " : "") +
              (event.advantage ? "克制 " : "") +
              "−" +
              event.damage
            : labels[event.status] || event.skill;
    number.className = "unit-damage";
    void number.offsetWidth;
    number.className =
      "unit-damage pop " + (event.heal !== undefined ? "healing" : "");
    target.classList.toggle("shielded", !!event.shield || !!event.absorbed);
    target.classList.toggle(
      "controlled",
      ["control", "stun"].includes(event.status),
    );
    actor.dataset.element =
      units.find((u) => u.unitId === event.actor)?.element || "";
    m.dialog.querySelector(".combat-log").textContent =
      (units.find((u) => u.unitId === event.actor)?.name || "伙伴") +
      " · " +
      event.skill +
      " " +
      number.textContent;
    m.dialog.querySelector(".round-counter").textContent =
      "ROUND " + event.round + " · " + event.skill;
    tone(event.heal ? 660 : event.critical ? 320 : 220, 0.08);
  }
  let index = 0,
    finished = false;
  const events = outcome.events || [],
    step = Math.min(240, Math.max(15, 9000 / Math.max(1, events.length)));
  function finish() {
    if (finished) return;
    finished = true;
    index = events.length;
    for (const u of units) {
      const node = m.dialog.querySelector(`[data-unit="${u.unitId}"]`);
      node.querySelector(".hp-fill").style.width =
        Math.max(0, (u.hp / u.maxHp) * 100) + "%";
      node.querySelector(".unit-hp").textContent = u.hp;
      node.classList.toggle("fallen", u.hp === 0);
    }
    m.dialog.querySelector(".combat-outcome").hidden = false;
    m.dialog
      .querySelector(".combat-outcome")
      .classList.add(outcome.won ? "victory" : "defeat");
    m.dialog.querySelector(".round-counter").textContent =
      outcome.rounds + " ROUNDS · " + (outcome.won ? "CLEAR" : "FAILED");
    m.dialog.querySelector(".combat-log").textContent = outcome.won
      ? "战斗结束，奖励已保存。"
      : "战斗结束，可在下方查看阵容建议。";
    m.dialog.querySelector("[data-skip]").disabled = true;
    tone(outcome.won ? 880 : 160, 0.3);
  }
  function advance() {
    if (finished) return;
    if (index >= events.length) {
      finish();
      return;
    }
    animate(events[index++]);
    m.after(advance, step / speed);
  }
  m.dialog.querySelectorAll("[data-speed]").forEach(
    (b) =>
      (b.onclick = () => {
        speed = Number(b.dataset.speed);
        try {
          localStorage.setItem("astral-combat-speed", String(speed));
        } catch {}
        m.dialog.querySelectorAll("[data-speed]").forEach((el) => {
          el.classList.toggle("selected", Number(el.dataset.speed) === speed);
          el.setAttribute(
            "aria-pressed",
            String(Number(el.dataset.speed) === speed),
          );
        });
      }),
  );
  m.dialog.querySelector("[data-skip]").onclick = finish;
  if (reduced) finish();
  else m.after(advance, 250);
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
