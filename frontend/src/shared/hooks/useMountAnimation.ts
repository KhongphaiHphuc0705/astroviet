import { useState, useEffect } from "react";

export type AnimationState = "closed" | "open" | "closing";

export function useMountAnimation(isOpen: boolean, duration: number = 320) {
  const [state, setState] = useState<AnimationState>(
    isOpen ? "open" : "closed",
  );

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("open");
    } else {
      setState((prev) => {
        if (prev === "open" || prev === "closing") {
          timeout = setTimeout(() => {
            setState("closed");
          }, duration);
          return "closing";
        }
        return prev;
      });
    }

    return () => clearTimeout(timeout);
  }, [isOpen, duration]);

  return state;
}
