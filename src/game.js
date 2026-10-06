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
].map(([name, title, icon, rarity, role, skill], id) => ({
  id,
  name,
  title,
  icon,
  rarity,
  role,
  skill,
}));
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
  };
}
export function migrate(s) {
  if (s?.version === 1) {
    const next = { ...fresh(), ...s, version: 2 };
    return validSave(next) ? next : null;
  }
  const next=s?.version===2?{...s,idleClaimAt:s.idleClaimAt??Date.now()}:s;
  return validSave(next) ? next : null;
}
export function summon(state, count, rng = Math.random) {
  if (![1, 10].includes(count) || state.gems < count * 150)
    throw new Error("星钻不足");
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
    (n, item) => n + (gear.find((g) => g.id === item)?.bonus || 0),
    0,
  );
  return (
    rarities[heroes[id].rarity].power +
    Math.min(10, (state.collection[id] || 1) - 1) * 8 +
    (level(state, id) - 1) * 5 +
    equipped
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
export function idleReward(state,now=Date.now()){
 const minutes=Math.min(480,Math.floor(Math.max(0,now-(state.idleClaimAt??now))/60000));
 return {minutes,coins:minutes*(5+state.cleared*2),gems:Math.floor(minutes/5)};
}
export function claimIdle(state,now=Date.now()){
 const reward=idleReward(state,now);if(!reward.minutes)throw new Error('暂时没有放置收益，请至少等待一分钟');
 state.coins+=reward.coins;state.gems+=reward.gems;state.idleClaimAt=now-((now-state.idleClaimAt)%60000);return reward;
}
export function enemyPower(stage) {
  return 45 + stage * 25;
}
export function simulateCombat(attacking, defending, rng=Math.random, pvp=false) {
  const players=attacking.map((unit,i)=>({...unit,unitId:'p'+i,maxHp:Math.round(unit.power*4+25),hp:Math.round(unit.power*4+25)}));
  const enemies=defending.map((unit,i)=>({...unit,unitId:'e'+i,maxHp:Math.round(unit.power*(pvp?4:3)+(pvp?25:15)),hp:Math.round(unit.power*(pvp?4:3)+(pvp?25:15))}));
  const events=[];
  const hit=(actor,target,multiplier,skill)=>{const critical=rng()<.15;const raw=Math.round((actor.power*.7+2)*(.9+rng()*.2)*multiplier*(critical?1.5:1));const damage=Math.min(target.hp,Math.max(1,Math.round(raw*(target.role==='骑士'?.78:1))));target.hp-=damage;events.push({actor:actor.unitId,target:target.unitId,damage,hp:target.hp,maxHp:target.maxHp,critical,skill,side:actor.unitId[0]});};
  let rounds=0;
  for(let round=1;round<=20;round++){
    rounds=round;
    for(const side of [players,enemies]){
      const opponents=side===players?enemies:players;
      for(const actor of side){
        if(actor.hp<=0)continue;
        const alive=opponents.filter(u=>u.hp>0);if(!alive.length)break;
        const skillRound=round%3===0;
        if(skillRound&&actor.role==='治疗'){
          const ally=side.filter(u=>u.hp>0).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];const heal=Math.min(ally.maxHp-ally.hp,Math.round(actor.power*.9+12));ally.hp+=heal;events.push({actor:actor.unitId,target:ally.unitId,heal,hp:ally.hp,maxHp:ally.maxHp,skill:actor.skill||'恢复之光',side:actor.unitId[0]});
        }
        const multiplier=skillRound?(actor.role==='法师'?1.25:actor.role==='战士'?1.6:1.2):1;
        const targets=skillRound&&actor.role==='法师'?alive:alive.slice(0,1);
        for(const target of targets)hit(actor,target,multiplier,skillRound?(actor.skill||'蓄力一击'):'普通攻击');
      }
      if(!opponents.some(u=>u.hp>0))break;
    }
    if(!players.some(u=>u.hp>0)||!enemies.some(u=>u.hp>0))break;
  }
  return {won:players.some(u=>u.hp>0)&&!enemies.some(u=>u.hp>0),dealt:events.filter(e=>e.side==='p').reduce((n,e)=>n+(e.damage||0),0),target:enemies.reduce((n,u)=>n+u.maxHp,0),rounds,events,players,enemies};
}
export function battle(state,rng=Math.random){
 if(!state.team.length)throw new Error('请先编成队伍');
 const attacking=state.team.map(id=>({...heroes[id],power:power(state,id)}));
 const total=enemyPower(state.stage);
 const defending=Array.from({length:state.stage%3===0?1:3},(_,i)=>({name:state.stage%3===0?'星境守卫':['荆棘史莱姆','荒林哥布林','石甲卫士'][i],kind:state.stage%3===0?2:i,role:'战士',power:Math.round(total/(state.stage%3===0?1:3)),skill:'荒野重击'}));
 const result=simulateCombat(attacking,defending,rng);
 let reward=0,coins=0;
 if(result.won){reward=state.stage>state.cleared?350:60;coins=state.stage>state.cleared?350:120;state.gems+=reward;state.coins+=coins;state.cleared=Math.max(state.cleared,state.stage);}
 return {...result,reward,coins};
}
export function applyAction(state, action, rng = Math.random) {
  switch (action.type) {
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
        action.stage > Math.min(12, state.cleared + 1)
      )
        throw new Error("关卡尚未解锁");
      state.stage = action.stage;
      return null;
    case "idle":
      return claimIdle(state);
    case "battle":
      return battle(state, rng);
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
      s.stage <= 12 &&
      Number.isInteger(s.cleared) &&
      s.cleared >= 0 &&
      s.cleared <= 12 &&
      s.stage <= Math.min(12, s.cleared + 1) &&
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
      (s.idleClaimAt===undefined||(Number.isSafeInteger(s.idleClaimAt)&&s.idleClaimAt>=0))
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
