---
title: 'Docker multi-stage build: thu nhỏ image Node.js'
description: 'Tách stage build và stage chạy để image production chỉ chứa đúng những gì cần thiết, nhẹ hơn nhiều lần.'
pubDate: 2026-10-28
topic: devops
tags: [docker, nodejs, hieu-nang]
---

Image Node.js "viết vội" thường nặng cả GB: nó chứa toolchain build, `devDependencies`, cache npm, source TypeScript... Tất cả đều không cần khi chạy production.

## Dockerfile "viết vội"

```dockerfile
FROM node:22
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["node", "dist/server.js"]
```

Vấn đề:

- Base image `node:22` (bản Debian đầy đủ) đã khá nặng.
- `npm install` kéo cả `devDependencies` (TypeScript, test, lint...).
- `COPY . .` trước khi install → sửa một dòng code là mất cache layer `node_modules`.

## Multi-stage: build một nơi, chạy một nơi

```dockerfile
# ---- 1. deps: cài toàn bộ dependency để build ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- 2. build: biên dịch TypeScript ----
FROM deps AS build
COPY . .
RUN npm run build && npm prune --omit=dev

# ---- 3. runtime: chỉ copy thứ cần để chạy ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
USER node
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./
CMD ["node", "dist/server.js"]
```

Ý tưởng chính: image cuối cùng chỉ lấy `dist/` và `node_modules` **đã bỏ devDependencies** từ stage trước. Mọi thứ còn lại bị bỏ đi.

## Ba mẹo nhỏ đi kèm

1. **Copy `package*.json` trước, source sau** → layer `npm ci` được cache, build lại chỉ mất vài giây.
2. **Thêm `.dockerignore`** để không gửi rác vào build context:

   ```text
   node_modules
   dist
   .git
   *.log
   .env
   ```

3. **Chạy bằng user `node`** thay vì root, giảm rủi ro nếu container bị khai thác.

## Kiểm tra kết quả

```bash
docker build -t my-api .
docker images my-api
```

Con số chính xác phụ thuộc project, nhưng chênh lệch giữa hai cách thường là nhiều lần. Nếu muốn soi từng layer xem cái gì đang chiếm chỗ, dùng [dive](/repos/).
