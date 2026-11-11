---
title: 'Hiểu Event Loop trong JavaScript qua 4 ví dụ'
description: 'Call stack, microtask, macrotask — đoán thứ tự console.log và hiểu vì sao Promise luôn chạy trước setTimeout.'
pubDate: 2026-11-05
topic: frontend
tags: [javascript, async, event-loop]
---

JavaScript chạy **đơn luồng**: tại một thời điểm chỉ có một đoạn code được thực thi. Vậy làm sao nó vừa chờ API, vừa chờ timer, mà giao diện không bị đứng? Câu trả lời là _event loop_.

## Ba thành phần cần nhớ

1. **Call stack** — nơi các hàm đang chạy được xếp chồng lên nhau.
2. **Microtask queue** — callback của `Promise.then`, `queueMicrotask`, `await`.
3. **Macrotask queue** (task queue) — callback của `setTimeout`, `setInterval`, sự kiện DOM, I/O.

Quy tắc vàng:

> Sau mỗi macrotask, event loop chạy **hết sạch** microtask queue rồi mới lấy macrotask tiếp theo.

## Ví dụ 1: setTimeout 0 không phải là "ngay lập tức"

```js
console.log('A');
setTimeout(() => console.log('B'), 0);
console.log('C');
// A, C, B
```

`setTimeout(..., 0)` chỉ đưa callback vào macrotask queue. Nó phải đợi call stack trống.

## Ví dụ 2: Promise luôn chen hàng trước setTimeout

```js
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise'));
console.log('sync');
// sync, promise, timeout
```

Code đồng bộ chạy xong → microtask (`promise`) → rồi mới tới macrotask (`timeout`).

## Ví dụ 3: await chia hàm làm hai nửa

```js
async function run() {
  console.log('1');
  await null;
  console.log('3');
}
run();
console.log('2');
// 1, 2, 3
```

Mọi thứ **sau** `await` được đưa vào microtask queue, nên `2` in ra trước `3`.

## Ví dụ 4: microtask lồng nhau có thể làm treo trang

```js
function loop() {
  Promise.resolve().then(loop);
}
loop(); // ⚠ trình duyệt không bao giờ được render lại
```

Vì microtask queue phải chạy hết mới tới lượt render, một chuỗi microtask vô tận sẽ chặn UI. Với `setTimeout(loop, 0)` thì trang vẫn mượt, vì giữa các macrotask trình duyệt có cơ hội render.

## Tóm tắt

| Loại | Ví dụ | Khi nào chạy |
| --- | --- | --- |
| Sync | `console.log` | ngay |
| Microtask | `Promise.then`, `await` | ngay sau khi stack trống |
| Macrotask | `setTimeout`, click | sau khi microtask đã hết |

Muốn tự kiểm tra, dán các ví dụ trên vào DevTools console và đoán trước kết quả.
