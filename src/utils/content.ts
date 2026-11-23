import { getCollection, type CollectionEntry } from 'astro:content';
import type { TopicKey } from '../consts';

export type Post = CollectionEntry<'blog'>;
export type Repo = CollectionEntry<'repos'>;
export type LinkItem = CollectionEntry<'links'>;

/** Published posts (drafts only show with `npm run dev`), newest first */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  // Same date: the later part of a series counts as newer (keeps prev/next links in reading order)
  return posts.sort(
    (a, b) =>
      b.data.pubDate.valueOf() - a.data.pubDate.valueOf() ||
      (b.data.seriesOrder ?? 0) - (a.data.seriesOrder ?? 0),
  );
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

/** Count how often each tag appears across all 3 content types */
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
 * Related posts: +2 points per shared tag, +1 point for the same topic.
 * Keeps posts with score > 0, highest first; ties go to the newer post.
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

/** Repos / links sharing tags with the post — shown at the end of the post */
export function getRelatedShares<T extends Repo | LinkItem>(current: Post, items: T[], limit = 3): T[] {
  const currentTags = new Set(current.data.tags);
  return items
    .map((it) => ({ it, score: it.data.tags.filter((t) => currentTags.has(t)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.it);
}

/** Estimated reading time (~220 words/min, code blocks count as words) */
export function readingTime(body: string | undefined): number {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10); // 2026-11-11 — proper dev style
}

/** Group posts by year for the archive page */
export function groupByYear(posts: Post[]): [number, Post[]][] {
  const map = new Map<number, Post[]>();
  for (const p of posts) {
    const y = p.data.pubDate.getFullYear();
    if (!map.has(y)) map.set(y, []);
    map.get(y)!.push(p);
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]);
}
