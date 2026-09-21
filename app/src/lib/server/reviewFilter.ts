/**
 * Shared review-listing filter + page size.
 *
 * routes/review/+page.server.ts (load) and routes/api/review/page/+server.ts (GET)
 * must keep byte-identical query behavior, so both call this instead of
 * maintaining their own copy of the tag-filter block.
 */
export const REVIEW_PAGE_SIZE = 200;

export function buildReviewFilter(searchTerm: string, notag: string): any {
	const filter: any = {};
	if (searchTerm) {
		filter.tags = { $all: [searchTerm] };
	}
	if (notag) {
		if (filter.tags) {
			filter.tags = {
				$all: [searchTerm],
				$not: { $in: [notag] }
			};
		} else {
			filter.tags = { $not: { $in: [notag] } };
		}
	}
	return filter;
}
