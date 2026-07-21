"use client";

import { useEffect, useState } from "react";
import { api, GalleryItem } from "@/services/api";
import { GalleryCard } from "@/components/GalleryCard";
import { ImageModal } from "@/components/ImageModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Compass } from "lucide-react";

export default function GalleryPage() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [activeImage, setActiveImage] = useState<GalleryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGallery = async () => {
      try {
        setIsLoading(true);
        const data = await api.getGallery();
        setGallery(data);
      } catch (err) {
        console.error("Error loading gallery page:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadGallery();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-neutral-950">
        <LoadingSpinner size={36} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block mb-1">Visual Memories</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white md:text-4xl">Camp & Valley Gallery</h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
          Take a look at real photos taken by fellow campers, guides, and explorers in the Valley of Flowers and Ghangaria base camps.
        </p>
      </div>

      {/* Grid of images */}
      {gallery.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {gallery.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              onClick={(it) => setActiveImage(it)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-[2rem] border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800">
          <Compass className="size-12 text-neutral-300 mb-3" />
          <h3 className="text-lg font-bold text-neutral-800 dark:text-white">No Images Found</h3>
        </div>
      )}

      {/* Image Modal Lightbox */}
      <ImageModal
        item={activeImage}
        isOpen={activeImage !== null}
        onClose={() => setActiveImage(null)}
      />

    </div>
  );
}
