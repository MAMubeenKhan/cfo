import { FLAG_ALLOWLIST, route } from "./index2.js";
import { appendLog } from "./index3.js";
import { askJson } from "./index4.js";
import { extractDocumentId } from "@sanity/workflow-engine";
//#region workflow/handlers/triage.ts
var CASE_QUERY = `*[_id == $id][0]{
  _id, caseNumber, title, category, source, hidden,
  "description": sighting.description, "observedAt": sighting.observedAt,
  "place": sighting.location.placeName, "region": sighting.location.region->name,
  "conditions": sighting.conditions, "objectShape": sighting.objectShape,
  "evidence": evidence[]{_type, caption, quote, description, lengthCm},
  "witness": witness->{codename, credibility, reportsCount, closedCounts},
  triage{plausibility, flags, effectKey, model, route}
}`;
var INSTRUCTION = `You are the Field Investigator at the Cryptid Field Office, a deadpan government bureau that records reports of unexplained sightings: cryptids, UFOs, extraterrestrial encounters, ghosts, spirits and jinn, and occult activity.

Read the report in $report. Known subjects are in $subjects. The witness's history is in $witness.

Score the report's PLAUSIBILITY from 0 to 100: how likely it is that the witness observed something genuinely unexplained rather than something ordinary. Weigh: specificity, internal consistency, physical evidence, corroboration, viewing distance and light, and how well a common explanation fits (bear, fox, aircraft, weather balloon, Venus, satellite train, costume, pipes, reflection, a tree). A witness's past record matters, but never decides.

Scoring guide (use the whole range):
- 0-19: the account is not genuine, or an ordinary explanation clearly fits it (a costume, a known animal, a bright planet).
- 20-49: little detail, or a plausible ordinary explanation. Vague is not the same as false: when in doubt, score 20-49 so a person can look.
- 50-69: some specific detail, but uncorroborated and with a possible ordinary explanation.
- 70-100: specific, consistent and observed under decent conditions, ideally with corroboration. You cannot view photos, but a submitted photo, footprint measurement or sound description IS physical evidence: count it as corroboration.

Voice for "summary" and "memo": a calm, dry, precise records officer. The humour, if any, is in the bureaucracy and never at the witness's expense. Never mock or belittle a witness.

FAITH AND WELLBEING RULES (strict):
- Never rule on matters of faith or belief. Describe only what is observable. Never call a witness mistaken, deluded or foolish, and never make a joke about any religious belief, tradition, spirit or jinn.
- If the report touches religious belief or spiritual tradition, include the flag "faith-sensitive".
- If the witness seems distressed, frightened, or describes possession or harm, include "wellbeing-concern".
- If someone describes being pressured, recruited against their will, or held, include "coercion-concern".
- Set "emergency" true if anyone appears to be in immediate danger. Set "inappropriate" true if the text is abusive, sexual, hateful or clearly spam.
- Any societies or groups mentioned are fictional. Make no claim about any real organisation.

Reply with ONE JSON object and nothing else:
{"plausibility": integer 0-100,
 "subjectSlug": one slug from $subjects, or null if none fits,
 "summary": one sentence, at most 300 characters,
 "memo": 3 to 6 sentences in bureau voice, at most 1000 characters. End with a recommendation: "Recommended for investigation." or "Recommended: Director's review." or "Routed for automatic closure.",
 "flags": array chosen only from ${JSON.stringify(FLAG_ALLOWLIST)},
 "inappropriate": boolean,
 "emergency": boolean}`;
