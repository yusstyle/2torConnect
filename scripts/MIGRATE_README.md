Migration README
=================

Purpose
-------
This document explains how the migration runner logs actions and how to run it safely (dry-run / dump SQL) when you cannot execute commands in this environment.

Relevant files
--------------
- Migration runner: [scripts/src/migrate.ts](scripts/src/migrate.ts)
- Combined SQL (generated): [scripts/migrations.sql](scripts/migrations.sql)

Flags
-----
- `--dry-run` — print each SQL statement to stdout without executing.
- `--dump-sql` — write all statements to `./migrations.sql` and exit without executing.

Logging behavior
----------------
- On successful execution of a migration step the script prints a line starting with a check mark, e.g. `✓ referral_code column`.
- On failure the script prints a tilde-prefixed line with the step name and a short error snippet, e.g. `~ referrals table: duplicate key value violates unique constraint`.
- The script writes to stdout only; to persist logs redirect stdout/stderr to a file.

Examples
--------
Print queries only (no DB changes):

```bash
pnpm --filter ./scripts run migrate -- --dry-run
```

Write combined SQL to `scripts/migrations.sql`:

```bash
pnpm --filter ./scripts run migrate -- --dump-sql
```

Execute migrations (will connect to your DB configured via your environment):

```bash
pnpm --filter ./scripts run migrate
```

Save logs to a file when executing:

```bash
pnpm --filter ./scripts run migrate > migrate.log 2>&1
```

Notes
-----
- Ensure your DB connection environment variables (e.g. `DATABASE_URL` or project-specific vars) are set before running the execute command.
- If PowerShell blocks `pnpm` or `tsx` execution due to policy, run the commands in an elevated shell or use WSL/Git Bash.
- The `--dump-sql` output is idempotent; review `scripts/migrations.sql` before applying to production.
