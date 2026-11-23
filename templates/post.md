---
# Template — copy into src/content/blog/ (subfolders are fine), rename it (e.g. my-post.md) and start writing.
# The file path becomes the URL: src/content/blog/my-post.md -> /posts/my-post/
title: 'Post title'
description: 'A 1-2 sentence summary shown on Google and in link previews (ideally 120-160 characters).'
pubDate: 2026-01-01
# updatedDate: 2026-01-15
# topic must be one of: frontend | algorithms  (edit the list in src/consts.ts)
topic: frontend
tags: [tag-1, tag-2]
draft: false  # true = draft, only visible with npm run dev
# pinned: true   # pin to the top of the home page
# series: 'Series name'
# seriesOrder: 1
---

Intro goes here.

## Level-2 heading (shown in the table of contents)

Content...

```ts
const hello = 'world';
```
