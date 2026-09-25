<!--
DEV post for the Sanity Challenge, Path Two. Paste everything below the tag line into the DEV editor.
Tags to select: devchallenge, sanitychallenge, sanity, ai
Cover image: submission/cover.png (1000 x 420)
Only one [BRACKETED] item is left: the agent session embed. Images use public GitHub links so DEV can load them.
-->

*This is a submission for the [Sanity Challenge, Path Two: Vibe-Code Something Strange](https://dev.to/challenges/sanity-2026-09-16)*

## What I Built

**The Cryptid Field Office**: a deadpan government bureau that takes every unexplained sighting seriously. Cryptids, lights over the desert, a figure on the stairs, a jinn in the storeroom, a lodge that is on no property register. You file a report. An AI **Field Investigator** reads it, scores it and decides where it goes. A person signs off on anything unclear. Every case ends in a stamp: CLASSIFIED, DEBUNKED or INCONCLUSIVE.

It is silly on the surface and serious underneath. Take away the Bigfoot and it is a **report-triage pipeline**: public intake, AI screening, linking related reports, a human decision, and an audit trail. Swap the creatures for potholes and you have a city 311 system. The same pattern runs bug trackers, insurance claims and fraud review. That was the point: something strange, built on something real.

It has three surfaces on one Sanity content lake:

| | What it is | Who uses it |
|---|---|---|
| **Public site** (Next.js) | Case map and files, a four-step report form, a live "your report is being triaged" page, and a public **Director's Desk** | Anyone. No login. |
| **Case Board** (Sanity **App SDK**) | A live corkboard: drag case photos around, pull a red pin from one card onto another to draw a string, approve or reject the AI's suggested links, fire workflow actions | Bureau staff |
| **Studio** | Custom desk, status badges, a map location picker, and the official **Workflows** plugin | Editors |

The part I am proudest of: **the agent and a person move a case through exactly the same workflow actions.** The AI triages a report, a visitor on the Director's Desk opens an investigation, and a staff member closes it from the Case Board, and all three are the same `fireAction` on the same instance, recorded in one audit trail.

## Demo

**Live site (no login needed): https://cryptid-field-office-mubeen9.vercel.app**

Try it in about a minute:

1. **[File a report](https://cryptid-field-office-mubeen9.vercel.app/report).** Describe something, drop a pin, optionally attach a photo. About 15 seconds after you submit, the Field Investigator has read it and a stamp lands on your case.
2. Open the **[Director's Desk](https://cryptid-field-office-mubeen9.vercel.app/desk)** and decide a case that needs a person.
3. Open the resulting case file: memo, evidence, red strings to related cases, and the timeline showing who did what ("Agent", "Visitor Director", "Bureau").

The Studio and Case Board need a Sanity login, so the video and screenshots below show them. The Director's Desk gives you the same workflow power without one.

{% embed https://youtu.be/xEti2uTE5eA %}

The video shows the whole loop: a public report, live AI triage, the Director's Desk, then the Case Board and the Studio, which need a Sanity login and so are only shown here.

![The home page](https://raw.githubusercontent.com/MAMubeenKhan/cfo/main/submission/screenshot-1-home.png)
![A report, triaged by the Field Investigator](https://raw.githubusercontent.com/MAMubeenKhan/cfo/main/submission/screenshot-2-report-triaged.png)
![A case file](https://raw.githubusercontent.com/MAMubeenKhan/cfo/main/submission/screenshot-3-case-file.png)
![The map and case list](https://raw.githubusercontent.com/MAMubeenKhan/cfo/main/submission/screenshot-4-map-and-list.png)
![The Director's Desk](https://raw.githubusercontent.com/MAMubeenKhan/cfo/main/submission/screenshot-5-directors-desk.png)
![Dark mode](https://raw.githubusercontent.com/MAMubeenKhan/cfo/main/submission/screenshot-6-dark-mode.png)
![On a phone](https://raw.githubusercontent.com/MAMubeenKhan/cfo/main/submission/screenshot-7-phone.png)

## Code

**https://github.com/MAMubeenKhan/cfo**

The repo includes `PLAN.md` (the full runbook I had Claude write *before* any code) and `BUILDLOG.md` (an honest day-by-day log, including everything that broke).

## My Build Process

**Tools:** Claude Code (Opus 5.5 for planning, Sonnet 5 for most building), the official `sanity-best-practices` agent skill, Playwright, axe-core and Lighthouse for testing. I am non-technical; I directed, Claude built.

### The idea (and the prompt that mattered most)

My first prompt was the challenge page pasted in, plus: *"give me options on what we should make and tell me what is best and why."* Claude scored four ideas against the four judging criteria and both bonuses and recommended the cryptid bureau, because a case moving from triage to a verdict is exactly the "agent moves it forward, a person approves it" pattern, and a red-string board is a natural App SDK app.

My honest worry was: *"won't it be weird and silly and make me a joke?"* Claude's answer became the design rule for the whole project: **play it deadpan.** The humour lives in the bureaucracy (case numbers, stamps, memos), never in the subject. A silly idea with a real workflow reads as clever; a silly idea with three screens reads as a joke.

Then I kept pushing the scope: *"include UFOs, aliens, Area 51"*, then *"ghosts, jinn, spirits and occult"*, then *"secret cults and societies."* That created a real design question I want to be upfront about, because it shaped the code:

* **Jinn are part of real religious belief.** So the bureau's humour must never touch them. Rules that ended up in code, not just in copy: faith-related reports are **never auto-closed**; the AI prompt forbids ruling on belief or calling a witness mistaken; the final filing step **refuses an agent "debunked" stamp** on a faith-sensitive case even if everything upstream failed; and a human closing one must tick an extra confirmation.
* **Every secret society is invented.** No real group, religion or person appears anywhere.
* Reports suggesting distress or coercion force human review and show a calm banner.

### The plan-first prompt

Before writing code I asked for *"an end to end plan so a new session doesn't have to do any planning, including edge cases, no tests until completion, only one comprehensive test at the end."* Claude read the Workflows and App SDK docs, checked real package versions, and wrote a ~500-line runbook. Three mid-flight prompts shaped it: *"it should be attractive with good UX and highly polished"*, *"as per current standards"* (this became a WCAG 2.2 AA, Core Web Vitals, dark-mode, reduced-motion spec), and my memory file (a `memory.md` Claude reads at every session start and appends lessons to).

### Sanity features I used

* **Content model:** 8 document types (case, subject, region, witness, connection, board pin, settings, counter) and 5 object types. Typed evidence union (photo, footprint, sound, testimony), geopoints, references, and a first-class `connection` document with provenance and confidence: the red strings. Witnesses are anonymous codenames with a credibility score computed across their cases.
* **Studio customisation:** status-queue desk structure, category and restricted-site lists, badges (status, plausibility P0-100, hidden), delete removed for cases (it would orphan their workflow instance), and a **MapLibre location picker** replacing the default geopoint input (which needs a Google Maps key).
* **Workflows (0.35, early access):** the `case-lifecycle` definition: five stages, five automated effects, human actions for the Director and Investigator. It passed `sanity-workflows deploy --check` on the first attempt. I then ran all 30 seeded cases through the *real engine* using the same actions a person fires, and asserted the stage histogram matched the plan exactly.
* **Functions:** a document Function fires when a workflow instance gains unclaimed effects and runs the AI handlers in Sanity's cloud, and a daily Scheduled Function sweeps stale claims and re-evaluates open cases.
* **Agent Actions:** the Field Investigator and the Cross-Referencer both call `client.agent.action.prompt`.
* **App SDK:** the Case Board (`useQuery` streams, `useWorkflowEngine`, `useWorkflowSession`, `@sanity/workflow-diagram`).

### Where it got stuck, and how we corrected course

I would rather show the dead ends than pretend there were none.

* **A big Bash command silently applied nothing** (twice): long heredocs containing an apostrophe failed with "unexpected EOF". The lesson, saved to memory: write files with the file tool, one call per file.
* **Half-installed packages:** an interrupted `npm install` left a half-extracted `zod`, which made every Sanity CLI command fail with `MODULE_NOT_FOUND`, then made a second install fail with `Invalid Version:`. Fix: delete `node_modules` and the lockfile, install fresh, in the background. On this network installs took 10 to 25 minutes.
* **The skill corrected the plan.** I installed Sanity's `sanity-best-practices` skill and it caught that `@sanity/icons` v5 has *no root exports* (every icon imports from its own path). My draft compiled and would have failed at bundle time.
* **Permissions:** my API token could deploy the Studio and Functions but not an App SDK app (missing an organisation-level grant) and could not create the organisation stack that Scheduled Functions need. I did not work around it: I shipped without the daily backup job and wrote a repair command instead, deployed the Case Board from my own login, and later, once I was logged in, created the organisation stack, moved both Functions onto it and retired the old one.
* **Vercel served 404 for everything:** the CLI created the project with no framework preset, so the build passed but the edge served nothing. One API call to set `framework: nextjs` and a redeploy fixed it. Deployment Protection was also putting a login in front of the site.
* **The AI was too harsh.** In the live test, a credible sighting *with a photo and a footprint* scored 68, just under the 70 "investigate" bar. I added a scoring guide to the prompt ("a submitted photo or footprint counts as physical evidence"; "vague is not false: when in doubt, score 20-49 so a person can look") and redeployed. The same report then opened an investigation, and the Cross-Referencer proposed 3 real related files.
* **Things the live test found** that no type-checker would have: a missing case returned HTTP 200 (a soft 404) because of a page-wide loading skeleton; the map threw "Worker failed to load" because MapLibre 6's worker files can't be bundled by Next; the map opened on Scotland instead of framing all cases; my evidence photos were bad at first sight (a footprint that looked like a snowman, a triangle invisible on a dark sky), which I only caught by *looking* at them.
* **My first rate limiter was useless, and only a live test showed it.** I had built it in server memory and even documented it as a known limit. Then I filed eight reports at once from one connection with the limit set to five: all eight went through, because serverless hosting spreads requests over many servers. I rebuilt it as counters stored in Sanity as private documents (an id with a dot in it is unreadable to the public). The same test then accepted five and refused three, and an anonymous query for those counters returns nothing.
* **Vercel blocked a deployment** once I started committing to git: the CLI attached my commit author, which was not on the Vercel team. Deploying from a copy of the folder without git history fixes it (`scripts/deploy-web.sh`).
* **Speed:** the case page scored 57 on a throttled phone because a 290 KB map library loaded below the fold. Mounting the map only when it scrolls into view took it to 93. Accessibility is 100 on every page; the search-engine score stays near 66 only because Vercel adds a `noindex` header to its free addresses.

### The App SDK and Workflows, honestly

* **Workflows** is a library, not a service: it acts only when your code calls it. That felt unfamiliar for a day, then clicked. Defining the process as data next to the content, with conditions in GROQ, made "the agent and a person use the same transitions" almost free. The cookbook matched the installed types closely, which is rare for a 0.x release. A deterministic instance ID (`prod.wf-instance.<caseId>`) made starting a case idempotent.
* **App SDK** hooks stayed live without any polling code of my own, and the workflow session gave me the action list, the definition and the history for the diagram in one object. The one rule I obeyed carefully: never edit a workflow instance document directly.

### What is honestly not there

* No CAPTCHA. Abuse is limited by a durable rate limit (5 reports an hour per visitor, 40 overall), a honeypot, a minimum fill time, and a daily AI budget with a kill switch in `Bureau settings`.
* The Case Board is desktop-only, by design.

## Sanity Project Details

* **Project ID:** `cyh4xyo1` · **Dataset:** `production` (public)
* Sample query: `https://cyh4xyo1.api.sanity.io/v2026-09-01/data/query/production?query=*[_type=="case"][0...5]{caseNumber,title,category,status}`
* **Studio:** https://cryptid-field-office.sanity.studio/ (needs a Sanity login)
* Schema highlights: `case` (workflow subject with a status mirror), `connection` (red strings with provenance), `witness` (anonymous, credibility computed across cases), `subject` (six categories), `region` (a `restricted` flag drives the Area 51 banner and redactions).

## Agent Session

**[AGENT SESSION EMBED: upload the transcript at https://dev.to/agent_sessions/new, curate the best slices, click Make Public, then embed it here]**

Good slices to keep: the idea comparison and the "won't this make me a joke?" answer; the faith-sensitivity design decision; the Workflows definition passing validation first time; the live test that found the too-harsh AI score; and the speed pass.
