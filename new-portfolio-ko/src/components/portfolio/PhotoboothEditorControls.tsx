"use client";

import { Grid2X2, Rows3 } from "lucide-react";
import {
  PHOTOBOOTH_FILTERS,
  PHOTOBOOTH_FRAMES,
  type PhotoboothFilter,
  type PhotoboothFrame,
  type PhotoboothLayout,
} from "@/lib/photobooth-export";

type PhotoboothEditorControlsProps = {
  photoCount: number;
  layout: PhotoboothLayout;
  onLayoutChange: (layout: PhotoboothLayout) => void;
  frame: PhotoboothFrame;
  onFrameChange: (frame: PhotoboothFrame) => void;
  filter: PhotoboothFilter;
  onFilterChange: (filter: PhotoboothFilter) => void;
  caption: string;
  onCaptionChange: (caption: string) => void;
};

const optionBase =
  "min-h-11 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors";
const selected = "border-[#eeabd0]/70 bg-[#eeabd0]/12 text-[#fff4fa]";
const unselected =
  "border-white/10 bg-white/[.035] text-[#bac2d2] hover:border-white/30 hover:text-white";
const legend = "mb-2 block text-xs font-semibold text-[#e6e0ef]";

export function PhotoboothEditorControls({
  photoCount,
  layout,
  onLayoutChange,
  frame,
  onFrameChange,
  filter,
  onFilterChange,
  caption,
  onCaptionChange,
}: PhotoboothEditorControlsProps) {
  return (
    <div className="flex flex-col gap-5">
      {photoCount === 4 && (
        <fieldset>
          <legend className={legend}>Print layout</legend>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={layout === "strip"}
              onClick={() => onLayoutChange("strip")}
              className={[
                optionBase,
                "flex items-center justify-center gap-2",
                layout === "strip" ? selected : unselected,
              ].join(" ")}
            >
              <Rows3 size={16} aria-hidden="true" />1 × 4 strip
            </button>
            <button
              type="button"
              aria-pressed={layout === "grid"}
              onClick={() => onLayoutChange("grid")}
              className={[
                optionBase,
                "flex items-center justify-center gap-2",
                layout === "grid" ? selected : unselected,
              ].join(" ")}
            >
              <Grid2X2 size={16} aria-hidden="true" />2 × 2 grid
            </button>
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className={legend}>Paper</legend>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(PHOTOBOOTH_FRAMES) as PhotoboothFrame[]).map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={frame === name}
              onClick={() => onFrameChange(name)}
              className={[
                optionBase,
                "flex items-center justify-start gap-2",
                frame === name ? selected : unselected,
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 shrink-0 rounded-full border border-black/15"
                style={{ backgroundColor: PHOTOBOOTH_FRAMES[name].background }}
              />
              {PHOTOBOOTH_FRAMES[name].label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>Photo filter</legend>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(PHOTOBOOTH_FILTERS) as PhotoboothFilter[]).map(
            (name) => (
              <button
                key={name}
                type="button"
                aria-pressed={filter === name}
                onClick={() => onFilterChange(name)}
                className={[
                  optionBase,
                  filter === name ? selected : unselected,
                ].join(" ")}
              >
                {PHOTOBOOTH_FILTERS[name].label}
              </button>
            ),
          )}
        </div>
      </fieldset>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label
            htmlFor="photobooth-caption"
            className="text-xs font-semibold text-[#e6e0ef]"
          >
            Caption
          </label>
          <span className="font-mono text-[10px] text-[#8792a7]">
            {caption.length}/40
          </span>
        </div>
        <input
          id="photobooth-caption"
          type="text"
          maxLength={40}
          value={caption}
          onChange={(event) => onCaptionChange(event.target.value)}
          placeholder="Add a short message (optional)"
          className="min-h-11 w-full rounded-xl border border-white/15 bg-[#0a0f19] px-3 text-sm text-white placeholder:text-[#788398]"
        />
      </div>
    </div>
  );
}
