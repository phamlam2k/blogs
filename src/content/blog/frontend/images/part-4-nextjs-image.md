---
title: 'Images on the Web, Part 4: Next.js <Image>, Demystified'
description: 'How next/image works under the hood, how it maps to everything in Parts 1–3, the props and config that matter in Next.js 16, getImageProps for backgrounds and <picture>, and when you should not use it.'
pubDate: 2026-11-25
topic: frontend
tags: [images, performance, nextjs, react, web-vitals]
series: 'Images on the Web'
seriesOrder: 4
---

> **Series: Images on the Web — Part 4 of 4**
> ← [Part 1 — What an image costs](/posts/frontend/images/part-1-what-an-image-really-costs/) · [Part 2 — Responsive images](/posts/frontend/images/part-2-responsive-images/) · [Part 3 — Background images and loading](/posts/frontend/images/part-3-background-images-and-loading/)

**In this part (≈ 13 min):**

- What `<Image>` actually renders — read with everything you now know
- Every problem from Parts 1–3, and how `<Image>` solves it
- What happens inside `/_next/image`
- The 4 patterns you'll use 95% of the time
- `next.config` options that matter
- Background images and art direction with `getImageProps()`
- When **not** to use `<Image>`, what it costs, and the most common mistakes

> **Version note:** this post targets **Next.js 16**. The biggest change from earlier versions: the `priority` prop is deprecated in favor of `preload`, and `images.qualities` is now required. Where it matters, I'll show the Next.js 15 equivalent.

---

## A one-line component with a lot of HTML behind it

You write this:

```jsx
import Image from 'next/image';
import hero from './hero.jpg';

<Image src={hero} alt="Mountains at sunrise" />
```

And Next.js renders something like this (URLs shortened):

```html
<img
  alt="Mountains at sunrise"
  loading="lazy"
  width="1200"
  height="800"
  decoding="async"
  style="color:transparent"
  srcset="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fhero.jpg&w=1200&q=75 1x,
          /_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fhero.jpg&w=3840&q=75 2x"
  src="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fhero.jpg&w=3840&q=75"
/>
```

Three parts ago, this would have looked like noise. Now read it line by line:

