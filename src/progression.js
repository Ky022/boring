// JSON extensions migrate lazily inside the existing authoritative player transaction.
export const slots = ["weapon", "body", "head", "legs", "feet", "charm"];
export const slotNames = {
  weapon: "武器",
  body: "衣服",
  head: "头盔",
  legs: "裤子",
  feet: "鞋子",
  charm: "饰品",
};
export const qualities = ["普通", "稀有", "史诗", "传说"];
export const sets = { flame: "焰羽", moon: "月泉", stone: "坚岩" };
export const dungeons = [
  {
    id: "gold",
    name: "黄金矿洞",
    icon: "◈",
    description: "击败矿洞守卫，获取金币",
    color: "#f5b956",
  },
  {
    id: "experience",
    name: "记忆之森",
    icon: "✧",
    description: "收集经验药剂，快速培养英雄",
    color: "#77dca1",
  },
  {
    id: "equipment",
    name: "遗落兵工厂",
    icon: "⚔",
    description: "获取六部位装备与套装",
    color: "#b69bfa",
  },
  {
    id: "material",
    name: "星晶秘境",
    icon: "⬡",
    description: "获取强化石与技能书",
    color: "#75d4ee",
  },
];
export const achievements = [
  {
    id: "chapter1",
    name: "森林凯旋",
    goal: 3,
    key: "cleared",
    reward: { gems: 300, tickets: 1 },
  },
  {
    id: "chapter4",
    name: "远征先锋",
    goal: 12,
    key: "cleared",
    reward: { gems: 600, tickets: 3 },
  },
  {
    id: "heroes10",
    name: "集结伙伴",
    goal: 10,
    key: "heroes",
    reward: { coins: 1000, tickets: 2 },
  },
  {
    id: "tower5",
    name: "登塔之路",
    goal: 5,
    key: "tower",
    reward: { gems: 300, stones: 20 },
  },
  {
    id: "level10",
    name: "精锐英雄",
    goal: 10,
    key: "level",
    reward: { books: 5, coins: 1000 },
  },
];
const day = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);
export function expansionFresh() {
  return {
    formation: null,
    edition: 1,
    legacyMigrated: false,
    items: [],
    loadouts: {},
    itemSeq: 0,
    stones: 20,
    experience: 5,
    books: 3,
    tickets: 0,
    skills: {},
    dungeon: { day: "", runs: {}, cleared: {} },
    welfare: {
      joinedAt: Date.now(),
      lastSign: "",
      streak: 0,
      totalSigns: 0,
      newcomer: [],
      achievements: [],
      freeDay: "",
      claimedMail: [],
    },
  };
}
export function expandSave(s) {
  if (s.edition === 1) return s;
  Object.assign(s, expansionFresh());
  s.legacyMigrated = true;
  // Keep legacy inventory/equipment untouched for rollback, convert every owned copy once.
  const names = {
    iron: "铁星长剑",
    bow: "逐风长弓",
    moon: "月华法杖",
    charm: "星灯护符",
    crystal: "霜晶吊坠",
    crown: "黎明王冠",
  };
  for (const old of s.inventory || []) {
    const item = makeItem(s, {
      slot: ["iron", "bow", "moon"].includes(old) ? "weapon" : "charm",
      quality: { iron: 0, charm: 0, bow: 1, crystal: 1, moon: 2, crown: 2 }[
        old
      ],
      set: "moon",
    });
    item.name = names[old];
    item.level = s.forge?.[old] || 0;
    item.legacy = old;
  }
  const used = new Set();
  for (const [hero, gear] of Object.entries(s.equipment || {})) {
    for (const [slot, old] of Object.entries(gear)) {
      const item = s.items.find((i) => i.legacy === old && !used.has(i.id));
      if (item) {
        (s.loadouts[hero] ??= {})[slot] = item.id;
        used.add(item.id);
      }
    }
  }
  // Power uses converted items only; legacy fields remain for compatibility until first new action.
  return s;
}
export function makeItem(
  s,
  { slot = "weapon", quality = 0, set = "stone" } = {},
) {
  const id = `e${++s.itemSeq}`;
  const item = {
    id,
    slot,
    quality,
    set,
    name: `${sets[set]}${slotNames[slot]}`,
    level: 0,
    locked: false,
  };
  s.items.push(item);
  return item;
}
export function itemPower(item) {
  const legacy = {
    iron: 12,
    bow: 24,
    moon: 42,
    charm: 8,
    crystal: 20,
    crown: 35,
  };
  return item.legacy
    ? legacy[item.legacy] + item.level * 6
    : 6 + item.quality * 9 + item.level * 3;
}
export function worn(s, id) {
  return Object.values(s.loadouts?.[id] || {})
    .map((uid) => s.items?.find((i) => i.id === uid))
    .filter(Boolean);
}
export function equipmentPower(s, id) {
  // Subtract the legacy contribution from migrated heroes to avoid counting twice.
  const legacyValues = {
    iron: 12,
    bow: 24,
    moon: 42,
    charm: 8,
    crystal: 20,
    crown: 35,
  };
  const old = Object.values(s.equipment?.[id] || {}).reduce(
    (n, k) => n + (legacyValues[k] || 0) + (s.forge?.[k] || 0) * 6,
    0,
  );
  return (
    worn(s, id).reduce((n, i) => n + itemPower(i), 0) -
    (s.legacyMigrated ? old : 0)
  );
}
export function itemStats(i) {
  const strength = i.quality + 1 + i.level * 0.15;
  return {
    attack: i.slot === "weapon" ? strength * 0.02 : 0,
    hp: ["body", "head", "legs"].includes(i.slot) ? strength * 0.025 : 0,
    crit: i.slot === "feet" ? strength * 0.01 : 0,
    heal: i.slot === "charm" ? strength * 0.025 : 0,
  };
}
export function itemStatText(i) {
  const stats = itemStats(i);
  return Object.entries(stats)
    .filter(([, n]) => n > 0)
    .map(
      ([k, n]) =>
        `${{ attack: "攻击", hp: "生命", crit: "暴击", heal: "治疗" }[k]} +${(n * 100).toFixed(1)}%`,
    )
    .join(" · ");
}
export function equipmentCombat(s, id) {
  const items = worn(s, id),
    count = (key) => items.filter((i) => i.set === key).length;
  const gearBonus = {
    attack: count("flame") >= 2 ? 0.08 : 0,
    hp: count("stone") >= 2 ? 0.12 : 0,
    heal: count("moon") >= 2 ? 0.15 : 0,
    shield: count("stone") >= 4 ? 0.2 : 0,
    crit: 0,
  };
  for (const i of items)
    for (const [k, n] of Object.entries(itemStats(i))) gearBonus[k] += n;
  return { gearBonus };
}
export function heroGrowth(s, h) {
  const ability = structuredClone(h.ability);
  ability.multiplier *= 1 + (s.skills?.[h.id] || 0) * 0.06;
  ability.heal *= 1 + (s.skills?.[h.id] || 0) * 0.06;
  const stars = s.stars?.[h.id] || 0;
  const passive = {
    骑士: "guard",
    战士: "drain",
    游侠: "double",
    法师: "break",
    治疗: "regen",
  }[h.role];
  if (stars >= 3 && !ability.effects.includes(passive))
    ability.effects.push(passive);
  return ability;
}
export function dungeonState(s, now = Date.now()) {
  if (s.dungeon.day !== day(now)) {
    s.dungeon.day = day(now);
    s.dungeon.runs = {};
  }
  return s.dungeon;
}
function grant(s, reward) {
  for (const [key, amount] of Object.entries(reward)) s[key] += amount;
  return reward;
}
export function mailbox(s, now = Date.now()) {
  const start = s.welfare.joinedAt;
  return [
    {
      id: "welcome-v1",
      title: "星境重启 · 冒险补给",
      text: "欢迎来到全新星境！领取装备强化与招募补给。",
      expires: start + 30 * 86400000,
      reward: { gems: 300, coins: 1000, stones: 20, tickets: 2 },
    },
  ].map((m) => ({
    ...m,
    claimed: s.welfare.claimedMail.includes(m.id),
    expired: now >= m.expires,
  }));
}
export function rewardText(r) {
  return Object.entries(r)
    .map(
      ([k, n]) =>
        `${{ gems: "星钻", coins: "金币", stones: "强化石", experience: "经验药剂", books: "技能书", tickets: "召唤券" }[k]} +${n}`,
    )
    .join(" · ");
}
export function achievementProgress(s, a) {
  return a.key === "heroes"
    ? Object.keys(s.collection).length
    : a.key === "level"
      ? Math.max(1, ...Object.values(s.levels))
      : s[a.key] || 0;
}
export function newcomerTasks(s) {
  const elapsed = Math.min(
    7,
    Math.floor(Math.max(0, Date.now() - s.welfare.joinedAt) / 86400000) + 1,
  );
  const tasks = [
    ["首次出征", s.cleared, 1],
    ["培养英雄", Math.max(1, ...Object.values(s.levels)), 3],
    ["集结六位伙伴", Object.keys(s.collection).length, 6],
    ["森林通关", s.cleared, 3],
    ["登上试炼塔", s.tower, 3],
    ["装备收藏", s.items.length, 6],
    ["连续冒险", s.welfare.totalSigns, 7],
  ];
  return tasks.map(([name, progress, goal], i) => ({
    id: i + 1,
    name,
    progress,
    goal,
    unlocked: i < elapsed,
    claimed: s.welfare.newcomer.includes(i + 1),
    reward: { gems: 150, tickets: i === 6 ? 5 : 1, coins: 500 },
  }));
}
export function awardLoot(s, stage, rng, elite) {
  const reward = { stones: elite ? 4 : 2, experience: 1 };
  grant(s, reward);
  if (stage % 3 === 0 || elite || rng() < 0.25) {
    const item = randomItem(s, Math.min(3, Math.floor(stage / 9)), rng);
    return { ...reward, item };
  }
  return reward;
}
function randomItem(s, quality, rng) {
  return makeItem(s, {
    slot: slots[Math.min(5, Math.floor(rng() * 6))],
    quality,
    set: ["flame", "moon", "stone"][Math.min(2, Math.floor(rng() * 3))],
  });
}
export function formationPositions(s) {
  return s.formation
    ? [...s.formation]
    : Array.from({ length: 6 }, (_, i) => s.team[i] ?? null);
}
export function validFormation(s, positions, team = s.team) {
  if (!Array.isArray(positions) || positions.length !== 6) return false;
  const ids = positions.filter((id) => id !== null);
  return (
    new Set(ids).size === ids.length &&
    ids.every((id) => Number.isInteger(id) && s.collection[id]) &&
    JSON.stringify(ids) === JSON.stringify(team)
  );
}
export function expansionAction(s, a, rng, ctx) {
  const result = (value) => ({ handled: true, result: value ?? null });
  if (a.type === "formation") {
    if (!Array.isArray(a.positions)) throw Error("站位无效");
    const team = a.positions.filter((id) => id !== null);
    if (!validFormation(s, a.positions, team))
      throw Error("站位包含重复或未拥有英雄");
    s.formation = [...a.positions];
    s.team = team;
    return result();
  }
  if (a.type === "loadout") {
    if (
      !Number.isInteger(a.id) ||
      !s.collection[a.id] ||
      !slots.includes(a.slot)
    )
      throw Error("角色或装备栏无效");
    const loadout = (s.loadouts[a.id] ??= {});
    if (a.item === null) {
      delete loadout[a.slot];
      return result();
    }
    const item = s.items.find((i) => i.id === a.item && i.slot === a.slot);
    if (!item) throw Error("装备不存在或部位不匹配");
    if (
      Object.entries(s.loadouts).some(
        ([id, l]) => Number(id) !== a.id && Object.values(l).includes(item.id),
      )
    )
      throw Error("此装备已被其他角色穿戴");
    loadout[a.slot] = item.id;
    return result();
  }
  if (["itemForge", "itemLock", "itemSalvage"].includes(a.type)) {
    const item = s.items.find((i) => i.id === a.item);
    if (!item) throw Error("装备不存在");
    if (a.type === "itemLock") {
      item.locked = !item.locked;
      return result(item);
    }
    if (a.type === "itemSalvage") {
      if (
        item.locked ||
        Object.values(s.loadouts).some((l) =>
          Object.values(l).includes(item.id),
        )
      )
        throw Error("锁定或穿戴中的装备不能分解");
      s.items = s.items.filter((i) => i.id !== item.id);
      return result(
        grant(s, {
          stones: 2 + item.quality * 3 + item.level,
          coins: 50 + item.quality * 50,
        }),
      );
    }
    const cost = (item.level + 1) * 100,
      stones = item.level + 1;
    if (item.level >= 10 || s.coins < cost || s.stones < stones)
      throw Error("金币或强化石不足，强化上限 +10");
    s.coins -= cost;
    s.stones -= stones;
    item.level++;
    return result(item);
  }
  if (a.type === "salvageCommon") {
    const wornIds = new Set(
      Object.values(s.loadouts).flatMap((l) => Object.values(l)),
    );
    const items = s.items.filter(
      (i) =>
        i.quality === 0 && i.level === 0 && !i.locked && !wornIds.has(i.id),
    );
    if (!items.length) throw Error("没有可分解的未强化普通装备");
    const ids = new Set(items.map((i) => i.id));
    s.items = s.items.filter((i) => !ids.has(i.id));
    return result(
      grant(s, { stones: items.length * 2, coins: items.length * 50 }),
    );
  }
  if (a.type === "itemBuy") {
    if (!slots.includes(a.slot)) throw Error("部位无效");
    if (s.coins < 300) throw Error("金币不足");
    s.coins -= 300;
    return result(makeItem(s, { slot: a.slot, set: "stone" }));
  }
  if (a.type === "loadoutAuto") {
    const team = a.id === undefined ? s.team : [a.id];
    if (
      !team.length ||
      !team.every((id) => Number.isInteger(id) && s.collection[id])
    )
      throw Error("请先选择已拥有的英雄");
    const used = new Set(
      Object.entries(s.loadouts)
        .filter(([id]) => !team.includes(+id))
        .flatMap(([, l]) => Object.values(l)),
    );
    for (const id of team) {
      s.loadouts[id] = {};
      for (const slot of slots) {
        const best = s.items
          .filter((i) => i.slot === slot && !used.has(i.id))
          .sort((a, b) => itemPower(b) - itemPower(a))[0];
        if (best) {
          s.loadouts[id][slot] = best.id;
          used.add(best.id);
        }
      }
    }
    return result();
  }
  if (["skillUp", "experienceUse"].includes(a.type)) {
    if (!Number.isInteger(a.id) || !s.collection[a.id])
      throw Error("尚未拥有角色");
    const n = s.skills[a.id] || 0;
    if (a.type === "skillUp") {
      if (n >= 5 || s.books < n + 1 || s.coins < (n + 1) * 200)
        throw Error("技能书或金币不足，技能上限 5 级");
      s.books -= n + 1;
      s.coins -= (n + 1) * 200;
      s.skills[a.id] = n + 1;
    } else {
      if (!s.experience || (s.levels[a.id] || 1) >= 50)
        throw Error("经验药剂不足或已满级");
      s.experience--;
      s.levels[a.id] = Math.min(50, (s.levels[a.id] || 1) + 2);
      ctx.dailyState(s).upgrades++;
    }
    return result();
  }
  if (a.type === "welfare") {
    const w = s.welfare,
      today = day();
    let reward;
    if (a.task === "free") {
      if (w.freeDay === today) throw Error("今日补给已领取");
      w.freeDay = today;
      reward = { tickets: 1, coins: 300, stones: 3 };
    } else if (a.task === "streak") {
      if (w.lastSign === today) throw Error("今日已签到");
      const yesterday = day(Date.now() - 86400000);
      w.streak = w.lastSign === yesterday ? (w.streak % 7) + 1 : 1;
      w.lastSign = today;
      w.totalSigns++;
      reward = {
        gems: w.streak === 7 ? 500 : 100,
        tickets: w.streak === 7 ? 3 : 1,
        coins: 300,
      };
    } else if (a.task === "newcomer") {
      const t = newcomerTasks(s).find((t) => t.id === a.target);
      if (!t || !t.unlocked || t.claimed || t.progress < t.goal)
        throw Error("任务未完成或已领取");
      w.newcomer.push(t.id);
      reward = t.reward;
    } else if (a.task === "achievement") {
      const t = achievements.find((t) => t.id === a.target);
      if (
        !t ||
        w.achievements.includes(t.id) ||
        achievementProgress(s, t) < t.goal
      )
        throw Error("成就未完成或已领取");
      w.achievements.push(t.id);
      reward = t.reward;
    } else throw Error("福利不存在");
    return result(grant(s, reward));
  }
  if (a.type === "rewardAll") {
    const earned = {};
    const collect = (reward) => {
      for (const [k, n] of Object.entries(reward))
        earned[k] = (earned[k] || 0) + n;
    };
    for (const m of mailbox(s))
      if (!m.claimed && !m.expired) {
        s.welfare.claimedMail.push(m.id);
        collect(grant(s, m.reward));
      }
    for (const t of newcomerTasks(s))
      if (t.unlocked && !t.claimed && t.progress >= t.goal) {
        s.welfare.newcomer.push(t.id);
        collect(grant(s, t.reward));
      }
    for (const t of achievements)
      if (
        !s.welfare.achievements.includes(t.id) &&
        achievementProgress(s, t) >= t.goal
      ) {
        s.welfare.achievements.push(t.id);
        collect(grant(s, t.reward));
      }
    if (!Object.keys(earned).length) throw Error("暂无可领取的邮件或成长奖励");
    return result(earned);
  }
  if (a.type === "mailClaim") {
    const m = mailbox(s).find((m) => m.id === a.mail);
    if (!m || m.claimed || m.expired) throw Error("邮件已领取或过期");
    s.welfare.claimedMail.push(m.id);
    return result(grant(s, m.reward));
  }
  if (a.type === "ticketSummon") {
    if (s.tickets < 1) throw Error("召唤券不足");
    // Caller delegates to the existing pity/guarantee implementation; no client-supplied rewards.
    return { handled: false };
  }
  if (a.type === "dungeon") {
    const d = dungeons.find((d) => d.id === a.dungeon),
      tier = a.tier;
    if (
      !d ||
      !Number.isInteger(tier) ||
      tier < 1 ||
      tier > 3 ||
      s.cleared < (tier - 1) * 6
    )
      throw Error("副本难度未解锁");
    const ds = dungeonState(s);
    if ((ds.runs[d.id] || 0) >= 3) throw Error("此副本今日三次奖励已用完");
    if (!s.team.length) throw Error("请先组队");
    let combat;
    if (a.sweep === true) {
      if ((ds.cleared[d.id] || 0) < tier) throw Error("先通关此难度才可扫荡");
      combat = { won: true, sweep: true, events: [], players: [], enemies: [] };
    } else
      combat = ctx.simulateCombat(
        ctx.combatTeam(s),
        Array.from({ length: 3 }, (_, i) => ({
          name: ["秘境守卫", "星晶巨像", "遗迹术士"][i],
          kind: i,
          role: i === 2 ? "法师" : "战士",
          element: ["风", "火", "水"][i],
          power: Math.round((70 + (tier - 1) * 180) / 3),
        })),
        rng,
      );
    const reward = {};
    let item = null;
    if (combat.won) {
      ds.runs[d.id] = (ds.runs[d.id] || 0) + 1;
      ds.cleared[d.id] = Math.max(ds.cleared[d.id] || 0, tier);
      if (d.id === "gold") reward.coins = 1000 * tier;
      if (d.id === "experience") reward.experience = 3 * tier;
      if (d.id === "material") {
        reward.stones = 8 * tier;
        reward.books = tier;
      }
      if (d.id === "equipment")
        item = randomItem(
          s,
          Math.min(3, tier - 1 + (rng() < 0.15 ? 1 : 0)),
          rng,
        );
      grant(s, reward);
    }
    ctx.dailyState(s).battles++;
    return result({
      ...combat,
      dungeon: d.id,
      reward: 0,
      coins: reward.coins || 0,
      loot: { ...reward, ...(item ? { item } : {}) },
    });
  }
  return { handled: false };
}
export function validExpansion(s) {
  if (s.edition === undefined) return true;
  if (
    !s.collection ||
    typeof s.collection !== "object" ||
    Array.isArray(s.collection)
  )
    return false;
  const int = (n, max = Number.MAX_SAFE_INTEGER) =>
    Number.isSafeInteger(n) && n >= 0 && n <= max;
  const rec = (v) => v && typeof v === "object" && !Array.isArray(v);
  if (
    s.edition !== 1 ||
    !["stones", "experience", "books", "tickets", "itemSeq"].every((k) =>
      int(s[k]),
    ) ||
    !Array.isArray(s.items) ||
    !rec(s.loadouts) ||
    !rec(s.skills) ||
    !rec(s.dungeon) ||
    !rec(s.welfare)
  )
    return false;
  if (
    new Set(s.items.map((i) => i.id)).size !== s.items.length ||
    !s.items.every(
      (i) =>
        rec(i) &&
        /^e[1-9]\d*$/.test(i.id) &&
        Number(i.id.slice(1)) <= s.itemSeq &&
        slots.includes(i.slot) &&
        int(i.quality, 3) &&
        int(i.level, 10) &&
        typeof i.locked === "boolean" &&
        typeof i.name === "string" &&
        i.name.length <= 30 &&
        !!sets[i.set],
    )
  )
    return false;
  if (
    s.formation !== undefined &&
    s.formation !== null &&
    !validFormation(s, s.formation)
  )
    return false;
  if (
    s.presets &&
    !s.presets.every(
      (p) => !p || !p.formation || validFormation(s, p.formation, p.team),
    )
  )
    return false;
  const used = new Set();
  for (const [id, l] of Object.entries(s.loadouts)) {
    if (!s.collection[id] || !rec(l)) return false;
    for (const [slot, uid] of Object.entries(l)) {
      if (
        used.has(uid) ||
        !s.items.some((i) => i.id === uid && i.slot === slot)
      )
        return false;
      used.add(uid);
    }
  }
  if (
    !Object.entries(s.skills).every(([id, n]) => s.collection[id] && int(n, 5))
  )
    return false;
  const d = s.dungeon,
    w = s.welfare;
  return (
    typeof d.day === "string" &&
    rec(d.runs) &&
    rec(d.cleared) &&
    Object.entries(d.runs).every(
      ([k, n]) => dungeons.some((d) => d.id === k) && int(n, 3),
    ) &&
    Object.entries(d.cleared).every(
      ([k, n]) => dungeons.some((d) => d.id === k) && int(n, 3),
    ) &&
    int(w.joinedAt) &&
    typeof w.lastSign === "string" &&
    typeof w.freeDay === "string" &&
    int(w.streak, 7) &&
    int(w.totalSigns) &&
    ["newcomer", "achievements", "claimedMail"].every(
      (k) => Array.isArray(w[k]) && new Set(w[k]).size === w[k].length,
    ) &&
    w.newcomer.every((n) => int(n, 7) && n >= 1) &&
    w.achievements.every((k) => achievements.some((a) => a.id === k)) &&
    w.claimedMail.every((k) => k === "welcome-v1")
  );
}
