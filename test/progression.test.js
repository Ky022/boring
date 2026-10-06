import test from "node:test";
import assert from "node:assert/strict";
import {
  fresh,
  migrate,
  applyAction,
  power,
  validSave,
  battle,
  combatTeam,
  simulateCombat,
} from "../src/game.js";
import {
  makeItem,
  itemPower,
  equipmentCombat,
  mailbox,
  dungeonState,
  heroGrowth,
} from "../src/progression.js";
const act = (s, a) => applyAction(s, a, () => 0.5);
test("legacy equipment migrates once, preserves power and isolates copy enhancement", () => {
  const old = fresh();
  delete old.edition;
  old.inventory = ["iron", "iron", "charm"];
  old.forge = { iron: 3 };
  old.equipment = { 8: { weapon: "iron" }, 9: { weapon: "iron" } };
  old.coins = 5000;
  const before = power(old, 8),
    s = migrate(old);
  assert.equal(power(s, 8), before);
  assert.equal(s.items.length, 3);
  const s2 = migrate(s);
  assert.equal(s2.items.length, 3);
  assert.equal(power(s2, 8), before);
  const uid = s.loadouts[8].weapon,
    other = s.loadouts[9].weapon;
  act(s, { type: "itemForge", item: uid });
  assert.equal(s.items.find((i) => i.id === other).level, 3);
  assert.equal(power(s, 8), before + 6);
  assert.ok(validSave(s));
});
test("six independent slots reject occupied, incompatible and nonexistent items", () => {
  const s = fresh();
  s.coins = 10000;
  for (const slot of ["weapon", "body", "head", "legs", "feet", "charm"]) {
    const i = act(s, { type: "itemBuy", slot });
    act(s, { type: "loadout", id: 8, slot, item: i.id });
  }
  assert.equal(Object.keys(s.loadouts[8]).length, 6);
  assert.ok(validSave(s));
  const uid = s.loadouts[8].weapon;
  assert.throws(() =>
    act(s, { type: "loadout", id: 9, slot: "weapon", item: uid }),
  );
  assert.throws(() =>
    act(s, { type: "loadout", id: 8, slot: "head", item: uid }),
  );
  assert.throws(() => act(s, { type: "itemSalvage", item: uid }));
  act(s, { type: "loadout", id: 8, slot: "weapon", item: null });
  act(s, { type: "itemLock", item: uid });
  assert.throws(() => act(s, { type: "itemSalvage", item: uid }));
  act(s, { type: "itemLock", item: uid });
  act(s, { type: "itemSalvage", item: uid });
  assert.ok(!s.items.some((i) => i.id === uid));
});
test("auto equipment respects off-team gear and no copy is worn twice", () => {
  const s = fresh();
  s.collection[11] = 1;
  s.loadouts[11] = { weapon: makeItem(s, { slot: "weapon", quality: 3 }).id };
  for (let n = 0; n < 3; n++) makeItem(s, { slot: "weapon", quality: 1 });
  const keep = s.loadouts[11].weapon;
  act(s, { type: "loadoutAuto" });
  assert.equal(s.loadouts[11].weapon, keep);
  assert.ok(validSave(s));
  const bad = structuredClone(s);
  bad.loadouts[9].weapon = bad.loadouts[8].weapon;
  assert.equal(validSave(bad), false);
});
test("mail, free pack, achievement and newcomer rewards reject repeats and expiry", () => {
  const s = fresh(),
    g = s.gems;
  act(s, { type: "mailClaim", mail: "welcome-v1" });
  assert.equal(s.gems, g + 300);
  assert.throws(() => act(s, { type: "mailClaim", mail: "welcome-v1" }));
  act(s, { type: "welfare", task: "free" });
  assert.throws(() => act(s, { type: "welfare", task: "free" }));
  assert.throws(() =>
    act(s, { type: "welfare", task: "achievement", target: "chapter1" }),
  );
  s.cleared = 3;
  act(s, { type: "welfare", task: "achievement", target: "chapter1" });
  assert.throws(() =>
    act(s, { type: "welfare", task: "achievement", target: "chapter1" }),
  );
  act(s, { type: "welfare", task: "newcomer", target: 1 });
  assert.throws(() => act(s, { type: "welfare", task: "newcomer", target: 1 }));
  const expired = fresh();
  expired.welfare.joinedAt = Date.now() - 31 * 86400000;
  assert.equal(mailbox(expired)[0].expired, true);
  assert.throws(() => act(expired, { type: "mailClaim", mail: "welcome-v1" }));
  assert.ok(validSave(s));
});
test("streak resets after gap and seventh day grants larger prize", () => {
  const s = fresh(),
    today = new Date().toISOString().slice(0, 10),
    yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  s.welfare.lastSign = yesterday;
  s.welfare.streak = 6;
  const r = act(s, { type: "welfare", task: "streak" });
  assert.equal(r.gems, 500);
  assert.equal(s.welfare.streak, 7);
  assert.throws(() => act(s, { type: "welfare", task: "streak" }));
  s.welfare.lastSign = new Date(Date.now() - 3 * 86400000)
    .toISOString()
    .slice(0, 10);
  act(s, { type: "welfare", task: "streak" });
  assert.equal(s.welfare.streak, 1);
  assert.equal(s.welfare.lastSign, today);
});
test("dungeon unlock, first clear, sweep cap and next-day reset preserve cleared difficulty", () => {
  const s = fresh();
  s.levels = { 8: 40, 9: 40, 10: 40 };
  assert.throws(() => act(s, { type: "dungeon", dungeon: "gold", tier: 2 }));
  assert.throws(() =>
    act(s, { type: "dungeon", dungeon: "gold", tier: 1, sweep: true }),
  );
  const r = act(s, { type: "dungeon", dungeon: "gold", tier: 1 });
  assert.equal(r.won, true);
  assert.equal(r.loot.coins, 1000);
  act(s, { type: "dungeon", dungeon: "gold", tier: 1, sweep: true });
  act(s, { type: "dungeon", dungeon: "gold", tier: 1, sweep: true });
  assert.throws(() =>
    act(s, { type: "dungeon", dungeon: "gold", tier: 1, sweep: true }),
  );
  dungeonState(s, Date.now() + 86400000);
  assert.equal(s.dungeon.runs.gold, undefined);
  assert.equal(s.dungeon.cleared.gold, 1);
  assert.ok(validSave(s));
});
test("skills, three-star passive and real set effects feed the combat engine", () => {
  const s = fresh(),
    base = combatTeam(s);
  s.coins = 10000;
  s.books = 20;
  act(s, { type: "skillUp", id: 8 });
  assert.ok(combatTeam(s)[0].ability.multiplier > base[0].ability.multiplier);
  s.stars[9] = 3;
  assert.ok(combatTeam(s)[1].ability.effects.includes("drain"));
  for (const slot of ["weapon", "body"]) {
    const i = makeItem(s, { slot, set: "stone" });
    act(s, { type: "loadout", id: 8, slot, item: i.id });
  }
  assert.ok(equipmentCombat(s, 8).gearBonus.hp > 0.12);
  const team = combatTeam(s),
    without = structuredClone(team);
  without[0].gearBonus.hp = 0;
  const enemies = [{ name: "Boss", role: "战士", power: 1000 }];
  assert.ok(
    simulateCombat(team, enemies, () => 0.5).players[0].maxHp >
      simulateCombat(without, enemies, () => 0.5).players[0].maxHp,
  );
});
test("campaign automatic progression is persistent while explicit replay stays selectable", () => {
  const s = fresh();
  s.levels = { 8: 40, 9: 40, 10: 40 };
  for (let n = 1; n <= 4; n++) {
    const r = battle(s, () => 0.5);
    assert.equal(r.stage, n);
    assert.equal(s.stage, n + 1);
    assert.ok(validSave(s));
    assert.equal(migrate(JSON.parse(JSON.stringify(s))).stage, n + 1);
  }
  act(s, { type: "stage", stage: 1 });
  assert.equal(battle(s, () => 0.5).reward, 60);
  assert.equal(s.stage, 5);
});
test("malformed extension state is rejected and ticket summon uses existing pity", () => {
  const s = fresh();
  assert.throws(() => act(s, { type: "ticketSummon" }));
  s.tickets = 1;
  s.pity = 49;
  s.gems = 0;
  const r = act(s, { type: "ticketSummon" });
  assert.ok(["SSR", "UR"].includes(r[0].rarity));
  assert.equal(s.gems, 0);
  assert.equal(s.tickets, 0);
  assert.ok(validSave(s));
  const broken = structuredClone(s);
  broken.welfare.claimedMail = ["welcome-v1", "welcome-v1"];
  assert.equal(validSave(broken), false);
});

test("one-click claims only eligible mail and growth rewards, never grants twice", () => {
  const s = fresh();
  s.cleared = 3;
  const g = s.gems;
  const r = act(s, { type: "rewardAll" });
  assert.equal(s.gems, g + r.gems);
  assert.ok(s.welfare.claimedMail.includes("welcome-v1"));
  assert.ok(s.welfare.achievements.includes("chapter1"));
  assert.ok(s.welfare.newcomer.includes(1));
  assert.throws(() => act(s, { type: "rewardAll" }));
  assert.ok(validSave(s));
});
