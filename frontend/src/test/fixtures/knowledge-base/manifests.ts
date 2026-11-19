import type { KnowledgeArticleMetadata } from "@features/knowledge-base/model/types";

export const VALID_FIXTURE_MANIFEST: readonly KnowledgeArticleMetadata[] = [
  {
    slug: "what-is-astrology",
    title: "Chiêm tinh học là gì?",
    category: "fundamentals",
    summary: "Tổng quan nền tảng chiêm tinh học phương Tây.",
    order: 1,
    updatedAt: "2026-11-18",
  },
  {
    slug: "sun-in-astrology",
    title: "Mặt Trời trong chiêm tinh",
    category: "planets",
    summary: "Ý nghĩa của Mặt Trời đại diện cho bản ngã và ý chí.",
    order: 1,
    updatedAt: "2026-11-15",
  },
  {
    slug: "moon-in-astrology",
    title: "Mặt Trăng trong chiêm tinh",
    category: "planets",
    summary: "Ý nghĩa của Mặt Trăng đại diện cho cảm xúc và tiềm thức.",
    order: 2,
    updatedAt: "2026-11-16",
  },
  {
    slug: "aries-sign",
    title: "Cung Bạch Dương",
    category: "signs",
    summary: "Năng lượng tiên phong của cung hoàng đạo Bạch Dương.",
    order: 1,
    updatedAt: "2026-11-10",
  },
  {
    slug: "first-house",
    title: "Nhà 1 trong bản đồ sao",
    category: "houses",
    summary: "Nhà đại diện cho cá tính và diện mạo bên ngoài.",
    order: 1,
    updatedAt: "2026-11-12",
  },
  {
    slug: "major-aspects",
    title: "Các góc chiếu chính",
    category: "aspects",
    summary: "Tổng quan 5 góc chiếu chính trong bản đồ sao.",
    order: 1,
    updatedAt: "2026-11-14",
  },
] as const;

export const INVALID_ENTRY_MANIFEST = [
  null,
  "string-entry",
  123,
  ["array-entry"],
] as const;

export const INVALID_SLUG_MANIFEST = [
  {
    slug: "Invalid_Slug",
    title: "Tiêu đề hợp lệ",
    category: "fundamentals",
    summary: "Tóm tắt hợp lệ.",
    order: 1,
    updatedAt: "2026-11-18",
  },
  {
    slug: "a--b",
    title: "Tiêu đề hợp lệ 2",
    category: "fundamentals",
    summary: "Tóm tắt hợp lệ.",
    order: 2,
    updatedAt: "2026-11-18",
  },
  {
    slug: "-leading-hyphen",
    title: "Tiêu đề hợp lệ 3",
    category: "fundamentals",
    summary: "Tóm tắt hợp lệ.",
    order: 3,
    updatedAt: "2026-11-18",
  },
  {
    slug: "trailing-hyphen-",
    title: "Tiêu đề hợp lệ 4",
    category: "fundamentals",
    summary: "Tóm tắt hợp lệ.",
    order: 4,
    updatedAt: "2026-11-18",
  },
] as const;

export const RESERVED_SLUG_MANIFEST = [
  {
    slug: "index",
    title: "Trang chủ kiến thức",
    category: "fundamentals",
    summary: "Tóm tắt hợp lệ.",
    order: 1,
    updatedAt: "2026-11-18",
  },
  {
    slug: "images",
    title: "Thư viện ảnh",
    category: "fundamentals",
    summary: "Tóm tắt hợp lệ.",
    order: 2,
    updatedAt: "2026-11-18",
  },
] as const;

export const DUPLICATE_SLUG_MANIFEST = [
  {
    slug: "same-slug",
    title: "Bài 1",
    category: "fundamentals",
    summary: "Tóm tắt bài 1.",
    order: 1,
    updatedAt: "2026-11-18",
  },
  {
    slug: "same-slug",
    title: "Bài 2",
    category: "planets",
    summary: "Tóm tắt bài 2.",
    order: 2,
    updatedAt: "2026-11-18",
  },
] as const;

export const INVALID_CATEGORY_MANIFEST = [
  {
    slug: "valid-slug",
    title: "Tiêu đề hợp lệ",
    category: "unknown-category",
    summary: "Tóm tắt hợp lệ.",
    order: 1,
    updatedAt: "2026-11-18",
  },
] as const;

export const INVALID_TITLE_MANIFEST = [
  {
    slug: "empty-title",
    title: "   ",
    category: "fundamentals",
    summary: "Tóm tắt hợp lệ.",
    order: 1,
    updatedAt: "2026-11-18",
  },
  {
    slug: "too-long-title",
    title: "A".repeat(121),
    category: "fundamentals",
    summary: "Tóm tắt hợp lệ.",
    order: 2,
    updatedAt: "2026-11-18",
  },
] as const;

export const INVALID_SUMMARY_MANIFEST = [
  {
    slug: "empty-summary",
    title: "Tiêu đề hợp lệ",
    category: "fundamentals",
    summary: "   ",
    order: 1,
    updatedAt: "2026-11-18",
  },
  {
    slug: "too-long-summary",
    title: "Tiêu đề hợp lệ 2",
    category: "fundamentals",
    summary: "A".repeat(161),
    order: 2,
    updatedAt: "2026-11-18",
  },
] as const;

export const INVALID_ORDER_MANIFEST = [
  {
    slug: "negative-order",
    title: "Tiêu đề hợp lệ",
    category: "fundamentals",
    summary: "Tóm tắt hợp lệ.",
    order: -1,
    updatedAt: "2026-11-18",
  },
  {
    slug: "float-order",
    title: "Tiêu đề hợp lệ 2",
    category: "fundamentals",
    summary: "Tóm tắt hợp lệ.",
    order: 1.5,
    updatedAt: "2026-11-18",
  },
] as const;

export const INVALID_UPDATED_AT_MANIFEST = [
  {
    slug: "bad-format-date",
    title: "Tiêu đề hợp lệ",
    category: "fundamentals",
    summary: "Tóm tắt hợp lệ.",
    order: 1,
    updatedAt: "18-11-2026",
  },
  {
    slug: "non-existent-calendar-date",
    title: "Tiêu đề hợp lệ 2",
    category: "fundamentals",
    summary: "Tóm tắt hợp lệ.",
    order: 2,
    updatedAt: "2026-02-30",
  },
  {
    slug: "invalid-month-date",
    title: "Tiêu đề hợp lệ 3",
    category: "fundamentals",
    summary: "Tóm tắt hợp lệ.",
    order: 3,
    updatedAt: "2026-13-01",
  },
] as const;
