"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const closeRef = useRef<HTMLButtonElement>(null);
  const mainButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    thumbRefs.current[selectedIndex]?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  }, [selectedIndex]);

  const step = useCallback(
    (direction: 1 | -1) => {
      setSelectedIndex((value) => (value + direction + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    const mainButton = mainButtonRef.current;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      mainButton?.focus();
    };
  }, [lightboxOpen, step]);

  if (!images.length) return null;
  const selectedImage = images[selectedIndex] ?? images[defaultIndex];

  return (
    <div className="product-gallery">
      <button
        type="button"
        ref={mainButtonRef}
        onClick={() => setLightboxOpen(true)}
        className="product-gallery-main relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-none bg-white"
        aria-label={`Enlarge image of ${title}`}
      >
        <Image
          src={selectedImage.src}
          alt={`${title} main view`}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain"
          preload
        />
      </button>
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
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[3000] bg-black"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} image viewer`}
          onClick={() => setLightboxOpen(false)}
        >
          <Image
            src={selectedImage.src}
            alt={`${title} enlarged view`}
            fill
            sizes="100vw"
            className="object-contain"
          />
          <button
            type="button"
            ref={closeRef}
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center bg-black/60 text-3xl leading-none text-white"
            aria-label="Close image viewer"
          >
            ×
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); step(-1); }}
                className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center bg-black/60 text-3xl leading-none text-white"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); step(1); }}
                className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center bg-black/60 text-3xl leading-none text-white"
                aria-label="Next image"
              >
                ›
              </button>
              <span className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 bg-black/60 px-3 py-1 text-xs text-white">
                {selectedIndex + 1} / {images.length}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
