import * as React from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = {
  primary: "bg-[#818CF8] text-[#0A0A0F] hover:bg-[#bdc2ff] glow-shadow",
  secondary: "bg-[#1C1C23] text-white hover:bg-[#242430] border border-[#242430]",
  outline: "bg-transparent text-white border border-[#242430] hover:border-[#3F3F4E] hover:bg-[rgba(129,140,248,0.05)]",
  ghost: "bg-transparent text-white hover:bg-[#1C1C23]",
};

export const buttonSizes = {
  default: "h-12 px-6 rounded-[10px] text-[15px]",
  lg: "h-14 px-10 rounded-[14px] text-[16px]",
  sm: "h-10 px-4 rounded-md text-[14px]",
};

export const buttonBase = "inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none";

export function getButtonClasses(variant: keyof typeof buttonVariants = "primary", size: keyof typeof buttonSizes = "default", className?: string) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={getButtonClasses(variant, size, className)}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
