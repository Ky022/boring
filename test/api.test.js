import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import worker from "../server/worker.js";
import { power } from "../src/game.js";
class Query {
  constructor(db, sql, params = []) {
    this.db = db;
    this.sql = sql;
    this.params = params;
  }
  bind(...params) {
    return new Query(this.db, this.sql, params);
  }
  execute(mode) {
    const s = this.db.prepare(this.sql);
    if (mode === "first") return s.get(...this.params) || null;
    if (mode === "all") return { results: s.all(...this.params) };
    const r = s.run(...this.params);
    return {
      meta: {
        changes: Number(r.changes),
        last_row_id: Number(r.lastInsertRowid),
      },
    };
  }
  async first() {
    const row = this.execute("first");
    if (this.db.guildReadBarrier && this.sql.startsWith("SELECT g.*"))
      await this.db.guildReadBarrier();
    return row;
  }
  async all() {
    return this.execute("all");
  }
  async run() {
    return this.execute("run");
  }
}
class D1 {
  constructor(db) {
    this.db = db;
  }
  prepare(sql) {
    return new Query(this.db, sql);
  }
  async batch(queries) {
    this.db.exec("BEGIN");
    try {
      const result = queries.map((q) => q.execute("run"));
      this.db.exec("COMMIT");
      return result;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
}
test("database accounts, cloud progress, guild cooperation, chat and arena", async (t) => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(
    readFileSync(
      new URL("../server/migrations/0001.sql", import.meta.url),
      "utf8",
    ),
  );
  sqlite.exec(
    readFileSync(
      new URL("../server/migrations/0002_idle.sql", import.meta.url),
      "utf8",
    ),
  );
  sqlite.exec(
    readFileSync(
      new URL("../server/migrations/0003_social.sql", import.meta.url),
      "utf8",
    ),
  );
  const env = { DB: new D1(sqlite), ALLOWED_ORIGIN: "https://ky022.github.io" };
  const call = async (path, token, data, extra = {}) => {
    const res = await worker.fetch(
      new Request("http://localhost/api" + path, {
        method: data === undefined ? "GET" : "POST",
        headers: {
          ...(token ? { Authorization: "Bearer " + token } : {}),
          ...(data !== undefined ? { "Content-Type": "application/json" } : {}),
          ...extra,
        },
        ...(data === undefined ? {} : { body: JSON.stringify(data) }),
      }),
      env,
    );
    return { status: res.status, ...(await res.json()) };
  };
  const alice = await call("/register", null, {
      username: "Alice",
      password: "testpass123",
    }),
    bob = await call("/register", null, {
      username: "Bob",
      password: "testpass456",
    }),
    eve = await call("/register", null, {
      username: "Eve",
      password: "testpass789",
    });
  assert.equal(alice.status, 200);
  assert.equal(bob.status, 200);
  assert.equal(eve.status, 200);
  let p = alice;
  await t.test("auth isolation and no password hashes exposed", async () => {
    assert.equal((await call("/me")).status, 401);
    assert.equal(
      (
        await call("/login", null, {
          username: "Alice",
          password: "incorrect123",
        })
      ).status,
      401,
    );
    assert.ok(!("password_hash" in alice.user));
    assert.equal(
      (
        await call("/me", alice.token, undefined, {
          Origin: "https://evil.example",
        })
      ).status,
      403,
    );
  });
  await t.test(
    "server validates upgrades and deduplicates commands",
    async () => {
      const command = {
        requestId: crypto.randomUUID(),
        revision: p.revision,
        action: { type: "upgrade", id: 8 },
      };
      const upgraded = await call("/action", alice.token, command);
      assert.equal(upgraded.status, 200);
      assert.equal(upgraded.state.coins, 900);
      assert.equal(
        (await call("/action", alice.token, command)).state.coins,
        900,
      );
      const current = await call("/me", alice.token);
      assert.equal(current.revision, 1);
      assert.equal(current.state.levels[8], 2);
      p = current;
    },
  );
  await t.test(
    "simultaneous mutations spend once and invalid requests leave no command",
    async () => {
      const revision = p.revision;
      const commands = [1, 2].map(() => ({
        requestId: crypto.randomUUID(),
        revision,
        action: { type: "buy", item: "iron" },
      }));
      const results = await Promise.all(
        commands.map((c) => call("/action", alice.token, c)),
      );
      assert.equal(results.filter((r) => r.status === 200).length, 1);
      assert.equal(results.filter((r) => r.status === 409).length, 1);
      p = await call("/me", alice.token);
      assert.equal(p.state.coins, 600);
      const failed = commands.find((_, i) => results[i].status === 409);
      assert.equal(
        sqlite
          .prepare("SELECT COUNT(*) AS n FROM commands WHERE request_id=?")
          .get(failed.requestId).n,
        0,
      );
    },
  );
  await t.test(
    "registration creates independent save and login restores persisted progress",
    async () => {
      const again = await call("/login", null, {
        username: "Alice",
        password: "testpass123",
      });
      assert.equal(again.state.coins, 600);
      assert.equal(again.state.levels[8], 2);
      assert.equal((await call("/me", bob.token)).state.coins, 1000);
    },
  );
  let guild;
  await t.test(
    "friends join by invite and outsiders cannot read guild chat",
    async () => {
      guild = (await call("/guild/create", alice.token, { name: "Moon guild" }))
        .guild;
      assert.ok(guild.code);
      assert.equal(
        (await call("/guild/join", bob.token, { code: guild.code })).guild
          .members.length,
        2,
      );
      assert.equal((await call("/chat?channel=guild", eve.token)).status, 403);
      assert.equal(
        (
          await call("/chat", alice.token, {
            channel: "guild",
            text: "Hello Bob <script>alert(1)</script>",
          })
        ).status,
        200,
      );
      const messages = await call("/chat?channel=guild", bob.token);
      assert.equal(messages.messages.length, 1);
      assert.ok(messages.messages[0].text.includes("<script>"));
    },
  );
  await t.test(
    "cooperative boss hp and contributions share one database",
    async () => {
      p = await call("/me", alice.token);
      const requestId = crypto.randomUUID();
      const r = await call("/action", alice.token, {
        requestId,
        revision: p.revision,
        action: { type: "boss" },
      });
      assert.equal(r.status, 200);
      assert.ok(r.result.damage > 0);
      const g = (await call("/guild", bob.token)).guild;
      assert.equal(g.bossHp, 3000 - r.result.damage);
      assert.equal(
        g.members.find((m) => m.name === "Alice").contribution,
        r.result.damage,
      );
      assert.equal(
        (
          await call("/action", alice.token, {
            requestId,
            revision: p.revision,
            action: { type: "boss" },
          })
        ).result.damage,
        r.result.damage,
      );
      p = await call("/me", alice.token);
    },
  );
  await t.test(
    "boss round resets atomically and retry awards only once",
    async () => {
      sqlite.prepare("UPDATE guilds SET boss_hp=1 WHERE id=?").run(guild.id);
      p = await call("/me", alice.token);
      const command = {
        requestId: crypto.randomUUID(),
        revision: p.revision,
        action: { type: "boss" },
      };
      const r = await call("/action", alice.token, command);
      assert.ok(r.result.defeated);
      assert.equal(r.result.reward, 200);
      assert.equal(r.guild.bossRound, 2);
      assert.equal(r.guild.bossHp, 4000);
      await call("/action", alice.token, command);
      assert.equal(
        (await call("/me", alice.token)).state.gems,
        p.state.gems + 200,
      );
    },
  );
  await t.test(
    "concurrent guild attacks persist only the winner and count weekly progress once",
    async () => {
      const pa = await call("/me", alice.token),
        pb = await call("/me", bob.token),
        before = (await call("/guild", alice.token)).guild;
      const ca = {
          requestId: crypto.randomUUID(),
          revision: pa.revision,
          action: { type: "boss" },
        },
        cb = {
          requestId: crypto.randomUUID(),
          revision: pb.revision,
          action: { type: "boss" },
        };
      let release;
      const barrier = new Promise((resolve) => (release = resolve));
      let reads = 0;
      sqlite.guildReadBarrier = async () => {
        if (++reads === 2) release();
        await barrier;
      };
      const replies = await Promise.all([
        call("/action", alice.token, ca),
        call("/action", bob.token, cb),
      ]);
      delete sqlite.guildReadBarrier;
      assert.deepEqual(replies.map((r) => r.status).sort(), [200, 409]);
      const g = (await call("/guild", alice.token)).guild;
      assert.equal(g.weekly.hits, before.weekly.hits + 1);
      const winner = replies.find((r) => r.status === 200);
      assert.equal(g.bossHp, before.bossHp - winner.result.damage);
      for (const [i, account, old, cmd] of [
        [0, alice, pa, ca],
        [1, bob, pb, cb],
      ]) {
        const now = await call("/me", account.token);
        assert.equal(
          now.state.coins,
          old.state.coins + (replies[i].status === 200 ? 50 : 0),
        );
        const recorded = sqlite
          .prepare(
            "SELECT COUNT(*) AS n FROM commands WHERE account_id=? AND request_id=?",
          )
          .get(account.user.id, cmd.requestId);
        assert.equal(recorded.n, replies[i].status === 200 ? 1 : 0);
      }
    },
  );
  await t.test(
    "cooperative weekly kill reward is available to contributors and cannot repeat",
    async () => {
      let p = await call("/me", bob.token);
      await call("/action", bob.token, {
        requestId: crypto.randomUUID(),
        revision: p.revision,
        action: { type: "boss" },
      });
      for (const account of [alice, bob]) {
        const p = await call("/me", account.token),
          cmd = {
            requestId: crypto.randomUUID(),
            revision: p.revision,
            action: { type: "guildClaim", task: "kills" },
          };
        const claimed = await call("/action", account.token, cmd);
        assert.equal(claimed.status, 200);
        assert.equal(claimed.state.gems, p.state.gems + 300);
        assert.equal(
          claimed.guild.weekly.tasks.find((t) => t.id === "kills").claimed,
          true,
        );
        assert.equal(
          (await call("/action", account.token, cmd)).state.gems,
          claimed.state.gems,
        );
        const denied = await call("/action", account.token, {
          ...cmd,
          requestId: crypto.randomUUID(),
          revision: claimed.revision,
        });
        assert.equal(denied.status, 400);
      }
      p = await call("/me", eve.token);
      assert.equal(
        (
          await call("/action", eve.token, {
            requestId: crypto.randomUUID(),
            revision: p.revision,
            action: { type: "guildClaim", task: "kills" },
          })
        ).status,
        400,
      );
    },
  );
  await t.test(
    "arena uses other player saved team and enforces daily attempts",
    async () => {
      const arena = await call("/arena", alice.token);
      assert.ok(arena.opponents.some((o) => o.id === bob.user.id));
      for (let i = 0; i < 5; i++) {
        p = await call("/me", alice.token);
        const r = await call("/action", alice.token, {
          requestId: crypto.randomUUID(),
          revision: p.revision,
          action: { type: "arena", opponent: bob.user.id },
        });
        assert.equal(r.status, 200);
        assert.equal(r.state.arenaAttempts, i + 1);
      }
      p = await call("/me", alice.token);
      assert.equal(
        (
          await call("/action", alice.token, {
            requestId: crypto.randomUUID(),
            revision: p.revision,
            action: { type: "arena", opponent: bob.user.id },
          })
        ).status,
        400,
      );
      assert.equal((await call("/arena", alice.token)).history.length, 5);
    },
  );
  await t.test(
    "guild owner transfers and exited users lose guild chat access",
    async () => {
      assert.equal((await call("/guild/leave", alice.token, {})).status, 200);
      assert.equal((await call("/guild", bob.token)).guild.owner, bob.user.id);
      assert.equal(
        (await call("/chat?channel=guild", alice.token)).status,
        403,
      );
    },
  );
  await t.test(
    "new growth actions persist and repeated daily claims are rejected",
    async () => {
      const base = (await call("/me", eve.token)).state;
      base.collection[8] = 3;
      base.coins = 10000;
      base.inventory = ["iron"];
      sqlite
        .prepare("UPDATE players SET state_json=? WHERE account_id=?")
        .run(JSON.stringify(base), eve.user.id);
      const act = async (action) => {
        const p = await call("/me", eve.token);
        return call("/action", eve.token, {
          requestId: crypto.randomUUID(),
          revision: p.revision,
          action,
        });
      };
      const star = await act({ type: "star", id: 8 });
      assert.equal(star.status, 200);
      assert.equal(star.state.stars[8], 1);
      assert.equal(star.state.collection[8], 2);
      const forged = await act({ type: "forge", item: "iron" });
      assert.equal(forged.state.forge.iron, 1);
      const signed = await act({ type: "daily", task: "signin" });
      assert.equal(signed.status, 200);
      assert.equal((await act({ type: "daily", task: "signin" })).status, 400);
      const restored = await call("/login", null, {
        username: "Eve",
        password: "testpass789",
      });
      assert.equal(restored.state.stars[8], 1);
      assert.equal(restored.state.forge.iron, 1);
      assert.equal(restored.state.daily.signed, true);
    },
  );
  await t.test(
    "friend requests enforce acceptance and hero borrowing is trusted, capped and daily limited",
    async () => {
      assert.equal(
        (await call("/friends/request", alice.token, { username: "Alice" }))
          .status,
        400,
      );
      assert.equal(
        (await call("/friends/request", alice.token, { username: "Bob" }))
          .status,
        200,
      );
      assert.equal(
        (await call("/friends/request", alice.token, { username: "Bob" }))
          .status,
        409,
      );
      assert.equal(
        (await call("/friends/accept", alice.token, { id: bob.user.id }))
          .status,
        409,
      );
      assert.equal(
        (await call("/friends/accept", eve.token, { id: alice.user.id }))
          .status,
        409,
      );
      assert.equal(
        (await call("/friends/accept", bob.token, { id: alice.user.id }))
          .status,
        200,
      );
      assert.equal(
        (await call("/friends", alice.token)).friends[0].status,
        "accepted",
      );
      const act = async (account, action) => {
        const p = await call("/me", account.token);
        const cmd = {
          requestId: crypto.randomUUID(),
          revision: p.revision,
          action,
        };
        return { reply: await call("/action", account.token, cmd), cmd };
      };
      assert.equal(
        (await act(alice, { type: "battle", supportFriend: eve.user.id })).reply
          .status,
        403,
      );
      assert.equal(
        (await act(bob, { type: "shareHero", id: 10 })).reply.status,
        200,
      );
      const boosted = (await call("/me", bob.token)).state;
      boosted.levels[10] = 50;
      sqlite
        .prepare("UPDATE players SET state_json=? WHERE account_id=?")
        .run(JSON.stringify(boosted), bob.user.id);
      const first = await act(alice, {
        type: "battle",
        supportFriend: bob.user.id,
        power: 999999,
      });
      assert.equal(first.reply.status, 200);
      assert.equal(first.reply.state.supportUses, 1);
      assert.ok(
        first.reply.result.players.find((u) => u.support).power <=
          Math.round(
            Math.max(
              ...first.reply.state.team.map((id) =>
                power(first.reply.state, id),
              ),
            ) * 1.5,
          ),
      );
      assert.equal((await call("/friends", eve.token)).friends.length, 0);
      assert.equal(first.reply.result.players.find((u) => u.support).id, 10);
      assert.equal(first.reply.state.collection[10], 1);
      assert.equal(
        (await call("/action", alice.token, first.cmd)).state.supportUses,
        1,
      );
      for (let i = 2; i <= 3; i++)
        assert.equal(
          (await act(alice, { type: "battle", supportFriend: bob.user.id }))
            .reply.state.supportUses,
          i,
        );
      assert.equal(
        (await act(alice, { type: "battle", supportFriend: bob.user.id })).reply
          .status,
        400,
      );
      const stale = (await call("/me", alice.token)).state;
      stale.supportDay = "2000-01-01";
      sqlite
        .prepare("UPDATE players SET state_json=? WHERE account_id=?")
        .run(JSON.stringify(stale), alice.user.id);
      assert.equal(
        (await act(alice, { type: "battle", supportFriend: bob.user.id })).reply
          .state.supportUses,
        1,
      );
      assert.equal(
        (await call("/friends/remove", alice.token, { id: bob.user.id }))
          .status,
        200,
      );
      assert.equal((await call("/friends", bob.token)).friends.length, 0);
      assert.equal(
        (await act(alice, { type: "battle", supportFriend: bob.user.id })).reply
          .status,
        403,
      );
    },
  );
  await t.test(
    "new reward and equipment commands are atomic, deduplicated and persistent",
    async () => {
      const before = await call("/me", eve.token);
      const cmd = {
        requestId: crypto.randomUUID(),
        revision: before.revision,
        action: { type: "mailClaim", mail: "welcome-v1" },
      };
      const replies = await Promise.all([
        call("/action", eve.token, cmd),
        call("/action", eve.token, { ...cmd, requestId: crypto.randomUUID() }),
      ]);
      assert.equal(replies.filter((r) => r.status === 200).length, 1);
      assert.equal(replies.filter((r) => r.status === 409).length, 1);
      const winner = replies.find((r) => r.status === 200);
      assert.equal(winner.state.gems, before.state.gems + 300);
      const actual = await call("/me", eve.token);
      assert.equal(actual.state.welfare.claimedMail.length, 1);
      const act = async (action) => {
        const p = await call("/me", eve.token);
        return call("/action", eve.token, {
          requestId: crypto.randomUUID(),
          revision: p.revision,
          action,
        });
      };
      assert.equal(
        (await act({ type: "mailClaim", mail: "welcome-v1" })).status,
        400,
      );
      const item = await act({ type: "itemBuy", slot: "body" });
      assert.equal(item.status, 200);
      const uid = item.result.id;
      assert.equal(
        (await act({ type: "loadout", id: 8, slot: "body", item: uid })).status,
        200,
      );
      assert.equal((await act({ type: "itemForge", item: uid })).status, 200);
      const restored = await call("/login", null, {
        username: "Eve",
        password: "testpass789",
      });
      assert.equal(restored.state.items.find((i) => i.id === uid).level, 1);
      assert.equal(restored.state.loadouts[8].body, uid);
      assert.equal(
        (await act({ type: "loadout", id: 9, slot: "body", item: uid })).status,
        400,
      );
      assert.equal(
        (await act({ type: "dungeon", dungeon: "gold", tier: 1, sweep: true }))
          .status,
        400,
      );
      assert.equal((await act({ type: "welfare", task: "free" })).status, 200);
      assert.equal((await act({ type: "welfare", task: "free" })).status, 400);
    },
  );
  await t.test("odyssey actions persist, reject invalid commands and deduplicate refunds", async () => {
    const account = await call("/register", null, {username:"Odyssey",password:"testpass123"});
    let current = account;
    const act = async action => {
      const cmd = {requestId:crypto.randomUUID(),revision:current.revision,action};
      const r = await call("/action", account.token, cmd);
      if(r.status===200) current=r;
      return {r,cmd};
    };
    assert.equal((await act({type:"wishlist",ids:[8]})).r.status,400);
    assert.equal((await act({type:"wishlist",ids:[2]})).r.status,200);
    await act({type:"upgrade",id:8});
    const {r,cmd}=await act({type:"trainingReset",id:8});
    assert.equal(r.status,200);assert.equal(r.state.coins,1000);
    assert.equal((await call("/action",account.token,cmd)).state.coins,1000);
    assert.equal((await act({type:"trainingReset",id:8})).r.status,400);
    assert.equal((await act({type:"expeditionStart",tier:1})).r.status,200);
    assert.equal((await act({type:"expeditionBoon",boon:"rest"})).r.status,400);
    const restored=await call("/login",null,{username:"Odyssey",password:"testpass123"});
    assert.deepEqual(restored.state.odyssey.wishlist,[2]);
    assert.equal(restored.state.odyssey.run.node,0);
    assert.deepEqual(restored.state.odyssey.run.team,[8,9,10]);
  });
  await t.test("logout revokes session", async () => {
    await call("/logout", eve.token, {});
    assert.equal((await call("/me", eve.token)).status, 401);
  });
  sqlite.close();
});