- **`width="1200" height="800"`** — you never typed them. Next.js read them from the imported file, so the browser can reserve space and avoid layout shift. *(Part 1)*
- **`srcset` with `1x` and `2x`** — `x` descriptors, because we didn't say how wide the image is on screen, so Next.js assumed a fixed size. *(Part 2)*
- **`w=1200` and `w=3840`** — the server resizes the file to these widths. (Why 3840 for 2×? It picks the first configured width that's at least 2 × 1200 = 2400 — and the next one in the default list is 3840.)
- **`q=75`** — the quality sweet spot. *(Part 1)*
- **`loading="lazy"`** — great below the fold, harmful for an LCP image. *(Part 3)*
- **`decoding="async"`** — don't block rendering while decoding. *(Part 3)*
- **`/_next/image?...`** — not your file, but a small image CDN inside your app that also picks the format from the `Accept` header. *(Parts 2 and 3)*

Every attribute solves a problem from this series. And if you don't know those problems, `<Image>` is a black box you'll eventually misuse — the classic ways being a hero image that loads *late* because it's lazy, or a card thumbnail that downloads a 3840px file.

## Why `<Image>` exists: the checklist

At the end of Part 3, the "perfect `<img>`" needed a lot of work. Here's that checklist next to what `<Image>` does:

| Problem | Where we learned it | What `<Image>` does |
|---|---|---|
| Oversized files | Part 1 | Resizes on the server to the widths in your config |
| Heavy formats | Part 1 | Converts to WebP (or AVIF if enabled) via the `Accept` header |
| Quality too high | Part 1 | Compresses with `quality` 75 by default |
| Layout shift (CLS) | Part 1 | Requires `width`/`height` (or `fill`); reads them automatically from imported files |
| One file for every screen | Part 2 | Generates `srcset` for you |
| Picking the right width | Part 2 | Uses your **`sizes`** prop — you still have to write it |
| Loading below-the-fold images | Part 3 | `loading="lazy"` by default |
| Decoding blocking render | Part 3 | `decoding="async"` by default |
| Placeholders | Part 3 | `placeholder="blur"`, auto-generated for imported images |
| Caching | Part 3 | Optimized images cached on the server; imported files get hashed URLs |
| Generating all those variants | Part 3 | On demand, on first request — a mini image CDN in your app |

Two rows deserve attention: **`sizes`** and **LCP priority**. `<Image>` can't guess your layout, and it can't know which image is your LCP. Those two are still your job — and they're where most real-world mistakes happen.

## Under the hood: what `/_next/image` does

Every optimized image URL looks like this:

```
/_next/image?url=%2Fimages%2Fhero.jpg&w=1080&q=75
```

When the browser requests it (with an `Accept: image/avif,image/webp,...` header), the Next.js server:

1. **Validates the request.** Is `url` allowed by your `localPatterns`/`remotePatterns`? Is `w` one of your configured `deviceSizes`/`imageSizes`? Is `q` in `qualities`? If not — error.
2. **Checks its cache** for this exact URL + format.
3. On a miss: **fetches the source image**, **resizes** it to width `w`, **encodes** it in the best format the browser accepts, using quality `q`.
4. **Stores** the result in its cache and responds with `Cache-Control` headers and `Vary: Accept`.

![Flow diagram: the browser sends GET /_next/image with url, w=1080, q=75 and an Accept header. The Next.js server first validates url, w and q against the config and returns an error if not allowed. If valid, it checks the cache: on a hit it sends the cached image; on a miss it fetches the source image, resizes it to w, encodes AVIF or WebP at quality q, saves it to the cache and sends it with Cache-Control and Vary: Accept.](/images/posts/images-series/07-next-image-flow.svg)
*One request to `/_next/image`. Only the first visitor for each url + width + quality + format pays for steps ③–⑤.*

Why the strict validation in step 1? Without it, anyone could request `?w=1&q=1`, `?w=2&q=2`... and make your server encode millions of variants, burning CPU and filling the disk. The allowlists (`deviceSizes`, `imageSizes`, `qualities`, `remotePatterns`) cap the number of possible variants. Keep that in mind when you're tempted to loosen them.

### How the `srcset` is generated

This connects directly to Part 2:

| You write | Next.js generates | Why |
|---|---|---|
| `width={600}`, no `sizes` | `x` descriptors: `1x`, `2x` | Assumes a fixed-size image |
| `sizes="..."` | `w` descriptors from `deviceSizes` + `imageSizes` | A fluid image: let the browser do the math |
| `fill`, no `sizes` | `w` descriptors, with `sizes="100vw"` | Assumes it's as wide as the viewport |

Look at the last row carefully. That's Rule #2 from Part 2: **no `sizes` = `100vw` = the biggest file.** With `fill`, forgetting `sizes` means a small card thumbnail on a desktop downloads a file meant for a full-screen image.

The defaults behind those widths:

```js
deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840] // for full-width-ish images
imageSizes:  [32, 48, 64, 96, 128, 256, 384]               // for smaller images
```

## The 4 patterns you'll use most

### Pattern 1: a local image (static import)

```jsx
import Image from 'next/image';
import cover from './cover.jpg';

export function ArticleCover() {
  return (
    <Image
      src={cover}
      alt="A laptop on a wooden desk next to a cup of coffee"
      placeholder="blur"
      sizes="(min-width: 768px) 720px, 100vw"
      style={{ width: '100%', height: 'auto' }}
    />
  );
}
```

With a static import, Next.js reads the file at build time, so you get for free:

- `width` and `height` → no CLS,
- a tiny `blurDataURL` → `placeholder="blur"` just works,
- a content-hashed URL → safe to cache long-term.

`style={{ width: '100%', height: 'auto' }}` makes it fluid (Part 1's `max-width: 100%; height: auto` trick), and `sizes` describes that fluid width.

### Pattern 2: a remote image with a known size

```jsx
<Image
  src={`https://images.example.com/avatars/${user.id}.jpg`}
  alt={user.name}
  width={64}
  height={64}
/>
```

Next.js can't read a remote file at build time, so you must provide `width` and `height` (they define the aspect ratio and the base for `1x`/`2x`), and you must allow the host in `next.config`:

```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'images.example.com', pathname: '/avatars/**' },
  ],
},
```

Be as specific as you can. `hostname: '**'` turns your server into a free image proxy for the entire internet.

(`images.domains` is the old way to do this — it's deprecated in favor of `remotePatterns`.)

### Pattern 3: an image that fills its container (`fill`)

When you don't know the image's dimensions, or you want it to fill a box — card thumbnails, CMS images, avatars of any shape:

```jsx
<div style={{ position: 'relative', aspectRatio: '16 / 9' }}>
  <Image
    src={post.coverUrl}
    alt={post.coverAlt}
    fill
    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
    style={{ objectFit: 'cover' }}
  />
