import { useState, useLayoutEffect, useEffect, type RefObject } from "react";

// Fallback to useEffect for SSR safety if needed, though useLayoutEffect is better for positioning
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function usePosition(
  triggerRef: RefObject<HTMLElement>,
  isOpen: boolean,
) {
  const [styles, setStyles] = useState<{
    top?: number;
    left?: number;
    width?: number;
  }>({});

  useIsomorphicLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      // TODO(Core): Bổ sung logic flip/collision detection để tránh bị che khuất khi ở mép màn hình
      setStyles({
        top: rect.bottom + window.scrollY + 4, // 4px gap below trigger
        left: rect.left + window.scrollX,
        width: rect.width, // Match trigger width for Select comboboxes
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, triggerRef]);

  return styles;
}
