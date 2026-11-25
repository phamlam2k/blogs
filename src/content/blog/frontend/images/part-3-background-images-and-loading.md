---
title: 'Images on the Web, Part 3: Background Images and Loading Strategy'
description: "Why CSS background images are a performance trap, how to fix them with image-set() and preload, and how lazy loading, fetchpriority, decoding and placeholders decide *when* your images show up."
pubDate: 2026-11-25
topic: frontend
tags: [images, performance, css, html, web-vitals, nextjs]
series: 'Images on the Web'
seriesOrder: 3
---

> **Series: Images on the Web — Part 3 of 4**
> ← [Part 2 — Responsive images](/posts/frontend/images/part-2-responsive-images/) · [Part 4 — Next.js `<Image>`, demystified](/posts/frontend/images/part-4-nextjs-image/) →

**In this part (≈ 10 min):**

- Why `background-image` is often the slowest image on your page — and three ways to fix it
- `image-set()`: responsive images in CSS
- Lazy loading: when it helps, and when it destroys your LCP
- `fetchpriority`, `<link rel="preload">` and `decoding`
- Placeholders and caching
- The "perfect `<img>`" — two versions to copy

**Quick recap:** Part 1 taught us the costs of an image (bytes, memory, layout). Part 2 taught us how to pick the **right file** with `srcset`, `sizes` and `<picture>`. Now: what about images in CSS, and **when** should each image load?

---

## Background images: the hidden trap

`background-image` is great for decoration: textures, gradients, patterns. But developers often use it for **content** — the big hero photo at the top of a landing page:

```css
.hero {
  background-image: url('/hero.jpg');
  background-size: cover;
  background-position: center;
  min-height: 70vh;
}
```

It looks identical to an `<img>`. Under the hood, it's very different.

### Problem 1: the browser discovers it late

Remember the **preload scanner** from Part 2? It reads raw HTML and starts fetching `<img>` files immediately. But a background image lives in CSS, so the browser must:

1. Download the HTML,
2. Find and download the CSS file,
3. Parse the CSS,
4. Match the `.hero` rule to an element in the page,
5. **Only then** start downloading `hero.jpg`.

That's a waterfall of extra round-trips before the most important image on the page even *starts*:

![Timeline diagram: with an img in the HTML, hero.jpg starts downloading right after the HTML starts, in parallel with the CSS, so LCP happens early. With a CSS background-image, the browser downloads HTML, then CSS, then parses and matches the .hero rule, and only then starts hero.jpg — LCP happens much later.](/images/posts/images-series/05-discovery-waterfall.svg)
*Simplified timeline. Same image, same server — the only difference is where the image is declared.*

And yes — a background image can be your **LCP element**, so this delay goes straight into your Core Web Vitals.

### Problem 2: no `srcset`, no `sizes`

Everything from Part 2 is unavailable. One URL, every screen.

### Problem 3: no `alt`, no lazy loading

Screen readers can't describe a background image, and there's no `loading="lazy"` for CSS backgrounds.

### Fix #1: use an `<img>` that *behaves* like a background

For content images, this is the best fix. `object-fit: cover` does for `<img>` what `background-size: cover` does for backgrounds:

```html
<section class="hero">
  <img
    class="hero-bg"
    src="hero-1600.jpg"
    srcset="hero-800.jpg 800w, hero-1600.jpg 1600w, hero-2400.jpg 2400w"
    sizes="100vw"
    width="2400"
    height="1350"
    alt="Our team hiking at sunrise"
    fetchpriority="high"
  />
  <h1>Build things that last</h1>
</section>
```

```css
.hero {
  position: relative;
  min-height: 70vh;
}
.hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;        /* = background-size: cover */
  object-position: center;  /* = background-position: center */
  z-index: -1;
}
```

Now the image is in the HTML (discovered immediately), responsive (`srcset` + `sizes`), accessible (`alt`) and prioritized (`fetchpriority`). Keep this pattern in mind — it's **exactly** what Next.js `<Image fill>` produces in Part 4.

### Fix #2: `image-set()` — responsive backgrounds in CSS