</div>
```

The rules of `fill`:

- The `<img>` becomes `position: absolute` and stretches to its parent — so the **parent must be positioned** (`relative`, `absolute` or `fixed`) and **must have a size** (here `aspect-ratio`). Otherwise the image either collapses to 0px or covers something it shouldn't.
- `objectFit: 'cover'` = `background-size: cover` (Part 3's Fix #1 — this is literally that pattern).
- **Always pass `sizes`.** Always.

### Pattern 4: the LCP / hero image

```jsx
import hero from './hero.jpg';

<section style={{ position: 'relative', minHeight: '70vh' }}>
  <Image
    src={hero}
    alt="Our team hiking at sunrise"
    fill
    sizes="100vw"
    loading="eager"
    fetchPriority="high"
    style={{ objectFit: 'cover', zIndex: -1 }}
  />
  <h1>Build things that last</h1>
</section>
```

`<Image>` is lazy by default — perfect for most images, wrong for this one (Part 3: never lazy-load the LCP image). So:

- **`loading="eager"`** — turn off lazy loading.
- **`fetchPriority="high"`** — download it before other images.

There's also a **`preload`** prop, which additionally inserts a `<link rel="preload">` in the `<head>`. Use it for a single, known LCP image when you want the earliest possible start — and don't combine it with `loading` or `fetchPriority`. Don't use it when different images might be the LCP at different screen sizes.

> **On Next.js 15 or earlier:** use the `priority` prop instead. It turns off lazy loading, sets high fetch priority and preloads the image — all in one. It still works in Next.js 16 but is deprecated.

## Configuring `next.config`

A realistic configuration:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Try AVIF first, then WebP. Default is ['image/webp'] only.
    formats: ['image/avif', 'image/webp'],

    // Every `quality` value you use must be listed here (required since Next.js 16).
    qualities: [60, 75, 90],

    // Remote hosts you trust.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.example.com', pathname: '/uploads/**' },
    ],

    // How long optimized images stay cached, in seconds. Default: 14400 (4 hours).
    minimumCacheTTL: 2678400, // 31 days

    // Usually fine as defaults:
    // deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // imageSizes: [32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
```

A few notes:

- **AVIF** files are usually smaller than WebP, but they're slower to encode, so the *first* request for each variant takes longer. After that, it's cached. For most content sites it's worth enabling.
- **`qualities`**: if a component uses `quality={90}` and 90 isn't in the list, the request fails. Keep the list short — each value multiplies the number of possible variants.
- **`minimumCacheTTL`**: if your source images rarely change (or have unique URLs), raise it. Otherwise the server re-optimizes the same images every few hours.

## Beyond `<img>`: `getImageProps()`

Sometimes you need the optimized URLs but **not** an `<Image>` component: a CSS background, or a `<picture>` for art direction. `getImageProps()` returns the props `<Image>` *would* render — `src`, `srcSet`, `sizes`, `width`, `height` — so you can use them anywhere.

### Background images with `image-set()`

Remember Part 3's `image-set()`? We can feed it optimized URLs:

