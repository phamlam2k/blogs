import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { TOPIC_KEYS } from './consts';

// Tag luôn được chuẩn hoá: chữ thường, khoảng trắng -> gạch ngang
const tags = z
  .array(z.string())
  .default([])
  .transform((list) => [...new Set(list.map((t) => t.trim().toLowerCase().replace(/\s+/g, '-')))]);

const topic = z.enum(TOPIC_KEYS);

// ---------- 1. Bài viết của bạn: src/content/blog/*.md | *.mdx ----------
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    topic,
    tags,
    draft: z.boolean().default(false),
    // Ghim bài lên đầu trang chủ
    pinned: z.boolean().default(false),
  }),
});

// ---------- 2. Repo GitHub bạn muốn share: src/content/repos/*.md ----------
const repos = defineCollection({
  loader: glob({ base: './src/content/repos', pattern: '**/*.md' }),
  schema: z.object({
    name: z.string(), // vd: withastro/astro
    url: z.url(),
    description: z.string(),
    language: z.string().optional(),
    topic,
    tags,
    addedDate: z.coerce.date(),
    // true nếu là repo của chính bạn
    mine: z.boolean().default(false),
  }),
});

// ---------- 3. Bài viết hay của người khác: src/content/links/*.md ----------
const links = defineCollection({
  loader: glob({ base: './src/content/links', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    url: z.url(),
    source: z.string(), // tác giả hoặc tên trang
    topic,
    tags,
    addedDate: z.coerce.date(),
  }),
});

export const collections = { blog, repos, links };
