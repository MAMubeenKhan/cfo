import { makeCrossrefHandler } from "./index5.js";
import { makeFileVerdictHandler } from "./index6.js";
import { makeMirrorHandler } from "./index7.js";
import { makeTriageHandler } from "./index8.js";
//#region workflow/handlers/index.ts
/**
* Every effect the case-lifecycle workflow can queue, keyed by the effect's name in the definition.
* `content` is a client with write access to the dataset. Handlers are idempotent: the engine
* may dispatch one twice (lease expiry), so each write is guarded by ctx.effectKey or a natural key.
*/
function createEffectHandlers(content, llm = {}) {
	return {
		"agent-triage": makeTriageHandler(content, llm),
		"agent-crossref": makeCrossrefHandler(content, llm),
		"mirror-review": makeMirrorHandler(content, "review"),
		"mirror-investigation": makeMirrorHandler(content, "investigation"),
		"file-verdict": makeFileVerdictHandler(content)
	};
}
//#endregion
export { createEffectHandlers };

//# sourceMappingURL=index9.js.map