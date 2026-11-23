---
title: "Trees, Part 2: Walking the DOM and Your Component Tree"
description: "Why querySelectorAll returns elements in that order, why React runs child effects before parent effects, and how one recursive component renders comments 50 levels deep."
pubDate: 2026-11-23
topic: algorithms
tags: ["algorithms", "data-structures", "trees", "frontend", "javascript", "react", "dom"]
series: "Algorithms Hiding in Your Frontend"
seriesOrder: 2
---

> **Series: Algorithms Hiding in Your Frontend — Trees, Part 2 of 3**
> ← [Part 1 — What is a tree?](/posts/algorithms/tree/part-1-what-is-a-tree/) · [Part 3 — Your code is a tree](/posts/algorithms/tree/part-3-your-code-is-a-tree/) →

**In this part (≈ 8 min):**

- Why "click outside to close" is a tree question
- The three ways to walk a tree — and which one the browser and React use
- Props, context and re-renders, explained as tree rules
- Recursive components: rendering data of any depth

**Quick recap of Part 1:** a tree is nodes connected without cycles, where every node except the root has exactly one parent. And the key idea: _a tree is made of trees_, so tree problems are solved with recursion — "solve it for my children, then combine."

Here's the tree we'll keep using:

```
                html
              /      \
          head        body
           |         /    \
         title   header    main
                   |      /    \
                  h1     p    button
```

---

## Tree #1 in your frontend: the DOM

The browser reads your HTML as plain text, character by character. Text is flat. But a web page isn't flat — a button sits inside a form, which sits inside a section. So the browser **parses** the text into a tree: the **Document Object Model (DOM)**.

Everything you do with the DOM is a tree operation:

| What you write | What it does on the tree |
|---|---|
| `el.appendChild(x)` | Add a new child node |
| `el.remove()` | Remove a node **and its whole subtree** |
| `el.closest('form')` | Walk **up** through ancestors until a match |
| `el.querySelector('.btn')` | Walk **down** through descendants until a match |
| `el.contains(other)` | Check whether `other` is a descendant |

That last one is behind a pattern you've probably written: **closing a dropdown when clicking outside it.**

```js
document.addEventListener('click', (event) => {
  // Is the clicked element inside the dropdown's subtree?
  if (!dropdown.contains(event.target)) {
    closeDropdown();
  }
});
```

"Clicked outside" really means "the clicked node is not a descendant of the dropdown." It's a tree question.

Event bubbling is a tree walk too: when you click a `button`, the event travels **up** through its ancestors — `main`, `body`, `html`, `document` — and any of them can listen for it. That's why event delegation works: one listener on a parent can handle clicks for all its descendants.

## Walking the tree: three orders

To do anything with every node — search, count, render, serialize — you need to **visit** them all. This is called **traversal**, and the order matters.

### Pre-order: parent first, then children

```js
function preOrder(node, visit) {
  visit(node);                    // 1. me first
  for (const child of node.children) {
    preOrder(child, visit);       // 2. then each child's subtree
  }
}
```

Result: `html → head → title → body → header → h1 → main → p → button`

Look familiar? It's the order the tags appear in your HTML source. That's not an accident. **"Document order" is pre-order traversal.** When `document.querySelectorAll('*')` returns elements in document order, it's giving you a pre-order walk of the DOM tree.

### Post-order: children first, then parent

```js
function postOrder(node, visit) {
  for (const child of node.children) {
    postOrder(child, visit);      // 1. all children first
  }
  visit(node);                    // 2. me last
}
```

Result: `title → head → h1 → header → p → button → main → body → html`

Every node is visited **after** everything inside it. Use this when a parent needs results from its children first:

