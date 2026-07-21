"use client";

import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { GalleryItem } from "@/services/api";

interface ImageModalProps {
  item: GalleryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageModal({ item, isOpen, onClose }: ImageModalProps) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl border-none bg-black/95 p-0 text-white shadow-2xl backdrop-blur-md overflow-hidden rounded-[2rem] outline-none">
        
        {/* Accessible DialogTitle */}
        <DialogTitle className="sr-only">
          {item.caption || "Image preview"}
        </DialogTitle>

        {/* Modal Body */}
        <div className="relative flex flex-col">
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 flex size-9 items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>

          {/* Large Image */}
          <div className="relative aspect-video w-full max-h-[80vh] overflow-hidden bg-neutral-950">
            <img
              src={item.url}
              alt={item.caption}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Caption footer info */}
          {item.caption && (
            <div className="bg-neutral-900 px-6 py-4 text-center text-sm font-medium text-neutral-300 border-t border-neutral-800">
              {item.caption}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
