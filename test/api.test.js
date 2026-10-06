import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import worker from "../server/worker.js";
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
    return this.execute("first");
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
  await t.test("logout revokes session", async () => {
    await call("/logout", eve.token, {});
    assert.equal((await call("/me", eve.token)).status, 401);
  });
  sqlite.close();
});
