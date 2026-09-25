import { appendLog, mirrorStatus } from "./index3.js";
import { extractDocumentId } from "@sanity/workflow-engine";
//#region workflow/handlers/mirror.ts
/** Mirrors the workflow stage onto the case document so the public site can read it without the engine. */
function makeMirrorHandler(content, status) {
	const message = status === "review" ? "Referred to the Director's review." : "Investigation opened.";
	return async (params, ctx) => {
		const caseId = extractDocumentId(String(params.subject));
		if (await mirrorStatus(content, caseId, status) === "moved") await appendLog(content, caseId, {
			key: `${ctx.effectKey}:routed`,
			actor: "system",
			kind: "routed",
			message
		});
	};
}
//#endregion
export { makeMirrorHandler };

//# sourceMappingURL=index7.js.map