- Calculating a folder's size (you need the size of everything inside it first)
- Deleting a folder (you must empty it before removing it)
- Evaluating math expressions (that's the whole of Part 3!)
- React runs `useEffect` for **children before parents** — a post-order pattern — so when a parent's effect runs, its children are already mounted

### Level-order (breadth-first): row by row

Instead of going deep first, go **wide** first: visit everything at depth 0, then depth 1, then depth 2... This uses a **queue** instead of recursion:

```js
function levelOrder(root, visit) {
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();   // take from the front
    visit(node);
    queue.push(...node.children); // add children to the back
  }
}
```

Result: `html → head → body → title → header → main → h1 → p → button`

Use this when you want the **closest** match, not the first one in document order — for example, finding the nearest focusable element, or showing a deeply nested structure one level at a time.

### Cheat sheet

| Order | Rule | Front-end examples |
|---|---|---|
| **Pre-order** | Parent → children | Document order, `querySelectorAll`, rendering HTML to a string |
| **Post-order** | Children → parent | Folder sizes, cleanup/unmount, evaluating expressions |
| **Level-order** | Row by row (queue) | Nearest match, level-by-level UI |

> **Fun fact:** the browser also has a built-in tree walker — `document.createTreeWalker()` — that walks the DOM in document (pre-order) order with filters. Most developers have never heard of it, but now you know what it does.

> **Two traps when walking the DOM:**
> 1. **Very deep trees.** Each recursive call uses a slot on the call stack. A tree tens of thousands of levels deep (rare in UI, but possible with generated data) throws `RangeError: Maximum call stack size exceeded`. The fix is a loop with your own stack or queue, like `levelOrder` above.
> 2. **Changing the DOM while you walk it.** `element.children` is a **live** collection — it updates as you add or remove nodes. Removing children while looping over it can skip elements. Copy it first: `[...element.children]`.

## Tree #2 in your frontend: the component tree

Whether you write React, Vue, Angular or Svelte, your app is a tree of components:

```
                 <App>
               /       \
        <Header>        <Page>
           |           /      \
        <Nav>    <PostList>   <Sidebar>
                   /    \
             <Post>      <Post>
```

Many of the "rules" of component frameworks are really just tree rules:

- **Props flow down** — data passes from a parent to its children, one edge at a time.
- **Events flow up** — a child calls a callback to tell its parent something happened.
- **"Prop drilling"** — passing data from `App` to `Post` means passing it through every node on the path: `App → Page → PostList → Post`. The pain grows with **depth**.
- **Context / provide-inject** — a component can read a value from its nearest **ancestor** that provides it, skipping the nodes in between. It's `closest()` for data.
- **Re-rendering a subtree** — in React, when a component re-renders, its children re-render by default too. Re-rendering `<Page>` affects its whole **subtree** (`PostList`, `Post`, `Post`, `Sidebar`) but not its sibling `<Header>`. This is why "where you put state" matters: state placed high in the tree causes bigger subtrees to re-render.

### Recursive components: when your data is a tree

Sometimes the data itself is a tree — nested comments, a file explorer, a multi-level menu. You don't know how deep it goes. Five levels? Fifty?

Remember the recursive definition from Part 1: *a tree is a node whose children are trees.* So a component for a tree is a component whose children are... the same component.

```jsx
function Comment({ comment }) {
  return (
    <div className="comment">
      <p>{comment.text}</p>

      {comment.replies.length > 0 && (
        <div className="replies">
          {comment.replies.map((reply) => (
            <Comment key={reply.id} comment={reply} />  // ← itself!
          ))}
        </div>
      )}
    </div>
  );
}
```

Compare this with `countNodes` from Part 1. Same shape: handle "me," then repeat the same thing for each child. The base case is a comment with no replies — it simply doesn't render the `replies` block.

This is how Reddit-style threads, folder trees in VS Code, and nested navigation menus are built.

## Your turn

Take the component tree above. Every component has a `useEffect` that logs its name:

```jsx
useEffect(() => console.log('Post'), []);
```

**Challenge:** in what order do the logs appear when the app first mounts? (Treat the two posts as `Post A` and `Post B`.)

<details>
<summary>Show the answer</summary>

React runs effects **children first, then parent** — a post-order walk:

```
Nav → Header → Post A → Post B → PostList → Sidebar → Page → App
```

`App` is always last: by the time the root's effect runs, the whole tree below it is already on the screen. That's why it's safe for a parent's effect to measure or focus a child's DOM node.

</details>

## Recap

- The DOM and your component tree are both trees — `contains`, `closest`, event bubbling, props, context and re-renders are all tree operations.
- **Pre-order** (me, then children) = document order.
- **Post-order** (children, then me) = cleanup, sizes, `useEffect` order.
- **Level-order** (row by row, with a queue) = nearest match.
- Tree-shaped data → **recursive component**.

## Next up

Here's a question that sounds too simple to ask: how does JavaScript know that `2 + 3 * 5 - 3` is **14** and not **22**? The answer is a tree you've never seen but use every single day — and by the end of Part 3, you'll have built a working calculator from it in about 50 lines.

👉 **[Part 3 — Your code is a tree: how JavaScript reads `2 + 3 * 5`](/posts/algorithms/tree/part-3-your-code-is-a-tree/)**
