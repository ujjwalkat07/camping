"use client";

import Link from "next/link";
import { Heart, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Package } from "@/services/api";

interface PackageCardProps {
  item: Package;
}

export function PackageCard({ item }: PackageCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-[2rem] bg-white border border-neutral-100/80 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-neutral-800/80 dark:bg-neutral-900">
      
      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={item.images[0]}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Rating or Duration Badge in corner */}
        <div className="absolute top-4 left-4 rounded-xl bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm dark:bg-neutral-950/90 dark:text-neutral-200">
          {item.duration}
        </div>
      </div>

      {/* Content overlay styling inspired by screenshots: White curve overlapping the image */}
      <div className="relative -mt-10 rounded-t-[2.5rem] bg-white px-5 pt-6 pb-5 dark:bg-neutral-900 transition-colors">
        
        {/* Floating Heart Icon Button */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="absolute -top-6 right-8 flex size-12 items-center justify-center rounded-full bg-white text-neutral-600 shadow-lg transition-transform hover:scale-105 active:scale-95 dark:bg-neutral-950 dark:text-neutral-300"
        >
          <Heart
            className={`size-5 transition-colors ${
              isLiked ? "fill-rose-500 text-rose-500" : "text-neutral-400 group-hover:text-rose-500"
            }`}
          />
        </button>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs font-medium text-neutral-400 dark:text-neutral-500 mb-1.5">
          <MapPin className="size-3.5 text-emerald-500" />
          <span>{item.location}</span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-neutral-800 text-lg leading-tight mb-2 group-hover:text-emerald-600 transition-colors dark:text-neutral-100">
          {item.name}
        </h3>

        {/* Short description */}
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4 line-clamp-2">
          {item.shortDescription}
        </p>

        <hr className="border-neutral-100 dark:border-neutral-800 mb-4" />

        {/* Price & Action Button */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 block">Starting from</span>
            <span className="text-lg font-extrabold text-neutral-900 dark:text-white">
              ₹{item.price.toLocaleString("en-IN")}
            </span>
          </div>

          <Button asChild size="sm" className="rounded-xl bg-neutral-900 text-white font-medium hover:bg-emerald-600 active:scale-[0.98] transition-all dark:bg-neutral-800 dark:hover:bg-emerald-600">
            <Link href={`/packages/${item.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
