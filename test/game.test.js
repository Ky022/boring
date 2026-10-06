import test from "node:test";
import assert from "node:assert/strict";
import { fresh, summon, battle, power, validSave } from "../src/game.js";
test("new game has an owned playable team and valid save", () => {
  const s = fresh();
  assert.equal(s.team.length, 3);
  assert.ok(validSave(s));
});
test("ten pulls cost 1500 and guarantee SR or higher", () => {
  const s = fresh();
  const pulls = summon(s, 10, () => 0.99);
  assert.equal(s.gems, 1500);
  assert.equal(pulls.length, 10);
  assert.equal(pulls.at(-1).rarity, "SR");
  assert.equal(pulls.filter((h) => h.rarity === "R").length, 9);
});
test("50th pull guarantees SSR and resets pity", () => {
  const s = fresh();
  s.pity = 49;
  assert.equal(summon(s, 1, () => 0.99)[0].rarity, "SSR");
  assert.equal(s.pity, 0);
});
test("UR pull resets pity and duplicates improve power", () => {
  const s = fresh();
  s.pity = 12;
  const h = summon(s, 1, () => 0)[0];
  assert.equal(h.rarity, "UR");
  assert.equal(s.pity, 0);
  const before = power(s, h.id);
  summon(s, 1, () => 0);
  assert.equal(power(s, h.id), before + 8);
});
test("insufficient gems changes nothing", () => {
  const s = fresh();
  s.gems = 0;
  const before = structuredClone(s);
  assert.throws(() => summon(s, 10));
  assert.deepEqual(s, before);
});
test("first clear and replay rewards differ", () => {
  const s = fresh();
  const first = battle(s, () => 1);
  assert.ok(first.won);
  assert.equal(first.reward, 350);
  assert.equal(s.cleared, 1);
  assert.equal(s.stage, 2);
  applyAction(s, { type: "stage", stage: 1 });
  assert.equal(battle(s, () => 1).reward, 60);
});
test("lost battles do not advance or reward", () => {
  const s = fresh();
  s.stage = 12;
  const before = s.gems;
  assert.equal(battle(s, () => 0).won, false);
  assert.equal(s.cleared, 0);
  assert.equal(s.gems, before);
});
test("save rejects duplicate teams, unknown heroes and locked stages", () => {
  const s = fresh();
  assert.ok(!validSave({ ...s, team: [8, 8] }));
  assert.ok(!validSave({ ...s, team: [999] }));
  assert.ok(!validSave({ ...s, stage: 12 }));
});
import { migrate, upgrade, buyGear, equip, applyAction } from "../src/game.js";
test("old guest saves migrate without losing collection and progress", () => {
  const old = {
    version: 1,
    gems: 900,
    pity: 9,
    collection: { 8: 2 },
    team: [8],
    stage: 2,
    cleared: 1,
  };
  const s = migrate(old);
  assert.equal(s.version, 2);
  assert.equal(s.gems, 900);
  assert.equal(s.collection[8], 2);
  assert.equal(s.stage, 2);
  assert.ok(validSave(s));
});
test("leveling charges coins and increases power", () => {
  const s = fresh(),
    before = power(s, 8);
  upgrade(s, 8);
  assert.equal(s.coins, 900);
  assert.equal(power(s, 8), before + 5);
  assert.ok(validSave(s));
});
test("equipment cannot be assigned to multiple heroes with one copy", () => {
  const s = fresh();
  buyGear(s, "iron");
  equip(s, 8, "iron");
  assert.throws(() => equip(s, 9, "iron"));
  equip(s, 8, null, "weapon");
  equip(s, 9, "iron");
  assert.ok(validSave(s));
  assert.equal(power(s, 9), 36);
});
test("forged or overcommitted equipment and locked stages are rejected", () => {
  const s = fresh();
  assert.throws(() => applyAction(s, { type: "stage", stage: 12 }));
  assert.ok(!validSave({ ...s, equipment: { 8: { weapon: "iron" } } }));
  assert.throws(() => upgrade(s, 0));
});
test("hard pity does not downgrade an UR roll", () => {
  const s = fresh();
  s.pity = 49;
  assert.equal(summon(s, 1, () => 0)[0].rarity, "UR");
});
import { simulateCombat } from "../src/game.js";
test("six-person formation is accepted but a seventh hero is rejected", () => {
  const s = fresh();
  for (let id = 0; id < 7; id++) s.collection[id] = 1;
  applyAction(s, { type: "team", team: [0, 1, 2, 3, 4, 5] });
  assert.ok(validSave(s));
  assert.throws(() =>
    applyAction(s, { type: "team", team: [0, 1, 2, 3, 4, 5, 6] }),
  );
});
test("combat records enemy retaliation and health loss", () => {
  const s = fresh(),
    r = battle(s, () => 0.99);
  assert.ok(r.events.some((e) => e.side === "e" && e.damage > 0));
  assert.ok(r.players.some((u) => u.hp < u.maxHp));
  assert.equal(r.won, true);
  assert.ok(r.rounds > 1 && r.rounds <= 20);
});
test("healing and mage area skills occur on the third round", () => {
  const r = simulateCombat(
    [
      { name: "Tank", power: 80, role: "骑士", skill: "Guard" },
      { name: "Healer", power: 20, role: "治疗", skill: "Heal" },
      { name: "Mage", power: 20, role: "法师", skill: "Storm" },
    ],
    [
      { name: "Foe1", power: 70, role: "战士" },
      { name: "Foe2", power: 70, role: "战士" },
    ],
    () => 0.99,
    true,
  );
  assert.ok(r.events.some((e) => e.heal > 0));
  const targets = new Set(
    r.events.filter((e) => e.skill === "Storm").map((e) => e.target),
  );
  assert.equal(targets.size, 2);
});
import { claimIdle, idleReward } from "../src/game.js";
test("idle income caps at eight hours and cannot be claimed twice", () => {
  const s = fresh();
  s.idleClaimAt = 0;
  s.cleared = 2;
  const reward = claimIdle(s, 24 * 3600000);
  assert.equal(reward.minutes, 480);
  assert.equal(reward.coins, 4320);
  assert.equal(reward.gems, 96);
  assert.throws(() => claimIdle(s, 24 * 3600000));
  assert.equal(idleReward(s, 24 * 3600000 + 60000).minutes, 1);
});
import {
  heroes,
  starUp,
  forgeUp,
  claimDaily,
  dailyState,
  towerBattle,
} from "../src/game.js";
test("expanded roster has stable starter IDs and every rarity and role", () => {
  assert.equal(heroes.length, 38);
  assert.equal(heroes[8].name, "艾可");
  assert.equal(heroes[10].name, "米娅");
  for (const r of ["R", "SR", "SSR", "UR"])
    assert.ok(heroes.filter((h) => h.rarity === r).length >= 6);
});
test("legacy save adds progression fields without losing duplicates or gear", () => {
  const s = fresh();
  s.collection[8] = 10;
  s.inventory = ["iron"];
  s.equipment = { 8: { weapon: "iron" } };
  for (const k of ["stars", "forge", "tower", "daily"]) delete s[k];
  const m = migrate(s);
  assert.equal(m.collection[8], 10);
  assert.deepEqual(m.equipment, s.equipment);
  assert.deepEqual(m.stars, {});
  assert.ok(validSave(m));
});
test("star ascension consumes duplicates, keeps hero and increases power through five stars", () => {
  const s = fresh();
  s.collection[8] = 16;
  s.coins = 10000;
  for (let n = 1; n <= 5; n++) {
    const before = power(s, 8),
      r = starUp(s, 8);
    assert.equal(r.stars, n);
    assert.ok(power(s, 8) > before);
    assert.ok(validSave(s));
  }
  assert.equal(s.collection[8], 1);
  assert.throws(() => starUp(s, 8));
  assert.throws(() => starUp(s, 99));
});
test("equipment enhancement applies to owned copies and rejects forged or capped gear", () => {
  const s = fresh();
  assert.throws(() => forgeUp(s, "iron"));
  buyGear(s, "iron");
  equip(s, 8, "iron");
  const before = power(s, 8);
  forgeUp(s, "iron");
  assert.equal(power(s, 8), before + 6);
  assert.equal(s.coins, 500);
  assert.ok(validSave(s));
  assert.ok(!validSave({ ...s, forge: { moon: 1 } }));
  s.forge.iron = 10;
  assert.throws(() => forgeUp(s, "iron"));
});
test("daily rewards cannot repeat and server day rollover resets eligibility", () => {
  const s = fresh();
  const r = claimDaily(s, "signin");
  assert.equal(r.gems, 150);
  assert.throws(() => claimDaily(s, "signin"));
  assert.throws(() => claimDaily(s, "summon"));
  summon(s, 10, () => 0.99);
  claimDaily(s, "summon");
  assert.throws(() => claimDaily(s, "summon"));
  const d = dailyState(s, Date.now() + 86400000);
  assert.equal(d.signed, false);
  assert.deepEqual(d.claimed, []);
  assert.ok(validSave(s));
});
test("tower rewards advance exactly one floor and cap at thirty", () => {
  const s = fresh();
  s.collection[0] = 1;
  s.team = [0];
  s.levels[0] = 50;
  const a = towerBattle(s, () => 0.99);
  assert.ok(a.won);
  assert.equal(s.tower, 1);
  assert.equal(a.floor, 1);
  s.tower = 30;
  assert.throws(() => towerBattle(s));
  const weak = fresh();
  weak.team = [8];
  weak.tower = 29;
  const gems = weak.gems;
  assert.equal(towerBattle(weak, () => 0.99).won, false);
  assert.equal(weak.tower, 29);
  assert.equal(weak.gems, gems);
});
test("element advantage, knight shield, ranger rear target and control are recorded", () => {
  const unit = (name, power, role, element) => ({ name, power, role, element });
  const a = simulateCombat(
      [unit("fire", 20, "战士", "火")],
      [unit("wind", 100, "战士", "风")],
      () => 0.99,
      true,
    ),
    b = simulateCombat(
      [unit("fire", 20, "战士", "水")],
      [unit("wind", 100, "战士", "风")],
      () => 0.99,
      true,
    );
  assert.ok(a.events[0].damage > b.events[0].damage);
  const r = simulateCombat(
    [
      unit("tank", 70, "骑士", "水"),
      unit("ranger", 20, "游侠", "风"),
      unit("mage", 20, "法师", "暗"),
    ],
    [unit("front", 100, "骑士", "火"), unit("rear", 100, "战士", "水")],
    () => 0,
    true,
  );
  assert.ok(r.events.some((e) => e.shield > 0));
  assert.ok(
    r.events.some(
      (e) => e.actor === "p1" && e.round === 3 && e.target === "e1",
    ),
  );
  assert.ok(r.events.some((e) => e.status === "control"));
  assert.ok(r.events.some((e) => e.status === "stun"));
});
import {
  formationBonuses,
  autoEquip,
  savePreset,
  loadPreset,
  combatTeam,
  stageEnemies,
  maxStage,
} from "../src/game.js";
test("three and five faction allies grant distinct formation bonuses", () => {
  assert.deepEqual(formationBonuses([{ faction: "A" }, { faction: "A" }]), []);
  assert.equal(
    formationBonuses(Array.from({ length: 3 }, () => ({ faction: "A" })))[0]
      .bonus,
    0.1,
  );
  assert.equal(
    formationBonuses(Array.from({ length: 5 }, () => ({ faction: "A" })))[0]
      .bonus,
    0.2,
  );
  const withBuff = simulateCombat(
    Array.from({ length: 3 }, (_, i) => ({
      name: "ally" + i,
      power: 20,
      role: "战士",
      faction: "A",
    })),
    [{ name: "enemy", power: 100, role: "战士" }],
    () => 0.99,
  );
  assert.equal(withBuff.players[0].maxHp, 116);
  assert.equal(withBuff.synergies[0].faction, "A");
});
test("dedicated hero skills cause burn, drain and revival and stats match events", () => {
  const r = simulateCombat(
    [
      {
        name: "Burner",
        power: 50,
        role: "战士",
        ability: { effects: ["burn", "drain"], multiplier: 1.3 },
      },
    ],
    [{ name: "Tank", power: 60, role: "骑士" }],
    () => 0.99,
    true,
  );
  assert.ok(r.events.some((e) => e.status === "ignite"));
  assert.ok(r.events.some((e) => e.status === "burn" && e.damage > 0));
  assert.ok(r.events.some((e) => e.heal > 0));
  assert.equal(
    r.stats[0].damage,
    r.events
      .filter((e) => e.actor === "p0")
      .reduce((n, e) => n + (e.damage || 0), 0),
  );
  const revived = simulateCombat(
    [
      { name: "Fragile", power: 5, role: "战士" },
      {
        name: "Reviver",
        power: 100,
        role: "治疗",
        ability: { effects: ["revive", "teamHeal"] },
      },
    ],
    [{ name: "Enemy", power: 80, role: "战士" }],
    () => 0.99,
    true,
  );
  assert.ok(revived.events.some((e) => e.revive && e.heal > 0));
  assert.ok(
    revived.events.filter((e) => e.revive && e.target === "p0").length <= 1,
  );
  assert.doesNotThrow(() => JSON.stringify(r));
});
test("counter skills retaliate without infinite chains and failed combat explains formation issues", () => {
  const r = simulateCombat(
    [
      {
        name: "Knight",
        power: 60,
        role: "骑士",
        ability: { effects: ["counter"] },
      },
    ],
    [
      {
        name: "Other knight",
        power: 60,
        role: "骑士",
        ability: { effects: ["counter"] },
      },
    ],
    () => 0.99,
    true,
  );
  assert.ok(r.events.some((e) => e.skill === "守卫反击"));
  assert.ok(r.events.length < 500);
  const weak = simulateCombat(
    [{ name: "Weak", power: 5, role: "战士" }],
    [{ name: "Boss", power: 300, role: "战士" }],
    () => 0.99,
  );
  assert.equal(weak.won, false);
  assert.ok(weak.tips.some((t) => t.includes("治疗")));
  assert.ok(weak.tips.some((t) => t.includes("骑士")));
});
test("one-click equipment uses available quantities and protects off-team gear", () => {
  const s = fresh();
  s.collection[11] = 1;
  s.inventory = ["iron", "moon", "charm", "crown"];
  s.equipment = { 11: { weapon: "moon" } };
  autoEquip(s);
  assert.equal(s.equipment[11].weapon, "moon");
  assert.equal(s.equipment[8].weapon, "iron");
  assert.equal(s.equipment[8].charm, "crown");
  assert.equal(s.equipment[9].charm, "charm");
  assert.ok(validSave(s));
});
test("three named formation presets are copies, validate ownership and survive migration", () => {
  const s = fresh();
  savePreset(s, 0, "攻坚");
  s.team = [10, 9, 8];
  assert.deepEqual(s.presets[0].team, [8, 9, 10]);
  loadPreset(s, 0);
  assert.deepEqual(s.team, [8, 9, 10]);
  assert.throws(() => savePreset(s, 3, "bad"));
  assert.throws(() => loadPreset(s, 1));
  assert.ok(
    !validSave({ ...s, presets: [{ name: "Forged", team: [0] }, null, null] }),
  );
  const restored = migrate(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.presets[0].name, "攻坚");
});
test("new chapters preserve legacy progress and elite rewards distinguish first clear", () => {
  const s = fresh();
  s.cleared = 12;
  applyAction(s, { type: "stage", stage: 13 });
  assert.ok(validSave(s));
  assert.equal(maxStage, 36);
  assert.throws(() => applyAction(s, { type: "stage", stage: 36 }));
  assert.throws(() => applyAction(s, { type: "elite" }));
  s.cleared = 13;
  s.collection[0] = 1;
  s.team = [0];
  s.levels[0] = 50;
  const first = applyAction(s, { type: "elite" }, () => 0.99);
  assert.equal(first.won, true);
  assert.equal(first.reward, 150);
  assert.equal(applyAction(s, { type: "elite" }, () => 0.99).reward, 20);
  assert.deepEqual(s.eliteCleared, [13]);
  assert.ok(validSave(s));
  assert.notEqual(
    stageEnemies(3)[0].ability.effects[0],
    stageEnemies(6)[0].ability.effects[0],
  );
});
test("support combat adds or replaces one hero without modifying permanent ownership", () => {
  const s = fresh(),
    support = { ...heroes[0], power: 100 };
  assert.equal(combatTeam(s, support).length, 4);
  assert.deepEqual(s.team, [8, 9, 10]);
  s.collection = { ...s.collection, 0: 1, 1: 1, 2: 1 };
  s.team = [0, 1, 2, 8, 9, 10];
  const units = combatTeam(s, support);
  assert.equal(units.length, 6);
  assert.equal(units[5].support, true);
  assert.deepEqual(s.team, [0, 1, 2, 8, 9, 10]);
});
