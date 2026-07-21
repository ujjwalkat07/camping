import { ZoomIn } from "lucide-react";
import { GalleryItem } from "@/services/api";

interface GalleryCardProps {
  item: GalleryItem;
  onClick: (item: GalleryItem) => void;
}

export function GalleryCard({ item, onClick }: GalleryCardProps) {
  return (
    <div
      onClick={() => onClick(item)}
      className="group relative cursor-pointer overflow-hidden rounded-[2rem] border border-neutral-100/50 bg-neutral-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-800/50 dark:bg-neutral-900"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden sm:aspect-[4/3] md:aspect-video lg:aspect-[4/3]">
        <img
          src={item.url}
          alt={item.caption}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover overlay with zoom icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex size-12 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-md backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            <ZoomIn className="size-5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Caption footer overlay */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <p className="text-xs text-white font-medium leading-snug line-clamp-2">
          {item.caption}
        </p>
      </div>
    </div>
  );
}
