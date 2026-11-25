---
title: 'Images on the Web, Part 1: What an Image Really Costs'
description: "<img> is one line of HTML, yet images are often the heaviest part of a page. Learn the three hidden costs of every image — bytes, memory and layout — and how to pick the right format."
pubDate: 2026-11-25
topic: frontend
tags: [images, performance, html, web-vitals]
series: 'Images on the Web'
seriesOrder: 1
---

> **Series: Images on the Web — Part 1 of 4**
> Images are usually the heaviest thing on a web page, yet `<img>` is the tag we think about least. This series starts with how images really work in the browser — costs, formats, responsive images, background images and loading — and ends, in Part 4, with Next.js `<Image>`: what it automates, why, and when you should *not* use it.

**In this part (≈ 8 min):**

- Why "just an `<img>` tag" is never just a tag
- The three costs of every image: **bytes**, **memory** and **layout**
- JPEG, PNG, WebP, AVIF, SVG, GIF: which one, when
- Why images decide your Core Web Vitals

**Coming up:** [Part 2 — Responsive images: `srcset`, `sizes`, `<picture>`](/posts/frontend/images/part-2-responsive-images/) · [Part 3 — Background images and loading strategy](/posts/frontend/images/part-3-background-images-and-loading/) · [Part 4 — Next.js `<Image>`, demystified](/posts/frontend/images/part-4-nextjs-image/)

---

## It's just an `<img>` tag... right?

```html
<img src="photo.jpg" alt="Mountains at sunrise" />
```

One line. Probably one of the first HTML tags you ever learned. You drop a photo into the project, point `src` at it, and it shows up. Done.

Now picture what really happens. The photo came straight from a phone camera: 4000 pixels wide, 3 MB. On the page it sits in a card 400 pixels wide. A visitor opens the page on a mid-range phone over 4G. Then:

- the phone downloads all 3 MB — most of it pixels nobody will ever see,
- it unpacks the photo into memory, where it takes far more space than 3 MB,
- and while all that happens, the text below the photo jumps down the moment it finally appears.

Nothing is "broken." No error in the console. The page just feels slow, heavy and jumpy — and the image is the reason.

That's the thing about images: they are usually the **largest part of a page's weight**, and very often the element that decides how fast the page *feels*. Yet the tag looks so simple that we rarely think about it.

So let's start from zero: **what does an image actually cost?** Here's the whole story in one picture — the rest of this post explains each box.

![Diagram: a 4000×3000, 3 MB photo goes through three costs — the network downloads all 3 MB, memory holds about 48 MB once decoded, and the missing width/height makes text jump. Each cost has a fix: resize and use AVIF/WebP, use 1200×800 for a 2× screen, and add width and height.](/images/posts/images-series/01-image-costs.svg)
*The three hidden costs of one oversized photo — and the fix for each.*

## Cost #1: bytes over the network

An image's file size depends on two things:

1. **Its pixel dimensions** — how many pixels it has.
2. **Its compression** — the format and quality used to store those pixels.

Dimensions matter more than people expect. File size grows roughly with the **area**, not the width. Double the width and height and you have **4×** the pixels:

| Dimensions | Pixels | Relative to 800×533 |
|---|---|---|
| 800 × 533 | 0.43 MP | 1× |
| 1600 × 1067 | 1.7 MP | 4× |
| 4000 × 2667 | 10.7 MP | 25× |

The classic mistake: a photo straight from a phone or a stock site (4000px wide, several MB) displayed in a card that's 400px wide. The browser downloads every one of those pixels, then throws most of them away when it scales the image down.

> **Rule #1:** never send more pixels than the screen can show. (Part 2 is all about how to do that across different screens.)

## Cost #2: memory and decoding

Here's the cost almost nobody talks about. A JPEG on the network is compressed. To draw it, the browser must **decode** it into raw pixels — and raw pixels are big:

> **Decoded size ≈ width × height × 4 bytes** (one byte each for red, green, blue and alpha)

So that 4000 × 3000 photo:

```
4000 × 3000 × 4 = 48,000,000 bytes ≈ 48 MB of memory
```

It might be only 3 MB as a JPEG, but it takes **48 MB** once decoded. Put ten of them in a carousel on a mid-range phone and you'll see janky scrolling, slow decoding, and sometimes the tab being killed for using too much memory.

That's why "it's only 3 MB, the network is fast" is not the full story. **Oversized images cost you twice: once to download, once to decode.**

This is also why the `decoding="async"` attribute exists: it hints to the browser that it can decode the image off the main thread instead of blocking rendering of other content. We'll come back to it in Part 3.

## Cost #3: layout shift

You've seen this: you start reading an article, an image above the text finishes loading, and the whole page jumps down. You lose your place — or worse, you tap the wrong button.

Why does it happen? Before the image downloads, the browser doesn't know how tall it will be, so it reserves **0px**. When the image arrives, everything below gets pushed down.

That jump is measured by **Cumulative Layout Shift (CLS)**, one of Google's Core Web Vitals.

The fix is old-school and simple: **always give images `width` and `height` attributes.**

```html
<img src="photo.jpg" width="1200" height="800" alt="..." />
```

```css
img {
  max-width: 100%;
  height: auto;
}
```

