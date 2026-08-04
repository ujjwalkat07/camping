import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

export function LoadingSpinner({ className = "", size = 32 }: LoadingSpinnerProps) {
  const hasTextColor = /\btext-/.test(className);
  const defaultColorClass = hasTextColor ? "" : "text-emerald-600 dark:text-emerald-500";

  return (
    <div className="inline-flex items-center justify-center shrink-0">
      <Loader2 
        size={size} 
        className={`animate-spin ${defaultColorClass} ${className}`.trim()} 
      />
    </div>
  );
}