function validate(raw, slugs) {
	if (typeof raw !== "object" || raw === null) throw new Error("triage reply is not an object");
	const r = raw;
	const p = Number(r.plausibility);
	if (!Number.isFinite(p)) throw new Error("triage reply has no plausibility");
	const flags = Array.isArray(r.flags) ? r.flags.filter((f) => typeof f === "string" && FLAG_ALLOWLIST.includes(f)) : [];
	const text = (v, max) => typeof v === "string" ? v.trim().slice(0, max) : "";
	const slug = typeof r.subjectSlug === "string" && slugs.has(r.subjectSlug) ? r.subjectSlug : null;
	const out = {
		plausibility: Math.min(100, Math.max(0, Math.round(p))),
		subjectSlug: slug,
		summary: text(r.summary, 400),
		memo: text(r.memo, 1200),
		flags: [...new Set(flags)],
		inappropriate: r.inappropriate === true,
		emergency: r.emergency === true
	};
	if (!out.summary || !out.memo) throw new Error("triage reply is missing the summary or memo");
	return out;
}
var outputsFor = (r) => ({ outputs: {
	needsHuman: r === "review",
	likelyHoax: r === "auto-debunk"
} });
function makeTriageHandler(content, llm) {
	return async (params, ctx) => {
		const caseId = extractDocumentId(String(params.subject));
		const c = await content.fetch(CASE_QUERY, { id: caseId });
		if (!c) {
			ctx.log(`agent-triage: case ${caseId} not found; routing to review`);
			return outputsFor("review");
		}
		if (c.triage?.effectKey === ctx.effectKey && c.triage.route) return outputsFor(c.triage.route);
		if (c.source === "seed" && typeof c.triage?.plausibility === "number") {
			const r = route(c.triage.plausibility, c.triage.flags ?? []);
			await appendLog(content, caseId, {
				key: `${ctx.effectKey}:triaged`,
				actor: "agent",
				kind: "triaged",
				message: `Field Investigator: plausibility ${c.triage.plausibility}/100. ${routeSentence(r)}`
			});
			return outputsFor(r);
		}
		const fallback = async (reason) => {
			await content.patch(caseId).set({ triage: {
				summary: "The Field Investigator was unavailable. Referred to the Director.",
				model: "none",
				route: "review",
				triagedAt: (/* @__PURE__ */ new Date()).toISOString(),
				effectKey: ctx.effectKey,
				flags: []
			} }).commit();
			await appendLog(content, caseId, {
				key: `${ctx.effectKey}:triaged`,
				actor: "system",
				kind: "error",
				message: `${reason} Referred to the Director.`
			});
			return outputsFor("review");
		};
		const settings = await content.fetch(`*[_id == "bureau-settings"][0]{agentEnabled, dailyAgentBudget}`);
		if (settings?.agentEnabled === false) return fallback("The Field Investigator is switched off.");
		const budget = settings?.dailyAgentBudget ?? 60;
		if (await content.fetch(`count(*[_type == "case" && defined(triage.triagedAt) && triage.model != "none" && triage.model != "seed" && dateTime(triage.triagedAt) > dateTime(now()) - 86400])`) >= budget) return fallback("The daily triage budget has been reached.");
		const subjects = await content.fetch(`*[_type == "subject"]{_id, "slug": slug.current, name, category, signatureTraits}`);
		const slugs = new Set(subjects.map((s) => s.slug));
		let result;
		try {
			result = await askJson({
				content,
				...llm
			}, INSTRUCTION, {
				report: JSON.stringify({
					caseNumber: c.caseNumber,
					title: c.title,
					category: c.category,
					...c,
					witness: void 0,
					triage: void 0,
					source: void 0,
					hidden: void 0
				}),
				subjects: JSON.stringify(subjects.map(({ slug, name, category, signatureTraits }) => ({
					slug,
					name,
					category,
					signatureTraits
				}))),
				witness: JSON.stringify(c.witness ?? {})
			}, (raw) => validate(raw, slugs));
		} catch (error) {
			ctx.log(`agent-triage failed: ${error instanceof Error ? error.message : String(error)}`);
			return fallback("The Field Investigator could not complete triage.");
		}
		const t = result.value;
		const flags = new Set(t.flags);
		if (c.category === "spirit") flags.add("faith-sensitive");
		if (t.inappropriate) flags.add("inappropriate-content");
		if (t.emergency) flags.add("possible-emergency");
		const flagList = [...flags];
		const r = route(t.plausibility, flagList);
		const match = subjects.find((s) => s.slug === t.subjectSlug);
		await content.patch(caseId).set({
			triage: {
				plausibility: t.plausibility,
				summary: t.summary,
				memo: t.memo,
				flags: flagList,
				route: r,
				triagedAt: (/* @__PURE__ */ new Date()).toISOString(),
				model: result.model,
				effectKey: ctx.effectKey,
				...match ? { subjectMatch: {
					_type: "reference",
					_ref: match._id
				} } : {}
			},
			...flags.has("inappropriate-content") ? { hidden: true } : {}
		}).commit();
		await appendLog(content, caseId, {
			key: `${ctx.effectKey}:triaged`,
			actor: "agent",
			kind: "triaged",
			message: `Field Investigator: plausibility ${t.plausibility}/100. ${routeSentence(r)}`
		});
		return outputsFor(r);
	};
}
function routeSentence(r) {
	return r === "investigation" ? "Opened for investigation." : r === "review" ? "Referred to the Director's review." : "Closed at triage.";
}
//#endregion
export { makeTriageHandler };

//# sourceMappingURL=index8.js.map