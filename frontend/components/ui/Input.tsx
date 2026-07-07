import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-[10px] border border-[#242430] bg-[#1C1C23] px-4 py-2 text-[15px] text-white transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#52525B] focus-visible:outline-none focus-visible:border-[#818CF8] disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0AB]">
            {icon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
