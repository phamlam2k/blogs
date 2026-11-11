---
title: 'Two Pointers: khi nào dùng và 3 bài kinh điển'
description: 'Nhận diện bài toán two pointers, mẫu code TypeScript và lời giải cho Two Sum II, Valid Palindrome, Container With Most Water.'
pubDate: 2026-10-15
topic: thuat-toan
tags: [dsa, typescript, leetcode]
---

Two pointers là kỹ thuật dùng **hai chỉ số** di chuyển trên mảng/chuỗi để thay một vòng lặp lồng nhau O(n²) bằng một lần duyệt O(n).

## Dấu hiệu nhận biết

- Mảng **đã sắp xếp**, cần tìm cặp/bộ thoả điều kiện.
- So sánh hai đầu của chuỗi (palindrome).
- Cần thu hẹp một "cửa sổ" từ hai phía.

## Mẫu chung

```ts
let left = 0;
let right = arr.length - 1;
while (left < right) {
  if (/* đã tìm thấy */) return /* ... */;
  if (/* cần giá trị lớn hơn */) left++;
  else right--;
}
```

## Bài 1 — Two Sum II (mảng đã sắp xếp)

```ts
function twoSum(nums: number[], target: number): [number, number] | null {
  let l = 0, r = nums.length - 1;
  while (l < r) {
    const sum = nums[l] + nums[r];
    if (sum === target) return [l, r];
    sum < target ? l++ : r--;
  }
  return null;
}
```

Vì mảng tăng dần: tổng nhỏ quá thì tăng `l`, lớn quá thì giảm `r`.

## Bài 2 — Valid Palindrome

```ts
function isPalindrome(s: string): boolean {
  const t = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let l = 0, r = t.length - 1;
  while (l < r) if (t[l++] !== t[r--]) return false;
  return true;
}
```

## Bài 3 — Container With Most Water

```ts
function maxArea(h: number[]): number {
  let l = 0, r = h.length - 1, best = 0;
  while (l < r) {
    best = Math.max(best, Math.min(h[l], h[r]) * (r - l));
    h[l] < h[r] ? l++ : r--;
  }
  return best;
}
```

Vì sao luôn dịch cột **thấp hơn**? Diện tích bị giới hạn bởi cột thấp. Nếu dịch cột cao, chiều rộng giảm mà chiều cao không thể tăng vượt cột thấp, nên chắc chắn không tốt hơn.

## Độ phức tạp

| Bài | Time | Space |
| --- | --- | --- |
| Two Sum II | O(n) | O(1) |
| Valid Palindrome | O(n) | O(n)\* |
| Container With Most Water | O(n) | O(1) |

\* Do tạo chuỗi đã lọc; có thể đưa về O(1) bằng cách bỏ qua ký tự không hợp lệ ngay trong vòng lặp.
