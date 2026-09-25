//#region workflow/lib/routing.ts
/** Any of these flags forces a human to look at the case. */
var FORCE_REVIEW_FLAGS = [
	"faith-sensitive",
	"wellbeing-concern",
	"coercion-concern",
	"inappropriate-content",
	"possible-emergency"
];
/** The only flags a case may carry. Anything else the model invents is dropped. */
var FLAG_ALLOWLIST = [
	"possible-misidentification",
	"known-hoax-pattern",
	"weather-explains",
	"animal-explains",
	"aircraft-explains",
	"celestial-explains",
	"satellite-explains",
	"low-detail",
	"inappropriate-content",
	"possible-emergency",
	"strong-detail",
	"multiple-witnesses",
	"faith-sensitive",
	"wellbeing-concern",
	"coercion-concern"
];
function route(plausibility, flags) {
	if (flags.some((f) => FORCE_REVIEW_FLAGS.includes(f))) return "review";
	if (plausibility < 20) return "auto-debunk";
	if (plausibility < 70) return "review";
	return "investigation";
}
/** Status ranks: a mirror write may only move a case forward, never backward. */
var STATUS_RANK = {
	intake: 0,
	review: 1,
	investigation: 2,
	filing: 3,
	classified: 4,
	debunked: 4,
	inconclusive: 4
};
var VERDICTS = [
	"classified",
	"debunked",
	"inconclusive"
];
/** Laplace-smoothed: a new witness sits at 50 and moves with their record. */
function credibility(counts) {
	const closed = counts.classified + counts.debunked + counts.inconclusive;
	return Math.round(100 * (counts.classified + .5 * counts.inconclusive + 1) / (closed + 2));
}
//#endregion
export { FLAG_ALLOWLIST, FORCE_REVIEW_FLAGS, STATUS_RANK, VERDICTS, credibility, route };

//# sourceMappingURL=index2.js.map