import { STATUS_RANK } from "./index2.js";
//#region workflow/lib/case-store.ts
/** Adds one entry to the public case log, once. `key` makes it safe to replay. */
async function appendLog(content, caseId, entry) {
	if (await content.fetch(`count(*[_id == $id && count(log[_key == $key]) > 0])`, {
		id: caseId,
		key: entry.key
	}) > 0) return;
	await content.patch(caseId).setIfMissing({ log: [] }).insert("after", "log[-1]", [{
		_key: entry.key,
		_type: "logEntry",
		at: (/* @__PURE__ */ new Date()).toISOString(),
		actor: entry.actor,
		kind: entry.kind,
		message: entry.message.slice(0, 400)
	}]).commit();
}
/**
* Sets the case status mirror, but only forwards. Effects may be processed out of order
* or replayed, and a stale one must never drag a filed case back to "review".
*/
async function mirrorStatus(content, caseId, status) {
	for (let attempt = 0; attempt < 3; attempt++) {
		const current = await content.fetch(`*[_id == $id][0]{_rev, status}`, { id: caseId });
		if (!current) throw new Error(`case ${caseId} not found`);
		if ((STATUS_RANK[status] ?? 0) <= (STATUS_RANK[current.status ?? "intake"] ?? 0)) return "kept";
		try {
			await content.patch(caseId).ifRevisionId(current._rev).set({ status }).commit();
			return "moved";
		} catch (error) {
			if (error.statusCode !== 409 || attempt === 2) throw error;
		}
	}
	return "kept";
}
function conflictKey(caseId, otherId) {
	const [from, to] = [caseId, otherId].sort();
	return {
		id: `conn-${from}-${to}`,
		from,
		to
	};
}
//#endregion
export { appendLog, conflictKey, mirrorStatus };

//# sourceMappingURL=index3.js.map