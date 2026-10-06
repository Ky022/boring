import { simulateCombat, formationBonuses } from "./combat.js";
export { simulateCombat, formationBonuses } from "./combat.js";
export const rarities = {
  R: { rate: 70, color: "#8daac3", power: 24 },
  SR: { rate: 24, color: "#bb8fff", power: 42 },
  SSR: { rate: 5, color: "#ffc766", power: 68 },
  UR: { rate: 1, color: "#ff87b7", power: 100 },
};
export const heroes = [
  ["露米", "月光祭司", "☾", "UR", "法师", "月华审判"],
  ["烬", "焰羽剑圣", "♜", "UR", "战士", "焰羽斩"],
  ["绯夜", "暮色游侠", "➶", "SSR", "游侠", "暗影追猎"],
  ["白霜", "霜境女王", "❄", "SSR", "法师", "冰晶风暴"],
  ["雷恩", "雷鸣骑士", "ϟ", "SSR", "骑士", "雷霆冲锋"],
  ["紫苑", "秘术学者", "✧", "SR", "法师", "奥术星阵"],
  ["青岚", "风之旅人", "༄", "SR", "游侠", "风刃回旋"],
  ["珊瑚", "潮汐医师", "❀", "SR", "治疗", "潮汐祝福"],
  ["艾可", "森林守卫", "♧", "R", "游侠", "荆棘箭雨"],
  ["罗伊", "见习剑士", "⚔", "R", "战士", "勇气一击"],
  ["米娅", "星灯使者", "✦", "R", "治疗", "星灯祈愿"],
  ["诺亚", "石盾卫士", "⬡", "R", "骑士", "坚岩守护"],
  ["索拉", "黎明龙骑", "☀", "UR", "骑士", "龙翼圣盾"],
  ["夜璃", "星渊魔女", "✧", "UR", "法师", "星渊禁锢"],
  ["芙蕾", "生命神谕", "❀", "UR", "治疗", "万物复苏"],
  ["塞恩", "风暴枪王", "ϟ", "UR", "游侠", "雷暴穿刺"],
  ["赤羽", "火山武姬", "♜", "SSR", "战士", "熔岩破阵"],
  ["澄月", "潮歌巫女", "☾", "SSR", "治疗", "海月祈愿"],
  ["赫墨", "沙漠守望", "⬡", "SSR", "骑士", "砂岩壁垒"],
  ["银叶", "雪林猎手", "➶", "SSR", "游侠", "霜叶追击"],
  ["伊朵", "花灵术士", "❀", "SSR", "法师", "花海结界"],
  ["玄鸦", "暗夜刺客", "✦", "SSR", "游侠", "黑羽突袭"],
  ["贝尔", "机巧少女", "⚙", "SR", "游侠", "齿轮连射"],
  ["卡洛", "烈焰拳师", "♜", "SR", "战士", "烈火连拳"],
  ["雅娜", "冰湖修女", "❄", "SR", "治疗", "冰泉赐福"],
  ["欧文", "铜甲卫长", "⬡", "SR", "骑士", "铜墙守护"],
  ["莉塔", "风铃法师", "✧", "SR", "法师", "风铃共鸣"],
  ["墨菲", "影刃佣兵", "⚔", "SR", "战士", "影刃闪击"],
  ["琥珀", "灯塔医者", "✦", "SR", "治疗", "暖光治愈"],
  ["菲恩", "荒野斥候", "➶", "SR", "游侠", "猎鹰标记"],
  ["可可", "蘑菇学徒", "♧", "R", "法师", "孢子弹"],
  ["巴克", "矿山护卫", "⬡", "R", "骑士", "矿石护盾"],
  ["桃桃", "村庄药师", "❀", "R", "治疗", "草药香气"],
  ["莱特", "沙丘弓手", "➶", "R", "游侠", "飞砂箭"],
  ["阿炎", "锻炉少年", "⚔", "R", "战士", "火星斩"],
  ["瑞雪", "雪乡旅者", "❄", "R", "法师", "雪花术"],
  ["波波", "海港水手", "♜", "R", "战士", "浪涛击"],
  ["妮娜", "林间歌者", "♧", "R", "治疗", "林间小调"],
].map(([name, title, icon, rarity, role, skill], id) => ({
  id,
  name,
  title,
  icon,
  rarity,
  role,
  skill,
  element: [
    "光",
    "火",
    "暗",
    "水",
    "风",
    "暗",
    "风",
    "水",
    "风",
    "火",
    "光",
    "水",
  ][id % 12],
  faction: ["星灯圣域", "焰羽联盟", "暮影议会", "霜潮王庭", "风林旅团"][
    { 光: 0, 火: 1, 暗: 2, 水: 3, 风: 4 }[
      ["光", "火", "暗", "水", "风", "暗", "风", "水", "风", "火", "光", "水"][
        id % 12
      ]
    ]
  ],
  story: `${name}来自${["星灯镇", "熔火山脉", "暮影森林", "霜月海岸"][id % 4]}，为了守护失落的星灯，加入了冒险者小队。`,
}));
const skillEffects = {
  bless: "祝福最低生命队友",
  burn: "附加两次灼烧",
  drain: "恢复伤害的45%生命",
  freeze: "65%概率使一名敌人跳过一次行动",
  counter: "进入反击姿态",
  break: "打碎目标护盾",
  double: "追加65%追击",
  execute: "锁定生命比例最低敌人",
  regen: "持续恢复两次",
  purify: "净化全队灼烧与控制",
  guard: "为全队额外提供护盾",
  revive: "复活一位未复活过的伙伴",
  teamHeal: "治疗全队",
};
const skillConfigs = [
  [["bless"], 1.2],
  [["burn"], 1.65],
  [["drain"], 1.3],
  [["freeze"], 1.15],
  [["counter"], 1.25],
  [["break"], 1.35],
  [["double"], 1.15],
  [["regen"], 1.1],
  [["double"], 1.05],
  [["execute"], 1.75],
  [["purify"], 1.0],
  [["counter"], 1.0],
  [["counter", "guard"], 1.2],
  [["freeze", "drain"], 1.2],
  [["revive", "teamHeal"], 0.9],
  [["chain", "double"], 1.25],
  [["burn", "break"], 1.6],
  [["teamHeal", "purify"], 1.0],
  [["counter", "regen"], 1.1],
  [["freeze"], 1.35],
  [["guard", "bless"], 1.05],
  [["execute", "drain"], 1.45],
  [["chain"], 1.4],
  [["double", "burn"], 1.45],
  [["regen", "purify"], 1.0],
  [["guard"], 1.15],
  [["bless", "freeze"], 1.1],
  [["break", "drain"], 1.6],
  [["guard", "regen"], 1.0],
  [["execute", "double"], 1.2],
  [["burn"], 1.15],
  [["guard", "break"], 1.0],
  [["regen"], 1.0],
  [["break", "chain"], 1.1],
  [["burn", "execute"], 1.4],
  [["freeze", "guard"], 1.0],
  [["drain", "chain"], 1.25],
  [["teamHeal", "regen"], 0.9],
];
for (const h of heroes) {
  const [effects, multiplier] = skillConfigs[h.id];
  h.ability = {
    effects,
    multiplier,
    heal: h.id === 14 ? 0.8 : 0.9,
    shield: h.id === 12 ? 0.85 : 0.65,
  };
  h.skillDescription =
    effects.map((e) => skillEffects[e]).join("；") + "。每三回合释放。";
}
export const chapters = [
  "萤火森林",
  "月影古城",
  "流沙秘境",
  "霜雪之巅",
  "熔火火山",
  "潮汐海港",
  "天空群岛",
  "暮影城堡",
  "远古遗迹",
  "冰晶迷宫",
  "星渊裂隙",
  "黎明圣域",
];
export const maxStage = 36;
export const gear = [
  {
    id: "iron",
    name: "铁星长剑",
    slot: "weapon",
    bonus: 12,
    cost: 300,
    icon: "⚔",
    rarity: "R",
  },
  {
    id: "bow",
    name: "逐风长弓",
    slot: "weapon",
    bonus: 24,
    cost: 700,
    icon: "➶",
    rarity: "SR",
  },
  {
    id: "moon",
    name: "月华法杖",
    slot: "weapon",
    bonus: 42,
    cost: 1500,
    icon: "☾",
    rarity: "SSR",
  },
  {
    id: "charm",
    name: "星灯护符",
    slot: "charm",
    bonus: 8,
    cost: 250,
    icon: "✦",
    rarity: "R",
  },
  {
    id: "crystal",
    name: "霜晶吊坠",
    slot: "charm",
    bonus: 20,
    cost: 600,
    icon: "❄",
    rarity: "SR",
  },
  {
    id: "crown",
    name: "黎明王冠",
    slot: "charm",
    bonus: 35,
    cost: 1200,
    icon: "♛",
    rarity: "SSR",
  },
];
export function fresh() {
  return {
    version: 2,
    gems: 3000,
    coins: 1000,
    pity: 0,
    collection: { 8: 1, 9: 1, 10: 1 },
    team: [8, 9, 10],
    stage: 1,
    cleared: 0,
    levels: {},
    inventory: [],
    equipment: {},
    arenaDay: "",
    arenaAttempts: 0,
    idleClaimAt: Date.now(),
    stars: {},
    forge: {},
    tower: 0,
    eliteCleared: [],
    presets: [null, null, null],
    supportHero: null,
    supportDay: "",
    supportUses: 0,
    daily: {
      day: "",
      summons: 0,
      battles: 0,
      upgrades: 0,
      claimed: [],
      signed: false,
    },
  };
}
export function migrate(s) {
  if (s?.version === 1) {
    const next = { ...fresh(), ...s, version: 2 };
    return validSave(next) ? next : null;
  }
  const next =
    s?.version === 2
      ? { ...fresh(), ...s, idleClaimAt: s.idleClaimAt ?? Date.now() }
      : s;
  return validSave(next) ? next : null;
}
export function summon(state, count, rng = Math.random) {
  if (![1, 10].includes(count) || state.gems < count * 150)
    throw new Error("星钻不足");
  dailyState(state).summons += count;
  state.gems -= count * 150;
  const result = [];
  for (let i = 0; i < count; i++) {
    state.pity++;
    const roll = rng() * 100;
    let rarity = roll < 1 ? "UR" : roll < 6 ? "SSR" : roll < 30 ? "SR" : "R";
    if (state.pity >= 50 && !["SSR", "UR"].includes(rarity)) rarity = "SSR";
    if (
      count === 10 &&
      i === 9 &&
      result.every((h) => h.rarity === "R") &&
      rarity === "R"
    )
      rarity = "SR";
    if (rarity === "SSR" || rarity === "UR") state.pity = 0;
    const pool = heroes.filter((h) => h.rarity === rarity);
    const h = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
    state.collection[h.id] = (state.collection[h.id] || 0) + 1;
    result.push(h);
  }
  return result;
}
export function level(state, id) {
  return state.levels?.[id] || 1;
}
export function power(state, id) {
  const equipped = Object.values(state.equipment?.[id] || {}).reduce(
    (n, item) =>
      n +
      (gear.find((g) => g.id === item)?.bonus || 0) +
      (state.forge?.[item] || 0) * 6,
    0,
  );
  return (
    rarities[heroes[id].rarity].power +
    Math.min(10, (state.collection[id] || 1) - 1) * 8 +
    (level(state, id) - 1) * 5 +
    equipped +
    (state.stars?.[id] || 0) * 60
  );
}
export function teamPower(state) {
  return state.team.reduce((n, id) => n + power(state, id), 0);
}
export function upgradeCost(state, id) {
  return level(state, id) * 100;
}
export function upgrade(state, id) {
  if (!Number.isInteger(id) || !heroes[id] || !state.collection[id])
    throw new Error("尚未拥有角色");
  if (level(state, id) >= 50) throw new Error("已达到 50 级上限");
  const cost = upgradeCost(state, id);
  if (state.coins < cost) throw new Error("金币不足");
  dailyState(state).upgrades++;
  state.coins -= cost;
  state.levels[id] = level(state, id) + 1;
  return { id, level: state.levels[id], cost };
}
export function buyGear(state, item) {
  const g = gear.find((g) => g.id === item);
  if (!g) throw new Error("装备不存在");
  if (state.coins < g.cost) throw new Error("金币不足");
  state.coins -= g.cost;
  state.inventory.push(item);
  return g;
}
export function equip(state, id, item, slot) {
  if (!Number.isInteger(id) || !heroes[id] || !state.collection[id])
    throw new Error("尚未拥有角色");
  state.equipment[id] ??= {};
  if (item === null) {
    if (!["weapon", "charm"].includes(slot)) throw new Error("装备栏无效");
    delete state.equipment[id][slot];
    return;
  }
  const g = gear.find((g) => g.id === item);
  if (!g) throw new Error("装备不存在");
  if (state.equipment[id][g.slot] === item) return;
  const total = state.inventory.filter((x) => x === item).length;
  const used = Object.values(state.equipment).filter(
    (e) => e[g.slot] === item,
  ).length;
  if (total <= used) throw new Error("没有空闲装备，请先从其他角色卸下");
  state.equipment[id][g.slot] = item;
}
export function idleReward(state, now = Date.now()) {
  const minutes = Math.min(
    480,
    Math.floor(Math.max(0, now - (state.idleClaimAt ?? now)) / 60000),
  );
  return {
    minutes,
    coins: minutes * (5 + state.cleared * 2),
    gems: Math.floor(minutes / 5),
  };
}
export function claimIdle(state, now = Date.now()) {
  const reward = idleReward(state, now);
  if (!reward.minutes) throw new Error("暂时没有放置收益，请至少等待一分钟");
  state.coins += reward.coins;
  state.gems += reward.gems;
  state.idleClaimAt = now - ((now - state.idleClaimAt) % 60000);
  return reward;
}
export function enemyPower(stage) {
  return 45 + stage * 25;
}
export function battle(
  state,
  rng = Math.random,
  support = null,
  elite = false,
) {
  if (!state.team.length) throw new Error("请先编成队伍");
  if (elite && state.stage > state.cleared)
    throw new Error("精英关卡需要先通关主线");
  dailyState(state).battles++;
  const attacking = combatTeam(state, support);
  const result = simulateCombat(
    attacking,
    stageEnemies(state.stage, elite),
    rng,
  );
  let reward = 0,
    coins = 0;
  if (result.won) {
    if (elite) {
      state.eliteCleared ??= [];
      const first = !state.eliteCleared.includes(state.stage);
      reward = first ? 150 : 20;
      coins = first ? 600 + state.stage * 20 : 180 + state.stage * 10;
      if (first) state.eliteCleared.push(state.stage);
    } else {
      reward = state.stage > state.cleared ? 350 : 60;
      coins =
        state.stage > state.cleared
          ? 350 + Math.max(0, state.stage - 12) * 20
          : 120 + Math.max(0, state.stage - 12) * 5;
      state.cleared = Math.max(state.cleared, state.stage);
    }
    state.gems += reward;
    state.coins += coins;
  }
  return {
    ...result,
    reward,
    coins,
    stage: state.stage,
    elite,
    boss: state.stage % 3 === 0,
  };
}

