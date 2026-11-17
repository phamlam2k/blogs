# liam.dev — blog lập trình viên (Astro)

Blog tĩnh, nhẹ, tốt cho SEO: mặc định không có JavaScript trên trang, chỉ có vài đoạn script nhỏ cho nút đổi theme, nút copy code và trang tìm kiếm.

## Chạy lần đầu

Cần **Node.js 22 bản mới nhất** (Astro 7 yêu cầu `>= 22.23`). Kiểm tra bằng `node -v`.

```bash
npm install
npm run dev        # mở http://localhost:4321
```

| Lệnh | Tác dụng |
| --- | --- |
| `npm run dev` | chạy local, sửa file là trang tự reload (hiện cả bài `draft`) |
| `npm run build` | build ra thư mục `dist/` để deploy |
| `npm run preview` | xem thử bản build |
| `npm run check` | kiểm tra lỗi TypeScript / frontmatter |

## Việc cần làm 1 lần

1. `src/consts.ts`: sửa `title`, `description`, `author`, link GitHub/email.
2. `astro.config.mjs`: đổi `SITE_URL` thành domain thật.
3. `public/robots.txt`: đổi `https://example.com` thành domain thật.
4. `public/og-default.png`: ảnh 1200×630 hiện khi share link. Thay bằng ảnh của bạn nếu muốn.
5. `src/intro.md`: lời giới thiệu ngắn trên trang chủ. `src/pages/gioi-thieu.astro`: trang giới thiệu chi tiết.
6. Xoá các bài, repo và link mẫu trong `src/content/` khi không cần nữa.

## Lên bài — chỉ cần tạo file Markdown

Có sẵn file mẫu trong thư mục `templates/`. Copy file mẫu vào đúng thư mục rồi sửa.

| Muốn đăng | Tạo file ở | Mẫu |
| --- | --- | --- |
| Bài viết của bạn | `src/content/blog/ten-bai.md` (hoặc `.mdx`) | `templates/post.md` |
| Repo GitHub | `src/content/repos/owner-repo.md` | `templates/repo.md` |
| Bài viết hay của người khác | `src/content/links/ten-link.md` | `templates/link.md` |

- **Tên file = URL**: `src/content/blog/docker-tips.md` sẽ thành `/blogs/docker-tips/`. Nên đặt tên không dấu, nối bằng gạch ngang.
- **topic** (chủ đề): mỗi mục thuộc đúng 1 chủ đề: `frontend`, `backend`, `devops`, `thuat-toan`, `cong-cu`, `ghi-chep`. Danh sách nằm trong `src/consts.ts`; muốn thêm chủ đề thì thêm một mục ở đó.
- **tags** (nhãn): gắn bao nhiêu cũng được. Tag tự chuyển thành chữ thường, khoảng trắng đổi thành `-`. Bài liên quan được tính theo tag trùng nhau (+2 điểm mỗi tag) và cùng topic (+1 điểm). Repo và link có tag trùng cũng hiện ở cuối bài.
- **draft: true**: bài nháp, chỉ thấy khi chạy `npm run dev`, không lên bản build.
- **pinned: true**: ghim bài lên đầu trang chủ.
- Ảnh trong bài: để trong `public/images/` rồi chèn bằng `![mô tả](/images/ten-anh.png)`.
- Trong file `.mdx` có thể dùng component `Callout` (khung ghi chú/mẹo/lưu ý); cách dùng ghi ở đầu file `src/components/Callout.astro`.

Nếu frontmatter sai (thiếu `title`, topic không tồn tại, url sai định dạng...), `npm run dev` và `npm run build` sẽ báo lỗi chỉ rõ file nào.

## Cấu trúc

```text
src/
├── consts.ts            # cấu hình site, menu, danh sách TOPICS
├── content.config.ts    # schema frontmatter của blog / repos / links
├── content/
│   ├── blog/            # bài viết của bạn
│   ├── repos/           # repo GitHub share
│   └── links/           # bài viết hay của người khác
├── components/          # Header, Footer, PostItem, RepoCard, TOC, Callout...
├── layouts/BaseLayout.astro
├── intro.md             # lời giới thiệu trên trang chủ
├── pages/               # các route: /, /blogs, /topics, /nhan, /repos, /lien-ket, /search, /rss.xml
├── styles/global.css    # toàn bộ theme (màu, font) — sửa biến CSS ở đầu file
└── utils/content.ts     # lấy dữ liệu, tính bài liên quan, thời gian đọc
templates/               # file mẫu để copy khi lên bài
```

## SEO có sẵn

- HTML tĩnh hoàn toàn, có title / description / canonical riêng cho từng trang.
- Open Graph và Twitter card, nên share lên Facebook, Zalo hay X đều có ảnh và mô tả.
- JSON-LD (`BlogPosting` cho bài viết, `WebSite` cho trang chủ).
- `sitemap-index.xml`, `rss.xml`, `robots.txt`.
- Bài nháp và trang tìm kiếm được gắn `noindex`.

Sau khi deploy, khai báo sitemap trong **Google Search Console** để Google index nhanh hơn.

## Deploy (miễn phí)

**Cloudflare Pages / Vercel / Netlify**: đẩy repo lên GitHub rồi import vào một trong ba dịch vụ.

- Build command: `npm run build`
- Output directory: `dist`
- Biến môi trường: `NODE_VERSION=22` (nếu dịch vụ hỏi)

Từ đó, mỗi lần `git push` một bài mới là site tự build và cập nhật.
