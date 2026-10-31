/**
 * 媒体文件的 API 路由
 * 用于处理媒体文件的请求
 * 
 * 1. 导入类型 APIRoute
 * 2. 设置 prerender 为 false
 * 3. 定义 GET 路由
 * 4. 获取 key 参数
 * 5. 如果 key 不存在，返回 404 响应
 * 6. 重定向到媒体文件的 API 路由 /_emdash/api/media/file/${key}
 */
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = ({ params, redirect }) => {
  const key = params.key;
  if (!key) return new Response(null, { status: 404 });
  return redirect(`/_emdash/api/media/file/${key}`, 307);
};
