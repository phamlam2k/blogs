---
title: "Trees, Part 3: Your Code Is a Tree — How JavaScript Reads 2 + 3 * 5"
description: "Before running a single line, JavaScript turns your code into a tree. See the real AST, build a working calculator in ~50 lines, peek at V8's bytecode, and discover why Babel, ESLint and Prettier are all tree tools."
pubDate: 2026-11-23
topic: algorithms
tags: ["algorithms", "data-structures", "trees", "frontend", "javascript", "ast"]
series: "Algorithms Hiding in Your Frontend"
seriesOrder: 3
---

> **Series: Algorithms Hiding in Your Frontend — Trees, Part 3 of 3**
> ← [Part 1 — What is a tree?](/posts/algorithms/tree/part-1-what-is-a-tree/) · [Part 2 — The DOM and your component tree](/posts/algorithms/tree/part-2-dom-and-components/)

**In this part (≈ 10 min):**

- The tree JavaScript builds from your code: the **AST**
- Build a real calculator in ~50 lines (paste it in your console!)
- What V8 actually does with the tree
- Why Babel, TypeScript, ESLint, Prettier and Vite are all "tree tools"

**Quick recap:** in Part 1 we learned that _a tree is made of trees_, so tree problems are solved with recursion. In Part 2 we learned three ways to walk a tree — and that **post-order** (children first, then parent) is what you use when a parent needs its children's results. Hold on to that one: it's the star of this part.

---

## A question that seems too simple

```js
const result = 2 + 3 * 5 - 3;
```

How does JavaScript know the answer is **14**?

If the engine just calculated left to right, it would get:
`2 + 3 = 5` → `5 * 5 = 25` → `25 - 3 = 22`. Wrong!

The problem is that text is flat, but math has **priority**: `*` must happen before `+`. The engine needs a way to record *what happens first*. And as you might guess by now — it builds a tree.

## The Abstract Syntax Tree (AST)

Before running your code, the JavaScript engine **parses** it into an **Abstract Syntax Tree**. For our expression:

```
              (-)
             /   \
          (+)     3
         /   \
        2    (*)
            /   \
           3     5
```

How did the parser decide this shape?

- `*` has higher priority, so `3 * 5` becomes a small subtree at the **bottom**.
- `+` and `-` have equal priority and are grouped left to right, so `2 + (3 * 5)` happens first and `- 3` comes **last**. That's why `-` is the root.

The rule to remember: **the deeper an operation sits, the earlier it runs.** The tree is the same as writing `((2 + (3 * 5)) - 3)` with all the parentheses.

You don't have to take my word for it. Here's the real output from **Acorn**, a JavaScript parser (simplified):

```json
{
  "type": "BinaryExpression",
  "operator": "-",
  "left": {
    "type": "BinaryExpression",
    "operator": "+",
    "left":  { "type": "Literal", "value": 2 },
    "right": {
      "type": "BinaryExpression",
      "operator": "*",
      "left":  { "type": "Literal", "value": 3 },
      "right": { "type": "Literal", "value": 5 }
    }
  },
  "right": { "type": "Literal", "value": 3 }
}
```

Exactly the tree we drew: `-` at the root, `+` below it, `*` at the bottom.

