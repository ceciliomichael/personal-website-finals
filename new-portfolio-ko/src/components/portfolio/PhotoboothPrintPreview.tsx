"use client";

import { ImagePlus } from "lucide-react";
import {
  getPhotoboothPrintGeometry,
  PHOTOBOOTH_FILTERS,
  PHOTOBOOTH_FRAMES,
  type PhotoboothFilter,
  type PhotoboothFrame,
  type PhotoboothLayout,
} from "@/lib/photobooth-export";

const PRINT_SLOT_IDS = ["print-1", "print-2", "print-3", "print-4"] as const;

type PhotoboothPrintPreviewProps = {
  photos: (string | null)[];
  photoCount: number;
  layout: PhotoboothLayout;
  frame: PhotoboothFrame;
  filter: PhotoboothFilter;
  caption: string;
  selectedSlot: number;
  onSelectSlot: (index: number) => void;
};

export function PhotoboothPrintPreview({
  photos,
  photoCount,
  layout,
  frame,
  filter,
  caption,
  selectedSlot,
  onSelectSlot,
}: PhotoboothPrintPreviewProps) {
  const geometry = getPhotoboothPrintGeometry(
    photoCount,
    layout,
    Boolean(caption.trim()),
  );
  const paper = PHOTOBOOTH_FRAMES[frame];
  const unit = (pixels: number) =>
    `${((pixels / geometry.width) * 100).toFixed(4)}cqw`;
  const previewRatio = (geometry.width / geometry.height).toFixed(5);

  // Container query units keep padding, gaps and footer proportional to the PNG.
  return (
    <section
      aria-label={
        layout === "grid"
          ? "Two by two print preview"
          : "Film strip print preview"
      }
      className="mx-auto shrink-0 overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,.4)]"
      style={{
        width: `min(100%, ${layout === "grid" ? "520px" : "360px"}, calc(min(55dvh, 480px) * ${previewRatio}))`,
        aspectRatio: `${geometry.width} / ${geometry.height}`,
        containerType: "inline-size",
        backgroundColor: paper.background,
        color: paper.foreground,
      }}
    >
      <div
        className="flex h-full min-h-0 flex-col"
        style={{ padding: unit(geometry.padding) }}
      >
        <div
          className="grid w-full shrink-0"
          style={{
            gridTemplateColumns: `repeat(${geometry.columns}, minmax(0, 1fr))`,
            gap: unit(geometry.gap),
          }}
        >
          {PRINT_SLOT_IDS.slice(0, photoCount).map((slotId, index) => (
            <button
              key={slotId}
              type="button"
              aria-label={`Select photo ${index + 1}`}
              aria-pressed={selectedSlot === index}
              onClick={() => onSelectSlot(index)}
              className="group relative block min-w-0 overflow-hidden bg-[#ded5e1] focus-visible:outline-offset-[-2px]"
              style={{
                aspectRatio: `${geometry.photoWidth} / ${geometry.photoHeight}`,
              }}
            >
              {photos[index] ? (
                // Browser object URLs cannot be handled by Next Image optimization.
                // biome-ignore lint/performance/noImgElement: Camera and upload blob URLs.
                <img
                  src={photos[index] ?? undefined}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ filter: PHOTOBOOTH_FILTERS[filter].css }}
                />
              ) : (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[#756b7b]">
                  <ImagePlus size={18} aria-hidden="true" />
                </span>
              )}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 transition-shadow group-hover:shadow-[inset_0_0_0_2px_rgba(221,126,179,.7)]"
                style={{
                  boxShadow:
                    selectedSlot === index
                      ? "inset 0 0 0 2px #dc77ad"
                      : undefined,
                }}
              />
            </button>
          ))}
        </div>
        <div
          className="relative w-full shrink-0"
          style={{ height: unit(geometry.footerHeight) }}
        >
          <span
            className="absolute inset-x-0 block truncate text-center font-display font-semibold tracking-[.03em]"
            style={{
              top: unit(17),
              fontSize: unit(22),
              lineHeight: 1.15,
            }}
          >
            ORBIT BOOTH
          </span>
          {caption.trim() && (
            <span
              className="absolute inset-x-0 block truncate text-center font-sans"
              style={{
                top: unit(47),
                fontSize: unit(18),
                lineHeight: 1.2,
              }}
            >
              {caption.trim()}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
