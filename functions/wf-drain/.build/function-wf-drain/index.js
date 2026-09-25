import { createEffectHandlers } from "./index9.js";
import { createClient } from "@sanity/client";
import { documentEventHandler } from "@sanity/functions";
import { ENGINE_API_VERSION, createEngine } from "@sanity/workflow-engine";
//#region functions/wf-drain/index.ts
/** Dispatches the queued effects of one workflow instance. One drain call per event, no outer loop. */
var handler = documentEventHandler(async ({ context, event }) => {
	const projectId = context.clientOptions.projectId;
	const dataset = context.clientOptions.dataset;
	if (!projectId || !dataset) throw new Error("The Function event has no project or dataset");
	const tag = process.env.WORKFLOW_TAG ?? "prod";
	const client = createClient({
		...context.clientOptions,
		projectId,
		dataset,
		apiVersion: ENGINE_API_VERSION,
		perspective: "raw",
		useCdn: false
	});
	const content = createClient({
		...context.clientOptions,
		projectId,
		dataset,
		apiVersion: "vX",
		perspective: "raw",
		useCdn: false
	});
	await createEngine({
		client,
		workflowResource: {
			type: "dataset",
			id: `${projectId}.${dataset}`
		},
		tag,
		executionContext: {
			kind: "drainer",
			id: "wf-drain"
		},
		effects: {
			handlers: createEffectHandlers(content, {
				provider: process.env.LLM_PROVIDER === "anthropic" ? "anthropic" : "sanity",
				anthropicKey: process.env.ANTHROPIC_API_KEY,
				anthropicModel: process.env.ANTHROPIC_MODEL
			}),
			missingHandler: "skip"
		}
	}).drainEffects({ instanceId: event.data._id });
});
//#endregion
export { handler };

//# sourceMappingURL=index.js.map