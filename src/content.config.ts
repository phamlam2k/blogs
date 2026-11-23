import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { TOPIC_KEYS } from './consts';

// Tags are always normalized: lowercase, spaces -> dashes
const tags = z
  .array(z.string())
  .default([])
  .transform((list) => [...new Set(list.map((t) => t.trim().toLowerCase().replace(/\s+/g, '-')))]);

const topic = z.enum(TOPIC_KEYS);

// ---------- 1. Your posts: src/content/blog/**/*.md | *.mdx ----------
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
    // Pin the post to the top of the home page
    pinned: z.boolean().default(false),
    // Optional series info, e.g. "Algorithms Hiding in Your Frontend", part 1
    series: z.string().optional(),
    seriesOrder: z.number().int().positive().optional(),
  }),
});

// ---------- 2. GitHub repos you want to share: src/content/repos/*.md ----------
const repos = defineCollection({
  loader: glob({ base: './src/content/repos', pattern: '**/*.md' }),
  schema: z.object({
    name: z.string(), // e.g. withastro/astro
    url: z.url(),
    description: z.string(),
    language: z.string().optional(),
    topic,
    tags,
    addedDate: z.coerce.date(),
    // true if it's your own repo
    mine: z.boolean().default(false),
  }),
});

// ---------- 3. Great articles by other people: src/content/links/*.md ----------
const links = defineCollection({
  loader: glob({ base: './src/content/links', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    url: z.url(),
    source: z.string(), // author or site name
    topic,
    tags,
    addedDate: z.coerce.date(),
  }),
});

export const collections = { blog, repos, links };