"But my image is responsive — it's not actually 1200px wide!" That's fine. Modern browsers use the two attributes to compute an **aspect ratio** (here 3:2), not a fixed size. Internally the browser's default stylesheet does roughly this:

```css
img {
  aspect-ratio: auto attr(width) / attr(height);
}
```

So with `max-width: 100%; height: auto`, the image can be any width, and the browser still reserves the correct height **before a single byte has arrived**. No jump.

![Diagram: without width and height, the image is 0px tall while loading, then pushes the text down when it arrives. With width and height, a 3:2 box is reserved while loading, and the text stays in place when the image arrives.](/images/posts/images-series/02-layout-shift.svg)
*Same page, two loads. On the left the browser has to guess (0px); on the right it knows the aspect ratio up front.*

Remember this trick. In Part 4 you'll see a framework add these two attributes for you automatically — and now you'll know why it insists on them.

## Choosing a format

Different formats compress different kinds of pictures well. Here's a practical guide:

| Format | Best for | Notes |
|---|---|---|
| **JPEG** | Photos | Universal support, no transparency. The safe fallback. |
| **PNG** | Screenshots, UI, images needing transparency | Lossless → **huge** for photos. Don't use for photos. |
| **WebP** | Photos *and* graphics, with transparency | Usually noticeably smaller than JPEG at similar quality. Supported in every modern browser. |
| **AVIF** | Photos, especially large ones | Usually smaller than WebP at similar quality. Slower to encode, a bit slower to decode. Supported in all modern browsers. |
| **SVG** | Logos, icons, illustrations made of shapes | Vector: sharp at any size, often tiny. Not for photos. |
| **GIF** | Almost nothing today | For animation, an MP4/WebM `<video>` is typically many times smaller. |

A few practical rules:

- **Photos:** serve AVIF or WebP, with JPEG as a fallback for very old browsers.
- **Logos and icons:** SVG.
- **Screenshots with text:** PNG or lossless WebP — lossy compression makes text look smudgy.
- **Animated GIF:** replace with a muted, looping video:

```html
<video autoplay muted loop playsinline width="480" height="270">
  <source src="demo.webm" type="video/webm" />
  <source src="demo.mp4" type="video/mp4" />
</video>
```

### Quality: the free win

For lossy formats, a "quality" setting around **75–80** is usually indistinguishable from 100 to the human eye, at a fraction of the size. Going from 100 to 80 often cuts the file size by more than half.

That's why so many image tools default to a quality in this range. (Next.js `<Image>`, for example, uses 75 — more on that in Part 4.)

## Why images decide your Core Web Vitals

Google's Core Web Vitals measure real-user experience. Images touch two of the three:

- **LCP (Largest Contentful Paint)** — when the biggest thing in the viewport finishes rendering. On most pages, that "biggest thing" is an image: a hero banner, a product photo, an article cover. A slow image = a slow LCP.
- **CLS (Cumulative Layout Shift)** — how much the page jumps around. Images without dimensions are the classic cause.

So "optimizing images" is not a nice-to-have detail. For many sites, it's **the** performance work.

> **Find your LCP element:** open DevTools → **Performance** panel → reload with recording. In the timings track you'll see an **LCP** marker; click it and DevTools highlights the element. Odds are it's an image.

## Your turn

**Challenge 1:** a product page shows a 3000 × 2000 photo in a 600 × 400 box. How much memory does the decoded image take? How much would it take if the file were exactly 600 × 400? (And what about 1200 × 800, for 2× screens?)

**Challenge 2:** paste this into the DevTools console on any site to find oversized images:

```js
[...document.images]
  .filter((img) => img.naturalWidth > img.clientWidth * window.devicePixelRatio * 1.5)
  .map((img) => ({
    src: img.currentSrc,
    file: `${img.naturalWidth}×${img.naturalHeight}`,
    shown: `${img.clientWidth}×${img.clientHeight}`,
  }));
```

<details>
<summary>Show the answer to Challenge 1</summary>

- 3000 × 2000 × 4 = **24 MB**
- 600 × 400 × 4 = **0.96 MB** — 25× less
- 1200 × 800 × 4 = **3.84 MB** — still more than 6× less than the original, and it looks perfect on a 2× screen

The original image wastes over 20 MB of memory just to be shrunk down on screen. Multiply that by every product in a grid.

</details>

## Recap

- Every image costs **bytes** (download), **memory** (decode: width × height × 4) and potentially **layout** (CLS).
- File size grows with **area** — halving the width saves about **75%** of the pixels.
- Always set **`width` and `height`** so the browser can reserve space via the aspect ratio.
- Photos → **AVIF/WebP** (JPEG fallback), icons → **SVG**, GIFs → **video**. Quality **75–80** is the sweet spot.
- Images usually *are* your **LCP**.

## Next up

Rule #1 says "never send more pixels than the screen can show." But screens range from a 360px phone to a 2560px monitor, with pixel densities from 1× to 3×. One file can't be right for all of them. In Part 2 we'll learn how to hand the browser a **menu** of files — and how the browser picks from it, often before your CSS has even loaded.

👉 **[Part 2 — Responsive images: `srcset`, `sizes` and `<picture>`](/posts/frontend/images/part-2-responsive-images/)**
