# CRYPTID FIELD OFFICE: End-to-End Build Plan
### Sanity Challenge, Path Two ("Vibe-Code Something Strange"). Deadline: Oct 4, 2026, 11:59 PM PDT


> ## SCOPE AMENDMENT 2026-09-24 (Mubeen): UFOs, aliens and Area 51 are IN. This section OVERRIDES the body where they differ.
>
> The Bureau now covers **every kind of unexplained sighting**: cryptids, UFO/UAP, extraterrestrial encounters, and restricted sites (Area 51 style). Tagline stays "Department of Unexplained Sightings".
>
> **Schema changes already made in code (studio/schemaTypes):**
> - The `creature` document type is now **`subject`** (title "Subject"). Read "creature" in the body below as "subject". Field renames: `case.sighting.creatureClaimed` -> `subjectClaimed`, `case.triage.creatureMatch` -> `subjectMatch`, `classification` -> **`category`** (`cryptid | ufo | extraterrestrial | ghost | spirit | occult`, see AMENDMENT 2). Handler/GROQ/UI code must use the new names. Agent output key `creatureSlug` -> `subjectSlug`.
> - `case` gains required **`category`** (`cryptid | ufo | extraterrestrial | ghost | spirit | occult`, see AMENDMENT 2) and `sighting.objectShape` (UFO only: triangle, disc, sphere, cigar, tic-tac, light-only, other).
> - `region` gains **`restricted`** (boolean). Cases filed in a restricted region show a RESTRICTED banner and heavier redaction styling.
> - New triage flags: `aircraft-explains`, `celestial-explains`, `satellite-explains` (Venus, ISS, Starlink trains, flares are the classic UFO explanations; the agent prompt must know this and score accordingly).
>
> **Seed data (replaces section 12 counts):** 14 subjects: 7 cryptids (Sasquatch, Mothman, Jersey Devil, Chupacabra, Loch Ness Monster, Skunk Ape, Flatwoods Monster), 4 UFO (Silent Triangle, Tic-Tac Object, Classic Disc, Luminous Orb Cluster), 3 extraterrestrial (Grey Humanoid, Nordic Humanoid, Mantis-type Humanoid). 10 regions incl. **Area 51 / Groom Lake NV (restricted)**, Rachel NV (Extraterrestrial Highway), Roswell NM, Sedona AZ, Point Pleasant WV, Pine Barrens NJ, Pacific Northwest, Loch Ness UK, Florida Everglades, Puerto Rico. 30 cases: 12 cryptid, 11 UFO, 7 extraterrestrial; at least 6 filed in restricted regions. Same stage targets as before (4 review, 5 investigation, 8 classified, 9 debunked, 4 inconclusive). Fictional reports at real places, deadpan, no real named people, no claims about real incidents.
>
> **UI additions:** category filter chips (All / Cryptid / UFO / Extraterrestrial) on /cases and the home page counters; map markers use a distinct icon per category; the Case Board polaroid shows a category glyph; dossier shows `objectShape` for UFO cases and a RESTRICTED banner where applicable; report form step 1 starts with "What kind of sighting?" (cryptid / strange lights or craft / alien encounter / not sure). Design stays "declassified dossier": Area 51 cases lean on redaction bars.
> **Copy:** "Department of Unexplained Sightings" everywhere; add the microcopy line "If you have seen something you cannot explain, you are not alone. File it anyway."

>
> ## SCOPE AMENDMENT 2 (2026-09-24, Mubeen): ghosts, jinn, spirits and occult are IN. Overrides Amendment 1 where they differ.
> - **Categories are now exactly:** `cryptid`, `ufo`, `extraterrestrial`, `ghost` (ghosts, hauntings, poltergeists), `spirit` (spirits and jinn), `occult` (rituals, omens, sites, curses). `folklore` and `misidentified` are no longer categories (misidentification is a triage flag / verdict, not a category). Subject `category` uses the same six values. Shared list lives in `studio/schemaTypes/constants.ts` (`CATEGORIES`).
> - **Faith sensitivity (non-negotiable design rule).** Jinn and spirits are part of real religious belief for many people, so the Bureau's deadpan humour must never mock them. Rules: (1) the Field Investigator prompt must say: never rule on matters of faith, describe only observable circumstances, never call a witness mistaken or deluded, never use humour about a religious belief; (2) new triage flags `faith-sensitive` and `wellbeing-concern`; the agent sets `faith-sensitive` for spirit/jinn/occult reports touching religious belief; (3) **routing override in `routing.ts`: any case with `faith-sensitive` is NEVER auto-debunked; minimum route is `review`**; (4) `wellbeing-concern` (e.g. distress, possession fears, harm to self or others) also forces `review`, hides nothing, and shows a calm banner on the filed page: "If you or someone you know is distressed, please talk to someone you trust or contact local support services."; (5) the human-facing stamps for these cases default to CLASSIFIED (on record) or INCONCLUSIVE, and the `debunk` action still exists but the Director UI shows an extra confirm ("This report may involve religious belief. The Bureau takes no position on matters of faith."); (6) the subject entry for Jinn is written respectfully and neutrally: "Beings described in Islamic tradition. The Bureau takes no position on matters of faith and records only what witnesses report." No punchlines at the expense of any belief; the humour stays in the bureaucracy, never in the belief.
> - **Seed (replaces Amendment 1 counts):** 20 subjects: cryptid 6 (Sasquatch, Mothman, Jersey Devil, Chupacabra, Loch Ness Monster, Skunk Ape), ufo 4 (Silent Triangle, Tic-Tac Object, Classic Disc, Luminous Orb Cluster), extraterrestrial 3 (Grey Humanoid, Nordic Humanoid, Mantis-type Humanoid), ghost 3 (Grey Lady, Shadow Figure, Poltergeist), spirit 2 (Jinn, reported presence; Wandering Spirit), occult 2 (Ritual Site Activity, Unexplained Omen). 30 cases: cryptid 8, ufo 7, extraterrestrial 4, ghost 5, spirit 3, occult 3; at least 5 in restricted regions; regions add a few haunted-site places (e.g. Edinburgh vaults UK, New Orleans LA, Salem MA). Stage targets unchanged. The 3 spirit cases must be faith-sensitive and must land in review / classified / inconclusive, never debunked.
> - **UI:** category chips become All / Cryptid / UFO / Alien / Ghost / Spirit / Occult; each category has its own map marker glyph, colour tint (kept within the dossier palette) and polaroid glyph.
> - **AMENDMENT 3: secret cults and societies are IN, inside the `occult` category** (title "Occult & secret societies"; covers rituals, omens, cursed sites, cults, secret societies). Rules: (1) **fictional groups only**: invent societies (e.g. "The Order of the Hollow Lantern", "The Ninth Meridian Society"); never name or imply a real organisation, real religion, real sect or real person, and never portray real fraternal or religious groups as sinister; (2) seed `occult` cases: 3 to 4, at least 2 about fictional societies; add a Subject "Secret Society Activity" and "Ritual Site Activity"; (3) new triage flag `coercion-concern` (someone describes being pressured, recruited against their will, or held): forces `review`, shows the same wellbeing banner as `wellbeing-concern`, never auto-debunks; (4) the deadpan humour targets the bureaucracy (surveillance files, redacted membership rolls), never the members or any belief.

> **For the Claude session executing this plan:** this is a complete runbook. Do not re-plan. Work through the phases in order.
> If an API signature differs from what is written here, look in the installed package's types
> (`node_modules/<pkg>/dist/*.d.ts`) or README, make the smallest possible change, and record it in `BUILDLOG.md` under "Plan vs reality".
> Stop and ask Mubeen only for the conditions listed in §0.4.

---

## 0. Ground rules for the executing session

