import { getCollection, type CollectionEntry } from 'astro:content';
import type { TopicKey } from '../consts';

export type Post = CollectionEntry<'blog'>;
export type Repo = CollectionEntry<'repos'>;
export type LinkItem = CollectionEntry<'links'>;

/** Bài viết đã xuất bản (bản nháp chỉ hiện khi chạy `npm run dev`), mới nhất trước */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getRepos(): Promise<Repo[]> {
  const repos = await getCollection('repos');
  return repos.sort((a, b) => b.data.addedDate.valueOf() - a.data.addedDate.valueOf());
}

export async function getLinks(): Promise<LinkItem[]> {
  const links = await getCollection('links');
  return links.sort((a, b) => b.data.addedDate.valueOf() - a.data.addedDate.valueOf());
}

export async function getAll() {
  const [posts, repos, links] = await Promise.all([getPosts(), getRepos(), getLinks()]);
  return { posts, repos, links };
}

/** Đếm số lần xuất hiện của từng tag trên cả 3 loại nội dung */
export async function getTagCounts(): Promise<Map<string, number>> {
  const { posts, repos, links } = await getAll();
  const counts = new Map<string, number>();
  for (const item of [...posts, ...repos, ...links]) {
    for (const tag of item.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return new Map([...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

export async function getTopicCounts(): Promise<Record<TopicKey, number>> {
  const { posts, repos, links } = await getAll();
  const counts = {} as Record<TopicKey, number>;
  for (const item of [...posts, ...repos, ...links]) {
    counts[item.data.topic] = (counts[item.data.topic] ?? 0) + 1;
  }
  return counts;
}

/**
 * Bài liên quan: mỗi tag trùng +2 điểm, cùng topic +1 điểm.
 * Lấy những bài có điểm > 0, điểm cao trước, cùng điểm thì bài mới hơn trước.
 */
export function getRelatedPosts(current: Post, all: Post[], limit = 3): Post[] {
  const currentTags = new Set(current.data.tags);
  return all
    .filter((p) => p.id !== current.id)
    .map((p) => {
      const sharedTags = p.data.tags.filter((t) => currentTags.has(t)).length;
      const sameTopic = p.data.topic === current.data.topic ? 1 : 0;
      return { post: p, score: sharedTags * 2 + sameTopic };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf())
    .slice(0, limit)
    .map((x) => x.post);
}

/** Repo / link có chung tag với bài viết — hiện ở cuối bài */
export function getRelatedShares<T extends Repo | LinkItem>(current: Post, items: T[], limit = 3): T[] {
  const currentTags = new Set(current.data.tags);
  return items
    .map((it) => ({ it, score: it.data.tags.filter((t) => currentTags.has(t)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.it);
}

/** Ước lượng thời gian đọc (~220 từ/phút, code block tính như chữ) */
export function readingTime(body: string | undefined): number {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10); // 2026-11-11 — đúng chất dev
}

/** Nhóm bài theo năm cho trang lưu trữ */
export function groupByYear(posts: Post[]): [number, Post[]][] {
  const map = new Map<number, Post[]>();
  for (const p of posts) {
    const y = p.data.pubDate.getFullYear();
    if (!map.has(y)) map.set(y, []);
    map.get(y)!.push(p);
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]);
}
