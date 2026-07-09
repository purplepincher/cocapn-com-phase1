# Ship Helm Command State Machine & Provisioning UI

This repository contains a **small, client‑side prototype** – not a full product – for exploring voice‑style commands that control a simulated ship’s heading, plus an experimental provisioning UI for ship lighting.  
It is meant as a design exploration and integration test harness, **not** production navigation software.

## What problem does it solve?

The core idea: demonstrate how a sequence of spoken‑like commands (`"port ten"`, `"course 045"`, `"belay"`, `"confirm"`) can drive a deterministic finite state machine that:

- Parses a command phrase (`parsePhrase()` in `state‑machine.js` handles ~10 wordings).
- Moves through states (`IDLE` → `C1_PULSING` → …) that mimic a real helm action.
- Simulates a timed relay closure (a “pulse”) that would, in a real system, eventually change the ship’s heading.
- Handles confirmation and cancellation in a two‑step dialogue window.

It is **not** connected to any physical helm or navigation instruments. All heading changes are simulated in‑memory.

## What’s in the repository?

| Path | Purpose |
|------|---------|
| `public/command-loop/` | The main helm command UI (HTML + CSS + JS). |
| `public/provisioning/` | An experimental provisioning / configuration UI (lighting setup). |
| `src/` | Cloudflare Worker entry point (trivially serves static assets). |
| `docs/` | Architecture notes. |

The JavaScript state machine (`state‑machine.js`) and the provisioning node tree (`provisioning‑tree.js`) are the core modules.

## How to run / deploy

### Locally

Because the site is pure static HTML/CSS/JS, you can serve it with any HTTP
server. The canonical way is the Worker itself (it serves `./public` via
[Workers static assets](https://developers.cloudflare.com/workers/static-assets/)):

```bash
npx wrangler dev      # http://localhost:8787
```

The command-loop demo loads `state-machine.js` as a classic `<script>` (not an
ES module) on purpose, so `public/index.html` also opens directly in a browser
from `file://` with no server at all.

### Deploy

```bash
npx wrangler deploy
```

This publishes the Worker bound to the `cocapn.com` zone. There is no build
step and no test suite — `src/index.ts` is a five-line asset passthrough, and
verification today is the live demos themselves plus the source links on the
landing page.

