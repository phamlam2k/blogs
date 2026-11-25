---
title: 'Images on the Web, Part 2: Responsive Images with srcset, sizes and <picture>'
description: 'One image file cannot fit every screen. Learn how srcset and sizes let the browser pick the right file, how it does the math, and when you need <picture> instead.'
pubDate: 2026-11-25
topic: frontend
tags: [images, performance, html, responsive-design, nextjs]
series: 'Images on the Web'
seriesOrder: 2
---

> **Series: Images on the Web — Part 2 of 4**
> ← [Part 1 — What an image really costs](/posts/frontend/images/part-1-what-an-image-really-costs/) · [Part 3 — Background images and loading strategy](/posts/frontend/images/part-3-background-images-and-loading/) →

**In this part (≈ 10 min):**

- Device pixel ratio: why "400px" isn't 400 pixels
- `srcset` with `x` descriptors — for fixed-size images
- `srcset` with `w` descriptors + `sizes` — for fluid images (and the math the browser does)
- `<picture>` — for new formats and different crops
- A decision table: which tool for which job

**Quick recap of Part 1:** every image costs bytes, memory (width × height × 4) and layout. Rule #1: **never send more pixels than the screen can show.** Today we learn how to follow that rule on every screen at once.

---

## The problem: one file, many screens

Your card image is shown:

- 343px wide on a phone,
- 720px wide on a tablet,
- 400px wide in a 3-column grid on a laptop.

And those phones and laptops have different **device pixel ratios (DPR)**. A modern phone typically has a DPR of 2 or 3, meaning one CSS pixel is drawn with 2×2 or 3×3 physical pixels. To look sharp, a 343px-wide image on a 3× phone needs about **1029** real pixels.

So the "right" file width ranges from about 400 to over 1400 pixels, depending on the device. Ship one 1400px file and phones on slow networks pay for pixels they could have skipped. Ship one 400px file and it looks blurry on every high-density screen.

The answer: give the browser **several files** and let it choose.

> You can check your own DPR: type `window.devicePixelRatio` in the DevTools console.

## Fixed-size images: `srcset` with `x` descriptors

If an image is always displayed at the same CSS size — an avatar, a logo, an icon — you only need to handle pixel density:

```html
<img
  src="avatar-64.jpg"
  srcset="avatar-64.jpg 1x, avatar-128.jpg 2x, avatar-192.jpg 3x"
  width="64"
  height="64"
  alt="User avatar"
/>
```

Read it as: *"On a 1× screen use the 64px file, on 2× use the 128px file, on 3× use the 192px file."* The `src` is the fallback for browsers that don't understand `srcset` (today, basically none — but keep it).

Keep `x` descriptors in mind for Part 4: when you don't tell Next.js `<Image>` how wide an image will be on screen, it assumes a fixed size and generates exactly this kind of `1x`/`2x` list.

## Fluid images: `srcset` with `w` descriptors + `sizes`

Most content images are **fluid**: their width depends on the viewport. Here `x` descriptors aren't enough — you need to describe *the files* and *the layout*, and let the browser do the math.

```html
<img
  src="card-800.jpg"
  srcset="card-400.jpg 400w,
          card-800.jpg 800w,
          card-1200.jpg 1200w,
          card-1600.jpg 1600w"
  sizes="(min-width: 1024px) 400px,
         (min-width: 640px) 50vw,
         100vw"
  width="1600"
  height="1067"
  alt="..."
/>
```

Two attributes, two jobs:

- **`srcset`** says what files exist: *"`card-400.jpg` is 400 pixels wide, `card-800.jpg` is 800 pixels wide..."* The `w` is the file's real pixel width.
- **`sizes`** says how wide the image will be **displayed**, in CSS pixels: *"on screens ≥ 1024px it's 400px; on screens ≥ 640px it's half the viewport; otherwise it's the full viewport width."* The first matching condition wins, so order matters.

### The math the browser does

The browser combines both to pick a file:

1. Find the first `sizes` condition that matches → the **slot width** in CSS pixels.
2. Multiply by the device pixel ratio → the **pixels needed**.
3. Pick a file from `srcset` that is at least that wide (typically the smallest one that is).

![Diagram: on a phone with a 390px viewport and DPR 3, step one matches sizes to a 390px slot, step two multiplies by 3 to get 1170 pixels needed, step three picks card-1200.jpg; 400w and 800w are too small and 1600w is more than needed. Without sizes the browser assumes 100vw and downloads the biggest file.](/images/posts/images-series/03-srcset-selection.svg)
*The three steps for one device. The table below runs the same math for four devices.*

