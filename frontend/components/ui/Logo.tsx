import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string;
}

export function Logo({ className, href = "/" }: LogoProps) {
  return (
    <Link 
      href={href} 
      className={cn("text-2xl font-bold tracking-tight text-white select-none", className)}
    >
      Busl<span className="text-[#818CF8]">i</span>ngo
    </Link>
  );
}
