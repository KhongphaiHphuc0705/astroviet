import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // Add custom typography sizes so they don't conflict with text colors
      "font-size": [
        {
          text: [
            "body-xs",
            "body-sm",
            "body-md",
            "body-lg",
            "heading-sm",
            "heading-md",
            "heading-lg",
            "heading-xl",
            "display-sm",
            "display-md",
            "display-lg",
            "display-xl",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
