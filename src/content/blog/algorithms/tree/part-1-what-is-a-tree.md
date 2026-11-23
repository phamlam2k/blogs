---
title: "Trees, Part 1: The Data Structure You've Used Since Your First <div>"
description: "Open DevTools and you're already looking at a tree. Learn what a tree really is, the vocabulary the DOM API borrowed from it, and the one recursive idea that makes every tree problem easy."
pubDate: 2026-11-23
topic: algorithms
tags: ["algorithms", "data-structures", "trees", "javascript", "frontend"]
series: "Algorithms Hiding in Your Frontend"
seriesOrder: 1
---

> **Series: Algorithms Hiding in Your Frontend — Trees, Part 1 of 3**
> Many front-end developers think algorithms are "interview stuff." This series shows the opposite: the tools you use every day — the browser, React, Vue, Vite, Prettier — are built on classic algorithms. Learn the algorithm, and you understand your tools better.

**In this part (≈ 7 min):**

- What a tree actually is (no math degree required)
- The vocabulary — and why you already know half of it from the DOM API
- The two rules every tree follows
- The one idea that makes tree code short: _a tree is made of trees_

**Coming up:** [Part 2 — Walking the DOM and your component tree](/posts/algorithms/tree/part-2-dom-and-components/) · [Part 3 — How JavaScript reads `2 + 3 * 5`](/posts/algorithms/tree/part-3-your-code-is-a-tree/)

---

## A question to start

Open DevTools on any website and look at the **Elements** panel. You'll see something like this:

```
▼ <html>
  ▶ <head>
  ▼ <body>
    ▼ <header>
        <h1>
    ▼ <main>
        <p>
        <button>
```

Little arrows that expand and collapse. Elements nested inside elements. Indentation that shows who "belongs" to whom.

You've looked at this hundreds of times. But have you noticed that it's not a list? It has a **shape**. Things branch out.

That shape is called a **tree**, and once you see it, you'll find it everywhere in front-end development: in the DOM, in your component structure, in your folder of source files, and even inside the JavaScript engine when it calculates `2 + 3 * 5 - 3`.

Let's build up the idea from scratch.

## What is a tree?

### The intuition

> A tree is a way of organizing things where each item can have **several items below it**, but only **one item above it**.

Think of a company org chart. The CEO has several managers. Each manager has several employees. But every employee has exactly **one** direct boss.

Now let's draw the HTML from above in the same way:

```
                html
              /      \
          head        body
           |         /    \
         title   header    main
                   |      /    \
                  h1     p    button
```

Same shape as the org chart. `html` is the "CEO", `body` is a "manager", and `button` is an "employee" with nobody below it.

### The vocabulary

Now that you've seen the picture, here are the names for each part. Keep the HTML tree above in mind — every term points to something in it.

| Term | Meaning | In our HTML tree |
|---|---|---|
| **Node** | One item in the tree | Every tag: `html`, `body`, `p`... |
| **Edge** | The link between two nodes | The line from `body` to `main` |
| **Root** | The top node — the only one with no parent | `html` |
| **Parent** | The node directly above | `main` is the parent of `p` |
| **Child** | A node directly below | `head` and `body` are children of `html` |
| **Siblings** | Nodes with the same parent | `p` and `button` |
| **Leaf** | A node with no children | `title`, `h1`, `p`, `button` |
| **Ancestor** | Any node on the path up to the root | `main`, `body`, `html` are ancestors of `p` |
| **Descendant** | Any node below, at any level | Everything inside `body` |
| **Subtree** | A node plus all its descendants | `main` + `p` + `button` |
| **Depth** (of a node) | Number of edges from the root down to it | `html` = 0, `body` = 1, `p` = 3 |
| **Height** (of a tree) | Longest path from the root to a leaf | 3 (`html → body → main → p`) |

If you've used the DOM API, many of these names will feel familiar — the browser literally uses them:

```js
element.parentElement      // parent
element.children           // children
element.nextElementSibling // sibling
element.closest('.card')   // search through ancestors
parent.contains(child)     // is child a descendant of parent?
```

The DOM API is a tree API. The browser designers just didn't put "tree" in the name.

