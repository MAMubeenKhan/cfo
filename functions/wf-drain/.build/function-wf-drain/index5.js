import { appendLog, conflictKey } from "./index3.js";
import { askJson } from "./index4.js";
import { extractDocumentId } from "@sanity/workflow-engine";
//#region workflow/handlers/crossref.ts
var INSTRUCTION = `You are the Cross-Referencer at the Cryptid Field Office, a deadpan government bureau.
Compare the case in $case with the candidate files in $candidates. Propose links only where two files plausibly concern the same phenomenon, place, witness pattern or period. Be conservative: a wrong link is worse than a missing one.
Any societies or groups mentioned are fictional. Never mock a witness or any belief.
Reply with ONE JSON object and nothing else:
{"links": [{"caseId": one _id from $candidates, "confidence": number 0.5-1, "reason": one sentence, at most 150 characters}]}
Return at most 4 links, or an empty array.`;
function makeCrossrefHandler(content, llm) {
	return async (params, ctx) => {
		const caseId = extractDocumentId(String(params.subject));
		const c = await content.fetch(`*[_id == $id][0]{_id, source, hidden, category, title, "description": sighting.description, "place": sighting.location.placeName, "geo": sighting.location.geo, "subject": triage.subjectMatch._ref}`, { id: caseId });
		if (!c || c.hidden) return;
		if (c.source === "seed") {
			const n = await content.fetch(`count(*[_type == "connection" && (from._ref == $id || to._ref == $id)])`, { id: caseId });
			await appendLog(content, caseId, {
				key: `${ctx.effectKey}:connected`,
				actor: "agent",
				kind: "connected",
				message: n > 0 ? `Cross-Referencer: ${n} related ${n === 1 ? "file" : "files"} on record.` : "Cross-Referencer: no related files on record."
			});
			return;
		}
		const candidates = await content.fetch(`*[_type == "case" && !hidden && _id != $id && (
          ($lat != null && defined(sighting.location.geo) && geo::distance(sighting.location.geo, geo::latLng($lat, $lng)) < 150000)
          || ($subject != null && triage.subjectMatch._ref == $subject)
        )]{_id, caseNumber, title, "place": sighting.location.placeName, category,
           "subject": triage.subjectMatch->slug.current, "when": sighting.observedAt,
           "description": sighting.description}[0...8]`, {
			id: caseId,
			lat: c.geo?.lat ?? null,
			lng: c.geo?.lng ?? null,
			subject: c.subject ?? null
		});
		if (candidates.length === 0) {
			await appendLog(content, caseId, {
				key: `${ctx.effectKey}:connected`,
				actor: "agent",
				kind: "connected",
				message: "Cross-Referencer: no related files located."
			});
			return;
		}
		const ids = new Set(candidates.map((x) => x._id));
		const { value } = await askJson({
			content,
			...llm
		}, INSTRUCTION, {
			case: JSON.stringify({
				_id: c._id,
				title: c.title,
				category: c.category,
				place: c.place,
				description: c.description
			}),
			candidates: JSON.stringify(candidates)
		}, (raw) => {
			const links = raw?.links;
			if (!Array.isArray(links)) throw new Error("reply has no links array");
			return links.map((l) => l).filter((l) => typeof l.caseId === "string" && ids.has(l.caseId) && Number(l.confidence) >= .5 && typeof l.reason === "string").slice(0, 4).map((l) => ({
				caseId: l.caseId,
				confidence: Math.min(1, Number(l.confidence)),
				reason: l.reason.slice(0, 160)
			}));
		});
		for (const link of value) {
			const k = conflictKey(caseId, link.caseId);
			await content.createIfNotExists({
				_id: k.id,
				_type: "connection",
				from: {
					_type: "reference",
					_ref: k.from
				},
				to: {
					_type: "reference",
					_ref: k.to
				},
				reason: link.reason,
				confidence: +link.confidence.toFixed(2),
				proposedBy: "agent",
				status: "proposed",
				createdAt: (/* @__PURE__ */ new Date()).toISOString()
			});
		}
		await appendLog(content, caseId, {
			key: `${ctx.effectKey}:connected`,
			actor: "agent",
			kind: "connected",
			message: value.length ? `Cross-Referencer proposed ${value.length} related ${value.length === 1 ? "file" : "files"}.` : "Cross-Referencer: no related files located."
		});
	};
}
//#endregion
export { makeCrossrefHandler };

//# sourceMappingURL=index5.js.map