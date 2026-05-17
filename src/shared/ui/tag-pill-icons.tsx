import * as React from "react";
import { Flame, Leaf, Sparkles } from "lucide-react";

export { Flame, Leaf, Sparkles };

export function Thorn({
  className,
  ...props
}: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M3 21 L21 3" />
      <path d="M12 12 L8 8" />
      <path d="M12 12 L16 8" />
      <path d="M12 12 L8 16" />
    </svg>
  );
}