> **Don't mix these up:** _depth_ is measured from the root **down to** a node; _height_ is measured from a node **down to** its furthest leaf. The root has depth 0; a leaf has height 0. (Some books count nodes instead of edges, so a single node has height 1. Either is fine — this series counts edges.)

### The rule that makes it a tree

Let's count our HTML tree.

- Nodes: `html, head, title, body, header, h1, main, p, button` → **9 nodes**
- Edges: count the lines in the drawing → **8 edges**

Is that a coincidence? Let's reason about it.

1. Every node, **except the root**, has exactly one parent.
2. Each "child → parent" connection is exactly one edge.
3. So the number of edges equals the number of nodes that have a parent — which is every node except the root.

That gives us the first real rule of trees:

> **A tree with _n_ nodes always has exactly _n − 1_ edges.**

There's a second rule hiding in the "only one parent" idea: **you can never walk in a loop**. If you go down from `body` to `main` to `p`, there's no edge that brings you back to `body` by another route. Put these together and you get the textbook definition:

> **A tree is a connected structure with no cycles.**

**Quick check:** a real family tree has two parents per person. Is it a tree? By our rule — no! A person with two parents means two edges going "up," and you can form loops through shared ancestors. Strictly speaking, a family tree is a **graph**, not a tree. (We'll meet graphs later in this series, when we look at how Vite and Webpack bundle your modules.)

## The most useful definition: a tree is made of trees

Look at the `body` node and everything below it:

```
         body
        /    \
    header    main
      |      /    \
     h1     p    button
```

That's... also a tree. And `main` with its children? Also a tree. And `p` alone? A tree with one node.

So we can define a tree using itself:

> **A tree is either empty, or a node whose children are themselves trees.**

This sounds like a word game, but it's the most important idea in this whole series. It means **any question about a tree can be answered by asking the same question about its children, then combining the answers.** In code, that's **recursion**.

Let's try it. How many nodes are in a tree?

- In words: *"1 (myself) + the number of nodes in each of my children's trees."*
- In code:

```js
function countNodes(node) {
  let total = 1; // myself
  for (const child of node.children) {
    total += countNodes(child); // same question, smaller tree
  }
  return total;
}
```

What's the height of a tree?

- In words: *"A leaf has height 0. Otherwise, it's 1 + the height of my tallest child."*
- In code:

```js
function height(node) {
  if (node.children.length === 0) return 0; // leaf
  return 1 + Math.max(...node.children.map(height));
}
```

Notice the pattern: **the sentence in plain English and the code are almost the same.** That's the power of the recursive definition. Keep it in mind — you'll see it again and again in Parts 2 and 3.

> **Watch out — the base case.** Every recursive tree function needs a "stop here" case: a leaf, an empty list of children, or `null`. Without it, you get infinite recursion — or a crash on `undefined.children`.

## Your turn

Try this before opening the answer. First say it in plain English, then write the code.

**Challenge:** write `countLeaves(node)` — how many nodes in the tree have no children? For our HTML tree the answer should be **4** (`title`, `h1`, `p`, `button`).

<details>
<summary>Show the answer</summary>

In words: *"If I'm a leaf, that's 1. Otherwise, it's the sum of the leaves in each of my children's trees."*

```js
function countLeaves(node) {
  if (node.children.length === 0) return 1; // I'm a leaf
  let total = 0;
  for (const child of node.children) {
    total += countLeaves(child);
  }
  return total;
}
```

Want to run it on a real page? Paste this into the DevTools console:

```js
countLeaves(document.documentElement);
```

It works because `element.children` is exactly the `children` our function expects. The DOM is a tree.

</details>

## Recap

- A tree is nodes connected **without cycles**; every node except the root has **exactly one parent**.
- A tree with _n_ nodes has **_n − 1_ edges**.
- The DOM API (`parentElement`, `children`, `closest`, `contains`) is a tree API in disguise.
- **A tree is made of trees** → most tree problems are "solve it for my children, then combine."

## Next up

You now know what a tree is. But knowing the shape is only half the story — the interesting part is **walking** it. In which order should you visit the nodes? It turns out the browser already picked one for you (it's called "document order"), and React uses a _different_ one when it runs your `useEffect`s.

👉 **[Part 2 — Walking the tree: the DOM and your component tree](/posts/algorithms/tree/part-2-dom-and-components/)**
