export const INTERPRETATION_COPY = {
  panelTitle: "Diễn giải",
  navigationLabel: "Các nhóm diễn giải",
  groups: {
    core: "Cốt lõi",
    planets: "Các hành tinh",
  },
  parts: {
    bySign: "Theo cung",
    byHouse: "Theo nhà",
  },
  houseDataUnavailable:
    "Dữ liệu Nhà và một số góc trong lá số này chưa khả dụng. Bạn vẫn có thể xem các diễn giải theo cung.",
  coverage:
    "Diễn giải góc chiếu và nhận định tổng hợp toàn lá số hiện chưa có nội dung.",
  disclaimer:
    "Chiêm tinh là một góc nhìn để bạn khám phá và suy ngẫm về bản thân, không phải kết luận tuyệt đối về con người hay tương lai. Hãy đón nhận những nội dung phù hợp với trải nghiệm của chính bạn.",
  unpublished: "Nội dung diễn giải chưa được phát hành",
  itemMissing: "Chưa có nội dung cho mục này",
  ascendantUnavailable: "Cung Mọc chưa khả dụng cho lá số này.",
  unavailable: "Hiện chưa thể hiển thị diễn giải cho lá số này.",
} as const;

export function formatCount(count: number): string {
  return `Có ${count} diễn giải cho lá số này`;
}

export function formatHouseLabel(houseNumber: number): string {
  return `Nhà ${houseNumber}`;
}
import type { InterpretationGroupId } from "../../model/interpretation";

export function getInterpretationGroupHeadingId(
  id: InterpretationGroupId,
): string {
  return `interpretation-group-${id}`;
}
