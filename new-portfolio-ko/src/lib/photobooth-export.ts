export const PHOTOBOOTH_FRAMES = {
  cream: { label: "Cream", background: "#FFF4E9", foreground: "#47394D" },
  blush: { label: "Blush", background: "#F5DCE8", foreground: "#56364C" },
  midnight: { label: "Midnight", background: "#25202F", foreground: "#FAEFF6" },
  white: { label: "White", background: "#FFFFFF", foreground: "#3D3545" },
} as const;

export type PhotoboothFrame = keyof typeof PHOTOBOOTH_FRAMES;

export const PHOTOBOOTH_FILTERS = {
  original: { label: "Original", css: "none" },
  mono: { label: "B&W", css: "grayscale(1)" },
  vintage: {
    label: "Vintage",
    css: "sepia(0.45) saturate(0.8) contrast(0.95)",
  },
} as const;

export type PhotoboothFilter = keyof typeof PHOTOBOOTH_FILTERS;

/** The camera, print preview, and PNG output all use a 4:3 photo frame. */
export const PHOTO_ASPECT_RATIO = 4 / 3;

export type PhotoboothLayout = "strip" | "grid";

export function getPhotoboothPrintGeometry(
  photoCount: number,
  layout: PhotoboothLayout,
  hasCaption: boolean,
) {
  const effectiveLayout = photoCount === 4 ? layout : "strip";
  const columns = effectiveLayout === "grid" ? 2 : 1;
  const rows = Math.ceil(photoCount / columns);
  const width = effectiveLayout === "grid" ? 900 : 640;
  const padding = 30;
  const gap = 14;
  const photoWidth = (width - padding * 2 - (columns - 1) * gap) / columns;
  const photoHeight = Math.round(photoWidth / PHOTO_ASPECT_RATIO);
  const footerHeight = hasCaption ? 95 : 68;
  const height =
    padding * 2 + rows * photoHeight + (rows - 1) * gap + footerHeight;

  return {
    columns,
    rows,
    width,
    height,
    padding,
    gap,
    photoWidth,
    photoHeight,
    footerHeight,
  };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("A photo could not be loaded."));
    image.src = url;
  });
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = width / height;

  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;

  if (sourceRatio > targetRatio) {
    cropWidth = sourceHeight * targetRatio;
  } else {
    cropHeight = sourceWidth / targetRatio;
  }

  context.drawImage(
    image,
    (sourceWidth - cropWidth) / 2,
    (sourceHeight - cropHeight) / 2,
    cropWidth,
    cropHeight,
    x,
    y,
    width,
    height,
  );
}

export async function exportPhotoboothPng(
  imageUrls: string[],
  frame: PhotoboothFrame,
  filter: PhotoboothFilter,
  caption: string,
  layout: PhotoboothLayout,
): Promise<Blob> {
  if (imageUrls.length < 1 || imageUrls.length > 4) {
    throw new Error("Choose between one and four photos to save.");
  }
  if (layout === "grid" && imageUrls.length !== 4) {
    throw new Error("A 2 × 2 grid needs four photos.");
  }

  const images = await Promise.all(imageUrls.map(loadImage));
  const paper = PHOTOBOOTH_FRAMES[frame];
  const {
    columns,
    rows,
    width,
    height,
    padding,
    gap,
    photoWidth,
    photoHeight,
  } = getPhotoboothPrintGeometry(
    images.length,
    layout,
    Boolean(caption.trim()),
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser could not create the photo strip.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = paper.background;
  context.fillRect(0, 0, width, height);

  context.filter = PHOTOBOOTH_FILTERS[filter].css;
  for (const [index, image] of images.entries()) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    drawCover(
      context,
      image,
      padding + column * (photoWidth + gap),
      padding + row * (photoHeight + gap),
      photoWidth,
      photoHeight,
    );
  }
  context.filter = "none";

  const footerTop = padding + rows * photoHeight + (rows - 1) * gap;
  context.fillStyle = paper.foreground;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = '600 22px "Space Grotesk", sans-serif';
  context.fillText("ORBIT BOOTH", width / 2, footerTop + 29);

  if (caption.trim()) {
    context.font = '18px "DM Sans", sans-serif';
    context.fillText(caption.trim(), width / 2, footerTop + 59, width - 60);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not save the print as a PNG."));
      }
    }, "image/png");
  });
}