If it really must stay in CSS (purely decorative, or you don't control the HTML), use `image-set()`. It's the CSS cousin of `srcset`, and can choose by **resolution** and by **format**:

```css
.hero {
  /* fallback for old browsers */
  background-image: url('/hero.jpg');
  background-image: image-set(
    url('/hero.avif') type('image/avif'),
    url('/hero.webp') type('image/webp'),
    url('/hero.jpg') type('image/jpeg')
  );
}

.avatar {
  background-image: image-set(
    url('/avatar-64.jpg') 1x,
    url('/avatar-128.jpg') 2x
  );
}
```

The limitation: `image-set()` only understands `x` (density) and `type()` — there's no `w` descriptor and no `sizes`. For different widths, combine it with media queries:

```css
.hero { background-image: url('/hero-800.jpg'); }

@media (min-width: 800px) {
  .hero { background-image: url('/hero-1600.jpg'); }
}
```

### Fix #3: preload it

If an important background image must stay in CSS, tell the browser about it from the HTML so it doesn't wait for the CSS:

```html
<link
  rel="preload"
  as="image"
  href="/hero-1600.jpg"
  imagesrcset="/hero-800.jpg 800w, /hero-1600.jpg 1600w"
  imagesizes="100vw"
  fetchpriority="high"
/>
```

`imagesrcset` and `imagesizes` are `srcset` and `sizes` for preloads — so the preloaded file matches the one the page will actually use. **Careful:** if your CSS media queries and your preload choose *different* files, the browser downloads both. Keep them in sync.

## When should an image load?

Not every image is equally important. The hero image decides your LCP; the 40th product in a grid might never be seen. Browsers give you several tools to express this.

### `loading="lazy"`: wait until it's needed

```html
<img src="product.jpg" loading="lazy" width="400" height="400" alt="..." />
```

The browser delays the download until the image is **near** the viewport. "Near" is generous: Chromium-based browsers start loading lazy images well before they scroll into view (on the order of a thousand-plus pixels ahead, more on slow connections), so users rarely see an empty box.

This saves bandwidth, memory and CPU for images the user may never scroll to.

But here's the trap:

> **Never lazy-load your LCP image.** A lazy image isn't fetched until the browser has done layout and confirmed it's near the viewport. For an image that's *already* in the viewport, that's pure delay — it can push your LCP back noticeably.

Lazy loading is for **below-the-fold** images. Above the fold, leave the default (`loading="eager"`).

A heads-up for Part 4: Next.js `<Image>` sets `loading="lazy"` **by default**. That's a great default for most images — and exactly wrong for your hero. We'll see how to handle it there.

### `fetchpriority="high"`: this one first

Browsers assign each request a priority. Images usually start at a low priority, because the browser doesn't know which ones will be visible until layout happens. You can tell it upfront:

```html
<img src="hero.jpg" fetchpriority="high" alt="..." />
```

Use it on **one image** — the LCP candidate. Marking everything as high priority means nothing is high priority; you'll just make the images compete with each other and with your CSS and fonts.

You can also do the opposite: `fetchpriority="low"` for an image that's visible but unimportant — for example, the 2nd–5th slides of a carousel that are in the DOM but hidden.

### `<link rel="preload">`: start before you'd even know

`fetchpriority` helps an image that's already in the HTML. `preload` helps an image the browser **can't see yet**:

- background images in CSS (Fix #3 above),
- images rendered by client-side JavaScript (an SPA that renders the hero only after the JS bundle runs),
- images whose URL is computed at runtime.

If your LCP image is a normal `<img>` in server-rendered HTML, you usually don't need `preload` — `fetchpriority="high"` on the `<img>` is enough.

### `decoding="async"`: don't block on decoding

From Part 1: decoding a big image takes real CPU time. `decoding="async"` hints that the browser can decode the image without holding up the rendering of other content. It's a small, safe win for most images — Next.js sets it by default.

### Summary: loading attributes

Ask two questions about every image:

![Decision tree: is it the LCP image? If yes and it is in the server-rendered HTML, use img with fetchpriority high and never lazy; if it comes from CSS or JS, use a link rel preload with fetchpriority high. If it is not the LCP image and is visible without scrolling, keep loading eager (the default); otherwise use loading lazy.](/images/posts/images-series/06-loading-decision.svg)
*Two questions decide how almost every image should load.*

The same rules as a table:

| Image | `loading` | `fetchpriority` | Preload? |
|---|---|---|---|
| **LCP / hero** (in the HTML) | `eager` (default) | `high` | Usually not needed |
| **LCP / hero** (in CSS or rendered by JS) | — | `high` (on the preload) | **Yes** |
| Other above-the-fold images | `eager` | default | No |
| Below the fold | **`lazy`** | default | No |
| Visible but unimportant (hidden carousel slides) | `eager` | `low` | No |

## Placeholders: what users see while waiting

Even with perfect priorities, images take time. What should the empty box look like?

1. **Nothing** (transparent) — simplest. Fine for small images.
2. **A solid color** — the image's dominant color as a `background-color`. Costs zero bytes and looks intentional.
3. **A blurred preview (LQIP — "low-quality image placeholder")** — a tiny (~10px wide) version of the image, inlined as a base64 data URL and blurred with CSS. The page feels loaded immediately, and the sharp image "develops" in.

```html
<img
  src="photo.jpg"
  width="1200"
  height="800"
  alt="..."
  style="background: url('data:image/jpeg;base64,/9j/4AAQ...') center / cover"
/>
```

Keep inline placeholders **tiny** — a few hundred bytes. A 20 KB base64 placeholder in every card makes your HTML heavier and delays everything.

This is the trick behind Next.js `placeholder="blur"`, which generates that tiny preview automatically for imported images.

## Delivering images: caching and CDNs

Two last pieces of the puzzle are about the server, not the HTML.

**Caching.** Give image files content-hashed names (`hero.3f9a1c.jpg`) and serve them with:

```
Cache-Control: public, max-age=31536000, immutable
```

The file at that URL never changes, so browsers and CDNs can keep it for a year. When the image changes, the hash — and therefore the URL — changes. Bundlers (and Next.js, for imported images) do the hashing for you.

**Image CDNs.** Producing 4 widths × 3 formats for every image by hand is painful. Image CDNs do it on demand from URL parameters:

```
https://images.example.com/hero.jpg?w=800&q=75
```

The CDN resizes, compresses, negotiates the format via the `Accept` header (Part 2), and caches the result. Look at that URL again — `?w=800&q=75`. If you've ever opened the Network tab on a Next.js site, you've seen URLs like `/_next/image?url=...&w=1200&q=75`. Same idea. **Next.js ships a small image CDN inside your app** — and that's where Part 4 begins.

## The perfect `<img>`: two versions to copy

**The LCP image** (hero, product photo, article cover):

```html
<img
  src="hero-1600.avif"
  srcset="hero-800.avif 800w, hero-1600.avif 1600w, hero-2400.avif 2400w"
  sizes="100vw"
  width="2400"
  height="1350"
  alt="Describe what the image shows"
  fetchpriority="high"
  decoding="async"
/>
```

**Every other content image:**

```html
<img
  src="card-800.avif"
  srcset="card-400.avif 400w, card-800.avif 800w, card-1200.avif 1200w"
  sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
  width="1200"
  height="800"
  alt="Describe what the image shows"
  loading="lazy"
  decoding="async"
/>
```

(Plus a `<picture>` wrapper for a JPEG fallback if you don't negotiate formats on the server.)

That's a lot to type for every image, and a lot of files to generate. Hold that thought.

## Your turn

This landing page has **five** image mistakes. Can you find them all?

```html
<!-- Top of the page: the hero (this is the LCP element) -->
<img src="/hero-4000x2667.png" loading="lazy" alt="Our new collection" />

<!-- Far below: a grid of 30 products -->
<img
  src="/p1-800.jpg"
  srcset="/p1-400.jpg 400w, /p1-800.jpg 800w, /p1-1600.jpg 1600w"
  fetchpriority="high"
  alt="Red sneakers"
/>
```

<details>
<summary>Show the answer</summary>

1. **The LCP image is lazy-loaded.** Remove `loading="lazy"` and add `fetchpriority="high"`.
2. **A PNG for a photo, at 4000px, with no `srcset`.** Use AVIF/WebP (JPEG fallback) in several widths with `sizes`.
3. **No `width`/`height` on either image** → layout shift (CLS) as they load.
4. **The product image has `w` descriptors but no `sizes`** → the browser assumes `100vw` and grabs the 1600px file for a small grid card.
5. **`fetchpriority="high"` on 30 below-the-fold products** → they compete with the real LCP image. Use `loading="lazy"` instead.

</details>

## Recap

- Content images in `background-image` are **discovered late**, have **no `srcset`**, no `alt`, no lazy loading.
- Fixes: an **`<img>` with `object-fit: cover`** (best), **`image-set()`** + media queries, or **`<link rel="preload">`** with `imagesrcset`/`imagesizes`.
- **`loading="lazy"`** below the fold — **never** on the LCP image.
- **`fetchpriority="high"`** on exactly one image: the LCP.
- **Preload** only what the browser can't discover from the HTML.
- Placeholders: solid color or a **tiny** blurred preview.
- Hashed filenames + long `Cache-Control`; image CDNs generate sizes and formats on demand.

## Next up

Look at the "perfect `<img>`" again: three widths, `sizes`, dimensions, priority, lazy loading, decoding, modern formats, a placeholder, cache headers and a CDN to produce it all. Doing that by hand for every image in a real app is unrealistic.

In Part 4, we'll see how Next.js `<Image>` does almost all of it from one line — how it works under the hood, how to configure it, and, just as important, **when you shouldn't use it**.

👉 **[Part 4 — Next.js `<Image>`, demystified](/posts/frontend/images/part-4-nextjs-image/)**
