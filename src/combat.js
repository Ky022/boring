export function formationBonuses(units) {
  const counts = {};
  for (const u of units)
    if (u.faction) counts[u.faction] = (counts[u.faction] || 0) + 1;
  return Object.entries(counts)
    .filter(([, n]) => n >= 3)
    .map(([faction, count]) => ({
      faction,
      count,
      bonus: count >= 5 ? 0.2 : 0.1,
    }));
}
export function simulateCombat(
  attacking,
  defending,
  rng = Math.random,
  pvp = false,
) {
  const make = (units, prefix, hpScale, extra) => {
    const bonuses = formationBonuses(units);
    return units.map((u, i) => {
      const bonus = bonuses.find((b) => b.faction === u.faction)?.bonus || 0;
      const maxHp = Math.round((u.power * hpScale + extra) * (1 + bonus));
      return {
        ...u,
        unitId: prefix + i,
        maxHp,
        hp: maxHp,
        attackBonus: bonus,
        shield: 0,
        burn: null,
        regen: 0,
        stunned: false,
        counter: false,
        revived: false,
        initialHp: maxHp,
      };
    });
  };
  const players = make(attacking, "p", 4, 25),
    enemies = make(defending, "e", pvp ? 4 : 3, pvp ? 25 : 15),
    events = [];
  const emit = (actor, target, round, skill, data) =>
    events.push({
      round,
      actor: actor.unitId,
      target: target.unitId,
      hp: target.hp,
      maxHp: target.maxHp,
      skill,
      side: actor.unitId[0],
      ...data,
    });
  const healing = (actor, target, amount, round, skill, revive = false) => {
    const heal = Math.min(target.maxHp - target.hp, Math.round(amount));
    target.hp += heal;
    if (revive) {
      target.revived = true;
      target.stunned = false;
      target.burn = null;
    }
    emit(actor, target, round, skill, { heal, revive });
  };
  const shielding = (actor, target, amount, round, skill) => {
    target.shield = Math.max(target.shield, Math.round(amount));
    emit(actor, target, round, skill, { shield: target.shield });
  };
  const damage = (actor, target, amount, round, skill, flags = {}) => {
    if (target.hp <= 0) return 0;
    const absorbed = Math.min(target.shield, amount);
    target.shield -= absorbed;
    const dealt = Math.min(target.hp, Math.max(0, amount - absorbed));
    target.hp -= dealt;
    emit(actor, target, round, skill, { damage: dealt, absorbed, ...flags });
    return dealt;
  };
  const hit = (actor, target, multiplier, round, skill, canCounter = true) => {
    if (actor.hp <= 0 || target.hp <= 0) return 0;
    const favored = { 火: "风", 风: "水", 水: "火", 光: "暗", 暗: "光" }[
      actor.element
    ];
    const elemental = favored && favored === target.element ? 1.25 : 1;
    const critical = rng() < 0.15;
    const amount = Math.max(
      1,
      Math.round(
        (actor.power * 0.7 + 2) *
          (0.9 + rng() * 0.2) *
          multiplier *
          (1 + actor.attackBonus) *
          (critical ? 1.5 : 1) *
          elemental *
          (target.role === "骑士" ? 0.78 : 1),
      ),
    );
    const dealt = damage(actor, target, amount, round, skill, {
      critical,
      advantage: elemental > 1,
    });
    if (canCounter && target.counter && target.hp > 0 && actor.hp > 0)
      hit(target, actor, 0.45, round, "守卫反击", false);
    return dealt;
  };
  let rounds = 0;
  for (let round = 1; round <= 20; round++) {
    rounds = round;
    for (const side of [players, enemies]) {
      const opposing = side === players ? enemies : players;
      for (const actor of side) {
        if (actor.hp <= 0) continue;
        if (actor.burn) {
          const b = actor.burn;
          damage(b.source, actor, b.amount, round, "灼烧持续伤害", {
            status: "burn",
          });
          if (--b.turns <= 0) actor.burn = null;
          if (actor.hp <= 0) continue;
        }
        if (actor.regen > 0) {
          healing(actor, actor, actor.power * 0.3, round, "持续恢复");
          actor.regen--;
        }
        if (actor.stunned) {
          actor.stunned = false;
          emit(actor, actor, round, "眩晕 · 跳过行动", { status: "stun" });
          continue;
        }
        const alive = opposing.filter((u) => u.hp > 0);
        if (!alive.length) break;
        const skillRound = round % 3 === 0,
          ability = actor.ability || {},
          effects = ability.effects || [];
        const skill = skillRound ? actor.skill || "蓄力一击" : "普通攻击";
        const allies = () => side.filter((u) => u.hp > 0),
          lowest = () =>
            allies().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (skillRound && actor.role === "骑士")
          for (const ally of allies())
            shielding(
              actor,
              ally,
              actor.power * (ability.shield || 0.65),
              round,
              skill,
            );
        if (skillRound && actor.role === "治疗") {
          const dead = side.find((u) => u.hp <= 0 && !u.revived);
          if (effects.includes("revive") && dead)
            healing(actor, dead, dead.maxHp * 0.35, round, skill, true);
          for (const ally of effects.includes("teamHeal")
            ? allies()
            : [lowest()])
            healing(
              actor,
              ally,
              actor.power * (ability.heal || 0.9) + 12,
              round,
              skill,
            );
        }
        let targets =
          skillRound && actor.role === "法师"
            ? alive
            : skillRound && actor.role === "游侠"
              ? alive.slice(-1)
              : alive.slice(0, 1);
        if (skillRound && effects.includes("chain"))
          targets = alive.slice(0, 2);
        if (skillRound && effects.includes("execute"))
          targets = [
            alive.reduce((a, b) => (a.hp / a.maxHp < b.hp / b.maxHp ? a : b)),
          ];
        const multiplier = skillRound
          ? ability.multiplier ||
            (actor.role === "法师" ? 1.25 : actor.role === "战士" ? 1.6 : 1.2)
          : 1;
        let dealt = 0;
        for (const target of targets) {
          dealt += hit(actor, target, multiplier, round, skill);
          if (skillRound && effects.includes("double") && target.hp > 0)
            dealt += hit(actor, target, 0.65, round, skill + " · 追击");
        }
        if (skillRound && actor.hp > 0) {
          if (effects.includes("drain") && dealt)
            healing(actor, actor, dealt * 0.45, round, skill + " · 吸血");
          if (effects.includes("bless"))
            healing(
              actor,
              lowest(),
              actor.power * 0.7,
              round,
              skill + " · 祝福",
            );
          if (effects.includes("counter")) {
            actor.counter = true;
            emit(actor, actor, round, skill + " · 反击姿态", {
              status: "counter",
            });
          }
          if (effects.includes("guard"))
            for (const ally of allies())
              shielding(
                actor,
                ally,
                actor.power * 0.45,
                round,
                skill + " · 守护",
              );
          if (effects.includes("regen"))
            for (const ally of effects.includes("teamHeal")
              ? allies()
              : [lowest()]) {
              ally.regen = 2;
              emit(actor, ally, round, skill + " · 持续恢复", {
                status: "regen",
              });
            }
          if (effects.includes("purify")) {
            for (const ally of allies()) {
              ally.burn = null;
              ally.stunned = false;
            }
            emit(actor, actor, round, skill + " · 净化", { status: "purify" });
          }
          if (effects.includes("burn"))
            for (const target of targets.filter((u) => u.hp > 0)) {
              target.burn = {
                source: actor,
                amount: Math.round(actor.power * 0.25),
                turns: 2,
              };
              emit(actor, target, round, skill + " · 灼烧", {
                status: "ignite",
              });
            }
          if (effects.includes("break"))
            for (const target of targets.filter((u) => u.hp > 0)) {
              target.shield = 0;
              emit(actor, target, round, skill + " · 破盾", {
                status: "break",
              });
            }
          const controlled = targets.find((u) => u.hp > 0);
          if (
            controlled &&
            ((effects.includes("freeze") && rng() < 0.65) ||
              (!actor.ability && actor.role === "法师" && rng() < 0.25))
          ) {
            controlled.stunned = true;
            emit(actor, controlled, round, skill + " · 束缚", {
              status: "control",
            });
          }
        }
      }
      if (!opposing.some((u) => u.hp > 0)) break;
    }
    if (!players.some((u) => u.hp > 0) || !enemies.some((u) => u.hp > 0)) break;
  }
  const clean = (u) => {
    const { burn, ...rest } = u;
    return rest;
  };
  const stats = [...players, ...enemies].map((u) => ({
    unitId: u.unitId,
    name: u.name,
    id: u.id,
    side: u.unitId[0],
    damage: events
      .filter((e) => e.actor === u.unitId)
      .reduce((n, e) => n + (e.damage || 0), 0),
    healing: events
      .filter((e) => e.actor === u.unitId)
      .reduce((n, e) => n + (e.heal || 0), 0),
    shielding: events
      .filter((e) => e.actor === u.unitId)
      .reduce((n, e) => n + (e.shield || 0), 0),
    taken: events
      .filter((e) => e.target === u.unitId)
      .reduce((n, e) => n + (e.damage || 0), 0),
  }));
  const won = players.some((u) => u.hp > 0) && !enemies.some((u) => u.hp > 0),
    tips = [];
  if (!won) {
    if (!attacking.some((u) => u.role === "治疗"))
      tips.push("队伍缺少治疗，加入治疗英雄提高续航。");
    if (attacking[0]?.role !== "骑士")
      tips.push("把骑士放在第一位，保护输出与治疗。");
    if (attacking.length < 6)
      tips.push("阵容未满六人，可以补上伙伴或借用好友英雄。");
    if (!formationBonuses(attacking).length)
      tips.push("上阵三位同阵营英雄，可激活攻击与生命加成。");
    tips.push("检查敌方属性克制，强化装备或升级英雄后再战。");
  }
  return {
    won,
    dealt: stats
      .filter((u) => u.side === "p")
      .reduce((n, u) => n + u.damage, 0),
    target: enemies.reduce((n, u) => n + u.maxHp, 0),
    rounds,
    events,
    players: players.map(clean),
    enemies: enemies.map(clean),
    stats,
    tips,
    synergies: formationBonuses(attacking),
  };
}
