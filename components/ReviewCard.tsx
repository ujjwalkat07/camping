import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Review } from "@/services/api";

interface ReviewCardProps {
  item: Review;
}

export function ReviewCard({ item }: ReviewCardProps) {
  // Generate initials for avatar fallback
  const initials = item.author
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  return (
    <Card className="rounded-[2rem] border border-neutral-100/80 bg-white p-6 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900 transition-all hover:shadow-md">
      <CardContent className="p-0">
        
        {/* Rating Stars */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`size-4 ${
                i < item.rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-neutral-200 dark:text-neutral-700"
              }`}
            />
          ))}
        </div>

        {/* Testimonial Text */}
        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed italic mb-6">
          &ldquo;{item.comment}&rdquo;
        </p>

        <hr className="border-neutral-100 dark:border-neutral-800 mb-4" />

        {/* User Info Row */}
        <div className="flex items-center gap-3">
          <Avatar className="flex size-10 shrink-0 overflow-hidden rounded-full border border-neutral-100 dark:border-neutral-800">
            <AvatarImage
              src={item.avatar}
              alt={item.author}
              className="h-full w-full object-cover"
            />
            <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold dark:bg-emerald-950/50 dark:text-emerald-300">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-100">
              {item.author}
            </h4>
            <span className="text-[11px] text-neutral-400">
              Reviewed on {new Date(item.date).toLocaleDateString("en-US", {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