export function applyAction(state, action, rng = Math.random, support = null) {
  switch (action.type) {
    case "autoEquip":
      return autoEquip(state);
    case "presetSave":
      return savePreset(state, action.slot, action.name);
    case "presetLoad":
      return loadPreset(state, action.slot);
    case "shareHero":
      if (
        !Number.isInteger(action.id) ||
        !heroes[action.id] ||
        !state.collection[action.id]
      )
        throw new Error("尚未拥有角色");
      state.supportHero = action.id;
      return { id: action.id };
    case "elite":
      return battle(state, rng, support, true);
    case "star":
      return starUp(state, action.id);
    case "forge":
      return forgeUp(state, action.item);
    case "daily":
      return claimDaily(state, action.task);
    case "tower":
      return towerBattle(state, rng, support);
    case "summon":
      return summon(state, action.count, rng);
    case "upgrade":
      return upgrade(state, action.id);
    case "buy":
      return buyGear(state, action.item);
    case "equip":
      return equip(state, action.id, action.item, action.slot) ?? null;
    case "team":
      if (
        !Array.isArray(action.team) ||
        action.team.length > 6 ||
        new Set(action.team).size !== action.team.length ||
        !action.team.every(
          (id) => Number.isInteger(id) && heroes[id] && state.collection[id],
        )
      )
        throw new Error("队伍无效");
      state.team = action.team;
      return null;
    case "stage":
      if (
        !Number.isInteger(action.stage) ||
        action.stage < 1 ||
        action.stage > Math.min(maxStage, state.cleared + 1)
      )
        throw new Error("关卡尚未解锁");
      state.stage = action.stage;
      return null;
    case "idle":
      return claimIdle(state);
    case "battle":
      return battle(state, rng, support);
    default:
      throw new Error("操作无效");
  }
}
function record(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}
export function validSave(s) {
  if (
    !(
      s &&
      s.version === 2 &&
      Number.isSafeInteger(s.gems) &&
      s.gems >= 0 &&
      Number.isSafeInteger(s.coins) &&
      s.coins >= 0 &&
      Number.isInteger(s.pity) &&
      s.pity >= 0 &&
      s.pity < 50 &&
      Number.isInteger(s.stage) &&
      s.stage >= 1 &&
      s.stage <= maxStage &&
      Number.isInteger(s.cleared) &&
      s.cleared >= 0 &&
      s.cleared <= maxStage &&
      s.stage <= Math.min(maxStage, s.cleared + 1) &&
      record(s.collection) &&
      Object.entries(s.collection).every(
        ([id, n]) =>
          String(Number(id)) === id &&
          heroes[Number(id)] &&
          Number.isSafeInteger(n) &&
          n > 0,
      ) &&
      Array.isArray(s.team) &&
      s.team.length <= 6 &&
      new Set(s.team).size === s.team.length &&
      s.team.every(
        (id) => Number.isInteger(id) && heroes[id] && s.collection[id],
      ) &&
      (s.stars === undefined ||
        (record(s.stars) &&
          Object.entries(s.stars).every(
            ([id, n]) =>
              s.collection[id] && Number.isInteger(n) && n >= 0 && n <= 5,
          ))) &&
      (s.forge === undefined ||
        (record(s.forge) &&
          Array.isArray(s.inventory) &&
          Object.entries(s.forge).every(
            ([id, n]) =>
              s.inventory.includes(id) &&
              Number.isInteger(n) &&
              n >= 0 &&
              n <= 10,
          ))) &&
      (s.tower === undefined ||
        (Number.isInteger(s.tower) && s.tower >= 0 && s.tower <= 30)) &&
      (s.daily === undefined ||
        (record(s.daily) &&
          typeof s.daily.day === "string" &&
          ["summons", "battles", "upgrades"].every(
            (k) => Number.isSafeInteger(s.daily[k]) && s.daily[k] >= 0,
          ) &&
          Array.isArray(s.daily.claimed) &&
          new Set(s.daily.claimed).size === s.daily.claimed.length &&
          s.daily.claimed.every((k) =>
            ["summon", "battle", "upgrade"].includes(k),
          ) &&
          typeof s.daily.signed === "boolean")) &&
      (s.eliteCleared === undefined ||
        (Array.isArray(s.eliteCleared) &&
          new Set(s.eliteCleared).size === s.eliteCleared.length &&
          s.eliteCleared.every(
            (n) => Number.isInteger(n) && n >= 1 && n <= s.cleared,
          ))) &&
      (s.presets === undefined ||
        (Array.isArray(s.presets) &&
          s.presets.length === 3 &&
          s.presets.every(
            (p) =>
              p === null ||
              (record(p) &&
                typeof p.name === "string" &&
                p.name.length <= 12 &&
                validTeam(s, p.team)),
          ))) &&
      (s.supportHero === undefined ||
        s.supportHero === null ||
        (Number.isInteger(s.supportHero) && !!s.collection[s.supportHero])) &&
      (s.supportDay === undefined || typeof s.supportDay === "string") &&
      (s.supportUses === undefined ||
        (Number.isInteger(s.supportUses) &&
          s.supportUses >= 0 &&
          s.supportUses <= 3)) &&
      record(s.levels) &&
      Object.entries(s.levels).every(
        ([id, n]) =>
          s.collection[id] && Number.isInteger(n) && n >= 1 && n <= 50,
      ) &&
      Array.isArray(s.inventory) &&
      s.inventory.every((item) => gear.some((g) => g.id === item)) &&
      record(s.equipment) &&
      typeof s.arenaDay === "string" &&
      Number.isInteger(s.arenaAttempts) &&
      s.arenaAttempts >= 0 &&
      s.arenaAttempts <= 5 &&
      (s.idleClaimAt === undefined ||
        (Number.isSafeInteger(s.idleClaimAt) && s.idleClaimAt >= 0))
    )
  )
    return false;
  const used = {};
  for (const [id, slots] of Object.entries(s.equipment)) {
    if (!s.collection[id] || !record(slots)) return false;
    for (const [slot, item] of Object.entries(slots)) {
      if (!gear.some((g) => g.id === item && g.slot === slot)) return false;
      used[item] = (used[item] || 0) + 1;
    }
  }
  return Object.entries(used).every(
    ([item, n]) => s.inventory.filter((x) => x === item).length >= n,
  );
}

