import type { APIRoute } from 'astro';
import { getAll } from '../utils/content';

// Index tìm kiếm tĩnh, sinh lúc build. Trang /search tải file này rồi lọc trên trình duyệt.
export const GET: APIRoute = async () => {
  const { posts, repos, links } = await getAll();
  const index = [
    ...posts.map((p) => ({
      type: 'blogs',
      title: p.data.title,
      desc: p.data.description,
      url: `/blogs/${p.id}/`,
      topic: p.data.topic,
      tags: p.data.tags,
      date: p.data.pubDate.toISOString().slice(0, 10),
    })),
    ...repos.map((r) => ({
      type: 'repos',
      title: r.data.name,
      desc: r.data.description,
      url: r.data.url,
      topic: r.data.topic,
      tags: r.data.tags,
      date: r.data.addedDate.toISOString().slice(0, 10),
    })),
    ...links.map((l) => ({
      type: 'links',
      title: l.data.title,
      desc: `${l.data.source}`,
      url: l.data.url,
      topic: l.data.topic,
      tags: l.data.tags,
      date: l.data.addedDate.toISOString().slice(0, 10),
    })),
  ];
  return new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json' } });
};
