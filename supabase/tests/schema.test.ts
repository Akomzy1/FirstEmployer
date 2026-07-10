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

describe("account deletion honours statutory retention (P12)", () => {
  it("purges standard evidence + threads, keeps RTW/holiday-pay records, anonymises the owner", async () => {
    await asSuperuser();
    // Seed: one evidence row per retention class + an assistant thread + an obligation.
    await db.exec(`
      insert into evidence (business_id, type, file_path, retention_class) values
        ('${ID.doPlumbing}', 'misc_upload',  '${ID.doPlumbing}/misc/a.pdf',    'standard'),
        ('${ID.doPlumbing}', 'rtw_record',   '${ID.doPlumbing}/rtw/r.pdf',     'rtw_employment_plus_2y'),
        ('${ID.doPlumbing}', 'holiday_log',  '${ID.doPlumbing}/pay/h.pdf',     'holiday_pay_6y');
      insert into assistant_threads (id, business_id, title)
        values ('00000000-0000-4000-8000-0000000000f1', '${ID.doPlumbing}', 'test thread');
      insert into assistant_messages (thread_id, role, content)
        values ('00000000-0000-4000-8000-0000000000f1', 'user', 'hello');
      insert into obligations (business_id, type, state) values ('${ID.doPlumbing}', 'record_keeping', 'complete');
    `);

    // Run the deletion as the account owner (RPC path).
    await asUser(ID.daveUser);
    const purged = await db.query<{ paths: string[] }>(
      `select public.delete_account_with_retention('${ID.doPlumbing}') as paths;`,
    );
    // The caller gets back exactly the standard-retention file paths to purge from storage.
    expect(purged.rows[0].paths).toEqual([`${ID.doPlumbing}/misc/a.pdf`]);

    await asSuperuser();
    const evidence = await db.query<{ retention_class: string }>(
      `select retention_class::text from evidence where business_id = '${ID.doPlumbing}' order by retention_class;`,
    );
    // RTW + holiday-pay records survive; the standard row is gone.
    expect(evidence.rows.map((r) => r.retention_class)).toEqual(["holiday_pay_6y", "rtw_employment_plus_2y"]);

    const threads = await db.query<{ n: number }>(
      `select count(*)::int as n from assistant_threads where business_id = '${ID.doPlumbing}';`,
    );
    expect(threads.rows[0].n).toBe(0);

    const owner = await db.query<{ full_name: string }>(
      `select full_name from profiles where id = '${ID.daveUser}';`,
    );
    expect(owner.rows[0].full_name).toBe("Deleted user");

    const biz = await db.query<{ subscription_state: string }>(
      `select subscription_state::text from businesses where id = '${ID.doPlumbing}';`,
    );
    expect(biz.rows[0].subscription_state).toBe("canceled");
  });

  it("a non-member cannot run the deletion", async () => {
    await asUser(ID.sarahUser);
    await expect(
      db.query(`select public.delete_account_with_retention('${ID.doPlumbing}');`),
    ).rejects.toThrow(/not a member/i);
  });
});

describe("config publish flow (P14)", () => {
  it("publish requires a note, flips statuses, and lands in events", async () => {
    await asSuperuser();
    // Seed a draft version to publish.
    const draft = await db.query<{ id: string }>(`
      insert into config_versions (label, effective_from, status, values)
      values ('2027.1', '2027-04-01', 'draft', (select values from config_versions where label = '2026.2'))
      returning id;
    `);
    const draftId = draft.rows[0].id;

    // A short note is rejected.
    await expect(
      db.query(`select public.publish_config_version('${draftId}', 'short', '${ID.daveUser}', 'admin@firstemployer.co.uk');`),
    ).rejects.toThrow(/audit note/i);

    // A proper publish supersedes the old live version and promotes the draft.
    await db.query(
      `select public.publish_config_version('${draftId}', 'Tax year 2027/28 uprating per HMRC bulletin.', '${ID.daveUser}', 'admin@firstemployer.co.uk');`,
    );
    const statuses = await db.query<{ label: string; status: string }>(
      `select label, status::text from config_versions order by label;`,
    );
    const byLabel = Object.fromEntries(statuses.rows.map((r) => [r.label, r.status]));
    expect(byLabel["2027.1"]).toBe("live");
    expect(byLabel["2026.2"]).toBe("superseded");

    const ev = await db.query<{ n: number }>(
      `select count(*)::int as n from events where action = 'config.published' and entity_id = '${draftId}';`,
    );
    expect(ev.rows[0].n).toBe(1);

    // Publishing an already-live version is rejected.
    await expect(
      db.query(`select public.publish_config_version('${draftId}', 'A second publish attempt note.', '${ID.daveUser}', 'admin@firstemployer.co.uk');`),
    ).rejects.toThrow(/already live/i);
  });

  it("feedback rows insert for members and are inaccessible to authenticated reads", async () => {
    await asUser(ID.daveUser);
    await db.exec(
      `insert into feedback (business_id, flow, rating, comment) values ('${ID.doPlumbing}', 'contracts', 5, 'The examiner caught a clause I would have got wrong.');`,
    );
    const visible = await db.query<{ n: number }>(`select count(*)::int as n from feedback;`);
    expect(visible.rows[0].n).toBe(0); // no select policy — admin (service role) only
    await asSuperuser();
    const all = await db.query<{ n: number }>(`select count(*)::int as n from feedback;`);
    expect(all.rows[0].n).toBe(1);
  });
});
