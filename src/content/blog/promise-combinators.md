---
title: 'Promise.all, allSettled, race, any — chọn cái nào?'
description: 'So sánh 4 hàm gộp Promise trong JavaScript: khi nào resolve, khi nào reject, và ví dụ dùng thực tế cho từng hàm.'
pubDate: 2026-11-08
topic: frontend
tags: [javascript, async]
---

Khi cần chạy nhiều tác vụ bất đồng bộ **song song**, JavaScript có 4 hàm gộp Promise. Chúng chỉ khác nhau ở một câu hỏi: _khi nào thì coi là xong, và xong thế nào?_

## Bảng so sánh nhanh

| Hàm | Resolve khi | Reject khi |
| --- | --- | --- |
| `Promise.all` | **tất cả** thành công | **một** cái lỗi (fail-fast) |
| `Promise.allSettled` | tất cả đã xong (dù lỗi hay không) | không bao giờ |
| `Promise.race` | cái **đầu tiên** xong là thành công | cái đầu tiên xong là lỗi |
| `Promise.any` | cái **đầu tiên** thành công | **tất cả** đều lỗi (`AggregateError`) |

## Promise.all — cần đủ hết mới chạy tiếp

```js
const [user, posts] = await Promise.all([fetchUser(id), fetchPosts(id)]);
```

Dùng khi thiếu một phần là trang không hiển thị được.

## Promise.allSettled — chạy hết, lỗi đâu ghi đó

```js
const results = await Promise.allSettled(files.map(upload));
const failed = results.filter((r) => r.status === 'rejected');
console.log(`${failed.length} file upload lỗi`);
```

Hợp với tác vụ hàng loạt, nơi một cái lỗi không nên làm hỏng cả mẻ.

## Promise.race — làm timeout

```js
const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
const data = await Promise.race([fetch(url), timeout(5000)]);
```

## Promise.any — lấy nguồn nhanh nhất còn sống

```js
const res = await Promise.any([fetch(mirrorA), fetch(mirrorB), fetch(mirrorC)]);
```

Một mirror chết cũng không sao, miễn còn ít nhất một cái trả về.

> Cả 4 hàm đều **không huỷ** các Promise còn lại. Muốn huỷ thật sự (ví dụ huỷ request), dùng `AbortController`.
