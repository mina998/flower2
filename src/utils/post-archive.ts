import { getEmDashCollection } from "emdash";

export const POSTS_PER_PAGE = 10;

export async function loadPostsPage(page: number) {
	const { entries, cacheHint } = await getEmDashCollection("posts", {
		orderBy: { published_at: "desc" },
	});
	const pageCount = Math.ceil(entries.length / POSTS_PER_PAGE);
	const start = (page - 1) * POSTS_PER_PAGE;
	return {
		posts: entries.slice(start, start + POSTS_PER_PAGE),
		pageCount,
		cacheHint,
	};
}
