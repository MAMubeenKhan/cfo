//#region workflow/lib/llm.ts
async function askJson(opts, instruction, params, validate) {
	const provider = opts.provider ?? "sanity";
	const timeoutMs = opts.timeoutMs ?? 45e3;
	let lastError;
	for (let attempt = 0; attempt < 2; attempt++) try {
		return {
			value: validate(await withTimeout(provider === "anthropic" ? callAnthropic(opts, instruction, params) : callSanity(opts, instruction, params), timeoutMs)),
			model: provider === "anthropic" ? opts.anthropicModel ?? "claude-haiku-4-5" : "sanity-agent-actions"
		};
	} catch (error) {
		lastError = error;
	}
	throw new Error(`LLM call failed after 2 attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}
async function callSanity(opts, instruction, params) {
	const result = await opts.content.agent.action.prompt({
		instruction,
		instructionParams: params,
		format: "json"
	});
	return typeof result === "string" ? JSON.parse(result) : result;
}
async function callAnthropic(opts, instruction, params) {
	if (!opts.anthropicKey) throw new Error("ANTHROPIC_API_KEY is not set");
	const { default: Anthropic } = await import("@anthropic-ai/sdk");
	const client = new Anthropic({ apiKey: opts.anthropicKey });
	let prompt = instruction;
	for (const [k, v] of Object.entries(params)) prompt = prompt.split(`$${k}`).join(v);
	const text = (await client.messages.create({
		model: opts.anthropicModel ?? "claude-haiku-4-5",
		max_tokens: 1400,
		system: "You are a records officer at a government bureau. Reply with one JSON object only, no prose, no code fences.",
		messages: [{
			role: "user",
			content: prompt
		}]
	})).content.map((b) => b.type === "text" ? b.text : "").join("").trim();
	return JSON.parse(text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim());
}
function withTimeout(p, ms) {
	return new Promise((resolve, reject) => {
		const t = setTimeout(() => reject(/* @__PURE__ */ new Error(`timed out after ${ms} ms`)), ms);
		p.then((v) => {
			clearTimeout(t);
			resolve(v);
		}, (e) => {
			clearTimeout(t);
			reject(e);
		});
	});
}
//#endregion
export { askJson };

//# sourceMappingURL=index4.js.map