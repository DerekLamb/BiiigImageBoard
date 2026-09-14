# Dev Harness

Browser + vision harness for the BiiigImageBoard app. It lets a
vision-capable subagent boot the stack, drive the UI with Playwright, capture
screenshots, and read the app's current state for decision-making.

## Layout

| Path | Purpose |
| --- | --- |
| `up.sh` | Start MongoDB (docker compose) + Vite dev server. Idempotent. |
| `down.sh` | Stop the dev server and Mongo stack. |
| `status.sh` | Show ports, HTTP status, docker state, and recent Vite logs. |
| `drive.mjs` | Playwright scenario runner: screenshots, text/snapshot capture, console/network error collection, JSON report. |
| `scenarios/` | Optional custom scenario JSON files. |
| `shots/` | Screenshots written here (gitignored). |
| `.run/` | Runtime state, logs, PIDs, saved login state, `last-report.json` (gitignored). |

## Quick start

```bash
# from the repo root
dev/harness/up.sh
node dev/harness/drive.mjs --preset smoke
dev/harness/status.sh
```

`drive.mjs` writes screenshots to `dev/harness/shots/` and a machine-readable
report to `dev/harness/.run/last-report.json`. Read the PNGs with a
vision-capable model to actually see the UI.

## Custom scenario

```bash
node dev/harness/drive.mjs --scenario dev/harness/scenarios/example.json
node dev/harness/drive.mjs --url https://localhost:5173/posts --out posts.png
node dev/harness/drive.mjs --preset smoke --fresh   # ignore saved login
```

Scenario steps support: `goto`/`route`, `click`, `fill`, `setFiles`, `press`,
`wait`, `waitFor`, `screenshot` (`fullPage`, `selector`), `text`, `snapshot`
(ARIA tree), `eval`, `expect`, and `conditional` step groups.

Credentials default to `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `app/.env`.
Login state is cached in `.run/state.json` and reused unless `--fresh` is set.