export const dailyTasks = [
  {
    id: "summon",
    key: "summons",
    goal: 3,
    name: "召唤三位伙伴",
    gems: 100,
    coins: 200,
  },
  {
    id: "battle",
    key: "battles",
    goal: 3,
    name: "挑战主线三次",
    gems: 100,
    coins: 300,
  },
  {
    id: "upgrade",
    key: "upgrades",
    goal: 1,
    name: "升级一位英雄",
    gems: 50,
    coins: 200,
  },
];
export function dailyState(state, now = Date.now()) {
  const day = new Date(now).toISOString().slice(0, 10);
  if (state.daily?.day !== day)
    state.daily = {
      day,
      summons: 0,
      battles: 0,
      upgrades: 0,
      claimed: [],
      signed: false,
    };
  return state.daily;
}
export function claimDaily(state, task) {
  const d = dailyState(state);
  if (task === "signin") {
    if (d.signed) throw new Error("今日已经签到");
    d.signed = true;
    state.gems += 150;
    state.coins += 300;
    return { gems: 150, coins: 300 };
  }
  const t = dailyTasks.find((t) => t.id === task);
  if (!t || d.claimed.includes(task) || d[t.key] < t.goal)
    throw new Error("任务未完成或已领取");
  d.claimed.push(task);
  state.gems += t.gems;
  state.coins += t.coins;
  return t;
}
export function starCost(state, id) {
  return {
    copies: (state.stars?.[id] || 0) + 1,
    coins: ((state.stars?.[id] || 0) + 1) * 500,
  };
}
export function starUp(state, id) {
  if (!Number.isInteger(id) || !heroes[id] || !state.collection[id])
    throw new Error("尚未拥有角色");
  state.stars ??= {};
  if ((state.stars[id] || 0) >= 5) throw new Error("已经达到五星");
  const cost = starCost(state, id);
  if (state.collection[id] <= cost.copies || state.coins < cost.coins)
    throw new Error("升星需要重复角色与金币，保留最后一位");
  const before = power(state, id);
  state.collection[id] -= cost.copies;
  state.coins -= cost.coins;
  state.stars[id] = (state.stars[id] || 0) + 1;
  return { id, stars: state.stars[id], gain: power(state, id) - before };
}
export function forgeUp(state, item) {
  const g = gear.find((g) => g.id === item);
  if (!g || !state.inventory.includes(item)) throw new Error("尚未拥有装备");
  state.forge ??= {};
  const n = state.forge[item] || 0,
    cost = (n + 1) * 200;
  if (n >= 10 || state.coins < cost)
    throw new Error("金币不足或装备已强化到十级");
  state.coins -= cost;
  state.forge[item] = n + 1;
  return { name: g.name, level: n + 1 };
}
export function towerBattle(state, rng = Math.random, support = null) {
  if (!state.team.length) throw new Error("请先编成队伍");
  if ((state.tower || 0) >= 30) throw new Error("已通关三十层星灯塔");
  const floor = (state.tower || 0) + 1,
    total = 65 + floor * 35;
  const result = simulateCombat(
    combatTeam(state, support),
    Array.from({ length: 3 }, (_, i) => ({
      name: ["塔影卫兵", "星石守卫", "秘境术士"][i],
      kind: i,
      role: i === 2 ? "法师" : "战士",
      element: ["火", "水", "风"][i],
      power: Math.round(total / 3),
    })),
    rng,
  );
  const reward = result.won ? 100 + floor * 5 : 0,
    coins = result.won ? 200 + floor * 25 : 0;
  if (result.won) {
    state.tower = floor;
    state.gems += reward;
    state.coins += coins;
  }
  return { ...result, reward, coins, floor };
}

