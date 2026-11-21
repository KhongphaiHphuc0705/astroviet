# Sprint F6 — Known Gaps Registry

> **Sprint:** F6 — Knowledge Base (MVP, Frontend-only)  
> **Initial Creation:** 2026-11-20 (Milestone F6.2 Closure)  
> **Status:** **ACTIVE TRACKING**  
> **Rule:** Chỉ ghi nhận các gap có bằng chứng kỹ thuật thực tế; không ghi nhận phỏng đoán; trạng thái tuân thủ định nghĩa chuẩn (`OPEN`, `DEFERRED`, `RESOLVED`, `ACCEPTED`).

---

## 1. Phân loại & Quy ước Trạng thái

- **OPEN:** Gap mới phát hiện, chưa có giải pháp hoặc đang chờ xử lý trong các milestone kế tiếp của Sprint F6.
- **DEFERRED:** Gap đã được nhận diện rõ, có kế hoạch xử lý ở một milestone cụ thể sau (ví dụ: F6.4, F6.5, F6.6) hoặc sprint tiếp theo.
- **ACCEPTED:** Gap được Product Owner phê duyệt chấp nhận giữ nguyên ở phạm vi MVP (không sửa ở Sprint F6).
- **RESOLVED:** Gap đã được giải quyết triệt để và có test / bằng chứng xác minh.

---

## 2. Bảng theo dõi Known Gaps (Sprint F6)

