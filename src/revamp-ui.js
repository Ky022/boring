import {
  slots,
  slotNames,
  qualities,
  sets,
  dungeons,
  dungeonState,
  itemPower,
  mailbox,
  rewardText,
  achievements,
  achievementProgress,
  newcomerTasks,
  itemStatText,
  itemStats,
  formationPositions,
} from "./progression.js";
import { heroes, level, power, formationBonuses, combatTeam, stageEnemies, teamPower, enemyPower } from "./game.js";
import { sprite, scenery, pixelCharacter, monster } from "./pixel.js";
import { worldScene, screenBanner, rewardTiles } from "./world-ui.js";
import { teamInsights, setProgress } from "./journey.js";
import { wireFormationDrag } from "./formation-drag.js";
import { paintedIcon } from "./sanctum-ui.js";
import { gameIcon, elementBadge } from "./hero-ui.js";
let formationPosition = null, formationRole = "全部", formationElement = "全部";
export function illustration(h, small = false) {
  if (small) return pixelCharacter(h, 'hero-illustration art-avatar');
  const url = new URL(`art/hero-${h.id}.webp`, document.baseURI).href;
  return `<span class="hero-illustration painted-character standalone-portrait" role="img" aria-label="${h.name}高清角色立绘"><svg viewBox="0 0 2 3" preserveAspectRatio="xMidYMin slice" aria-hidden="true" overflow="hidden"><image href="${url}" width="2" height="3"/></svg></span>`;
}
export function itemIcon(i) {
  const color = ["#a5b5c6", "#76cfe8", "#bf91ff", "#ffcf78"][i.quality];
  const shapes = {
    weapon: "M12 3L22 3L17 22L10 28L7 25L12 20Z M5 23L14 30 M9 27L4 34",
    body: "M10 5L16 9L22 5L29 12L24 18L23 33L9 33L8 18L3 12Z",
    head: "M6 29L6 15Q16 1 26 15L26 29L21 31L21 20L11 20L11 31Z",
    legs: "M9 5L24 5L26 33L18 33L16 17L14 33L6 33Z",
    feet: "M12 5L24 5L23 23L28 27L28 33L6 33L6 27L12 22Z",
    charm: "M7 8Q16 0 25 8L23 14L16 22L9 14Z M16 20L24 29L16 36L8 29Z",
  };
  return `<svg class="item-icon" viewBox="0 0 36 40" aria-hidden="true"><path d="${shapes[i.slot]}" fill="${color}" stroke="#18223c" stroke-width="2"/><path d="M13 10L17 10" stroke="#fff" stroke-width="2"/></svg>`;
}
export function equipmentSlots(s, id) {
  return `<div class="six-equipment">${slots
    .map((slot) => {
      const i = s.items.find((i) => i.id === s.loadouts[id]?.[slot]);
      return `<button data-equip="${id}" data-equip-slot="${slot}" class="q${i?.quality ?? 0}" aria-label="${slotNames[slot]}">${i ? itemIcon(i) : `<span>${{ weapon: "⚔", body: "♜", head: "♛", legs: "Ⅱ", feet: "➶", charm: "✦" }[slot]}</span>`}<small>${slotNames[slot]}${i ? ` +${i.level}` : ""}</small></button>`;
    })
    .join("")}</div>`;
}
export function formationView(s, nav) {
  const roles = s.team.map((id) => heroes[id].role),
    advice = [];
  if (!roles.includes("骑士")) advice.push("建议加入骑士保护前排");
  if (!roles.includes("治疗")) advice.push("建议加入治疗提高续航");
  if (s.team.length < 6) advice.push(`还有 ${6 - s.team.length} 个空位`);
  const synergies = formationBonuses(combatTeam(s));
  const positions = formationPositions(s), chosen = formationPosition ?? Math.max(0, positions.indexOf(null)), foes = stageEnemies(s.stage);
  return `<div class="formation-screen revamped-formation reference-formation">${nav}<div class="formation-scene">${worldScene("formation-court")}<div class="formation-vs"><span>我的小队</span><b>VS</b><span>第 ${s.stage} 关</span></div><div class="formation-slots">${positions.map((id,i)=>{const h=heroes[id];return `<button data-position="${i}" style="grid-row:${i%3+1};grid-column:${i<3?2:1}" class="${i===chosen?'chosen-position':''}" aria-pressed="${i===chosen}" aria-label="${i<3?'前排':'后排'}${i%3+1}，${h?h.name:'空位'}"><span class="position-ring"></span><small>${i<3?'前排':'后排'} ${i%3+1}</small>${h?sprite(h):'<span class="empty-position">＋</span>'}<b>${h?h.name:'空位'}</b>${h?`<em>${elementBadge(h.element)}Lv.${level(s,h.id)}</em>`:''}</button>`}).join('')}</div><div class="formation-opponents">${Array.from({length:6},(_,i)=>{const e=foes[i];return `<div style="grid-row:${i%3+1};grid-column:${i<3?1:2}" class="${e?'occupied':''}"><span class="position-ring"></span>${e?`${monster(e.kind||0)}<b>${e.name}</b><em>${elementBadge(e.element)}敌方</em>`:''}</div>`}).join('')}</div><div class="formation-power"><span>本队战力 <b>${teamPower(s).toLocaleString()}</b></span><span>敌方战力 <b>${enemyPower(s.stage).toLocaleString()}</b></span></div></div><section class="inline-formation-picker"><div class="formation-selection" role="status">已选：${chosen<3?"前排":"后排"} ${chosen%3+1} · ${positions[chosen]===null?"空位":heroes[positions[chosen]].name}<span>长按拖动 · 点选也可换人</span></div><div class="inline-formation-roster">${heroes.filter(h=>s.collection[h.id]&&(formationRole==="全部"||h.role===formationRole)&&(formationElement==="全部"||h.element===formationElement)).sort((a,b)=>power(s,b.id)-power(s,a.id)).map(h=>`<button data-pick="${h.id}" class="formation-card ${s.team.includes(h.id)?'deployed':''}" aria-label="选择${h.name}${s.team.includes(h.id)?'，已上阵':''}" style="--rarity:${{R:'#9eafb2',SR:'#b88cdc',SSR:'#dfb561',UR:'#ef91af'}[h.rarity]}"><small>Lv.${level(s,h.id)}</small>${elementBadge(h.element)}${sprite(h)}<b>${h.name}</b><em>${'★'.repeat(s.stars[h.id]||1)}</em>${s.team.includes(h.id)?'<span class="formation-check">✓</span>':''}</button>`).join('')||'<p class="formation-empty">这个分类没有已获得英雄</p>'}</div><div class="inline-picker-heading"><div class="formation-elements"><button data-formation-element="全部" class="${formationElement==='全部'?'active':''}" aria-label="全部属性">ALL</button>${['光','暗','水','火','风'].map(e=>`<button data-formation-element="${e}" class="${formationElement===e?'active':''}" aria-label="${e}属性">${elementBadge(e)}</button>`).join('')}</div><select data-inline-role aria-label="组队职业筛选">${['全部','骑士','战士','游侠','法师','治疗'].map(r=>`<option ${formationRole===r?'selected':''}>${r}</option>`).join('')}</select></div></section><div class="team-insights">${teamInsights(s).slice(0,2).map(n=>`<span>${n}</span>`).join('')}</div><div class="formation-bottom"><button data-inline-clear class="secondary" aria-label="卸下选中位置">卸下</button><button class="primary" id="fight" ${!s.team.length?'disabled':''}>挑战第 ${s.stage} 关</button><details class="formation-options"><summary aria-label="阵容设置">${paintedIcon('formation')}</summary><div class="screen-panel"><div class="formation-actions"><button class="primary" data-recommend>推荐阵容</button><button class="secondary" data-loadout-auto>一键穿戴</button></div><p class="team-advice">${advice.join(' · ')||'前排与治疗齐备'}</p><div class="synergy-chips">${synergies.map(b=>`<span>${b.faction} · 攻击/生命 +${b.bonus*100}%</span>`).join('')||'<span>同阵营 3 位 / 5 位触发共鸣</span>'}</div><details class="preset-details"><summary>保存与载入阵容</summary><div id="preset-mount"></div></details></div></details></div></div>`;
}
export function forgeView(s, nav, id) {
  return `<div class="forge-screen revamped-forge world-forge" data-panel="bag">${nav}${screenBanner("星灯锻造所",`强化石 ${s.stones} · 装备 ${s.items.length} 件`,"shield","town-east")}<div class="forge-panel-tabs"><button data-forge-panel="bag" class="active">装备背包</button><button data-forge-panel="shop">基础商店</button></div><div class="screen-panel"><button class="primary" data-equip="${id}">查看 ${heroes[id].name} 的六部位装备</button><details class="equipment-shop" open><summary>基础装备商店 · 每件 ◈300</summary><div class="shop-slots">${slots.map((slot) => `<button data-item-buy="${slot}">${itemIcon({ slot, quality: 0 })}<b>${slotNames[slot]}</b><small>金币 300</small><span>购买</span></button>`).join("")}</div></details><div class="bag-toolbar"><select data-bag-filter aria-label="装备部位筛选"><option value="all">全部部位</option>${slots.map(k=>`<option value="${k}">${slotNames[k]}</option>`).join("")}</select><select data-quality-filter aria-label="装备品质筛选"><option value="all">全部品质</option>${qualities.map((q,i)=>`<option value="${i}">${q}</option>`).join("")}</select></div><button class="secondary" data-salvage-common>批量分解未穿戴、未强化的普通装备</button><p class="muted">副本与主线可获得更高品质；穿戴中或锁定装备不可分解。</p><div class="equipment-bag">${
    s.items
      .map((i) => {
        const owner = Object.entries(s.loadouts).find(([, l]) =>
          Object.values(l).includes(i.id),
        );
        return `<article class="equipment-card q${i.quality}" data-slot="${i.slot}" data-quality="${i.quality}"><div class="bag-item-art">${itemIcon(i)}<b>+${i.level}</b>${i.locked?"<span>锁定</span>":""}</div><b class="bag-item-name">${i.name}</b><small>${qualities[i.quality]} · ${slotNames[i.slot]}</small><details class="bag-item-details"><summary>属性 / 强化</summary><div><b>${i.name} +${i.level}</b><small>${qualities[i.quality]} · ${slotNames[i.slot]} · 战力 +${itemPower(i)}</small><small>${itemStatText(i)}<br>${sets[i.set]}套装 · ${owner ? heroes[+owner[0]].name + "穿戴中" : "未穿戴"}</small></div><div class="item-actions"><button data-item-action="itemForge" data-item-id="${i.id}" ${i.level >= 10 ? "disabled" : ""}>强化</button><button data-item-action="itemLock" data-item-id="${i.id}">${i.locked ? "解锁" : "锁定"}</button><button data-item-action="itemSalvage" data-item-id="${i.id}" ${owner || i.locked ? "disabled" : ""}>分解</button></div></details></article>`;
      })
      .join("") ||
    '<div class="r-equipment-empty"><b>先给伙伴准备一套旅行装备</b><p>基础商店填满六个部位，遗落兵工厂获取更高品质装备。</p><button class="primary" data-adventure-mode="daily">前往日常副本 ›</button><button class="secondary" data-forge-panel="shop">选购基础装备 ›</button></div>'
  }</div><div class="set-guide"><h3>给不同职业搭配套装</h3><div class="r-set-options"><span><b>焰羽 · 输出</b><small>2件攻击 +8%</small></span><span><b>月泉 · 治疗</b><small>2件治疗 +15%</small></span><span><b>坚岩 · 骑士</b><small>2件生命 +12% · 4件护盾 +20%</small></span></div><p>一键装备优先职业适合的套装；高品质与强化收益也会参与选择。</p></div></div></div>`;
}
export function dungeonView(s) {
  const d = dungeonState(s);
  return `<section class="dungeon-board">${screenBanner("日常远征","每日获取金币、经验、装备与材料","adventure","town-east")}<div class="section-heading"><div><small>DAILY EXPEDITIONS</small><h2>日常副本</h2><p>每种每日 3 次奖励 · 通关后可扫荡</p></div></div>${dungeons.map((v) => `<article class="dungeon-card" style="--accent:${v.color}"><div class="dungeon-emblem">${gameIcon({gold:"star",xp:"water",equipment:"shield",materials:"book"}[v.id]||"adventure")}</div><div><h3>${v.name}</h3><p>${v.description}</p><small>剩余 ${3 - (d.runs[v.id] || 0)} 次 · 马来西亚早上 8 点刷新</small></div><select data-dungeon-tier="${v.id}" aria-label="${v.name}难度">${[1, 2, 3].map((t) => `<option value="${t}" ${s.cleared < (t - 1) * 6 ? "disabled" : ""}>${["普通", "困难", "大师"][t - 1]}${t > 1 ? ` · 通关${(t - 1) * 6}关` : ""}</option>`).join("")}</select><div class="dungeon-actions"><button class="primary" data-dungeon="${v.id}" ${d.runs[v.id] >= 3 ? "disabled" : ""}>挑战</button><button class="secondary" data-dungeon="${v.id}" data-sweep="true" ${!d.cleared[v.id] || d.runs[v.id] >= 3 ? "disabled" : ""}>扫荡</button></div></article>`).join("")}</section>`;
}
export function welfareView(s, mode) {
  const w = s.welfare,
    today = new Date().toISOString().slice(0, 10);
  const nav = `<button class="secondary claim-all" data-reward-all>一键领取邮件与成长奖励</button><div class="welfare-tabs">${[
    ["welfare", "福利"],
    ["mail", "邮箱"],
    ["achievements", "成就"],
  ]
    .map(
      ([k, n]) =>
        `<button data-home-drawer="${k}" class="${mode === k ? "active" : ""}">${n}</button>`,
    )
    .join("")}</div>`;
  const btn = (task, target, disabled, label = "领取") =>
    `<button class="primary" data-welfare="${task}" ${target !== undefined ? `data-target="${target}"` : ""} ${disabled ? "disabled" : ""}>${label}</button>`;
  if (mode === "mail")
    return `${nav}<h2>冒险者邮箱</h2>${mailbox(s)
      .map(
        (m) =>
          `<article class="reward-entry"><h3>${m.title}</h3><p>${m.text}</p>${rewardTiles(m.reward)}<small>到期：${new Date(m.expires).toLocaleDateString("zh-CN")}</small><button class="primary" data-mail="${m.id}" ${m.claimed || m.expired ? "disabled" : ""}>${m.claimed ? "已领取" : m.expired ? "已过期" : "领取附件"}</button></article>`,
      )
      .join("")}`;
  if (mode === "achievements")
    return `${nav}<h2>冒险成就</h2>${achievements
      .map((a) => {
        const n = achievementProgress(s, a),
          claimed = w.achievements.includes(a.id);
        return `<article class="reward-entry"><h3>${a.name}</h3><progress value="${n}" max="${a.goal}"></progress><small>${Math.min(n, a.goal)} / ${a.goal}</small>${rewardTiles(a.reward)}${btn("achievement", a.id, claimed || n < a.goal, claimed ? "已领取" : "领取")}</article>`;
      })
      .join("")}`;
  return `${nav}<h2>每日福利</h2><div class="signin-calendar">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<div class="${w.streak >= n ? "signed" : ""}"><small>第 ${n} 天</small>${gameIcon(n===7?"summon":"mail")}<b>${n===7?"星钻 500":"召唤券"}</b><span>${n === 7 ? "3 张券" : "×1"}</span></div>`).join("")}</div><p>连续签到七日大奖；断签重新开始，下一轮可继续领取。</p>${btn("streak", undefined, w.lastSign === today, w.lastSign === today ? "今日已签到" : "签到领奖")}<article class="reward-entry"><h3>免费每日补给</h3>${rewardTiles({tickets:1,coins:300,stones:3})}${btn("free", undefined, w.freeDay === today, w.freeDay === today ? "已领取" : "免费领取")}</article><h3>新手七日成长</h3>${newcomerTasks(
    s,
  )
    .map(
      (t) =>
        `<article class="reward-entry"><b>第 ${t.id} 天 · ${t.name}</b><small>${Math.min(t.progress, t.goal)} / ${t.goal} ${!t.unlocked ? "· 未开放" : ""}</small>${rewardTiles(t.reward)}${btn("newcomer", t.id, !t.unlocked || t.claimed || t.progress < t.goal, t.claimed ? "已领取" : "领取")}</article>`,
    )
    .join("")}`;
}
export function rewardDots(s) {
  const today = new Date().toISOString().slice(0, 10),
    w = s.welfare;
  return {
    welfare:
      w.lastSign !== today ||
      w.freeDay !== today ||
      newcomerTasks(s).some(
        (t) => t.unlocked && !t.claimed && t.progress >= t.goal,
      ),
    mail: mailbox(s).some((m) => !m.claimed && !m.expired),
  };
}
export function wireRevamp(ctx) {
  const {
      root,
      getState,
      dispatch,
      run,
      render,
      modal,
      setNotice,
      showBattle,
    } = ctx,
    s = getState();
  const salvage = root.querySelector("[data-salvage-common]");
  if (salvage)
    salvage.onclick = () =>
      run(async () =>
        setNotice(rewardText(await dispatch({ type: "salvageCommon" }))),
      );
  const all = root.querySelector("[data-reward-all]");
  if (all)
    all.onclick = () =>
      run(async () =>
        setNotice(rewardText(await dispatch({ type: "rewardAll" }))),
      );
  root.querySelectorAll('[data-position]').forEach(b => b.onclick = () => {
    formationPosition = Number(b.dataset.position); ctx.render();
  });
  root.querySelectorAll('[data-formation-element]').forEach(b => b.onclick = () => { formationElement = b.dataset.formationElement; ctx.render(); });
  const rolePicker = root.querySelector('[data-inline-role]');
  if (rolePicker) rolePicker.onchange = () => { formationRole = rolePicker.value; ctx.render(); };
  root.querySelectorAll('.inline-formation-picker [data-pick]').forEach(b => b.onclick = () => run(async () => {
    const positions = formationPositions(getState()), id = Number(b.dataset.pick);
    const position = formationPosition ?? Math.max(0,positions.indexOf(null)), old = positions[position], previous = positions.indexOf(id);
    if (previous >= 0) positions[previous] = old;
    positions[position] = id;
    await dispatch({type:'formation',positions});
    formationPosition = position; setNotice(`${heroes[id].name}已就位 · ${position<3?'前排':'后排'} ${position%3+1}`);
  }));
  wireFormationDrag(ctx, (position) => { formationPosition = position; });
  const clearPosition = root.querySelector('[data-inline-clear]');
  if (clearPosition) clearPosition.onclick = () => run(async () => {
    const positions = formationPositions(getState()); positions[formationPosition ?? Math.max(0,positions.indexOf(null))] = null;
    await dispatch({type:'formation',positions});setNotice('站位已空出');
  });
  const recommend = root.querySelector("[data-recommend]");
  if (recommend)
    recommend.onclick = () =>
      run(async () => {
        const state = getState(),
          pool = heroes
            .filter((h) => state.collection[h.id])
            .sort((a, b) => power(state, b.id) - power(state, a.id)),
          team = [];
        for (const role of ["骑士", "治疗"]) {
          const h = pool.find((h) => h.role === role);
          if (h) team.push(h.id);
        }
        for (const h of pool)
          if (!team.includes(h.id) && team.length < 6) team.push(h.id);
        const front = team
          .filter((id) => ["骑士", "战士"].includes(heroes[id].role))
          .slice(0, 3);
        for (const id of team)
          if (
            front.length < 3 &&
            !front.includes(id) &&
            heroes[id].role !== "治疗"
          )
            front.push(id);
        const back = team.filter((id) => !front.includes(id));
        while (back.length > 3) front.push(back.shift());
        const positions = Array.from({ length: 6 }, () => null);
        front.forEach((id, i) => (positions[i] = id));
        back.forEach((id, i) => (positions[i + 3] = id));
        await dispatch({ type: "formation", positions });
        setNotice("已选择前排、治疗与强力输出，可继续点站位调整");
      });
  root.querySelectorAll("[data-loadout-auto]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          await dispatch({ type: "loadoutAuto" });
          setNotice("六部位装备已分配，其他英雄的装备保持穿戴");
        })),
  );
  root.querySelectorAll("[data-item-buy]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const i = await dispatch({
            type: "itemBuy",
            slot: b.dataset.itemBuy,
          });
          setNotice(`获得 ${i.name}`);
        })),
  );
  root.querySelectorAll("[data-item-action]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const r = await dispatch({
            type: b.dataset.itemAction,
            item: b.dataset.itemId,
          });
          setNotice(
            b.dataset.itemAction === "itemForge"
              ? `${r.name} 强化 +${r.level}`
              : "装备已更新",
          );
        })),
  );
  root.querySelectorAll("[data-welfare]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const r = await dispatch({
            type: "welfare",
            task: b.dataset.welfare,
            target:
              b.dataset.welfare === "newcomer"
                ? Number(b.dataset.target)
                : b.dataset.target,
          });
          setNotice(rewardText(r));
        })),
  );
  root
    .querySelectorAll("[data-mail]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          run(async () =>
            setNotice(
              rewardText(
                await dispatch({ type: "mailClaim", mail: b.dataset.mail }),
              ),
            ),
          )),
    );
  root.querySelectorAll("[data-dungeon]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const r = await dispatch({
            type: "dungeon",
            dungeon: b.dataset.dungeon,
            tier: Number(
              root.querySelector(`[data-dungeon-tier="${b.dataset.dungeon}"]`)
                .value,
            ),
            sweep: b.dataset.sweep === "true",
          });
          setNotice(
            r.won
              ? "获得 " +
                  [
                    rewardText(
                      Object.fromEntries(
                        Object.entries(r.loot).filter(([k]) => k !== "item"),
                      ),
                    ),
                    r.loot.item?.name,
                  ]
                    .filter(Boolean)
                    .join(" · ")
              : "挑战失败，不消耗奖励次数",
          );
          if (!r.sweep) showBattle(r);
        })),
  );
}
export function openFormation(position, ctx) {
  const s = ctx.getState(),
    current = formationPositions(s)[position],
    m = ctx.modal(
      `<h2>${position < 3 ? "前排" : "后排"} ${(position % 3) + 1} · 选择英雄</h2><p>点英雄替换；已上阵英雄会交换位置。</p><select data-picker-role aria-label="组队职业筛选">${["全部", "骑士", "战士", "游侠", "法师", "治疗"].map((r) => `<option>${r}</option>`).join("")}</select><div class="team-selection">${heroes
        .filter((h) => s.collection[h.id])
        .sort((a, b) => power(s, b.id) - power(s, a.id))
        .map(
          (h) =>
            `<button data-pick="${h.id}" data-role="${h.role}" class="${s.team.includes(h.id) ? "selected" : ""}">${illustration(h, true)}<b>${h.name}</b><small>${h.role} · Lv.${level(s, h.id)}</small><small>战力 ${power(s, h.id)} ${s.team.includes(h.id) ? "· 上阵" : ""}</small></button>`,
        )
        .join(
          "",
        )}</div>${current !== null ? '<button class="secondary" data-remove-position>卸下此英雄</button>' : ""}<p class="picker-error"></p><button class="primary" data-close>返回阵容</button>`,
      "选择组队英雄",
    );
  m.dialog.classList.add("team-picker-dialog");
  m.dialog.querySelector("[data-picker-role]").onchange = (e) =>
    m.dialog
      .querySelectorAll("[data-pick]")
      .forEach(
        (b) =>
          (b.hidden =
            e.target.value !== "全部" && b.dataset.role !== e.target.value),
      );
  const change = async (team) => {
    if (ctx.isBusy()) return;
    try {
      await ctx.run(async () => {
        await ctx.dispatch({ type: "formation", positions: team });
        m.end();
        ctx.setNotice("阵容已保存");
      });
    } catch (e) {
      m.dialog.querySelector(".picker-error").textContent = e.message;
    }
  };
  m.dialog.querySelectorAll("[data-pick]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = Number(b.dataset.pick),
          team = formationPositions(ctx.getState()),
          old = team[position],
          idx = team.indexOf(id);
        if (idx >= 0) {
          [team[idx], team[position]] = [old, id];
        } else team[position] = id;
        change(team);
      }),
  );
  const remove = m.dialog.querySelector("[data-remove-position]");
  if (remove)
    remove.onclick = () =>
      change(
        formationPositions(ctx.getState()).map((id, i) =>
          i === position ? null : id,
        ),
      );
}
export function openEquipmentRevamp(id, ctx, selectedSlot = "weapon") {
  const s = ctx.getState(),
    h = heroes[id],
    current = s.loadouts[id] || {},
    m = ctx.modal(
      `<div class="equipment-title"><h2>${h.name} · 六部位装备</h2><span>战力 ${power(s, id)} · 强化石 ${s.stones}</span></div>${equipmentSlots(s, id)}<div class="equipment-set-status">${Object.entries(setProgress(s,id).counts).map(([key,n])=>`<span class="${n>=2?'active':''}">${sets[key]} ${n} 件 · ${n>=2?'已激活':'还差 1 件激活'}</span>`).join('')||'暂无套装，集齐同套两件可激活加成'}</div><div class="equipment-choices">${slots
        .map(
          (slot) =>
            `<section data-slot-section="${slot}" ${slot !== selectedSlot ? "hidden" : ""}><h3>${slotNames[slot]}</h3><button class="secondary" data-loadout-item="" data-slot="${slot}">卸下</button>${
              s.items
                .filter((i) => i.slot === slot)
                .map((i) => {
                  const owner = Object.entries(s.loadouts).find(([, l]) =>
                    Object.values(l).includes(i.id),
                  );
                  const equipped = s.items.find((x) => x.id === current[slot]),
                    delta = itemPower(i) - (equipped ? itemPower(equipped) : 0);
                  return `<button class="equipment-choice q${i.quality}" data-loadout-item="${i.id}" data-slot="${slot}" ${owner && Number(owner[0]) !== id ? "disabled" : ""}>${itemIcon(i)}<span><b>${i.name} +${i.level}</b><small>${qualities[i.quality]} · ${itemStatText(i)}<br><strong class="equip-delta ${delta>=0?'positive':'negative'}">替换后战力 ${delta >= 0 ? "+" : ""}${delta}</strong> · ${sets[i.set]}套<br>${Object.entries(itemStats(i)).filter(([,n])=>n>0).map(([k,n])=>{const diff=(n-(equipped?itemStats(equipped)[k]:0))*100;return `${{attack:'攻击',hp:'生命',crit:'暴击',heal:'治疗'}[k]} ${diff>=0?'+':''}${diff.toFixed(1)}%`;}).join(' · ')}</small><small>${owner ? `${heroes[+owner[0]].name}穿戴中` : "可穿戴"}</small></span>${current[slot] === i.id ? "✓" : ""}</button>`;
                })
                .join("") || "<p>暂无此部位装备，去日常副本或工坊获取。</p>"
            }</section>`,
        )
        .join(
          "",
        )}</div><p>焰羽两件加攻击 · 月泉两件加治疗 · 坚岩两件加生命</p><button class="secondary" data-auto-hero>一键推荐穿戴</button><p class="equip-error" role="status"></p><button class="primary" data-close>完成</button>`,
      "六部位装备配置",
    );
  m.dialog.classList.add("equipment-dialog", "revamped-equipment");
  m.dialog.querySelectorAll("[data-equip-slot]").forEach(
    (b) =>
      (b.onclick = () => {
        selectedSlot = b.dataset.equipSlot;
        m.dialog
          .querySelectorAll("[data-slot-section]")
          .forEach((p) => (p.hidden = p.dataset.slotSection !== selectedSlot));
      }),
  );
  const change = async (action) => {
    if (ctx.isBusy()) return;
    await ctx.run(async () => {
      await ctx.dispatch(action);
      m.end();
      ctx.render();
      openEquipmentRevamp(id, ctx, selectedSlot);
    });
  };
  m.dialog.querySelectorAll("[data-loadout-item]").forEach(
    (b) =>
      (b.onclick = () =>
        change({
          type: "loadout",
          id,
          slot: b.dataset.slot,
          item: b.dataset.loadoutItem || null,
        })),
  );
  m.dialog.querySelector("[data-auto-hero]").onclick = () =>
    change({ type: "loadoutAuto", id });
}