function validTeam(state, team) {
  return (
    Array.isArray(team) &&
    team.length <= 6 &&
    new Set(team).size === team.length &&
    team.every(
      (id) => Number.isInteger(id) && heroes[id] && state.collection[id],
    )
  );
}
export function autoEquip(state) {
  if (!state.team.length) throw new Error("请先编成队伍");
  const counts = {};
  for (const item of state.inventory) counts[item] = (counts[item] || 0) + 1;
  const next = structuredClone(state.equipment);
  for (const [id, slots] of Object.entries(next)) {
    if (state.team.includes(Number(id))) delete next[id];
    else for (const item of Object.values(slots)) counts[item]--;
  }
  for (const id of state.team) {
    next[id] = {};
    for (const slot of ["weapon", "charm"]) {
      const best = gear
        .filter((g) => g.slot === slot && counts[g.id] > 0)
        .sort(
          (a, b) =>
            b.bonus +
            (state.forge?.[b.id] || 0) * 6 -
            (a.bonus + (state.forge?.[a.id] || 0) * 6),
        )[0];
      if (best) {
        next[id][slot] = best.id;
        counts[best.id]--;
      }
    }
  }
  state.equipment = next;
  return { power: teamPower(state) };
}
export function savePreset(state, slot, name) {
  if (!Number.isInteger(slot) || slot < 0 || slot > 2 || !state.team.length)
    throw new Error("请选择有效阵容槽并编成队伍");
  const label = String(name || `阵容 ${slot + 1}`).trim();
  if (!label || label.length > 12) throw new Error("阵容名称需要1至12字");
  state.presets ??= [null, null, null];
  state.presets[slot] = { name: label, team: [...state.team] };
  return state.presets[slot];
}
export function loadPreset(state, slot) {
  if (
    !Number.isInteger(slot) ||
    slot < 0 ||
    slot > 2 ||
    !state.presets?.[slot] ||
    !validTeam(state, state.presets[slot].team)
  )
    throw new Error("没有可用的阵容预设");
  state.team = [...state.presets[slot].team];
  return { name: state.presets[slot].name };
}
export function combatTeam(state, support = null) {
  const units = state.team.map((id) => ({
    ...heroes[id],
    power: power(state, id),
  }));
  if (support) {
    if (units.length === 6) units.pop();
    units.push({ ...support, support: true });
  }
  return units;
}
export function stageEnemies(stage, elite = false) {
  const total = enemyPower(stage) * (elite ? 1.5 : 1),
    chapter = Math.floor((stage - 1) / 3),
    boss = stage % 3 === 0;
  const mechanics = [
    {
      name: "荆棘巨树",
      effects: ["counter"],
      role: "骑士",
      element: "风",
      hint: "巨树释放护盾并反击，试着使用破盾与治疗。",
    },
    {
      name: "暮影领主",
      effects: ["drain"],
      role: "战士",
      element: "暗",
      hint: "领主会吸血，集中输出尽快击败。",
    },
    {
      name: "砂岩巨像",
      effects: ["guard", "break"],
      role: "骑士",
      element: "火",
      hint: "巨像保护自己并破盾，水属性输出有优势。",
    },
    {
      name: "寒霜女妖",
      effects: ["freeze"],
      role: "法师",
      element: "水",
      hint: "女妖群攻并束缚，净化与风属性伙伴可以应对。",
    },
    {
      name: "熔岩暴君",
      effects: ["burn"],
      role: "法师",
      element: "火",
      hint: "暴君施加灼烧，带净化英雄与水属性输出。",
    },
    {
      name: "深海祭司",
      effects: ["teamHeal", "regen"],
      role: "治疗",
      element: "水",
      hint: "祭司持续恢复，培养输出或控制打断行动。",
    },
  ];
  const spec = mechanics[chapter % mechanics.length];
  if (boss)
    return [
      {
        ...spec,
        kind: 2,
        power: Math.round(total),
        skill: spec.name + " · 秘技",
        ability: { effects: spec.effects, multiplier: 1.35 },
      },
    ];
  return Array.from({ length: 3 }, (_, i) => ({
    name: elite
      ? ["精英斥候", "精英守卫", "精英术士"][i]
      : ["荆棘史莱姆", "荒林哥布林", "石甲卫士"][i],
    kind: i,
    role: elite && i === 2 ? "法师" : "战士",
    element: ["风", "火", "水"][i],
    power: Math.round(total / 3),
    skill: elite ? "精英秘术" : "荒野重击",
    ability: elite
      ? { effects: i === 2 ? ["burn"] : [], multiplier: 1.3 }
      : undefined,
  }));
}
