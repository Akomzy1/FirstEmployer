import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

/**
 * Migration + RLS + immutability harness (Prompt 2 VERIFY, CLAUDE.md gates 7 & 5).
 *
 * Runs the REAL migrations against PGlite (in-process Postgres, no Docker),
 * behind a small auth shim that reproduces Supabase's auth.uid() and the
 * anon/authenticated/service_role roles. Proves:
 *   - every migration applies cleanly, in order;
 *   - two seeded tenants cannot see each other's rows under `authenticated`;
 *   - immutable evidence tables reject UPDATE/DELETE for every role.
 */

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const migrationsDir = join(root, "supabase", "migrations");

const ID = JSON.parse(readFileSync(join(here, "seed-ids.json"), "utf8")) as Record<string, string>;

let db: PGlite;

/** Run as a simulated signed-in user: switch to `authenticated` and set the JWT sub. */
async function asUser(userId: string) {
  await db.exec("reset role;");
  await db.exec(`set request.jwt.claim.sub = '${userId}';`);
  await db.exec("set role authenticated;");
}
async function asSuperuser() {
  await db.exec("reset role;");
  await db.exec("set request.jwt.claim.sub = '';");
}

beforeAll(async () => {
  db = new PGlite();

  // 1) auth shim (test-only; Supabase provides this in production)
  await db.exec(readFileSync(join(here, "shim.sql"), "utf8"));

  // 2) all migrations, in filename order
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  expect(files.length).toBeGreaterThan(0);
  for (const f of files) {
    await db.exec(readFileSync(join(migrationsDir, f), "utf8"));
  }

  // 3) seed (as superuser, bypassing RLS the way service_role does)
  await db.exec(readFileSync(join(root, "supabase", "seed.sql"), "utf8"));
});

afterAll(async () => {
  await db?.close();
});

describe("migrations apply cleanly", () => {
  it("creates every expected table", async () => {
    const res = await db.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_schema = 'public' order by table_name;`,
    );
    const names = res.rows.map((r) => r.table_name);
    for (const t of [
      "assistant_messages",
      "assistant_threads",
      "businesses",
      "business_members",
      "config_versions",
      "determinations",
      "documents",
      "employees",
      "evidence",
      "events",
      "examinations",
      "obligations",
      "profiles",
      "rtw_records",
    ]) {
      expect(names).toContain(t);
    }
  });

  it("seeded both config versions and two tenants", async () => {
    await asSuperuser();
    const cfg = await db.query<{ label: string }>(`select label from config_versions order by label;`);
    expect(cfg.rows.map((r) => r.label)).toEqual(["2026.1", "2026.2"]);
    const biz = await db.query<{ n: number }>(`select count(*)::int as n from businesses;`);
    expect(biz.rows[0].n).toBe(2);
  });
});

describe("config resolves against the seeded database", () => {
  it("returns 2026.1 before the boundary and 2026.2 on/after it", async () => {
    await asSuperuser();
    const q = async (d: string) =>
      (
        await db.query<{ label: string }>(
          `select label from config_versions
           where status <> 'draft' and effective_from <= $1
           order by effective_from desc limit 1;`,
          [d],
        )
      ).rows[0]?.label;
    expect(await q("2026-03-31")).toBe("2026.1");
    expect(await q("2026-04-01")).toBe("2026.2");
  });
});

describe("RLS cross-tenant isolation", () => {
  it("Dave sees only DO Plumbing and Liam; nothing of Sarah's", async () => {
    await asUser(ID.daveUser);
    const biz = await db.query<{ name: string }>(`select name from businesses;`);
    expect(biz.rows.map((r) => r.name)).toEqual(["DO Plumbing & Heating Ltd"]);

    const emp = await db.query<{ full_name: string }>(`select full_name from employees;`);
    expect(emp.rows.map((r) => r.full_name)).toEqual(["Liam Carter"]);
  });

  it("Sarah sees only Bright Lights Salon and Priya; nothing of Dave's", async () => {
    await asUser(ID.sarahUser);
    const biz = await db.query<{ name: string }>(`select name from businesses;`);
    expect(biz.rows.map((r) => r.name)).toEqual(["Bright Lights Salon"]);

    const emp = await db.query<{ full_name: string }>(`select full_name from employees;`);
    expect(emp.rows.map((r) => r.full_name)).toEqual(["Priya Shah"]);
  });

  it("an authenticated user cannot write into another tenant", async () => {
    await asUser(ID.sarahUser);
    // Sarah tries to add an employee to Dave's business — WITH CHECK must reject.
    await expect(
      db.query(
        `insert into employees (business_id, full_name) values ($1, 'Mole');`,
        [ID.doPlumbing],
      ),
    ).rejects.toThrow();
  });

  it("config_versions is readable by any authenticated tenant (global statutory data)", async () => {
    await asUser(ID.sarahUser);
    const cfg = await db.query<{ n: number }>(`select count(*)::int as n from config_versions;`);
    expect(cfg.rows[0].n).toBe(2);
  });
});

describe("immutability of evidence tables", () => {
  it("rejects UPDATE and DELETE on determinations even for superuser", async () => {
    await asSuperuser();
    // Seed one determination directly (INSERT is allowed).
    await db.exec(`
      insert into determinations (employee_id, answers, verdict, confidence_band, rules_version, reference)
      values ('${ID.liam}', '{}'::jsonb, 'employee', 'clear', 'sa-1.0', 'FE-DET-2026-0001');
    `);
    await expect(
      db.query(`update determinations set verdict = 'worker' where reference = 'FE-DET-2026-0001';`),
    ).rejects.toThrow(/immutable/i);
    await expect(
      db.query(`delete from determinations where reference = 'FE-DET-2026-0001';`),
    ).rejects.toThrow(/immutable/i);
  });

  it("rejects UPDATE on events (append-only audit log)", async () => {
    await asSuperuser();
    await db.exec(
      `insert into events (business_id, action, entity) values ('${ID.doPlumbing}', 'test.event', 'business');`,
    );
    await expect(db.query(`update events set action = 'tampered';`)).rejects.toThrow(/immutable/i);
  });
});