| Gap ID       | Tóm tắt Hiện tượng / Khoảng cách Kỹ thuật                                                                                                                                       |         Phân loại         | Milestone Liên quan | Giải pháp / Kế hoạch Xử lý                                                                                                                       | Trạng thái Hiện tại |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-----------------------: | :-----------------: | ------------------------------------------------------------------------------------------------------------------------------------------------ | :-----------------: |
| **KG-F6-01** | Bài viết mẫu `what-is-astrology.md` là bài viết kỹ thuật phục vụ kiểm thử pipeline và content linting, chưa qua hội đồng chuyên môn biên tập nội dung phê duyệt                 |         Nội dung          |        F6.6         | Sẽ được thay thế bằng 15 bài viết chính thức đã được Product Owner phê duyệt tại Milestone F6.6                                                  |    **DEFERRED**     |
| **KG-F6-02** | Hiện tại chỉ có 1 bài viết mẫu trong danh mục `fundamentals`; 4 danh mục còn lại (`planets`, `signs`, `houses`, `aspects`) chưa có bài viết                                     |         Nội dung          |        F6.6         | Hoàn thiện đủ 15 bài viết theo PRD FR-12 tại Milestone F6.6; các bài viết được nạp qua manifest                                                  |    **DEFERRED**     |
| **KG-F6-03** | Ảnh remote/CDN bị từ chối theo chính sách bảo mật D-F6.2-04; việc kiểm tra file ảnh vật lý trong `public/knowledge/images/` và chỉ số CLS chưa triển khai                       |       Media / A11y        |        F6.6         | Triển khai xác minh khi có hình ảnh minh họa thực tế đầu tiên tại Milestone F6.6                                                                 |    **DEFERRED**     |
| **KG-F6-04** | Thẻ Heading sinh từ Markdown chưa tự động gán ID định danh; các liên kết dạng `#anchor` chưa hỗ trợ tại MVP                                                                     |      UI / Điều hướng      |       Backlog       | Giữ nguyên theo quyết định MVP; không tự ý thêm plugin `remark-slug` hay `rehype-slug`                                                           |    **ACCEPTED**     |
| **KG-F6-05** | Dấu hiệu thị giác cho liên kết ngoài (external link icon và thông báo cho trình đọc màn hình "mở trong tab mới") chưa được áp dụng tại tầng Markdown renderer                   |         UI / A11y         |        F6.4         | Triển khai ở mức giao diện trang chi tiết tại Milestone F6.4 theo thiết kế UI Spec                                                               |    **DEFERRED**     |
| **KG-F6-06** | Bộ kiểm tra tác giả Content Lint L1 (HTML thô) và L4 (GFM syntax) sử dụng biểu thức chính quy (regex) tĩnh sau khi bóc tách code block, có thể sót các trường hợp biên phức tạp |      Kiểm thử / Lint      |        F6.2         | Chấp nhận giới hạn của regex tĩnh; được bảo vệ 2 lớp bởi `skipHtml` của `react-markdown` và allow-list components tại runtime                    |    **ACCEPTED**     |
| **KG-F6-07** | Thẻ mạng xã hội `og:image` chưa được hỗ trợ tại phạm vi MVP theo quyết định D-F6-D1                                                                                             |            SEO            |         MVP         | Cấu trúc dữ liệu `KnowledgeSeo` chủ động loại trừ trường `image` để ngăn chặn sinh `og:image` rác hoặc giả mạo                                   |    **ACCEPTED**     |
| **KG-F6-08** | Còn 4 lỗ hổng bảo mật trong các thư viện phụ thuộc production (`axios`, `zod`, `follow-redirects`, `fast-uri`)                                                                  |  An toàn chuỗi cung ứng   |    Baseline F6.0    | Kế thừa từ các sprint trước; `react-markdown@10.1.0` thêm vào không phát sinh bất kỳ lỗ hổng production mới nào; không chạy `npm audit fix` tự ý |    **ACCEPTED**     |
| **KG-F6-09** | Tiêu chí `F6-AC-L5` (kiểm tra trực quan độ dài nhãn góc chiếu "Trùng tụ" so với "Hợp" trên các viewport) giữ trạng thái UNVERIFIED                                              |    Kiểm thử trực quan     |        F6.0b        | Cần bổ sung ảnh chụp màn hình thực tế từ thiết bị/browser để chính thức đóng tiêu chí này                                                        |      **OPEN**       |
| **KG-F6-10** | Hệ thống Prerender, Hydration client, sinh Sitemap.xml, Robots.txt và cấu hình Nginx `try_files` chưa triển khai                                                                |    Hạ tầng / Prerender    |        F6.5         | Sẽ được triển khai toàn diện tại Milestone F6.5 theo phương án kiến trúc P1                                                                      |    **DEFERRED**     |
| **KG-F6-11** | Link `/knowledge/:slug` từ thẻ bài viết trên trang listing dẫn tới NotFound (`*`) tới khi có trang chi tiết                                                                     |      UI / Điều hướng      |        F6.4         | Triển khai route và trang chi tiết bài viết tại Milestone F6.4 (D-F6.3-08)                                                                       |    **DEFERRED**     |
| **KG-F6-12** | Navbar và Footer của MarketingLayout chưa có link trực tiếp tới `/knowledge` (KB-AC-06)                                                                                         |        Điều hướng         |        F6.5         | Cập nhật thanh điều hướng và footer tại Milestone F6.5                                                                                           |    **DEFERRED**     |
| **KG-F6-13** | `document.title` của `/knowledge` vẫn hiển thị "AstroViet" mặc định tới khi tích hợp `usePageMeta`                                                                              |         SEO / UI          |      F6.4/F6.5      | Triển khai cập nhật thẻ meta và title tại F6.4/F6.5                                                                                              |    **DEFERRED**     |
| **KG-F6-14** | Kiểm tra tương phản màu và trải nghiệm đọc màn hình thực tế chưa có ảnh chụp viewport light/dark chính thức từ QA/Owner; KB-AC-13 phần thị giác giữ UNVERIFIED                  | Kiểm thử trực quan / A11y |        F6.3         | Bổ sung bộ ảnh chụp màn hình các breakpoint (320, 375, 768, 1024, 1280) cả 2 theme                                                               |      **OPEN**       |

---

## 3. Tổng kết Trạng thái Gaps

- **Tổng số Gaps được theo dõi:** 14
- **OPEN:** 2 (`KG-F6-09`, `KG-F6-14`)
- **DEFERRED:** 8 (`KG-F6-01`, `KG-F6-02`, `KG-F6-03`, `KG-F6-05`, `KG-F6-10`, `KG-F6-11`, `KG-F6-12`, `KG-F6-13`)
- **ACCEPTED:** 4 (`KG-F6-04`, `KG-F6-06`, `KG-F6-07`, `KG-F6-08`)
- **RESOLVED:** 0
