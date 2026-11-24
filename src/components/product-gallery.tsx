"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface ProductImage {
  src: string;
  is_default?: boolean;
}

interface ProductGalleryProps {
  title: string;
  images: ProductImage[];
}

export function ProductGallery({ title, images }: ProductGalleryProps) {
  const defaultIndex =
    images.findIndex((item) => item.is_default) >= 0
      ? images.findIndex((item) => item.is_default)
      : 0;

  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    thumbRefs.current[selectedIndex]?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  }, [selectedIndex]);

  if (!images.length) return null;
  const selectedImage = images[selectedIndex] ?? images[defaultIndex];

  return (
    <div className="product-gallery">
      <div className="product-gallery-main relative aspect-[4/3] overflow-hidden rounded-none bg-white">
        <Image
          src={selectedImage.src}
          alt={`${title} main view`}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain"
          preload
        />
      </div>
      {images.length > 1 && (
        <div className="product-gallery-thumbnails mt-4 flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              type="button"
              ref={(element) => { thumbRefs.current[index] = element; }}
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-none bg-white border sm:w-24 ${
                index === selectedIndex
                  ? "border-emerald-700"
                  : "border-transparent hover:border-black/20"
              }`}
              aria-pressed={index === selectedIndex}
              aria-label={`Show image ${index + 1} for ${title}`}
            >
              <Image
                src={image.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 10vw, 25vw"
                className="object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
