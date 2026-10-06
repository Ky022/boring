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
