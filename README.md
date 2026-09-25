# Cryptid Field Office

**A deadpan government bureau that takes every unexplained sighting seriously.** File a report about a cryptid, a light in the sky, a figure on the stairs, a spirit, or a secret society. An AI Field Investigator reads it, scores it and decides where it goes. A person signs off on anything unclear.

Underneath the costume it is a real **report-triage pipeline**: public intake, AI screening, linking related reports, a human decision, and an audit trail. Swap Bigfoot for potholes and it is a city 311 system.

Built for the DEV × Sanity challenge, Path Two ("Vibe-Code Something Strange"), with Claude Code.

| | |
|---|---|
| Public site | Next.js 16, Tailwind v4, `next-sanity` (`web/`) |
| Studio | Sanity Studio v6 with a custom desk, map input and the official Workflows plugin (`studio/`) |
| Case Board | A custom app on the **Sanity App SDK**: a live corkboard with red strings (`caseboard/`) |
| Process | **Sanity Workflows**: `case-lifecycle`, five stages, agent and human use the same transitions (`workflow/`) |
| Automation | **Sanity Functions** drain the workflow's effects when a report arrives (`functions/`) |
| AI | Sanity **Agent Actions** (fallback: the Anthropic API) |
| Sanity project | `cyh4xyo1`, dataset `production` (public) |

## How a case moves

```
intake ──(Field Investigator)──► investigation | review | filing
review ──(Director)────────────► investigation | filing
investigation ──(Investigator)─► filing
filing ──► closed
```

* The Field Investigator proposes a plausibility score and flags. **Code decides the route** (`workflow/lib/routing.ts`), never the model: under 20 is closed at triage, 20 to 69 goes to a person, 70 and over is investigated.
* The Cross-Referencer links related files by place, subject and pattern.
* A person can advance any case from three surfaces (the public **Director's Desk**, the **Case Board** and the **Studio**) through exactly the same workflow actions the agent uses.

### Design rules worth knowing

* **Faith is never the punchline.** Reports touching spirits and jinn are flagged `faith-sensitive`. They are never auto-closed, the model may not rule on belief, and the final filing step refuses an agent "debunked" stamp on one. The humour lives in the bureaucracy.
* **Every society and sighting is invented.** No real group, religion or person appears.
* **Wellbeing and coercion concerns** force human review and show a calm banner.
* **Cost is capped.** A kill switch and a daily AI budget live in `Bureau settings`.
* **No personal data.** Witnesses are anonymous codenames; IP addresses are salted-hashed for rate limiting and never stored; photos are re-encoded in the browser, which strips location data.

## Repository layout

```
studio/       Sanity Studio (schema, desk structure, map input, workflow plugin)
web/          Public Next.js site
caseboard/    Sanity App SDK app
workflow/     The case-lifecycle definition, effect handlers, routing rules
functions/    Sanity Function that dispatches workflow effects
scripts/      Seed builder, workflow seeding, repair, definition export
seed/         30 hand-written cases, subjects, regions, witnesses, generated evidence photos
PLAN.md       The full build runbook (written before any code)
BUILDLOG.md   An honest log of what worked, what broke and what changed
```

## Running it

You need Node 22+, a Sanity project and an editor-level API token.

```bash
# 1. tokens (never committed)
cp web/.env.example web/.env.local         # add SANITY_WRITE_TOKEN
# root .env: SANITY_AUTH_TOKEN, WORKFLOW_TAG=prod

# 2. schema, content and workflow
cd studio && npm i && npx sanity schema deploy && cd ..
npm i
npm run seed:build                          # writes seed/seed.ndjson
( cd studio && npx sanity dataset import ../seed/seed.ndjson --dataset production )
npm run wf:deploy                           # deploys case-lifecycle
npm run seed:workflows                      # drives the 30 seeded cases to their stages
npx sanity blueprints deploy                # deploys the wf-drain Function

# 3. the apps
cd web && npm i && npm run dev              # http://localhost:3000
cd studio && npm run dev                    # http://localhost:3333
cd caseboard && npm i && npm run dev        # via the Sanity Dashboard
```

Useful commands: `npm run wf:recover` (start missing instances and settle open ones), `npm run wf:check` (validate the definition offline), `npm run typecheck`.

## Honest limitations

* **Sanity Workflows is early access (0.x).** All `@sanity/workflow-*` packages are pinned to exactly `0.35.0`.
* The rate limiter is in-memory, so it bounds abuse per server instance, not globally. The hard cap on cost is the daily AI budget.
* The daily recovery sweeper was dropped: Scheduled Functions need an organisation-scoped stack. `npm run wf:recover` does the same job on demand.
* The Case Board and Studio need a Sanity login. The public site has no login, and the Director's Desk gives visitors the same workflow power.

See `CREDITS.md` for attributions.