### 0.1 Before starting any task
1. Read `~/.claude/memory.md` (a SessionStart hook normally loads it; if it isn't in context, read it). It holds Mubeen's preferences and lessons. Follow them.
2. Read this plan, `CLAUDE.md` and `BUILDLOG.md` in the repo root.
3. **After each task:** if Mubeen corrected you, or you learned something worth keeping, append one short line to `memory.md` in the form `- YYYY-MM-DD HH:MM — lesson` (get the time from `date "+%Y-%m-%d %H:%M"`). Never rewrite, reorder or delete old lines.

### 0.2 First actions of the first execution session (Phase 0 does this)
- Append these lines to `~/.claude/memory.md` (the file already exists and is auto-loaded, so do NOT create a second memory file):
  - `- 2026-09-24 20:15 — Plans must be complete end-to-end runbooks (exact commands, file layout, edge cases, fallbacks, test pass) so a fresh session can execute with zero re-planning.`
  - `- 2026-09-24 20:15 — UI work must be attractive, highly polished and to current standards (WCAG 2.2 AA, responsive 360–1920px, dark mode, reduced motion, Core Web Vitals). "Works" is not done.`
  - `- 2026-09-24 20:15 — Mubeen is non-technical: explain what is being built and what he must do in plain language; never assume he knows dev tooling. Give him exact click-by-click steps for anything he must do himself.`
- Copy this plan into the repo as `PLAN.md`.
- Create `CLAUDE.md` containing: "Read ~/.claude/memory.md and PLAN.md before any task. Append lessons to memory.md after each task (dated line, never rewrite old lines). No tests until the Phase 8 comprehensive pass. Keep BUILDLOG.md updated after every phase."

### 0.3 Testing policy (Mubeen's rule, non-negotiable)
- **No tests during implementation.** Don't run the apps to check them, don't write test files or test scripts, don't do screenshot checks mid-build.
- Allowed during implementation (setup, not testing): installs, scaffolding, `sanity-workflows deploy`, `sanity schema deploy`, dataset import, the seed script and deploys, because later phases depend on them. If one of these errors, fix it; that's setup, not a test pass.
- **Exactly one comprehensive test pass**, after everything is implemented and deployed (Phase 8). Then fix what failed, and re-check only the failed items.

### 0.4 Stop and ask Mubeen only when
- An interactive login or account action is needed (listed in each phase as **👤 MUBEEN DOES**).
- A paid plan is required for something.
- A Workflows API turns out to lack a capability the design depends on (not just a different signature). Use the fallback in §14 and tell him.
- Anything destructive to the dataset (deleting documents, `blueprints destroy`, dataset delete).
- Committing: per memory, commit only after Mubeen has seen and OK'd the phase. Ask at the end of each phase: "Commit this phase?"

### 0.5 Secrets hygiene
- Tokens and API keys never go in chat and never get committed. Claude creates `.env.local` / `.env` files with placeholder values. **👤 Mubeen pastes the real values** into those files himself.
- `.gitignore` covers `.env*` (except `.env.example`), `node_modules`, `.next`, `dist`, `.sanity`.
- Before uploading the agent session (Phase 9), scrub it: grep for `sk[A-Za-z0-9]{20,}`, `sk-ant-`, the account email handle, and `token`.

---

## 1. What we are building (product in one page)

**Cryptid Field Office (CFO)** is a deadpan government-bureau web app that processes public reports of cryptid sightings (Bigfoot, Mothman, the Jersey Devil…). Underneath, it's a real **report-triage system**, the same pattern as a city 311 line, a bug tracker or insurance claims: *public intake → AI screening → linking related reports → human decision → public record with an audit trail.*

**Tone:** straight-faced, never goofy. It uses case numbers, stamps, memos and formal language, and the humour comes from taking it seriously. The write-up says outright: *"Swap Bigfoot for potholes and this is a city 311 system."*

### Three surfaces, one content lake
| Surface | Tech | Who uses it | Purpose |
|---|---|---|---|
| **Public site** (`web/`) | Next.js 16 on Vercel | Anyone, including the judges (no login) | Browse the case map, read dossiers, **file a report and watch the AI triage it live**, try the "Director's Desk (visitor access)" to approve or debunk cases |
| **Case Board** (`caseboard/`) | Sanity App SDK app in the Sanity Dashboard | Bureau staff | Real-time red-string conspiracy board (React Flow). Drag cases, draw strings to link them, confirm or reject agent-proposed links, fire workflow actions, see the workflow diagram |
| **Studio** (`studio/`) | Sanity Studio v6 | Editors | Schema editing, custom map input, workflow strip via the official Workflows plugin, custom desk structure, badges |

### The process (Sanity Workflows, `case-lifecycle`)
`intake → (agent triage) → review | investigation | filing → filing → closed`
- The **Field Investigator agent** (a workflow effect) scores plausibility 0–100. Code (not the LLM) routes the case: <20 → auto-debunk; 20–69, inappropriate, or an emergency → human review; ≥70 → investigation.
- The **Cross-Referencer agent** (an effect in investigation) finds nearby or similar cases with GROQ `geo::distance` and proposes `connection` documents (the red strings).
- **Humans** move cases through the same transitions from three places: the Studio plugin, the Case Board, and the public Director's Desk. That's exactly what the judges asked for.

### Why this should win (mapped to judging criteria)
1. **Honest writeup:** `BUILDLOG.md` is kept from day one, including Plan vs reality and Workflows 0.x surprises.
2. **Functionality:** judges can do the whole loop with no login (file a report, watch the stamp land, act as Director).
3. **Schema:** typed evidence union, geo, references, first-class `connection` docs with provenance, witness credibility computed across cases, and a workflow-state mirror with a monotonic guard.
4. **Creativity:** a deadpan bureau and a red-string board. Plus both bonuses (**App SDK** and **Workflows**), and Workflows launched on Sep 14, so few entrants will have it.

---

## 2. Architecture

```
                 ┌─────────────── Sanity project (dataset: production, PUBLIC read) ───────────────┐
 Public (web/)   │ content docs: case, creature, region, witness, connection, boardPin, settings   │
 Next.js 16 ─────┤ workflow docs: sanity.workflow.instance (tag "prod")  ← engine writes these     │
  server actions │                                                                                 │
  (write token)  └───────▲───────────────────────▲────────────────────────▲────────────────────────┘
      │ startInstance    │ fireAction            │ document function      │ App SDK (user auth)
      │ fireAction       │ (Studio plugin)       │ wf-drain: drainEffects │ caseboard: sessions,
      ▼                  │                       │  → effect handlers     │ fireAction, pins, strings
  Photon geocoder     Studio v6            Sanity Functions (Node 24)   Sanity Dashboard
  OpenFreeMap tiles   + workflow plugin    + LLM (Agent Actions prompt | Anthropic fallback)
```

### Repo layout (the repo root, git repo → GitHub `cryptid-field-office`, public)
There are no npm workspaces (React 19 / styled-components / Next / Vite hoisting conflicts). Four independent npm projects:
```
/                          root project: workflow + functions + scripts  (package.json "type":"module")
  sanity.workflow.ts       deployments config (tag "prod")
  sanity.blueprint.ts      Functions blueprint
  workflow/
    case-lifecycle.ts      THE workflow definition (§5)
    handlers/              effect handlers (§6): triage.ts crossref.ts mirror.ts file-verdict.ts index.ts
    lib/                   content-client.ts, llm.ts, settings.ts, routing.ts, validate.ts, log.ts
  functions/
    wf-drain/index.ts      document function → drainEffects
    wf-sweep/index.ts      scheduled (daily) → sweepStaleClaims + tick
  scripts/
    build-seed.ts          seed/data.ts → seed/seed.ndjson
    seed-workflows.ts      starts instances for seed cases and drives them to their target stage
    drain.ts               local drainer (same handlers). Used for seeding and recovery
    recover.ts             start missing instances, sweep stale claims, drain
    export-definition.ts   writes definition JSON → caseboard/src/generated + web/src/generated
  seed/data.ts, seed/seed.ndjson
  studio/                  Sanity Studio v6 project
  web/                     Next.js 16 project
  caseboard/               App SDK project
  PLAN.md  CLAUDE.md  BUILDLOG.md  README.md  CREDITS.md  SUBMISSION.md  .gitignore
```

### Pinned versions (as of 2026-09-24; install with `--save-exact` for everything `@sanity/workflow-*`)
- `@sanity/workflow-*`: **exactly 0.35.0, all of them** (0.x minors can break; never upgrade during the challenge). The set: `workflow-engine`, `workflow-cli`, `workflow-blueprint`, `workflow-studio-plugin`, `workflow-studio`, `workflow-react`, `workflow-sdk`, `workflow-components`, `workflow-diagram`.
- `sanity` ^6.16 (the Studio plugin needs ≥6.15), `@sanity/vision` ^6.16, `@sanity/client` ^8.7, `@sanity/sdk` + `@sanity/sdk-react` ^3.5, `@sanity/ui` ^4.2, `@sanity/icons` ^5.2, `styled-components` ^6.5, `react`/`react-dom` ^19.2.7
- `@sanity/functions` ^1.8, `@sanity/blueprints` ^0.27, `tsx` ^4.23, `typescript` **^6** in the root (safer than 7 with tooling), `valibot` or `zod` ^4.6
- web: `next` ^16.3, `next-sanity` ^13.3, `@sanity/image-url` ^2.1, `tailwindcss` ^4.3 + `@tailwindcss/postcss`, shadcn/ui (latest CLI), `motion` ^13, `next-themes` ^0.4, `sonner` ^2, `vaul` ^1.1, `lucide-react`, `swr` ^2.5, `zod` ^4, `react-map-gl` ^8.1 + `maplibre-gl` (the version react-map-gl's peerDeps accept; if 6.x isn't accepted, use 5.x)
- caseboard: `@xyflow/react` ^12.12, plus the App SDK set above. **`package.json` override required:** `"overrides": {"@sanity/sdk": {"@sanity/mutate": "0.18.2"}}` (from the Workflows App SDK docs)
- Local Node 22.18 (OK: App SDK needs ≥22.12). Functions run on Node 24 in the cloud.

### Environment variables
| File | Vars |
|---|---|
| root `.env` | `SANITY_PROJECT_ID`, `SANITY_DATASET=production`, `SANITY_AUTH_TOKEN` (editor robot token), `WORKFLOW_TAG=prod`, `LLM_PROVIDER=sanity` (or `anthropic`), `ANTHROPIC_API_KEY` (optional), `ANTHROPIC_MODEL=claude-haiku-4-5` |
| `web/.env.local` | `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET=production`, `SANITY_WRITE_TOKEN` (editor robot, server-only), `WORKFLOW_TAG=prod`, `NEXT_PUBLIC_SITE_URL` |
| `caseboard` | projectId/dataset as constants in `src/config.ts` (not secret). The org ID goes in `sanity.cli.ts` |
| Functions | provided by the blueprint and `context.clientOptions`. `LLM_PROVIDER` / `ANTHROPIC_API_KEY` via the functions env command (§7) |

---

## 3. Content model (`studio/schemaTypes/`)

**Critical ID rule:** document IDs must **never contain a dot**. IDs with dots are private sub-path docs and don't show up in public (unauthenticated) queries. Use `case-<uuid>`, `conn-<idA>-<idB>`, `pin-<caseId>`, `witness-<code>`. (Workflow instance IDs contain dots and stay private, which is fine because we mirror their state onto the case.)

### `case` (the workflow subject)
| field | type | notes |
|---|---|---|
| caseNumber | string, required, readOnly | `CFO-2026-0147`. Allocated atomically (§8.3) |
| title | string, required, max 90 | e.g. "Tall figure crossing Route 9 at dusk" |
| status | string enum, readOnly | `intake, review, investigation, filing, classified, debunked, inconclusive`. **Mirror of the workflow stage.** Written only by effects and by creation |
| sighting | object | `observedAt` datetime (required, not in the future, ≥1950); `location` object {`geo` geopoint required, `placeName` string, `region` ref→region}; `conditions` {`light` enum daylight/dusk/night/artificial, `weather` enum clear/rain/fog/snow/wind, `distanceMeters` number 0–5000, `durationSeconds` number 0–7200}; `description` text (40–2000 chars); `creatureClaimed` ref→creature (optional) |
| witness | ref→witness, required | |
| evidence | array of typed objects | `photoEvidence` {image (hotspot), caption}, `footprintEvidence` {lengthCm 1–200, image?}, `soundEvidence` {description text, durationSeconds}, `testimonyEvidence` {quote text, speaker string}. Max 6 |
| triage | object (readOnly in Studio) | `plausibility` 0–100, `summary` string, `memo` text (bureau memo), `creatureMatch` ref→creature, `flags` array of string (allowlist: `possible-misidentification, known-hoax-pattern, weather-explains, animal-explains, low-detail, inappropriate-content, possible-emergency, strong-detail, multiple-witnesses`), `route` enum auto-debunk/review/investigation, `triagedAt`, `model` string, `effectKey` string |
| verdict | object (readOnly) | `outcome` enum classified/debunked/inconclusive, `note`, `filedAt`, `filedBy` enum agent/director/visitor |
| log | array of `logEntry` {_key, at datetime, actor enum agent/human/visitor/system, kind enum received/triaged/routed/connected/decision/filed/error, message string} | The public audit trail. `_key` = effectKey for idempotency |
| workflowInstanceId | string, readOnly, hidden | set after startInstance |
| hidden | boolean | moderation. Hidden cases are excluded from every public query |
| source | enum web/seed/studio | |
| submissionKey | string, hidden | client idempotency key |

**Studio preview:** title, `caseNumber · status`, media = a status stamp icon.

### `creature` (taxonomy)
`name`, `slug`, `codename` (e.g. `SUBJECT-BF`), `classification` enum cryptid/folklore/misidentified-animal, `summary` (text, 280), `description` (portable text), `signatureTraits` string[], `habitat` string[], `sizeRangeCm` {min,max}, `firstRecorded` number (year), `threatLevel` 1–5, `plate` (image, optional, public-domain engraving with a credit string), `plateCredit` string.

### `region`
`name`, `slug`, `country`, `centroid` geopoint.

### `witness`
`codename` (e.g. `WITNESS-4F2A`, generated), `credibility` 0–100 (computed, readOnly), `reportsCount`, `closedCounts` {classified, debunked, inconclusive}. **No PII:** no name, no email, no IP.

### `connection` (a red string, first-class)
`from` ref→case, `to` ref→case (IDs sorted so from<to), `reason` string ≤160, `confidence` 0–1, `proposedBy` enum agent/human, `status` enum proposed/confirmed/rejected, `createdAt`, `decidedAt`. ID `conn-<fromId>-<toId>` makes it unique per pair.

### `boardPin`
`case` ref, `x` number, `y` number. ID `pin-<caseId>`. Case Board layout only.

### `bureauSettings` (singleton, ID `bureau-settings`)
`agentEnabled` bool (default true), `dailyAgentBudget` number (default 60), `publicDeskEnabled` bool (default true), `publicDeskHourlyLimit` number (default 10).

### `counter` (ID `counter-case-number`)
`year` number, `value` number.

---

## 4. LLM layer (`workflow/lib/llm.ts`)
- `askJson<T>(instruction: string, params: Record<string,string>, validate: (x: unknown) => T): Promise<{value: T, model: string}>`
- Provider `sanity` (default): `content.agent.action.prompt({instruction, instructionParams: {<k>: <string constant>}, format: 'json'})`. It needs `@sanity/client` ≥7.4 and an `apiVersion` that supports agent actions (`'vX'` per the docs). Put the case JSON in as a **string constant param**, so both providers get identical inputs.
- Provider `anthropic` (fallback, if Agent Actions are unavailable or out of quota): `@anthropic-ai/sdk` `messages.create`, model `ANTHROPIC_MODEL` (default `claude-haiku-4-5`), system prompt = bureau persona, and "Respond with JSON only" enforced by the validator.
- One retry on invalid JSON or validation failure, with a 45 s timeout per call. After that, throw. The effect fails and the workflow routes to human review (§5).

---

## 5. Workflow definition: `workflow/case-lifecycle.ts`

Imports come from `@sanity/workflow-engine/define`. The workflow is named `case-lifecycle`, has `initialStage: 'intake'`, and `expectedMinReaderModel: 10` (the subject is required).

**Workflow fields:** `subject` (type subject, required, initialValue input) · `director` (actor) · `investigator` (actor) · `decision` (string) · `verdict` (string) · `verdictNote` (string).

**Stages:**

**1. `intake`** "Intake & triage"
- activity `triage`:
  - `analyze`: `when: 'true'`, effects `[{name:'agent-triage', bindings:{subject:'$fields.subject._id'}, outputs:[{type:'boolean',name:'needsHuman'},{type:'boolean',name:'likelyHoax'}]}]`
  - `triaged`: `when: "$effectStatus['agent-triage'] == 'done'"`, `status: 'done'`
- transitions, **in this order**:
  1. `triage-failed` → `review`, `when: "$effectStatus['agent-triage'] == 'failed'"`
  2. `auto-close` → `filing`, `when: "$allActivitiesDone && $effects['agent-triage'].likelyHoax && !$effects['agent-triage'].needsHuman"`
  3. `to-review` → `review`, `when: "$allActivitiesDone && $effects['agent-triage'].needsHuman"`
  4. `to-investigation` → `investigation`, `when: '$allActivitiesDone'`

**2. `review`** "Director's review"
- activity `decide`:
  - `mirror`: `when:'true'`, effects `[{name:'mirror-review', bindings:{subject:'$fields.subject._id'}}]`
  - `open-investigation`: `status:'done'`, ops: set `decision` literal `'investigate'`, set `director` = actor
  - `debunk`: `status:'done'`, params `[{type:'string', name:'note', title:'Grounds for debunking', required:true}]`, ops: set `decision` `'close'`, `verdict` `'debunked'`, `verdictNote` = param note, `director` = actor
- transitions: `to-investigation` when `"$allActivitiesDone && $fields.decision == 'investigate'"`; `to-filing` when `"$allActivitiesDone && $fields.decision == 'close'"`

**3. `investigation`** "Field investigation"
- activity `cross-reference` (automatic):
  - `run`: `when:'true'`, effects `[{name:'mirror-investigation', bindings:{subject}}, {name:'agent-crossref', bindings:{subject}}]`
  - `done`: `when: "$effectStatus['agent-crossref'] == 'done'"`, `status:'done'`
  - `skip-on-failure`: `when: "$effectStatus['agent-crossref'] == 'failed'"`, `status:'done'` (a failed cross-reference must never block a case)
- activity `field-report` (human): `classify`, `debunk`, `inconclusive`. Each has `status:'done'` and a required `note` param; ops set `verdict` to the literal, `verdictNote` = note, `investigator` = actor
- transition: `to-filing` when `'$allActivitiesDone'`

**4. `filing`** "Filing"
- activity `file`:
  - `stamp`: `when:'true'`, effects `[{name:'file-verdict', bindings:{subject:'$fields.subject._id', verdict:"coalesce($fields.verdict, 'debunked')", note:"coalesce($fields.verdictNote, 'Closed at triage by the Field Investigator.')", by:"select(defined($fields.investigator) => 'investigator', defined($fields.director) => 'director', 'agent')"}}]`
  - `filed`: `when: "$effectStatus['file-verdict'] == 'done'"`, `status:'done'`
- transition: `to-closed` when `'$allActivitiesDone'`

**5. `closed`**: terminal, no activities.

**If an expression form is rejected at `sanity-workflows deploy --check`:**
- If `select()`/`coalesce()` are rejected inside bindings: bind the raw fields (`$fields.verdict`, `$fields.verdictNote`, `$fields.director`, `$fields.investigator`) and do the defaulting inside the `file-verdict` handler.
- If boolean effect outputs can't be referenced in transitions: have the triage handler write `route` on the case, and add three `status:'done'` actions whose `when` checks `$effects['agent-triage'].route == '…'`, each setting `decision` via ops; transitions then read `$fields.decision`.
- Record any change in BUILDLOG.

`sanity.workflow.ts`: `defineWorkflowConfig({deployments:[{name:'production', tag:'prod', expectedMinReaderModel:10, workflowResource:{type:'dataset', id:`${PROJECT_ID}.production`}, definitions:[caseLifecycle]}]})`. Content and workflow instances share **one dataset** (simplest; the plugin, SDK and web all point at the same place).

---

## 6. Effect handlers (`workflow/handlers/`)

Shared setup: `content` client (`@sanity/client`, token, `perspective:'published'` for reads, `useCdn:false`). `subjectId(params)` uses `extractDocumentId` from `@sanity/workflow-engine`. `appendLog(caseId, entry)` inserts `log[]` with `_key = ctx.effectKey` **only if no entry with that key exists** (check first, then `patch.setIfMissing({log:[]}).insert('after','log[-1]',[entry])`). Every handler is **idempotent** because leases can expire and effects can re-run.

### `agent-triage`
1. Fetch the case (with witness, creatureClaimed, evidence summary). **Missing case** → log to console and return `{outputs:{needsHuman:true, likelyHoax:false}}`.
2. **Replay guard:** if `case.triage.effectKey === ctx.effectKey`, return the outputs derived from the stored triage (no LLM call).
3. **Seed guard:** if `case.source === 'seed'` and `case.triage.plausibility` is set, skip the LLM and route from the stored plausibility (this is how seeds reach their target stages without spending quota).
4. **Kill switch / budget:** read `bureauSettings`. If `!agentEnabled`, or the count of cases with `triage.triagedAt > now-24h && triage.model != 'none'` ≥ `dailyAgentBudget` → write triage `{plausibility: null, summary:'Field Investigator unavailable; routed to the Director.', model:'none', route:'review'}` and return `needsHuman:true`.
5. Build the context: the case JSON; creatures list `{slug, name, signatureTraits, habitat}`; witness history `{reportsCount, closedCounts, credibility}`.
6. `askJson` with the instruction (bureau-memo persona, deadpan, never mocks the witness, never claims creatures are real or fake as fact). Output schema: `{plausibility:int 0-100, creatureSlug:string|null, summary:string≤400, memo:string≤1200, flags:string[] (allowlist), inappropriate:boolean, emergency:boolean}`.
7. **Validate and sanitize:** clamp plausibility to an integer 0–100; drop unknown flags; `creatureSlug` must exist in the list, else null; truncate strings.
8. **Deterministic routing (`routing.ts`), because code decides and not the LLM:** `inappropriate || emergency` → review (and set `hidden:true` if inappropriate); `p < 20` → auto-debunk; `20 ≤ p < 70` → review; `p ≥ 70` → investigation.
9. Patch the case: `triage{…, route, triagedAt, model, effectKey}`, `hidden` if needed. Log entry: `"Field Investigator: plausibility 62/100. Routed to the Director."`
10. Return `{outputs:{needsHuman: route==='review', likelyHoax: route==='auto-debunk'}}`.

### `agent-crossref`
1. Fetch the case. If it's missing or hidden → return (activity completes via `done`).
2. Candidates query (published, not hidden, not self):
   `*[_type=="case" && !hidden && _id != $id && (geo::distance(sighting.location.geo, $point) < 150000 || triage.creatureMatch._ref == $creature)] | order(geo::distance(sighting.location.geo, $point) asc)[0...8]{_id, caseNumber, title, "place": sighting.location.placeName, "creature": triage.creatureMatch->slug.current, "when": sighting.observedAt, description}`
   If there are 0 candidates → log "No related files located." and return.
3. `askJson` → `{links:[{caseId, confidence 0-1, reason ≤160}]}`. Keep only IDs that are in the candidate set (hallucination guard), confidence ≥0.5, top 4.
4. For each link: `createIfNotExists({_id: conn-<min>-<max>, _type:'connection', from, to, reason, confidence, proposedBy:'agent', status:'proposed', createdAt})`. Log: "Cross-Referencer proposed 3 related files."

### `mirror-review` / `mirror-investigation`
Set `status` with a **monotonic guard**. Rank: intake 0 < review 1 < investigation 2 < filing 3 < verdicts 4. Only patch if the new rank > the current rank (use `ifRevisionId`, and retry once on conflict). This stops out-of-order effect processing from moving a case backwards. Add a log entry.

### `file-verdict`
1. Validate `verdict` ∈ {classified, debunked, inconclusive}, else `inconclusive`. Set `note` to a default if it's empty.
2. Patch the case: `status = verdict`, `verdict{outcome, note, filedAt, filedBy}`. Log "Filed: CLASSIFIED."
3. Recompute witness credibility from all of the witness's closed cases: `round(100 * (classified + 0.5*inconclusive + 1) / (closed + 2))` (Laplace-smoothed, so a new witness sits at 50). Patch the witness's `closedCounts` and `credibility`.
4. **Visitor attribution:** if the case has a pending `visitorDecision` marker (set by the Director's Desk, §8.4), set `filedBy:'visitor'`.

`handlers/index.ts` exports `effectHandlers: Record<string, EffectHandler>` = `{ 'agent-triage', 'agent-crossref', 'mirror-review', 'mirror-investigation', 'file-verdict' }`.

---

## 7. Sanity Functions (`sanity.blueprint.ts`, `functions/`)

- Initialise: `npx sanity@latest blueprints init . --type ts --stack-name production --project-id <id>`
- **`wf-drain`** (document function): filter `_type == "sanity.workflow.instance" && tag == "prod" && count(after().pendingEffects[!defined(claim)]) > coalesce(count(before().pendingEffects[!defined(claim)]), 0)`, `on:['create','update']`, projection `{_id}`, resource `${projectId}.production`, **timeout 120 s**, memory 1 GB. The handler follows the docs exactly: build the client from `context.clientOptions` + `apiVersion: ENGINE_API_VERSION`, `perspective:'raw'`, `createEngine({…, tag:'prod', executionContext:{kind:'drainer', id:'wf-drain'}, effects:{handlers: effectHandlers, missingHandler:'skip'}})`, then **one** `drainEffects({instanceId})` call with no outer loop.
- **`wf-sweep`** (scheduled): **daily** (`0 4 * * *`), because the Free plan only allows a daily schedule. It runs `sweepStaleClaims` and `tick` for open instances, as in the docs. We have no time-based conditions, so daily recovery is enough.
- Robot token via `defineRobotToken({name:'wf-runtime', memberships:[{resourceType:'project', resourceId, roleNames:['editor']}]})`. **Fallback:** if the stack rejects robot tokens (they need an org-scoped stack), remove `robotToken` and rely on the function's default `context.clientOptions.token`. If that token can't write, set an env var `SANITY_AUTH_TOKEN` on the function and use that.
- Function env: `npx sanity functions env add wf-drain LLM_PROVIDER sanity` (plus `ANTHROPIC_API_KEY` if we use the fallback). If the command name differs, check `npx sanity functions --help`.
- **Deploy order:** `npx sanity-workflows deploy` (definitions) **first**, then `npx sanity blueprints deploy`. Logs: `npx sanity functions logs wf-drain`.
- **No recursion:** handlers write `case`/`connection`/`witness` docs, never instances. Engine writes to instances only add effects when a stage changes, and that's the intended cascade.
- **Local drainer** `scripts/drain.ts`: queries instances with unclaimed pending effects and runs `drainEffects` with the same handlers. It's used by the seed script and by `npm run wf:recover`.

---

## 8. Public site: `web/` (Next.js 16, App Router, RSC)

### 8.1 Setup
`npx create-next-app@latest web --ts --app --tailwind --eslint --src-dir --import-alias "@/*" --use-npm` → `npx shadcn@latest init` → add `button dialog sheet tabs select input textarea label tooltip badge skeleton command sonner separator popover`. Clients: `next-sanity` `createClient` (read, `useCdn:true`) + `defineLive` → `sanityFetch` and `<SanityLive/>` in the root layout (public dataset, so no token is needed for live). Follow the installed next-sanity README for the exact v13 API. Write client (server-only): `import 'server-only'`, token `SANITY_WRITE_TOKEN`. The engine (server-only) is `createEngine({client: write.withConfig({apiVersion: ENGINE_API_VERSION}), workflowResource, tag})` with **no** effect handlers.

### 8.2 Pages
| Route | Content |
|---|---|
| `/` | **Hero**: "Cryptid Field Office · Department of Unexplained Sightings", with a one-line deadpan mission statement and two CTAs (File a report · Browse case files). **Live counters** (open / classified / debunked / inconclusive). **"Incoming wire"**: the 10 latest log entries across cases, live via SanityLive, animating in. **Map teaser** (static preview image → full map on /cases). **"How a case moves"**: the `StageTrack` component with live counts per stage. **Featured dossiers** (3 cards). |
| `/cases` | Split view: MapLibre map (clustered markers coloured by status) plus a filterable list. Filters: status, creature, region, year, search. URL-synced with `searchParams`. **List/Map toggle** (the list is the accessible alternative; on mobile the map is full-bleed with a `vaul` bottom-sheet list). Empty state copy. |
| `/cases/[caseNumber]` | **Dossier**: manila folder header (case number in mono, status stamp), sighting details grid, mini-map, description, evidence gallery, **Field Investigator memo** (typed-memo styling; flagged terms shown as redaction bars that reveal on hover/focus), **Case timeline** (log entries with actor icons), **Related files** (connections as a small red-string graph plus a list, with confirmed strings solid and proposed ones dashed), witness card (codename + credibility meter). `generateMetadata` + `opengraph-image.tsx` (dossier card with stamp). Hidden or missing case → `notFound()`. |
| `/report` | **3-step form**: (1) What you saw: title, creature claimed (combobox with "Unknown"), description with a character counter; (2) Where & when: map pin picker plus place search (Photon), "Use my location" (handles permission denied), datetime (not in the future), conditions chips; (3) Evidence & statement: up to 3 photos (JPEG/PNG/WebP, ≤5 MB each, client-side preview + size check), footprint length, sound description. **Review step** before submit. Draft autosaved to localStorage (wrapped in try/catch). Honeypot field plus min-time-on-form of 4 s. Returning witness: the codename is stored in localStorage and reused. |
| `/report/filed/[caseNumber]` | **The demo moment.** "Report received. Case CFO-2026-0147 opened." A live `StageTrack` polls `/api/cases/[n]/status` every 2 s (SWR) for up to 3 min: Received → Field Investigator reviewing (typing-dots skeleton) → routed (Director's review / Investigation / Debunked). The **stamp animation** lands when the status changes. It shows the triage summary when ready. After 3 min: "Triage is taking longer than usual. Your file is at /cases/…". `aria-live="polite"` announces every change. |
| `/desk` | **Director's Desk (visitor access)**, clearly labelled as a public demo. Lists cases in `review` (the triage memo and plausibility are visible). Actions: **Open investigation** / **Debunk** (note 10–280 chars required). Disabled when `publicDeskEnabled` is false. Confirmation dialog. Result toast. |
| `/about` | "About the Bureau" (in-world) plus a **"How this was built"** section for judges: architecture diagram, stage diagram, links to the repo, project ID, dataset URL and the Case Board screenshots/video. |
| `not-found` | "This file has been redacted." |
| `sitemap.ts`, `robots.ts`, metadata, favicon/icon set, manifest | |

### 8.3 Server actions / routes
- **`fileReport`** (server action):
  1. Validate with zod: same limits as the schema, trimmed.
  2. Reject if the honeypot is filled or form time is under 4 s (return a generic success-looking error so bots learn nothing).
  3. Rate limit: 5 reports per IP-hash per hour, using an in-memory LRU (acceptable per-instance limitation, documented). The IP is hashed with a salt and never stored.
  4. Idempotency: the client sends `submissionKey` (a UUID generated when the form mounts). The case ID is `case-${submissionKey}`, and if a case with that ID exists, return its caseNumber (so a double-click creates one case).
  5. Upload photos: `client.assets.upload('image', buffer, {filename, extract: ['lqip','blurhash','palette']})`. Don't extract `location`, so no EXIF GPS is kept.
  6. Witness: reuse the codename from localStorage if the doc exists, else create `witness-<4 hex>` (retry on collision).
  7. Case number: `client.patch('counter-case-number').setIfMissing({value:0, year}).inc({value:1}).commit()` → `CFO-${year}-${String(value).padStart(4,'0')}` (atomic server-side increment, so no race).
  8. `createIfNotExists` the case (published, `status:'intake'`, `source:'web'`, log "Report received.").
  9. `engine.startInstance({definition:'case-lifecycle', initialFields:[{type:'subject', name:'subject', value: refDataset({projectId, dataset, documentId: caseId, type:'case'})}]})` → patch `workflowInstanceId`. **If startInstance throws:** keep the case (`status:'intake'`), log a system error entry, and still redirect. `npm run wf:recover` starts the missing instances. The filed page shows "Queued for triage".
  10. `redirect('/report/filed/' + caseNumber)`.
- **`GET /api/cases/[caseNumber]/status`**: `{status, triage:{plausibility, summary}, updatedAt}`, with `cache: 'no-store'` and hidden cases → 404.
- **`deskDecision`** (server action):
  1. Check that the setting is enabled.
  2. Re-fetch the case: it must be in `status:'review'` and have an instanceId.
  3. Rate limit per `publicDeskHourlyLimit`.
  4. Validate the note.
  5. Patch the case with `visitorDecision: {at}` (used for attribution).
  6. `engine.fireAction({instanceId, activity:'decide', action: 'open-investigation' | 'debunk', params: {note}})` (check the params key name in the d.ts).
  7. If the action isn't allowed (the stage already moved), return a friendly "This file was just decided by someone else" message and refresh.
- **`/api/geo/search?q=`** and **`/api/geo/reverse?lat=&lon=`**: server proxy to `https://photon.komoot.io/api/` and `/reverse`, with a 24 h `fetch` cache, a 5 s timeout, and a `User-Agent: CryptidFieldOffice/1.0 (+site url)` header. The client debounces by 400 ms. On failure the UI says "Place search unavailable. Drop a pin instead."

### 8.4 GROQ (in `web/src/lib/queries.ts`)
Every public query includes `_type=="case" && !hidden`. Home counters: `{"open": count(*[... && status in ["intake","review","investigation","filing"]]), ...}`. Wire: `*[_type=="case" && !hidden && defined(log)] | order(_updatedAt desc)[0...10]{caseNumber, title, status, "entry": log[-1]}`. Dossier: the case plus `"connections": *[_type=="connection" && status != "rejected" && (from._ref == ^._id || to._ref == ^._id)]{..., from->{caseNumber,title,status}, to->{caseNumber,title,status}}`.

---

## 9. Case Board: `caseboard/` (App SDK)

Scaffold: `npx sanity@latest init --template app-quickstart --output-path caseboard` (this prompts for the org, so **👤 MUBEEN DOES** it or picks the org when prompted). Add the override from §2 **before** installing the workflow packages. `src/App.tsx`: `<SanityApp config={[{projectId, dataset:'production'}]} fallback={<BoardSkeleton/>}>` inside `<ThemeProvider theme={buildTheme()}>` from `@sanity/ui`.

**Layout (desktop-first, since it's a staff tool; minimum width 1024, with a friendly "Open on a larger screen" message below that):**
- **Left rail (280px): Stage columns**, one collapsible section per stage via `useWorkflowInstances({engine, filter:{stage}})`, with a count badge and case cards (number, title, plausibility chip). A search box and creature filter sit at the top.
- **Centre: Corkboard** (`@xyflow/react`). Nodes are "polaroid" case cards (status stamp, number, title, place, date). Edges are `connection` docs drawn as a custom **RedStringEdge** (a bezier with slight sag, 2px `--string` red; proposed ones dashed with a subtle pulse, confirmed ones solid; the tooltip shows the reason and confidence). The background is a cork texture (CSS, subtle; plain dark felt in dark mode). React Flow's MiniMap and Controls are included.
  - Drag a node → debounced 600 ms upsert of `pin-<caseId>` via App SDK document actions (`createDocument`/`editDocument` + `publishDocument`, whatever `useApplyDocumentActions` exposes in v3.5; check the d.ts). Unpinned cases auto-layout in a grid by stage.
  - Connect handle → handle creates `connection` (proposedBy human, status confirmed, published).
  - Click an agent string → a popover with **Confirm** / **Reject**.
  - Real-time: other users' pins and strings appear live (App SDK store). New strings animate in (stroke-dashoffset draw).
- **Right panel (400px): Dossier + Workflow.** The case summary, the triage memo, and a **workflow panel** built on `useWorkflowSession({engine, instanceId})`. It handles the `invalid` / `error` / `evaluationError` / loading states as in the docs, shows the current stage and the actions from `evaluation`, and uses a **params dialog** for required notes. Actions whose `action.filtered` is true are hidden; `!allowed` means disabled with a tooltip. Below that is **`@sanity/workflow-diagram`** for this case (current stage and visited path highlighted), fed from `src/generated/case-lifecycle.json`, and then the case log timeline.
- **Never** use `useEditDocument` on workflow instance docs (per the docs). Only session `fire`/`editField` touches instances.
- **Keyboard:** Tab through the rail, Enter selects, `C` starts connect mode from the selected card, then choose the target via a Command palette (`⌘K` / `Ctrl+K`, "Connect to…" / "Go to case…"), `Esc` cancels, and arrow keys nudge the selected node by 20px.
- The engine is created as in the docs' `useMemo` with `useClient({apiVersion:'2026-04-29'})`, the dataset `production`, and the tag `prod`.
- Deploy: `npx sanity@latest deploy` (from `caseboard/`).

---

## 10. Studio: `studio/`

`npx sanity@latest init` (**👤 Mubeen is logged in first**). Create a new project "Cryptid Field Office" with dataset `production`, the clean template, TypeScript and npm, with output path `studio`. If non-interactive flags are rejected, run it interactively with Mubeen.
- `sanity.config.ts`: `structureTool({structure, defaultDocumentNode: workflowDefaultDocumentNode()})`, `workflowStudioPlugin({tag:'prod', mappings:[{docType:'case', definition:'case-lifecycle', label:'Case lifecycle'}]})` (**no autoStart**, because web and seeds start instances; Studio-created cases use the plugin's Start button), `visionTool()`.
- **Desk structure:** "Case files" → Intake / Director's review / Investigation / Closed (filtered lists by `status`) + "All cases"; "Red strings" (connections, grouped proposed/confirmed); "Creatures"; "Regions"; "Witnesses"; divider; "Bureau settings" (singleton, no create/delete).
- **Custom input:** `GeoPinInput` for `sighting.location.geo`, a MapLibre map (OpenFreeMap) with a draggable pin and lat/lng fields that stay in sync. This replaces the default geopoint input, which needs a Google key.
- **Document actions:** remove `delete` and `duplicate` for `case` (use `hidden` instead; this avoids orphaned workflow instances); singleton actions for `bureauSettings`.
- **Badges:** a `plausibility` badge ("P62", with the tone by band) on cases.
- **List previews:** status stamp media per status.
- **Branding:** Studio `title: 'Cryptid Field Office'`, custom logo component (the "CFO" seal SVG), `icon`.
- **Validation:** everything in §3 as Rule validators.
- **Initial value templates:** a case from Studio defaults to `source:'studio'`, `status:'intake'`.
- Deploy: `npx sanity schema deploy` then `npx sanity deploy` (hostname `cryptid-field-office`, or `cfo-bureau` if that's taken).

---

## 11. Design system & UX (current standards; applies to web; the Case Board follows @sanity/ui with the same accent tokens)

### 11.1 Direction: "Declassified dossier"
Deadpan federal bureau: paper, typewritten metadata, ink stamps, red string. Restraint rules: **at most two motifs per screen**, generous whitespace, modern layout underneath. It should feel like a contemporary product (think Linear or Stripe polish) dressed as a bureau, not a Halloween page.

### 11.2 Tokens (Tailwind v4 `@theme` in `globals.css`; light + dark via `next-themes`, `class` strategy, system default, no flash)
| token | light | dark ("Night shift") | use |
|---|---|---|---|
| `--paper` | #F4EEE1 | #111315 | page background |
| `--paper-2` | #EAE1CC | #1A1D20 | cards, folders |
| `--ink` | #1C1B19 | #ECE6D8 | text (≥ 12:1) |
| `--ink-muted` | #5B574F | #A8A195 | secondary text (≥ 4.5:1) |
| `--rule` | #CFC4AC | #2C3034 | borders |
| `--intake` | #5B574F | #A8A195 | stage |
| `--review` | #1D4E89 | #7EB0F0 | stage + focus ring |
| `--investigation` | #8A5A00 | #E0A640 | stage |
| `--classified` | #1F6F43 | #5CC98A | verdict |
| `--debunked` / `--string` | #B42318 | #F0645A | verdict + red string |
| `--inconclusive` | #4A5563 | #9AA5B4 | verdict |
Verify every text/background pair at ≥ 4.5:1 (≥ 3:1 for large text and UI components) during Phase 8.

- **Type** (`next/font/google`, self-hosted, `display:swap`): **Source Serif 4** (headings, memo titles), **IBM Plex Sans** (UI/body), **IBM Plex Mono** (case numbers, metadata, stamps). Scale 12/14/16/18/22/28/36/48/60, body 16/1.55, headings 1.15, `text-wrap: balance` on headings and `pretty` on paragraphs.
- **Space:** a 4px base scale. **Radius:** 4px (paper), 10px for sheets and dialogs. **Shadows:** a two-layer soft "paper lift".
- **Texture:** an inline SVG noise background at 3% opacity (<2 KB, disabled in forced-colors mode).
- **Stamp component:** mono bold uppercase, 2px border, −6° rotation, an SVG `feTurbulence` + `feDisplacementMap` ink edge, coloured by verdict. **Animation:** scale 1.35→1, opacity 0→1, 160 ms, a spring with a tiny overshoot, plus a 1-frame "ink spread" shadow. With `prefers-reduced-motion`, a simple fade.
- **Icons:** lucide-react at 1.5 stroke. **Illustrations:** creature "specimen plates" are **typographic cards** (codename monogram and traits) by default; public-domain engravings only where clearly PD (e.g. Olaus Magnus *Carta Marina* sea serpents from Wikimedia Commons), each credited in `CREDITS.md` and on the card. **Look at every image before using it** (memory rule).

### 11.3 Components (web)
`SiteHeader` (seal logo, nav, theme toggle, "File a report" primary button, skip link), `SiteFooter` (map attribution, credits, "not a real government agency"), `Stamp`, `StatusPill`, `StageTrack` (horizontal stepper, vertical on mobile, `aria-current="step"`), `CaseCard`, `DossierHeader`, `MemoBlock` (with `Redaction`: a keyboard-focusable reveal), `Timeline`, `EvidenceGallery` (lightbox dialog, `next/image` with the Sanity loader and LQIP blur), `CaseMap` (client, lazy via `next/dynamic` with a skeleton), `PinPicker`, `PlaceSearch` (combobox, ARIA 1.2 pattern), `WireTicker` (`aria-live="polite"`, paused on hover/focus, respects reduced motion), `CredibilityMeter`, `StringGraph` (small SVG), `EmptyState`, `ErrorState`, toasts (sonner).

### 11.4 Standards checklist (verified in Phase 8)
- **Accessibility, WCAG 2.2 AA:** semantic landmarks, a skip link, visible 2px focus ring with 2px offset (`:focus-visible`), targets ≥ 24×24 (44 on mobile primary actions), full keyboard support, form labels plus inline errors linked with `aria-describedby` and a summary on submit, no colour-only status (the stamp always has text), the map has a list alternative, `aria-live` for async changes, `prefers-reduced-motion` and `forced-colors` honoured, `lang="en"`, alt text on all images (seed evidence captions double as alt).
- **Responsive:** 360, 390, 768, 1024, 1440 and 1920. No horizontal scroll. Mobile-first Tailwind.
- **Performance (Core Web Vitals):** LCP < 2.5 s, CLS < 0.05, INP < 200 ms. Map JS is lazy-loaded (not in the home bundle). Images get AVIF/WebP via the Sanity CDN `auto=format` and sized `sizes`. Fonts self-hosted with subsets. Target Lighthouse ≥ 95 in all four categories on `/` and a dossier page.
- **SEO/social:** per-page metadata, per-case OG images, `sitemap.xml`, canonical URLs.
- **Resilience:** every data section has loading (skeleton), empty and error states. `error.tsx` and `not-found.tsx` per segment.
- **Motion:** `motion` for stamps and ticker items, View Transitions (React `<ViewTransition>` / Next 16 support) between the case list and the dossier, shared-element on the case number. Everything degrades gracefully.

### 11.5 Microcopy (deadpan voice guide; use these and write more in the same voice)
- Primary CTA: "File a report". Secondary: "Browse case files".
- Empty filter: "No files match. Either the filters are too narrow, or they're getting better at hiding."
- Submit success: "Report received. Case CFO-2026-0147 has been opened and a Field Investigator dispatched."
- Submit failure: "The wire went dead. Your report was not filed. Nothing was lost, so try again."
- Agent busy: "The Field Investigator is reviewing your report. Please remain where you are."
- 404: "This file has been redacted."
- Footer: "The Cryptid Field Office is not a government agency. Probably."
- Emergency flag banner: "If someone is in danger, contact local emergency services. The Bureau cannot help you."

---

## 12. Seed data (`seed/data.ts` → `scripts/build-seed.ts` → `seed/seed.ndjson`)
- **Creatures (12):** Sasquatch, Mothman, Jersey Devil, Chupacabra, Loch Ness Monster, Yeti, Skunk Ape, Ogopogo, Flatwoods Monster, Dover Demon, Beast of Bodmin Moor, Fresno Nightcrawler. **Exclude Indigenous sacred figures** (e.g. Wendigo, Bunyip) out of cultural respect.
- **Regions (10)**, with centroids.
- **Witnesses (14)**, with codenames.
- **Cases (30):** written by hand in the deadpan voice, varied and specific, dated 2019–2026, spread over real places. Stored `triage.plausibility` values are chosen to land each case in its target: **4 review** (p 30–60), **5 investigation** (p 72–90, of which 3 stay open), **8 classified**, **9 debunked** (5 auto-debunked at p<20, 4 by the Director), **4 inconclusive**. Each case has 0–3 evidence items, mostly testimony and footprint, plus 2–3 "photo" items rendered as intentionally blurry, grainy SVGs (the joke is "Photo evidence (enhanced)"). **12 connections** (8 confirmed, 4 proposed). Settings and counter docs are included (counter value = 30).
- **Import:** `npx sanity dataset import seed/seed.ndjson production --replace` (from `studio/`).
- **`scripts/seed-workflows.ts`:**
  1. Start an instance for each seed case and patch `workflowInstanceId`.
  2. Run the local drain (the seed guard skips the LLM).
  3. Fire the human actions needed to reach each target (review → open-investigation / debunk; investigation → classify / debunk / inconclusive with seed notes).
  4. Drain again.
  5. Print a stage histogram and **assert it matches the targets**. This is part of the setup; if it's wrong, fix the seed.
  It's idempotent: it skips cases that already have an instance.

---

## 13. Execution phases (dates are targets; today is Thu Sep 24)

### Phase 0: Setup (Fri Sep 25, morning)
1. Memory lines, PLAN.md, CLAUDE.md, BUILDLOG.md skeleton (§0.2). Run `git init` and add `.gitignore`.
2. **👤 MUBEEN DOES** (Claude gives him exact prompts):
   a. Type `! npx sanity@latest login` in Claude Code and log in with Google or GitHub in the browser that opens.
   b. Have a **Vercel** account (sign up at vercel.com with GitHub).
   c. `! gh auth status`. If it isn't logged in, run `! gh auth login`.
   d. *(Optional)* an Anthropic API key, only if Agent Actions turn out to be unavailable.
3. Claude creates the Studio project (§10). The project ID then goes into all configs.
4. **👤 MUBEEN DOES:** create 1 token at sanity.io/manage → project → API → Tokens → "Add API token", name `cfo-server`, permission **Editor**. Paste it into `.env` (root) and `web/.env.local` where Claude has left `PASTE_TOKEN_HERE`. Never paste it into chat.
5. `npx sanity dataset visibility set production public` (from studio). Add CORS origins: `http://localhost:3000`, `http://localhost:3333`, and later the Vercel URL, via `npx sanity cors add <origin> --credentials` (no `--credentials` needed for the public site).
6. BUILDLOG entry.

### Phase 1: Schema & Studio base (Sep 25)
The full schema from §3, desk structure, validation, document actions, badges, previews, branding, GeoPinInput. Then `npx sanity schema deploy`.

### Phase 2: Seed content (Sep 25–26)
Write `seed/data.ts` (all 30 cases, by hand, deadpan), `build-seed.ts`, and import.

### Phase 3: Workflow + agents + functions (Sep 26–27)
1. Install the root deps (exact workflow versions).
2. Write `case-lifecycle.ts`, `sanity.workflow.ts`, `lib/*` and `handlers/*`.
3. `npx sanity-workflows deploy --check` → `npx sanity-workflows deploy` (fallbacks in §5).
4. Run `seed-workflows.ts`.
5. Write the blueprint and the functions, set the function env, then run `npx sanity blueprints deploy`.
6. Add the workflow plugin to the Studio.
7. Run `export-definition.ts`.
8. BUILDLOG: record the real prompts used and anything that broke.

### Phase 4: Public site (Sep 27–29)
§8 in full, with the §11 design system first (tokens, fonts, base components), then pages in this order: layout → dossier → cases/map → home → report + filed → desk → about → OG/sitemap. Deadpan copy everywhere.

### Phase 5: Case Board (Sep 29–30)
§9 in full. Then `npx sanity@latest deploy` for the app.

### Phase 6: Polish (Sep 30)
Studio polish, the microcopy pass, motion pass, empty/error/loading states everywhere, `README.md` (setup, architecture, how to run locally, project ID, dataset URL), `CREDITS.md` (OpenFreeMap/OpenMapTiles/OSM, Photon/komoot, PD images, fonts).

### Phase 7: Deploy everything (Oct 1)
1. Push to GitHub. **👤 Ask first**, then `gh repo create cryptid-field-office --public --source . --push`.
2. **👤 MUBEEN DOES:** on vercel.com → Add New Project → import `cryptid-field-office`, set Root Directory to `web`, add the env vars from §2 (Claude gives him the exact list with values, except the token, which he copies from his `.env`), then Deploy. Then add the Vercel URL to Sanity CORS and set `NEXT_PUBLIC_SITE_URL`.
3. Studio: `npx sanity deploy`. Case Board: `npx sanity deploy` (in caseboard). Definitions and blueprints are already deployed.
4. Toggle `bureauSettings` to the production values.

### Phase 8: THE comprehensive test pass (Oct 2)
Run once, against the **deployed** stack, and record results in `BUILDLOG.md` as a checklist with ✅/❌. For screenshots, use `npx playwright screenshot` from the scratchpad (not test files); run `npx playwright install chromium` first.
**A. Core loop (the most important)**
1. File a credible report on the live site (with a photo) → redirect to the filed page → the stage updates live within ~60 s → routed to Investigation → cross-reference strings appear on the dossier and on the Case Board.
2. File a vague report → routed to Director's review → on `/desk` choose "Open investigation" → it moves → file a verdict from the **Case Board** → the stamp appears on the public dossier live, and the witness credibility updates.
3. File an absurd report → auto-debunked by the agent → stamp shown, log says "Closed at triage".
4. File a report with inappropriate text → hidden from public lists, routed to review.
5. From the **Studio** plugin, act on a review case → same transition, and it's reflected on web and the board. (This proves agent, visitor, board and Studio all use the same transitions.)
**B. Edge cases**
6. Double-click submit leads to one case. 7. Honeypot and fast submit are rejected. 8. The 6th report in an hour is rate-limited with friendly copy. 9. A future date, a 6 MB photo and a wrong file type are rejected inline. 10. Location permission denied falls back to search/pin. 11. Photon down (point the URL at a bad host temporarily in local dev) shows the fallback copy. 12. `agentEnabled=false` routes new cases to review with the "unavailable" message. 13. Budget = current count behaves the same. 14. A desk decision on a case that has just moved gives the friendly message. 15. A hidden case URL returns 404. 16. Kill a startInstance (temporarily bad tag locally) → the case is queued → `npm run wf:recover` starts it. 17. Re-running the drain does not duplicate log entries or connections. 18. A Case Board drag in two browser windows syncs live, and a string drawn in one appears in the other. 19. Delete is unavailable for cases in Studio.
**C. Quality bar**
20. Screenshots at 390 and 1440 wide, light and dark, of `/`, `/cases`, a dossier, `/report` (each step), the filed page, `/desk` and the Case Board. **Look at every one** (memory rule) and fix anything off.
21. Keyboard-only run through filing a report and the desk. 22. Lighthouse (Chrome DevTools or `npx lighthouse`) on `/` and a dossier, all ≥ 95. Fix what isn't. 23. Contrast check of the token pairs. 24. Reduced-motion emulation. 25. Logged-out incognito check that all public pages work.
Then fix all ❌ and re-check only those items.

### Phase 9: Submission (Oct 3; Oct 4 is buffer)
1. **Cover image 1000×420:** a hidden route `/press/cover` rendered with real app styles (seal, "CRYPTID FIELD OFFICE", a stamp, a red-string motif), captured with `npx playwright screenshot --viewport-size=1000,420 <url>/press/cover cover.png`. Look at it.
2. **Screenshots** for the post (from Phase 8, polished).
3. **Video (2–3 min), 👤 MUBEEN records it** with Win+Alt+R (Xbox Game Bar) or OBS, uploads it to YouTube as unlisted, and Claude writes the shot script: (0:00) home and the live wire → (0:20) file a report → (0:50) watch the triage stamp land → (1:10) dossier with strings → (1:30) Case Board: drag, string, approve → (2:10) the Studio plugin strip → (2:30) outro.
4. **`SUBMISSION.md`**, following the DEV template exactly: *What I Built* (the pitch plus the 311 framing), *Demo* (the live URL, the no-login path for judges, the video embed, screenshots, and a note that the Case Board and Studio need org membership so they're shown via video/screenshots while `/desk` gives judges the same workflow power), *Code* (the GitHub link), *My Build Process* (from BUILDLOG: the AI IDE was Claude Code, the prompts that worked and didn't, where the model got stuck, Plan vs reality, the Workflows 0.x experience, the App SDK experience, Functions), *Sanity Project Details* (project ID, the public dataset query URL `https://<id>.api.sanity.io/v2026-09-01/data/query/production?query=*[_type=="case"][0...5]`, schema highlights), *Agent Session*. Tags: `devchallenge, sanitychallenge, sanity, ai`.
5. **Agent session:** the transcript `.jsonl` files are in `~/.claude/projects/<this-project>/`. Scrub them (§0.5). **👤 MUBEEN** uploads at dev.to/agent_sessions/new, curates the best slices (planning, a Workflows debugging moment, the design pass), clicks **Make Public**, and embeds it.
6. **👤 MUBEEN** pastes `SUBMISSION.md` into the DEV editor, sets the cover, previews, and publishes. Then he shares the link.

### Stretch (only if everything above is done by Oct 2)
- `@sanity/workflow-mcp`: connect Claude Code as a "Senior Investigator" agent that operates instances over MCP. Film 20 s of it for the video.
- Presence avatars on the Case Board.

---

## 14. Risks & fallbacks
| Risk | Fallback |
|---|---|
| Workflows packages misbehave or a feature is missing | Use the §5 expression fallbacks. If the engine is unusable for a capability, model the missing piece as data (`workflowState` on the case, plus a document function enforcing transitions) and be honest about it in the writeup. Tell Mubeen first. |
| Agent Actions unavailable or out of quota on Free | `LLM_PROVIDER=anthropic` (needs Mubeen's key). The budget guard plus review routing mean the app never breaks. |
| Robot token in the blueprint rejected | Use the default function token, or a `SANITY_AUTH_TOKEN` env var on the function (§7). |
| Function timeout on slow LLM calls | Timeout 120 s. The lease is 5 min. On failure, triage routes to review. |
| Scheduled functions are daily only on Free | We have no time conditions. `npm run wf:recover` handles manual recovery. |
| Judges can't log in to the Dashboard or Studio | `/desk` gives the same workflow power publicly, plus the video and screenshots. |
| Vandalism of the public desk | Rate limit, review-stage-only, notes required, and the seed can be re-run (idempotent) to top up review cases. The kill switch is `publicDeskEnabled`. |
| Tile/geocoder outage | List view plus a manual pin, with fallback copy. |
| React/styled-components version clash in the caseboard | The documented `@sanity/mutate` override. Keep `@sanity/ui` ^4.2.1 and styled-components ^6.4.2 exactly as the docs specify. |
| Out of time | Cut in this order: stretch goals → View Transitions → witness credibility UI → Studio badges. **Never cut:** the core loop, `/desk`, the Case Board strings and workflow panel, the writeup. |
