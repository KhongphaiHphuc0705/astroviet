import type { KnowledgeArticleMetadata } from "./types";

export const KNOWLEDGE_MANIFEST: readonly KnowledgeArticleMetadata[] = [
  {
    slug: "what-is-astrology",
    title: "Chiêm tinh học là gì?",
    category: "fundamentals",
    summary:
      "Giới thiệu chiêm tinh học phương Tây, bản đồ sao cá nhân, những hiểu lầm thường gặp và góc nhìn hiện đại như công cụ chiêm nghiệm bản thân.",
    order: 1,
    updatedAt: "2026-11-25",
  },
  {
    slug: "how-to-read-a-natal-chart",
    title: "Cách đọc một bản đồ sao cá nhân",
    category: "fundamentals",
    summary:
      "Hướng dẫn từng bước đọc bản đồ sao cá nhân từ các yếu tố cốt lõi, bốn điểm góc quan trọng và cách xử lý khi chưa rõ giờ sinh trên AstroViet.",
    order: 2,
    updatedAt: "2026-11-25",
  },
  {
    slug: "planets-signs-houses",
    title: "Hành tinh, cung hoàng đạo và nhà: Ba thành phần của lá số",
    category: "fundamentals",
    summary:
      "Phân biệt vai trò của hành tinh, cung hoàng đạo và nhà trong bản đồ sao cá nhân qua khung câu hỏi cái gì, như thế nào và ở đâu.",
    order: 3,
    updatedAt: "2026-11-25",
  },
  {
    slug: "sun-moon-rising",
    title: "Mặt Trời, Mặt Trăng và Cung Mọc (Ascendant): Bộ ba nền tảng",
    category: "planets",
    summary:
      "Tìm hiểu vai trò của Mặt Trời, Mặt Trăng và Cung Mọc (Ascendant) trong bản đồ sao cá nhân và lý do Cung Mọc đòi hỏi giờ sinh chính xác.",
    order: 1,
    updatedAt: "2026-11-25",
  },
  {
    slug: "personal-planets",
    title: "Sao Thủy, Sao Kim và Sao Hỏa: Các hành tinh cá nhân",
    category: "planets",
    summary:
      "Khám phá ý nghĩa biểu tượng của Sao Thủy, Sao Kim và Sao Hỏa — ba hành tinh cá nhân phản ánh tư duy, giá trị thẩm mỹ và cách hành động.",
    order: 2,
    updatedAt: "2026-11-25",
  },
  {
    slug: "social-and-outer-planets",
    title: "Sao Mộc, Sao Thổ và các hành tinh thế hệ",
    category: "planets",
    summary:
      "Tìm hiểu vai trò của hai hành tinh xã hội Sao Mộc, Sao Thổ cùng ba hành tinh thế hệ Sao Thiên Vương, Sao Hải Vương và Sao Diêm Vương.",
    order: 3,
    updatedAt: "2026-11-25",
  },
] as const;