Let's run it:

| Device | Viewport | DPR | Slot width | Pixels needed | Picks |
|---|---|---|---|---|---|
| Phone | 390px | 3 | 100vw = 390px | 1170 | `card-1200.jpg` |
| Tablet | 768px | 2 | 50vw = 384px | 768 | `card-800.jpg` |
| Laptop | 1440px | 2 | 400px | 800 | `card-800.jpg` |
| Old monitor | 1280px | 1 | 400px | 400 | `card-400.jpg` |

Four devices, three different files, each one "just enough." The 1× monitor downloads about **1/16th** of the pixels of the largest file (a quarter of the width, a quarter of the height).

> **The browser has the final say.** The spec lets browsers adjust the choice — for example, picking a smaller file when the user has data saving enabled, or reusing a larger file that's already in the cache. Treat `srcset` as a menu, not an order.

### "Why do I have to write `sizes`? The browser knows the layout!"

Actually, it doesn't — not yet. Browsers start downloading images **very early**, using a fast "preload scanner" that reads the raw HTML before CSS is downloaded and before layout happens. At that moment, the browser has no idea your card is in a 3-column grid. `sizes` is you telling it in advance.

And if you leave `sizes` out? The browser assumes **`100vw`** — the image is as wide as the whole screen. On a 1440px laptop with DPR 2, that's **2880 pixels needed** for a card that's only 400px wide. It'll pick your biggest file every time.

> **Rule #2:** with `w` descriptors, **always** write `sizes`. A missing `sizes` silently turns your responsive image into "always download the biggest one."

This single rule is the #1 performance mistake with Next.js `<Image fill>` too — we'll see why in Part 4.

### `sizes` doesn't need to be perfect

`sizes` is a hint, not a pixel-perfect layout. Being roughly right (within ~10–20%) is enough, because `srcset` files are usually spaced far apart anyway. Write the main breakpoints of your layout and move on. You can use `calc()` too:

```html
sizes="(min-width: 1280px) calc((1280px - 2 * 32px) / 3), (min-width: 640px) 50vw, 100vw"
```

> **Newer option:** for images with `loading="lazy"`, you can write `sizes="auto"` (or `sizes="auto, 100vw"` as a fallback) and Chromium-based browsers will use the real layout width — lazy images load after layout, so the browser *does* know the size by then. Other browsers ignore `auto` and use the fallback.

## `<picture>`: when choosing by width isn't enough

`srcset` lets the browser choose between **sizes of the same image**. Two situations need more control — that's what `<picture>` is for.

### Use case 1: serving new formats with a fallback

You want AVIF for browsers that support it, WebP for others, and JPEG as the safety net:

```html
<picture>
  <source type="image/avif" srcset="photo-800.avif 800w, photo-1600.avif 1600w" sizes="100vw" />
  <source type="image/webp" srcset="photo-800.webp 800w, photo-1600.webp 1600w" sizes="100vw" />
  <img src="photo-800.jpg" srcset="photo-800.jpg 800w, photo-1600.jpg 1600w" sizes="100vw"
       width="1600" height="1067" alt="..." />
</picture>
```

The browser walks the `<source>` elements **top to bottom** and uses the **first one** it can handle. A browser without AVIF support skips the first `<source>` because of its `type`. Order from best to most compatible.

![Diagram: the browser reads the picture element. If it can show AVIF it uses photo.avif; if not, it checks WebP and uses photo.webp; otherwise it falls back to the img with photo.jpg. The first usable source wins, and the img is required.](/images/posts/images-series/04-picture-selection.svg)
*How the browser walks a `<picture>`: first usable `<source>` wins, `<img>` is the safety net.*

### Use case 2: art direction (a different crop)

A wide landscape hero looks great on desktop. On a narrow phone, the same photo shrinks until the person in it is a tiny dot. What you want is a **different image** — a tighter, portrait crop:

```html
<picture>
  <source media="(min-width: 768px)" srcset="hero-wide-1600.jpg 1600w, hero-wide-2400.jpg 2400w"
          sizes="100vw" width="2400" height="1000" />
  <img src="hero-tall-800.jpg" srcset="hero-tall-800.jpg 800w, hero-tall-1200.jpg 1200w"
       sizes="100vw" width="1200" height="1500" alt="Team photo at the office" />
</picture>
```

