# liam.dev — a developer blog (Astro)

A static, lightweight, SEO-friendly blog: no JavaScript on the page by default, just a few tiny scripts for the theme toggle, the copy-code button and the search page.

## Getting started

Requires the **latest Node.js 22** (Astro 7 needs `>= 22.23`). Check with `node -v`.

```bash
npm install
npm run dev        # open http://localhost:4321
```

| Command | What it does |
| --- | --- |
| `npm run dev` | run locally with live reload (also shows `draft` posts) |
| `npm run build` | build into `dist/` for deployment |
| `npm run preview` | preview the production build |
| `npm run check` | check TypeScript / frontmatter errors |

## One-time setup

1. `src/consts.ts`: edit `title`, `description`, `author`, GitHub/email links.
2. `astro.config.mjs`: change `SITE_URL` to your real domain.
3. `public/robots.txt`: replace `https://example.com` with your real domain.
4. `public/og-default.png`: the 1200×630 image shown when a link is shared. Replace it with your own if you like.
5. `src/intro.md`: the short intro on the home page.

## Publishing — just create a Markdown file

Templates live in `templates/`. Copy one into the right folder and edit it.

| To publish | Create a file in | Template |
| --- | --- | --- |
| Your own post | `src/content/blog/my-post.md` (or `.mdx`, subfolders allowed) | `templates/post.md` |
| A GitHub repo | `src/content/repos/owner-repo.md` | `templates/repo.md` |
| A great article by someone else | `src/content/links/link-name.md` | `templates/link.md` |

- **File path = URL**: `src/content/blog/algorithms/tree.md` becomes `/posts/algorithms/tree/`. Use lowercase, dash-separated names.
- **topic**: each item belongs to exactly 1 topic: `frontend` or `algorithms`. The list lives in `src/consts.ts`; add an entry there to create a new topic.
- **tags** (labels): as many as you like. Tags are lowercased automatically and spaces become `-`. Related posts are scored by shared tags (+2 each) and same topic (+1). Repos and links with shared tags also show up at the end of a post.
- **series / seriesOrder** (optional): group posts into a series, e.g. "Algorithms Hiding in Your Frontend".
- **draft: true**: a draft, only visible with `npm run dev`, excluded from the build.
- **pinned: true**: pin the post to the top of the home page.
- Images: put them in `public/images/` and embed with `![description](/images/my-image.png)`.
- In `.mdx` files you can use the `Callout` component (note/tip/warning boxes); usage is documented at the top of `src/components/Callout.astro`.

If the frontmatter is invalid (missing `title`, unknown topic, malformed url...), `npm run dev` and `npm run build` will report exactly which file is wrong.

## Structure

```text
src/
├── consts.ts            # site config, menu, TOPICS list
├── content.config.ts    # frontmatter schemas for blog / repos / links
├── content/
│   ├── blog/            # your posts (e.g. blog/algorithms/ for the algorithms series)
│   ├── repos/           # shared GitHub repos
│   └── links/           # great articles by other people
├── components/          # Header, Footer, PostItem, RepoCard, TOC, Callout...
├── layouts/BaseLayout.astro
├── intro.md             # intro on the home page
├── pages/               # routes: /, /posts, /topics, /labels, /repos, /links, /search, /rss.xml
├── styles/global.css    # the whole theme (colors, fonts) — edit the CSS variables at the top
└── utils/content.ts     # data fetching, related posts, reading time
templates/               # templates to copy when publishing
```

## Built-in SEO

- Fully static HTML with a unique title / description / canonical per page.
- Open Graph and Twitter cards, so shared links get an image and description.
- JSON-LD (`BlogPosting` for posts, `WebSite` for the home page).
- `sitemap-index.xml`, `rss.xml`, `robots.txt`.
- Drafts and the search page are marked `noindex`.

After deploying, submit the sitemap in **Google Search Console** to get indexed faster.

## Deploy (free)

**Cloudflare Pages / Vercel / Netlify**: push the repo to GitHub and import it into one of them.

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `NODE_VERSION=22` (if asked)

From then on, every `git push` with a new post rebuilds and updates the site.
