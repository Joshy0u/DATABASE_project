import * as React from "react";
import { cn } from "../../lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200/50",
        "disabled:opacity-50 disabled:pointer-events-none",
        variant === "default" && "bg-zinc-50 text-zinc-950 hover:bg-zinc-200",
        variant === "secondary" && "bg-zinc-800 text-zinc-50 hover:bg-zinc-700",
        className,
      )}
      {...props}
    />
  );
}

