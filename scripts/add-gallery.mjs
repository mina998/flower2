/**
 * 1.安装相册插件
 * pnpm add emdash-plugin-media-gallery
 * 2.在 package.json 中添加脚本
 * "scripts": {
 *   "gallery": "node scripts/add-gallery.mjs"
 * }
 * 3.在 astro.config.mjs 中导入插件并添加到 emdash 中
 * import { mediaGalleryPlugin } from "emdash-plugin-media-gallery";
 * plugins: [mediaGalleryPlugin()],
 * 4.添加相册字段
 * @param {string} collection 集合slug
 * @param {string} labelArg 字段名称
 * @returns {void}
 * 
 * 在终端运行
 * pnpm gallery product
 * pnpm gallery product 产品相册
 * 
 */
import { EmDashApiError, EmDashClient } from "emdash/client";

const WIDGET = "media-gallery:gallery";
const FIELD_SLUG = "gallery";
const DEFAULT_LABEL = "相册";
const OPTIONS = {
	maxItems: 30,
	allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
	perItemFields: ["alt", "caption"],
};

const [collection, labelArg] = process.argv.slice(2);

if (!collection || collection.startsWith("-")) {
	console.error("用法: pnpm gallery <集合slug> [字段名称]");
	console.error("例如: pnpm gallery product");
	console.error("      pnpm gallery product 产品相册");
	process.exit(1);
}

const baseUrl = process.env.EMDASH_URL ?? "http://localhost:4321";
const client = new EmDashClient({ baseUrl, devBypass: true });
const label = labelArg || DEFAULT_LABEL;

try {
	const current = await client.collection(collection);
	const existing = current.fields?.find((field) => field.slug === FIELD_SLUG);

	if (!existing) {
		await client.createField(collection, {
			slug: FIELD_SLUG,
			type: "json",
			label,
			widget: WIDGET,
			options: OPTIONS,
		});
		console.log(`已给「${current.label}」加上相册字段 ${FIELD_SLUG}`);
		process.exit(0);
	}

	if (existing.type !== "json") {
		console.error(
			`「${current.label}」里已有字段 ${FIELD_SLUG}，类型是 ${existing.type}，不能改成相册。`,
		);
		process.exit(1);
	}

	if (existing.widget === WIDGET && (!labelArg || existing.label === labelArg)) {
		console.log(`「${current.label}」的 ${FIELD_SLUG} 已经是相册控件。`);
		process.exit(0);
	}

	await updateField(baseUrl, collection, {
		widget: WIDGET,
		options: OPTIONS,
		...(labelArg ? { label: labelArg } : {}),
	});
	console.log(`已把「${current.label}」的 ${FIELD_SLUG} 接上相册控件。`);
} catch (error) {
	if (error instanceof EmDashApiError && error.status === 404) {
		console.error(`找不到内容类型「${collection}」。先在后台 Content Types 里建好它。`);
		process.exit(1);
	}
	const message = error instanceof Error ? error.message : String(error);
	if (message.includes("ECONNREFUSED") || message.includes("fetch failed")) {
		console.error("连不上本地站点。先在另一个终端运行 pnpm dev。");
		process.exit(1);
	}
	console.error(message);
	process.exit(1);
}

async function updateField(url, collectionSlug, body) {
	const bypass = await fetch(new URL("/_emdash/api/auth/dev-bypass", url), {
		redirect: "manual",
	});
	const cookie = (bypass.headers.get("set-cookie") ?? "").split(";")[0];
	await bypass.text().catch(() => {});
	if (!cookie) {
		throw new Error("开发登录没有返回会话。确认 pnpm dev 正在运行。");
	}

	const response = await fetch(
		new URL(
			`/_emdash/api/schema/collections/${encodeURIComponent(collectionSlug)}/fields/${FIELD_SLUG}`,
			url,
		),
		{
			method: "PUT",
			headers: {
				cookie,
				"content-type": "application/json",
				"x-emdash-request": "1",
			},
			body: JSON.stringify(body),
		},
	);
	if (!response.ok) {
		const text = await response.text();
		throw new Error(text || `更新字段失败（${response.status}）`);
	}
}
