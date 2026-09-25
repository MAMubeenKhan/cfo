import { VERDICTS, credibility } from "./index2.js";
import { appendLog } from "./index3.js";
import { extractDocumentId } from "@sanity/workflow-engine";
//#region workflow/handlers/file-verdict.ts
var STAMP = {
	classified: "CLASSIFIED",
	debunked: "DEBUNKED",
	inconclusive: "INCONCLUSIVE"
};
/** Stamps the verdict on the case and refreshes the witness's track record. Safe to replay. */
function makeFileVerdictHandler(content) {
	return async (params, ctx) => {
		const caseId = extractDocumentId(String(params.subject));
		const c = await content.fetch(`*[_id == $id][0]{_id, "witness": witness._ref, "visitor": defined(visitorDecision.at), category, "flags": triage.flags}`, { id: caseId });
		if (!c) {
			ctx.log(`file-verdict: case ${caseId} not found`);
			return;
		}
		const wanted = typeof params.verdict === "string" ? params.verdict : "debunked";
		const verdict = VERDICTS.includes(wanted) ? wanted : "inconclusive";
		const note = typeof params.note === "string" && params.note.trim() || (verdict === "debunked" ? "Closed at triage by the Field Investigator." : "Filed without a note.");
		const filedBy = c.visitor ? "visitor" : params.investigatorId ? "investigator" : params.directorId ? "director" : "agent";
		const final = verdict === "debunked" && filedBy === "agent" && c.flags?.includes("faith-sensitive") ? "inconclusive" : verdict;
		await content.patch(caseId).set({
			status: final,
			verdict: {
				outcome: final,
				note: note.slice(0, 600),
				filedAt: (/* @__PURE__ */ new Date()).toISOString(),
				filedBy
			}
		}).commit();
		await appendLog(content, caseId, {
			key: `${ctx.effectKey}:filed`,
			actor: filedBy === "agent" ? "agent" : filedBy === "visitor" ? "visitor" : "human",
			kind: "filed",
			message: `Filed: ${STAMP[final]}. ${note}`.slice(0, 400)
		});
		if (c.witness) {
			const counts = await content.fetch(`{"classified": count(*[_type=="case" && witness._ref==$w && status=="classified"]),
          "debunked": count(*[_type=="case" && witness._ref==$w && status=="debunked"]),
          "inconclusive": count(*[_type=="case" && witness._ref==$w && status=="inconclusive"]),
          "total": count(*[_type=="case" && witness._ref==$w])}`, { w: c.witness });
			await content.patch(c.witness).set({
				reportsCount: counts.total,
				closedCounts: {
					classified: counts.classified,
					debunked: counts.debunked,
					inconclusive: counts.inconclusive
				},
				credibility: credibility(counts)
			}).commit();
		}
	};
}
//#endregion
export { makeFileVerdictHandler };

//# sourceMappingURL=index6.js.map