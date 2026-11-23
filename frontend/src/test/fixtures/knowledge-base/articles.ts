import type { KnowledgeArticle } from "@features/knowledge-base";

/**
 * Rich Markdown fixture covering all supported structural elements
 * (h2-h4, paragraphs, ul/ol, blockquote, hr, inline/block code, internal/external links,
 * and long unbreakable tokens) for F6.4 typography, a11y, and regression testing.
 */
export const RICH_FIXTURE_ARTICLE: KnowledgeArticle = {
  slug: "what-is-astrology",
  title: "Chiêm tinh học là gì?",
  category: "fundamentals",
  summary:
    "Tổng quan nền tảng về chiêm tinh học phương Tây, các hành tinh, cung hoàng đạo và nhà.",
  order: 1,
  updatedAt: "2026-11-19",
  markdown: [
    "## Nền tảng biểu tượng",
    "",
    "Chiêm tinh học phương Tây sử dụng bản đồ sao sinh để mô tả vị trí tương đối của các thiên thể tại thời điểm và địa điểm sinh của mỗi người.",
    "",
    "### Bốn trụ cột chính",
    "",
    "- **Hành tinh** đại diện cho các động lực tâm lý cốt lõi.",
    "- **Cung hoàng đạo** mô tả sắc thái biểu đạt của từng hành tinh.",
    "- **Nhà** cho thấy lĩnh vực đời sống nơi năng lượng thể hiện.",
    "- **Góc chiếu** phản ánh mối liên hệ hình học giữa các hành tinh.",
    "",
    "1. Xác định ngày, giờ và nơi sinh chính xác.",
    "2. Tính toán kinh độ hoàng đạo bằng hệ thiên văn chuẩn.",
    "3. Tổng hợp cấu trúc cung, nhà và góc chiếu.",
    "",
    "> Bản đồ sao không áp đặt định mệnh mà gợi mở góc nhìn chiêm nghiệm về tính cách và chu kỳ phát triển.",
    "",
    "---",
    "",
    "#### Ví dụ ký hiệu và liên kết",
    "",
    "Ký hiệu góc trùng tụ là `0°` với độ lệch `orb <= 8°`.",
    "",
    "```",
    "Sun 15°24' Aries (House 1) conjunct Mercury 18°05' Aries (orb 2°41') — long-code-line-for-horizontal-scroll-verification",
    "```",
    "",
    "Xem thêm [Hành tinh Mặt Trời](/knowledge/sun-planet), [Slug không tồn tại](/knowledge/missing-slug), và [Tài liệu tham khảo](https://example.com/astrology-reference).",
  ].join("\n"),
};

/**
 * Second article fixture for testing A -> B article switching (KB-U47, KB-U52).
 */
export const SECOND_FIXTURE_ARTICLE: KnowledgeArticle = {
  slug: "sun-planet",
  title: "Mặt Trời trong bản đồ sao",
  category: "planets",
  summary:
    "Ý nghĩa của Mặt Trời đại diện cho bản sắc cốt lõi, ý chí và năng lượng sáng tạo.",
  order: 2,
  updatedAt: "2026-11-20",
  markdown: [
    "## Vai trò của Mặt Trời",
    "",
    "Mặt Trời biểu trưng cho trung tâm ý thức và hướng phát triển bản sắc cá nhân.",
    "",
    "Quay lại bài [Chiêm tinh học là gì?](/knowledge/what-is-astrology).",
  ].join("\n"),
};

/**
 * Image policy fixture covering valid local images, rejected remote/CDN images,
 * and rejected empty-alt images (KB-U43, KB-AC-25).
 */
export const IMAGE_FIXTURE_ARTICLE: KnowledgeArticle = {
  slug: "zodiac-wheel-guide",
  title: "Cấu trúc vòng tròn hoàng đạo",
  category: "signs",
  summary: "Minh họa bố cục 12 cung hoàng đạo trên vòng tròn 360 độ.",
  order: 3,
  updatedAt: "2026-11-21",
  markdown: [
    "## Minh họa vòng tròn 12 cung",
    "",
    "![Biểu đồ vòng tròn 12 cung hoàng đạo](/knowledge/images/zodiac-wheel.webp)",
    "",
    "![Ảnh remote bị từ chối](https://cdn.example.com/remote-zodiac.png)",
    "",
    "![](/knowledge/images/missing-alt.png)",
  ].join("\n"),
};

/**
 * Raw HTML / XSS payload fixture to verify `skipHtml` and zero DOM injection (KB-U50).
 */
export const XSS_FIXTURE_ARTICLE: KnowledgeArticle = {
  slug: "security-check",
  title: "Kiểm thử an toàn nội dung",
  category: "fundamentals",
  summary: "Fixture kiểm tra HTML thô và XSS bị loại bỏ hoàn toàn.",
  order: 4,
  updatedAt: "2026-11-21",
  markdown: [
    "## Nội dung an toàn",
    "",
    "Đoạn văn hợp lệ.",
    "",
    "<script>window.__xssExecuted = true;</script>",
    '<img src="/knowledge/images/x.png" onerror="window.__xssExecuted = true" />',
    '<div onclick="alert(1)">Raw HTML block</div>',
  ].join("\n"),
};