```jsx
import { getImageProps } from 'next/image';

function getBackgroundImage(srcSet = '') {
  const imageSet = srcSet
    .split(', ')
    .map((entry) => {
      const [url, density] = entry.split(' ');
      return `url("${url}") ${density}`;
    })
    .join(', ');
  return `image-set(${imageSet})`;
}

export function Banner() {
  const {
    props: { srcSet },
  } = getImageProps({ alt: '', width: 1200, height: 400, src: '/banner.jpg' });

  return (
    <section style={{ height: '400px', backgroundImage: getBackgroundImage(srcSet), backgroundSize: 'cover' }}>
      ...
    </section>
  );
}
```

No `sizes` → Next.js generates `1x`/`2x` descriptors, which is exactly what `image-set()` understands. But remember the Part 3 trade-offs: this is still a CSS background — discovered late, no `alt`. For a hero, Pattern 4 (`fill` + `objectFit: 'cover'`) is usually better.

### Art direction with `<picture>`

Different crops for mobile and desktop (Part 2's use case 2):

```jsx
import { getImageProps } from 'next/image';

export function Hero() {
  const common = { alt: 'Our team at the office', sizes: '100vw' };

  const {
    props: { srcSet: desktop },
  } = getImageProps({ ...common, width: 2400, height: 1000, src: '/hero-wide.jpg' });

  const {
    props: { srcSet: mobile, ...rest },
  } = getImageProps({ ...common, width: 1200, height: 1500, src: '/hero-tall.jpg' });

  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktop} />
      <img {...rest} srcSet={mobile} style={{ width: '100%', height: 'auto' }} />
    </picture>
  );
}
```

One limitation: `getImageProps()` can't be used with the `placeholder` prop.

## Using your own image CDN: custom loaders

If your images already live on an image CDN (Cloudinary, imgix, Cloudflare Images...), you don't want Next.js to download and re-encode them. A **loader** tells `<Image>` how to build URLs for *your* CDN, while keeping everything else (`srcset`, `sizes`, lazy loading, dimensions):

```ts
// next.config.ts
images: {
  loader: 'custom',
  loaderFile: './image-loader.ts',
},
```

```ts
// image-loader.ts
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const params = ['f_auto', 'c_limit', `w_${width}`, `q_${quality || 'auto'}`];
  return `https://res.cloudinary.com/demo/image/upload/${params.join(',')}${src}`;
}
```

Now `/_next/image` is never called — the browser goes straight to the CDN, with the right width in every `srcset` entry.

## When should you NOT use `<Image>`?

`<Image>` is the right default for **content images**: photos, covers, product shots, user uploads from known hosts. But it isn't free, and it isn't always the right tool. Run through these questions top to bottom:

![Decision chain: an SVG logo or icon — use a plain img, inline SVG or an icon component. Already served by an image CDN — use Image with a custom loader. Static export — use a custom loader or images unoptimized true. An animated GIF — use a muted looping video. A decorative pattern or texture — use CSS background-image. Otherwise use Image, always write sizes, and give the LCP image eager, high priority.](/images/posts/images-series/08-should-i-use-next-image.svg)
*If every answer is "no", `<Image>` is the right tool.*

The same decisions, with the reasons:

| Situation | Better choice | Why |
|---|---|---|
| **SVG** logos and icons | Plain `<img>`, inline SVG, or an icon component | SVG is already resolution-independent; Next.js doesn't optimize it (it serves `.svg` sources unoptimized) |
| Tiny icons, emoji, 1px images | Plain `<img>` | Nothing to optimize, extra wrapper logic for nothing |
| Images **already on an image CDN** | `<Image>` + **custom loader** (or `unoptimized`) | Avoid double processing and double cost |
| **Static export** (`output: 'export'`) | Custom loader, or `images: { unoptimized: true }` | There's no server to run `/_next/image` |
| **Animated GIFs** | `<video autoplay muted loop playsinline>` | Animated images aren't optimized; video is far smaller |
| Images from **arbitrary user-provided URLs** | Fetch, validate and store them yourself (or a CDN) | You can't safely allowlist "every host" |
| **Decorative** patterns and textures | CSS `background-image` | Not content; no `alt`, no LCP concerns |

### The costs you're signing up for

- **CPU and memory.** Resizing and encoding (especially AVIF) is real work. Self-hosted, that work happens on your Node.js server — the same one rendering your pages.
- **A slow first request.** The first visitor to request each variant waits for the encode. Subsequent visitors get the cached version.
- **Cache per instance.** When self-hosting, optimized images are cached on that server's disk. With several instances, each one builds its own cache. Put a CDN in front of your app so variants are cached at the edge.
- **Platform usage.** On hosting platforms, image optimization usually counts toward usage or billing (transformations, cache reads/writes). Check your provider's pricing if you have many unique images.

## The most common mistakes

1. **`fill` without `sizes`** → every thumbnail downloads a viewport-wide image. The #1 mistake by far.
2. **The LCP image left lazy** (the default) → slow LCP. Use `loading="eager"` + `fetchPriority="high"` (or `preload`).
3. **Preloading many images** → they compete with each other and with CSS/fonts. One LCP image, that's it.
4. **Confusing `width`/`height` with display size.** They describe the image's **intrinsic** size and aspect ratio. The displayed size is controlled by CSS (`style`, `className`). A `width={300}` image stretched by CSS to 900px looks blurry — fix it with `sizes` and fluid styles, not by guessing.
5. **`fill` inside a parent with no position or no height** → the image disappears (0px tall) or escapes its box.
6. **Using a `quality` not listed in `images.qualities`** → the image fails to load in Next.js 16.
7. **Overly broad `remotePatterns`** (`hostname: '**'`) → anyone can use your server as an image proxy.
8. **Empty `alt` on meaningful images.** `alt=""` is correct only for purely decorative images. If the image carries content, describe it.

## Your turn

This product card has **four** problems. Fix them.

```jsx
// next.config.ts has no `images` config.

