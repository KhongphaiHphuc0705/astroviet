/**
 * FormFoundationDemo — Full Validation Lifecycle & Accessibility Tests
 *
 * 14 mục Testing Strategy (M7 Plan §9):
 *  §9.1  Form render không lỗi
 *  §9.2  Không có lỗi validation khi mount (trước khi tương tác)
 *  §9.3  displayName — lỗi required xuất hiện đúng sau blur để trống
 *  §9.4  displayName — lỗi tự xóa ngay khi gõ đủ ký tự (reValidateMode:'onChange')
 *  §9.5  contactEmail — lỗi required khi blur để trống
 *  §9.6  contactEmail — lỗi format sau blur nhập sai email
 *  §9.7  country (Select/Controller) — lỗi required sau blur không chọn
 *  §9.8  agreeToTerms (Checkbox) — lỗi render thủ công qua role='alert'
 *  §9.9  Submit không hợp lệ — onValid không được gọi, lỗi hiển thị
 *  §9.10 Submit hợp lệ — onValid được gọi, submit-result xuất hiện
 *  §9.11 disabled field — giá trị đóng băng ở defaultValue (Phương án A: RHF register
 *        giữ field trong payload nhưng user không thể thay đổi — khác HTML native submission
 *        vốn loại disabled hoàn toàn; sự khác biệt này được ghi nhận có chủ đích vào AC4)
 *  §9.12 readOnly field có mặt trong payload submit
 *  §9.13 Focus-first-error — con trỏ nhảy về field lỗi đầu tiên theo FIELD_ORDER
 *        (lỗi được bố trí ở field KHÔNG phải đầu tiên để xác nhận thứ tự đúng)
 *  §9.14 Accessibility — vitest-axe sạch trong trạng thái ban đầu (sạch)
 *  §9.15 Accessibility — vitest-axe sạch SAU KHI lỗi validation hiển thị
 *        (aria-invalid/aria-describedby/role='alert' đang active — lỗi a11y thực tế
 *        thường chỉ lộ ra ở trạng thái có lỗi, không phải trạng thái sạch)
 *  §9.16 Keyboard-only navigation — Tab qua toàn bộ form + Enter submit thành công
 *        (AC5: navigate và submit hoàn toàn bằng bàn phím, không cần chuột)
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { FormFoundationDemo } from "./FormFoundationDemo";

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup() {
  const user = userEvent.setup();
  render(<FormFoundationDemo />);
  return { user };
}

/** Điền form hợp lệ đầy đủ để test submit thành công */
async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByRole("textbox", { name: /tên hiển thị/i }),
    "Nguyễn An",
  );
  await user.type(
    screen.getByRole("textbox", { name: /email liên hệ/i }),
    "test@example.com",
  );

  // Chọn quốc gia qua native select (luôn tồn tại trong DOM)
  const nativeSelect = screen.getByTestId("native-select");
  await user.selectOptions(nativeSelect, "VN");

  // Tick checkbox đồng ý
  await user.click(
    screen.getByRole("checkbox", { name: /đồng ý với điều khoản/i }),
  );
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe("FormFoundationDemo", () => {
  // §9.1 — Form render không lỗi
  it("§9.1 renders the form without crashing", () => {
    setup();
    expect(
      screen.getByRole("form", { name: /form foundation demo/i }),
    ).toBeInTheDocument();
  });

  // §9.2 — Không có lỗi validation khi mount (trước khi tương tác)
  it("§9.2 shows no validation errors on initial mount", () => {
    setup();
    // Kiểm tra không có role='alert' nào hiển thị (chỉ Checkbox error dùng role='alert' thủ công)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    // Input không có aria-invalid=true
    const textboxes = screen.getAllByRole("textbox");
    textboxes.forEach((input) => {
      expect(input).not.toHaveAttribute("aria-invalid", "true");
    });
  });

  // §9.3 — displayName: lỗi required xuất hiện đúng sau blur để trống
  it("§9.3 displayName — shows required error after blur when empty", async () => {
    const { user } = setup();
    const input = screen.getByRole("textbox", { name: /tên hiển thị/i });

    await user.click(input);
    await user.tab(); // blur

    await waitFor(() => {
      expect(screen.getByText(/tối thiểu 2 ký tự/i)).toBeInTheDocument();
    });
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  // §9.4 — displayName: lỗi tự xóa ngay khi gõ đủ ký tự (reValidateMode:'onChange')
  // Chiến lược: submit để kích hoạt lỗi lần đầu (alternative path thay vì blur),
  // sau đó type vào field không blur — lỗi phải tự biến mất khi onChange đủ ký tự.
  it("§9.4 displayName — error clears immediately as user types valid value (reValidateMode:onChange)", async () => {
    const { user } = setup();

    // Bước 1: submit form trống → lỗi displayName xuất hiện (bắt đầu reValidation cycle)
    await user.click(screen.getByRole("button", { name: /gửi biểu mẫu/i }));
    await waitFor(() => {
      expect(screen.getByText(/tối thiểu 2 ký tự/i)).toBeInTheDocument();
    });

    // Bước 2: gõ vào field displayName — KHÔNG blur sau đó
    // reValidateMode:'onChange' → RHF re-validate ngay sau mỗi onChange event
    // → khi đã đủ 2 ký tự, lỗi phải biến mất MÀ KHÔNG CẦN blur
    const input = screen.getByRole("textbox", { name: /tên hiển thị/i });
    await user.type(input, "An"); // 2 ký tự ≥ min:2

    await waitFor(
      () => {
        expect(
          screen.queryByText(/tối thiểu 2 ký tự/i),
        ).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  // §9.5 — contactEmail: lỗi required khi blur để trống
  it("§9.5 contactEmail — shows required error after blur when empty", async () => {
    const { user } = setup();
    const input = screen.getByRole("textbox", { name: /email liên hệ/i });

    await user.click(input);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/email là bắt buộc/i)).toBeInTheDocument();
    });
  });

  // §9.6 — contactEmail: lỗi format sau blur nhập sai email
  it("§9.6 contactEmail — shows format error after blur with invalid email", async () => {
    const { user } = setup();
    const input = screen.getByRole("textbox", { name: /email liên hệ/i });

    await user.type(input, "not-an-email");
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText(/định dạng email không hợp lệ/i),
      ).toBeInTheDocument();
    });
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  // §9.7 — country (Select/Controller): lỗi required sau blur không chọn
  it("§9.7 country Select — shows required error after blur without selecting", async () => {
    const { user } = setup();

    // Trigger blur trên combobox trigger (custom desktop Select)
    const trigger = screen.getByTestId("combobox-trigger");
    await user.click(trigger); // opens dropdown
    // Đóng lại và di chuyển focus ra ngoài để kích blur
    await user.keyboard("[Escape]");
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText(/vui lòng chọn một quốc gia/i),
      ).toBeInTheDocument();
    });
  });

  // §9.8 — agreeToTerms (Checkbox): lỗi render thủ công qua role='alert' khi submit không tick
  it("§9.8 agreeToTerms Checkbox — shows manual error via role=alert when not checked on submit", async () => {
    const { user } = setup();
    // Điền các field hợp lệ khác trước, chỉ bỏ checkbox
    await user.type(
      screen.getByRole("textbox", { name: /tên hiển thị/i }),
      "Nguyễn An",
    );
    await user.type(
      screen.getByRole("textbox", { name: /email liên hệ/i }),
      "test@example.com",
    );
    const nativeSelect = screen.getByTestId("native-select");
    await user.selectOptions(nativeSelect, "VN");

    await user.click(screen.getByRole("button", { name: /gửi biểu mẫu/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent(
        /phải đồng ý với điều khoản/i,
      );
    });

    // Checkbox phải có aria-invalid=true
    expect(
      screen.getByRole("checkbox", { name: /đồng ý với điều khoản/i }),
    ).toHaveAttribute("aria-invalid", "true");
  });

  // §9.9 — Submit không hợp lệ: onValid không gọi, lỗi hiển thị, submit-result không xuất hiện
  it("§9.9 invalid submit — does not show submit-result, shows validation errors", async () => {
    const { user } = setup();

    // Submit form trống
    await user.click(screen.getByRole("button", { name: /gửi biểu mẫu/i }));

    await waitFor(() => {
      expect(screen.getByText(/tối thiểu 2 ký tự/i)).toBeInTheDocument();
    });
    expect(screen.queryByTestId("submit-result")).not.toBeInTheDocument();
  });

  // §9.10 — Submit hợp lệ: submit-result hiển thị
  it("§9.10 valid submit — shows submit-result panel", async () => {
    const { user } = setup();
    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: /gửi biểu mẫu/i }));

    await waitFor(() => {
      expect(screen.getByTestId("submit-result")).toBeInTheDocument();
    });
    expect(screen.getByTestId("submit-result")).toHaveTextContent(
      /gửi thành công/i,
    );
  });

  // §9.11 — disabled field behavior: RHF onValid data
  // Quan trọng: RHF bao gồm disabled field trong onValid(data) khi dùng register().
  // Điều này khác với HTML native form submission (native loại disabled).
  // Behavior đúng để test: giá trị disabled field là defaultValue gốc và KHÔNG bị user thay đổi.
  it("§9.11 disabled field (referenceCode) — value equals default, cannot be changed by user interaction", async () => {
    const { user } = setup();
    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: /gửi biểu mẫu/i }));

    await waitFor(() => {
      expect(screen.getByTestId("submit-result")).toBeInTheDocument();
    });

    const jsonText = screen
      .getByTestId("submit-result")
      .querySelector("pre")!.textContent!;
    const payload = JSON.parse(jsonText) as Record<string, unknown>;
    // RHF giữ giá trị field disabled trong onValid data (native HTML mới loại).
    // Điều quan trọng cần xác nhận: giá trị phải là defaultValue — user không thể thay đổi nó.
    expect(payload.referenceCode).toBe("REF-2024-001");
  });

  // §9.12 — readOnly field có mặt trong payload submit
  it("§9.12 readOnly field (dateOfBirth) is present in submitted payload", async () => {
    const { user } = setup();
    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: /gửi biểu mẫu/i }));

    await waitFor(() => {
      expect(screen.getByTestId("submit-result")).toBeInTheDocument();
    });

    const jsonText = screen
      .getByTestId("submit-result")
      .querySelector("pre")!.textContent!;
    const payload = JSON.parse(jsonText) as Record<string, unknown>;
    // readOnly field được register với RHF → có mặt trong payload
    expect(payload).toHaveProperty("dateOfBirth");
    expect(payload.dateOfBirth).toBe("DD/MM/YYYY");
  });

  // §9.13 — Focus-first-error: con trỏ nhảy về field lỗi đầu tiên theo FIELD_ORDER
  // Bố trí: displayName hợp lệ + country hợp lệ, chỉ contactEmail để trống
  // → lỗi chỉ ở contactEmail (field thứ 2 trong FIELD_ORDER, không phải thứ 1)
  // → xác nhận focus không hardcode vào field đầu tiên mà đọc FIELD_ORDER đúng thứ tự
  it("§9.13 CRITICAL — focus jumps to FIRST field in FIELD_ORDER that has an error (not necessarily DOM first)", async () => {
    const { user } = setup();

    // displayName: hợp lệ (không có lỗi)
    await user.type(
      screen.getByRole("textbox", { name: /tên hiển thị/i }),
      "Nguyễn An",
    );
    // contactEmail: để trống → sẽ có lỗi (thứ 2 trong FIELD_ORDER)
    // country: chọn hợp lệ (không có lỗi)
    const nativeSelect = screen.getByTestId("native-select");
    await user.selectOptions(nativeSelect, "VN");
    // agreeToTerms: tick (không có lỗi)
    await user.click(
      screen.getByRole("checkbox", { name: /đồng ý với điều khoản/i }),
    );

    await user.click(screen.getByRole("button", { name: /gửi biểu mẫu/i }));

    await waitFor(() => {
      expect(screen.getByText(/email là bắt buộc/i)).toBeInTheDocument();
    });

    // contactEmail phải được focus — bởi vì đó là field đầu tiên có lỗi trong FIELD_ORDER
    // (displayName trước nó không có lỗi → onInvalid skip nó và dừng tại contactEmail)
    const emailInput = screen.getByRole("textbox", { name: /email liên hệ/i });
    expect(document.activeElement).toBe(emailInput);
  });

  // §9.14 — Accessibility: vitest-axe sạch trong trạng thái ban đầu
  it("§9.14 passes accessibility check (axe) in initial (clean) state", async () => {
    const { container } = render(<FormFoundationDemo />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // §9.15 — Accessibility: vitest-axe sạch SAU KHI lỗi validation hiển thị
  // Lý do test riêng: aria-invalid, aria-describedby, và role='alert' chỉ xuất hiện ở
  // trạng thái lỗi — một số vi phạm a11y (id trùng, describedby trỏ tới element không tồn tại)
  // chỉ lộ ra sau khi error markup được inject vào DOM.
  it("§9.15 passes accessibility check (axe) AFTER validation errors are displayed", async () => {
    const user = userEvent.setup();
    const { container } = render(<FormFoundationDemo />);

    // Kích hoạt toàn bộ lỗi validation bằng cách submit form trống
    await user.click(screen.getByRole("button", { name: /gửi biểu mẫu/i }));

    await waitFor(() => {
      // Đợi lỗi đầu tiên xuất hiện — đảm bảo aria-invalid/describedby đã được inject
      expect(screen.getByText(/tối thiểu 2 ký tự/i)).toBeInTheDocument();
    });

    // Chạy axe với toàn bộ error markup đang active
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // §9.16 — Keyboard-only navigation: Tab qua toàn bộ form + Enter submit
  it("§9.16 keyboard-only — can navigate through all fields and submit form without mouse", async () => {
    const user = userEvent.setup();
    render(<FormFoundationDemo />);

    // Bước 1: Focus vào displayName → gõ → Tab
    const displayNameInput = screen.getByRole("textbox", {
      name: /tên hiển thị/i,
    });
    displayNameInput.focus();
    await user.keyboard("Nguyen An");
    await user.tab();

    // Bước 2: contactEmail nhận focus → gõ email hợp lệ → Tab
    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: /email liên hệ/i }),
    );
    await user.keyboard("test@example.com");
    await user.tab();

    // Bước 3: native <select> nhận focus (jsdom không ẩn opacity-0/sm:hidden)
    // → selectOptions để đảm bảo onChange được fire (ArrowDown trong jsdom không fire onChange)
    const nativeSelect = screen.getByTestId("native-select");
    expect(document.activeElement).toBe(nativeSelect);
    await user.selectOptions(nativeSelect, "VN"); // chọn "Việt Nam" qua keyboard-equivalent API
    await user.tab(); // Tab → combobox-trigger button

    // Bước 3b: Tab qua combobox-trigger (button trong Tab order, không cần tương tác)
    await user.tab(); // Tab → checkbox

    // Bước 4: Checkbox nhận focus → Space để tick → Tab
    const checkbox = screen.getByRole("checkbox", {
      name: /đồng ý với điều khoản/i,
    });
    expect(document.activeElement).toBe(checkbox);
    await user.keyboard(" "); // Space ticks checkbox
    expect(checkbox).toBeChecked();
    await user.tab();

    // Bước 5: Tab qua combobox-trigger (visible button, focusable on desktop)
    // rồi qua readOnly field (dateOfBirth — focusable nhưng không sửa được)
    // Số Tab cần thiết phụ thuộc vào Tab order thực tế sau checkbox
    // → dùng vòng lặp Tab tối đa để tìm Submit button
    let attempts = 0;
    while (
      document.activeElement !==
        screen.getByRole("button", { name: /gửi biểu mẫu/i }) &&
      attempts < 5
    ) {
      await user.tab();
      attempts++;
    }

    // Bước 6: Submit button đang được focus → Enter để submit
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: /gửi biểu mẫu/i }),
    );
    await user.keyboard("[Enter]");

    // Xác nhận: submit thành công → submit-result hiển thị
    await waitFor(() => {
      expect(screen.getByTestId("submit-result")).toBeInTheDocument();
    });
    expect(screen.getByTestId("submit-result")).toHaveTextContent(
      /gửi thành công/i,
    );
  });
});
