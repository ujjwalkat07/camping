import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

export function LoadingSpinner({ className = "", size = 32 }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 
        size={size} 
        className="animate-spin text-emerald-600 dark:text-emerald-500" 
      />
    </div>
  );
}