> **Try it yourself:** go to [astexplorer.net](https://astexplorer.net), paste any JavaScript, and click around. Each node in the tree highlights the matching code. It's one of the best ways to "see" how a parser thinks.

### Calculating the answer: post-order traversal

To calculate the value of a node like `(+)`, you first need the values of its children. Children first, then parent — that's **post-order traversal** from Part 2:

1. `3 * 5` → **15**
2. `2 + 15` → **17**
3. `17 - 3` → **14** ✅

## Build it yourself: a tiny calculator in ~50 lines

Let's make this real. Here is a complete calculator that turns text into a tree, then walks the tree to get the answer. You can paste it into your browser console.

### Step 1 — Break the text into tokens

```js
function tokenize(src) {
  return src.match(/\d+(\.\d+)?|[+\-*/()]/g);
}

tokenize('2 + 3 * 5 - 3'); // ['2', '+', '3', '*', '5', '-', '3']
```

### Step 2 — Build the tree, respecting priority

The trick is to split the work into levels, from lowest priority to highest:

- An **expression** is terms joined by `+` or `-`
- A **term** is factors joined by `*` or `/`
- A **factor** is a number, or an expression in parentheses

Because `term()` is called *inside* `expression()`, multiplication gets grouped first and ends up deeper in the tree — exactly the rule we found above.

```js
function parse(tokens) {
  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++];

  // expression := term (('+' | '-') term)*
  function expression() {
    let node = term();
    while (peek() === '+' || peek() === '-') {
      const op = next();
      node = { op, left: node, right: term() };
    }
    return node;
  }

  // term := factor (('*' | '/') factor)*
  function term() {
    let node = factor();
    while (peek() === '*' || peek() === '/') {
      const op = next();
      node = { op, left: node, right: factor() };
    }
    return node;
  }

  // factor := number | '(' expression ')'
  function factor() {
    const t = next();
    if (t === '(') {
      const node = expression();
      next(); // skip ')'
      return node;
    }
    return { value: Number(t) };
  }

  return expression();
}
```

### Step 3 — Walk the tree in post-order

```js
function evaluate(node) {
  if ('value' in node) return node.value;   // leaf: just a number

  const left = evaluate(node.left);         // 1. left subtree
  const right = evaluate(node.right);       // 2. right subtree

  switch (node.op) {                        // 3. then this node
    case '+': return left + right;
    case '-': return left - right;
    case '*': return left * right;
    case '/': return left / right;
  }
}

evaluate(parse(tokenize('2 + 3 * 5 - 3')));   // 14
evaluate(parse(tokenize('(2 + 3) * 5 - 3'))); // 22
```

Look at `evaluate` one more time. "If I'm a leaf, return my value. Otherwise, solve my children, then combine." It's the same recursive pattern as `countNodes` and `height` from Part 1 — and as the `<Comment>` component from Part 2. One idea, three completely different places.

## What the real engine does

Real engines like V8 (Chrome, Node.js) go one step further. They don't walk the tree every time your code runs; they use the tree **once** to produce a list of low-level instructions called **bytecode**.

For a function with variables:

```js
function calc(a, b, c, d) {
  return a + b * c - d;
}
```

V8 generates this bytecode (you can see it yourself with `node --print-bytecode`):

```
Ldar  c        ← load c
Mul   b        ← b * c
Add   a        ← a + (b*c)
Star0          ← save result in register r0
Ldar  d        ← load d
Sub   r0       ← r0 - d
Return
```

The order — multiply, then add, then subtract — is the post-order walk of the tree, flattened into a list.

And for our original expression with only numbers? V8 is even smarter:

```js
function k() {
  return 2 + 3 * 5 - 3;
}
```

```
LdaSmi [14]    ← just load the number 14
Return
```

Since everything is a constant, the engine calculates the tree **while reading your code** and replaces it with `14`. This is called **constant folding**. The calculation never happens at runtime.

## Your tools are tree tools

Once you know about ASTs, you'll notice that many of the tools in your `package.json` follow the same three steps — **parse → work on the tree → print**:

| Tool | What it does with the tree |
|---|---|
| **Babel** | Parses modern JS, **transforms** nodes (e.g. JSX → function calls), prints older JS |
| **TypeScript** | Parses, **checks** types on each node, removes type nodes, prints JS |
| **ESLint** | Parses, **visits** nodes looking for patterns that break rules |
| **Prettier** | Parses, throws away your formatting, **prints** the tree in its own style |
| **Vite / esbuild / SWC** | Parse, find `import` nodes to build the dependency graph, transform, bundle |

So every time Prettier reformats your code on save, it's turning your file into a tree and printing it back out.

## Your turn

**Challenge:** draw the AST for `(2 + 3) * 5 - 3`. Which operator is the root? Which one is deepest?

<details>
<summary>Show the answer</summary>

```
              (-)
             /   \
          (*)     3
         /   \
       (+)    5
      /   \
     2     3
```

The parentheses force `2 + 3` to the **bottom** (it runs first), `*` is in the middle, and `-` is still the root because it runs last. Post-order: `2 + 3 = 5` → `5 * 5 = 25` → `25 - 3 = 22`. That matches what our calculator returned.

</details>

---

## The whole Trees mini-series on one page

| Concept | One-line summary |
|---|---|
| **Tree** | Nodes connected without cycles; every node except the root has exactly one parent |
| **Edges** | A tree with *n* nodes has *n − 1* edges |
| **Recursive definition** | A tree is a node whose children are trees → solve with recursion |
| **Pre-order** | Me, then my children → document order |
| **Post-order** | My children, then me → evaluating, cleanup, sizes |
| **Level-order** | Row by row, using a queue → nearest match |
| **DOM** | The browser's tree of your HTML |
| **Component tree** | Props down, events up, context from ancestors, re-renders by subtree |
| **AST** | Your code as a tree; the deeper an operation, the earlier it runs |

## Practice

**LeetCode (algorithm practice):**

- [104. Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/) — it's our `height()` function from Part 1
- [226. Invert Binary Tree](https://leetcode.com/problems/invert-binary-tree/) — the famous one
- [102. Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/) — BFS with a queue, from Part 2
- [100. Same Tree](https://leetcode.com/problems/same-tree/) — the first step toward understanding how React compares trees

**Front-end challenges:**

1. **Write your own `getElementsByClassName`** without using any built-in query methods — just `children` and recursion.
2. **Build a nested comments component** from a JSON tree, with collapse/expand for each thread.
3. **Extend the calculator** from this part to support negative numbers (`-5 + 3`) and the `%` operator. Hint: think about which level of the parser each one belongs to.
4. **Paste a React component into [astexplorer.net](https://astexplorer.net)** (choose the `@babel/parser`), find the `JSXElement` nodes, and see how JSX looks as a tree.

## What's next

That's it for trees! Next in the series, we'll look at the **Stack** — the data structure behind your browser's Back button, undo/redo in every editor, and the bracket matching in VS Code. (Spoiler: the Back and Forward buttons are two stacks working together.)

See you there. 🌳