The difference from `srcset` is important:

- With **`srcset`**, the browser *may* choose. It's a suggestion.
- With **`<source media>`**, the first matching source is *required*. It's a command.

So use `media` when the choice is about **content** (what the user sees), and `srcset`/`sizes` when the choice is about **resolution** (how many pixels).

Note the `width` and `height` on the `<source>`: since the two crops have different aspect ratios, each source carries its own dimensions so the browser reserves the right space — no layout shift on either screen size.

### Things people get wrong with `<picture>`

- **The `<img>` is required.** `<picture>` is just a wrapper; the `<img>` is what actually renders. Without it, nothing shows.
- **Style the `<img>`, not the `<picture>`.** CSS like `width`, `object-fit` and `border-radius` belongs on the `<img>`.
- **`alt`, `loading`, `decoding` and `fetchpriority` go on the `<img>`** — they apply whichever source wins.

## A third way: let the server choose the format

Instead of listing formats in `<picture>`, a server can look at the request. When a browser asks for an image, it sends an **`Accept`** header listing formats it supports, e.g. `image/avif,image/webp,image/*`. The server can then reply with AVIF to one browser and JPEG to another — **from the same URL**.

This is called **content negotiation**. Image CDNs (Cloudinary, imgix, Cloudflare Images...) work this way — and so does Next.js's `/_next/image` endpoint. That's why Next.js can give you modern formats from a plain `<img>`, no `<picture>` needed. (The server must also send `Vary: Accept` so caches don't serve an AVIF to a browser that asked for JPEG.)

## Which tool for which job?

| Situation | Use |
|---|---|
| Image always shown at the same CSS size (avatar, logo) | `srcset` with **`x`** descriptors |
| Image width changes with the layout | `srcset` with **`w`** descriptors **+ `sizes`** |
| Different crop / different image per screen size | `<picture>` + `<source media>` |
| New formats, and the server can't negotiate | `<picture>` + `<source type>` |
| New formats, and you have an image CDN / Next.js | Plain `<img srcset>` — let the server negotiate |

## Your turn

You have this image:

```html
<img
  srcset="a-480.jpg 480w, a-960.jpg 960w, a-1440.jpg 1440w, a-1920.jpg 1920w"
  sizes="(min-width: 1200px) 600px, (min-width: 700px) 80vw, 100vw"
  src="a-960.jpg" width="1920" height="1280" alt="..."
/>
```

**Challenge:** which file does each device pick?

1. A 1920px desktop monitor, DPR 1
2. An 820px tablet, DPR 2
3. A 360px phone, DPR 3
4. The same 1920px monitor — but someone deleted the `sizes` attribute

<details>
<summary>Show the answer</summary>

1. Slot = **600px** (first condition matches). × 1 = 600 → **`a-960.jpg`**
2. Slot = 80vw = **656px**. × 2 = 1312 → **`a-1440.jpg`**
3. Slot = 100vw = **360px**. × 3 = 1080 → **`a-1440.jpg`**
4. No `sizes` → browser assumes 100vw = **1920px**. × 1 = 1920 → **`a-1920.jpg`** — about 3.6× the pixels of answer 1, for the exact same 600px-wide box on screen.

Answer 4 is the whole reason Rule #2 exists.

</details>

You can verify the browser's choice on any page: select the image in the Elements panel, then type `$0.currentSrc` in the console.

## Recap

- **DPR** means a 400px slot may need 800–1200 real pixels.
- **`x` descriptors** for fixed-size images; **`w` descriptors + `sizes`** for fluid ones.
- Browser math: **slot width (from `sizes`) × DPR → smallest file that's big enough.**
- No `sizes` = **`100vw`** = the biggest file, almost every time.
- **`<picture>`**: `type` for formats, `media` for art direction. The `<img>` inside is required and gets the styles and attributes.
- Servers can pick the format via the **`Accept`** header — that's what image CDNs and Next.js do.

## Next up

We now know *which* file to download. But there are two more questions: **when** should it download, and what about images that live in CSS — `background-image` — where none of today's tricks work? In Part 3 we'll fix background images, learn about lazy loading, `fetchpriority` and preloading, and write the "perfect `<img>` tag."

👉 **[Part 3 — Background images and loading strategy](/posts/frontend/images/part-3-background-images-and-loading/)**
