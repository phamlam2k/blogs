---
title: 'Promise.all, allSettled, race, any — which one to pick?'
description: 'Comparing the 4 Promise combinators in JavaScript: when they resolve, when they reject, and a practical use case for each.'
pubDate: 2026-11-08
topic: frontend
tags: [javascript, async]
---

When you need to run several async tasks **in parallel**, JavaScript gives you 4 Promise combinators. They differ in only one question: _when is it considered done, and done how?_

## Quick comparison

| Function | Resolves when | Rejects when |
| --- | --- | --- |
| `Promise.all` | **all** succeed | **one** fails (fail-fast) |
| `Promise.allSettled` | all have settled (success or failure) | never |
| `Promise.race` | the **first** to settle succeeds | the first to settle fails |
| `Promise.any` | the **first** one succeeds | **all** fail (`AggregateError`) |

## Promise.all — you need every piece to continue

```js
const [user, posts] = await Promise.all([fetchUser(id), fetchPosts(id)]);
```

Use it when the page can't render if any single part is missing.

## Promise.allSettled — run everything, record each failure

```js
const results = await Promise.allSettled(files.map(upload));
const failed = results.filter((r) => r.status === 'rejected');
console.log(`${failed.length} uploads failed`);
```

Great for batch jobs, where one failure shouldn't ruin the whole batch.

## Promise.race — implementing a timeout

```js
const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
const data = await Promise.race([fetch(url), timeout(5000)]);
```

## Promise.any — take the fastest source that's still alive

```js
const res = await Promise.any([fetch(mirrorA), fetch(mirrorB), fetch(mirrorC)]);
```

If one mirror is down, no problem — as long as at least one responds.

> None of the 4 functions **cancel** the remaining Promises. To actually cancel work (e.g. abort a request), use `AbortController`.