export function ProductCard({ product }) {
  return (
    <div className="card">
      <Image src={product.imageUrl} alt="" fill />
      <h3>{product.name}</h3>
    </div>
  );
}
```

`product.imageUrl` looks like `https://cdn.shop.com/products/123.jpg`. Cards are shown in a grid: 4 columns on desktop (≥ 1024px), 2 columns on tablets (≥ 640px), 1 column on phones.

<details>
<summary>Show the answer</summary>

```jsx
export function ProductCard({ product }) {
  return (
    <div className="card">
      <div style={{ position: 'relative', aspectRatio: '1 / 1' }}>
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          style={{ objectFit: 'cover' }}
        />
      </div>
      <h3>{product.name}</h3>
    </div>
  );
}
```

```ts
// next.config.ts
images: {
  remotePatterns: [{ protocol: 'https', hostname: 'cdn.shop.com', pathname: '/products/**' }],
},
```

1. **No `sizes`** → each card downloads a viewport-wide image. Added one that matches the grid.
2. **`fill` with no positioned, sized parent** → wrapped it in a `position: relative` box with an `aspect-ratio`, and added `objectFit: 'cover'`.
3. **Remote host not allowed** → added `remotePatterns`, scoped to `/products/**`.
4. **`alt=""` on a product photo** → it's content, not decoration. Described it with the product name.

Bonus: if the first row of cards is above the fold on desktop, the first card might be your LCP element — consider passing `loading="eager"` to it.

</details>

## Series recap

- **Part 1:** every image costs **bytes, memory (w × h × 4) and layout**. Always set dimensions; choose AVIF/WebP for photos, SVG for icons, video for animations.
- **Part 2:** **`srcset` + `sizes`** let the browser pick the right file. No `sizes` = `100vw`. **`<picture>`** for formats and art direction.
- **Part 3:** content backgrounds are a trap → **`<img>` + `object-fit`**, `image-set()` or preload. **Lazy** below the fold, **`fetchpriority="high"`** on the LCP, tiny placeholders, long caching.
- **Part 4:** **`<Image>` automates almost all of it** — but `sizes` and LCP priority are still your job, it has real costs, and SVGs, static exports, existing CDNs and GIFs need a different approach.

Now when you look at `<Image src={hero} alt="..." />`, you know exactly what every attribute in the output means — and when it's not enough.

Thanks for reading the whole series! 🖼️
