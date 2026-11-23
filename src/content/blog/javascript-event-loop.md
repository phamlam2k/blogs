---
title: 'Understanding the JavaScript Event Loop in 4 Examples'
description: 'Call stack, microtasks, macrotasks — predict the order of console.log calls and learn why a Promise always runs before setTimeout.'
pubDate: 2026-11-05
topic: frontend
tags: [javascript, async, event-loop]
---

JavaScript is **single-threaded**: only one piece of code runs at any given moment. So how can it wait for an API, wait for a timer, and still keep the UI responsive? The answer is the _event loop_.

## Three pieces to remember

1. **Call stack** — where currently running functions are stacked on top of each other.
2. **Microtask queue** — callbacks from `Promise.then`, `queueMicrotask`, `await`.
3. **Macrotask queue** (task queue) — callbacks from `setTimeout`, `setInterval`, DOM events, I/O.

The golden rule:

> After every macrotask, the event loop **drains** the entire microtask queue before picking up the next macrotask.

## Example 1: setTimeout 0 is not "immediately"

```js
console.log('A');
setTimeout(() => console.log('B'), 0);
console.log('C');
// A, C, B
```

`setTimeout(..., 0)` only puts the callback into the macrotask queue. It still has to wait for the call stack to be empty.

## Example 2: a Promise always cuts in front of setTimeout

```js
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise'));
console.log('sync');
// sync, promise, timeout
```

Synchronous code finishes → microtasks (`promise`) → only then the macrotask (`timeout`).

## Example 3: await splits a function in two

```js
async function run() {
  console.log('1');
  await null;
  console.log('3');
}
run();
console.log('2');
// 1, 2, 3
```

Everything **after** `await` is queued as a microtask, so `2` is printed before `3`.

## Example 4: nested microtasks can freeze the page

```js
function loop() {
  Promise.resolve().then(loop);
}
loop(); // ⚠ the browser never gets a chance to re-render
```

Because the microtask queue must be fully drained before rendering happens, an endless chain of microtasks blocks the UI. With `setTimeout(loop, 0)` the page stays smooth, because the browser gets a chance to render between macrotasks.

## Summary

| Kind | Example | When it runs |
| --- | --- | --- |
| Sync | `console.log` | immediately |
| Microtask | `Promise.then`, `await` | right after the stack is empty |
| Macrotask | `setTimeout`, click | after all microtasks are done |

To test yourself, paste the examples above into the DevTools console and guess the output first.
