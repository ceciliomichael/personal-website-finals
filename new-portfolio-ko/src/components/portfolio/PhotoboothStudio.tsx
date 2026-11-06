"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Download,
  ImagePlus,
  LoaderCircle,
  RotateCcw,
  Trash2,
  VideoOff,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  exportPhotoboothPng,
  PHOTO_ASPECT_RATIO,
  type PhotoboothFilter,
  type PhotoboothFrame,
  type PhotoboothLayout,
} from "@/lib/photobooth-export";
import { PhotoboothEditorControls } from "./PhotoboothEditorControls";
import { PhotoboothPrintPreview } from "./PhotoboothPrintPreview";

const SLOT_IDS = ["slot-1", "slot-2", "slot-3", "slot-4"] as const;
const COUNTDOWN_OPTIONS = [0, 3, 5, 10] as const;
type CountdownSeconds = (typeof COUNTDOWN_OPTIONS)[number];

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-[#ebe8f7] transition-colors hover:border-[#f0a6d2]/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40";
const selectedChoice = "border-[#f0a6d2]/70 bg-[#f0a6d2]/15 text-white";
const normalChoice =
  "border-white/12 bg-white/5 text-[#bdc5da] hover:border-white/30";
const legendClass =
  "mb-2 block font-mono text-[10px] tracking-[.12em] text-[#c0b6d3] uppercase";

export function PhotoboothStudio() {
  const [stage, setStage] = useState<"capture" | "edit">("capture");
  const [photoCount, setPhotoCount] = useState(4);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [photos, setPhotos] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [frame, setFrame] = useState<PhotoboothFrame>("cream");
  const [printLayout, setPrintLayout] = useState<PhotoboothLayout>("strip");
  const [filter, setFilter] = useState<PhotoboothFilter>("original");
  const [caption, setCaption] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<CountdownSeconds>(3);
  const [captureMode, setCaptureMode] = useState<"single" | "strip">("strip");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentShot, setCurrentShot] = useState<number | null>(null);
  const [flashCount, setFlashCount] = useState(0);
  const [saveBusy, setSaveBusy] = useState(false);
  const [message, setMessage] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraRequestRef = useRef(0);
  const cameraPendingRef = useRef(false);
  const captureRunRef = useRef(0);
  const captureBusyRef = useRef(false);
  const captureTimerRef = useRef<number | null>(null);
  const captureWaitResolveRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);
  const photoUrlsRef = useRef<(string | null)[]>([null, null, null, null]);

  const cancelCapture = useCallback(() => {
    captureRunRef.current += 1;
    if (captureTimerRef.current !== null) {
      window.clearTimeout(captureTimerRef.current);
      captureTimerRef.current = null;
    }
    captureWaitResolveRef.current?.();
    captureWaitResolveRef.current = null;
    captureBusyRef.current = false;
    setCaptureBusy(false);
    setCountdown(null);
    setCurrentShot(null);
  }, []);

  const stopCamera = useCallback(() => {
    cancelCapture();
    cameraRequestRef.current += 1;
    cameraPendingRef.current = false;
    for (const track of cameraStreamRef.current?.getTracks() ?? []) {
      track.stop();
    }
    cameraStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setCameraBusy(false);
  }, [cancelCapture]);

  const startCamera = useCallback(async () => {
    if (cameraPendingRef.current || cameraStreamRef.current) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(
        "Camera access requires HTTPS or localhost and a supported browser. You can still upload photos.",
      );
      return;
    }

    const request = ++cameraRequestRef.current;
    cameraPendingRef.current = true;
    setCameraBusy(true);
    setMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", width: { ideal: 1280 } },
      });

      if (request !== cameraRequestRef.current || !videoRef.current) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        return;
      }

      cameraStreamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      if (request === cameraRequestRef.current && mountedRef.current) {
        setCameraActive(true);
      }
    } catch {
      if (request === cameraRequestRef.current) {
        stopCamera();
        setMessage(
          "Camera unavailable or permission denied. Allow camera access in your browser or upload photos instead.",
        );
      }
    } finally {
      if (request === cameraRequestRef.current) {
        cameraPendingRef.current = false;
        setCameraBusy(false);
      }
    }
  }, [stopCamera]);

  // The camera starts on entry and on return from editing, without a click.
  useEffect(() => {
    if (stage === "capture") {
      void startCamera();
    } else {
      stopCamera();
    }
  }, [stage, startCamera, stopCamera]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        stopCamera();
      } else if (stage === "capture") {
        void startCamera();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [stage, startCamera, stopCamera]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      captureRunRef.current += 1;
      if (captureTimerRef.current !== null) {
        window.clearTimeout(captureTimerRef.current);
      }
      captureWaitResolveRef.current?.();
      cameraRequestRef.current += 1;
      cameraPendingRef.current = false;

      for (const track of cameraStreamRef.current?.getTracks() ?? []) {
        track.stop();
      }
      cameraStreamRef.current = null;

      for (const url of photoUrlsRef.current) {
        if (url) URL.revokeObjectURL(url);
      }
    };
  }, []);

  function replacePhoto(index: number, url: string | null) {
    const updated = [...photoUrlsRef.current];
    const previous = updated[index];
    updated[index] = url;
    photoUrlsRef.current = updated;
    setPhotos(updated);

    if (previous && previous !== url) {
      URL.revokeObjectURL(previous);
    }
    setMessage("");
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (captureBusyRef.current || files.length === 0) return;

    if (
      files.some(
        (file) => !file.type.startsWith("image/") || file.size > MAX_FILE_BYTES,
      )
    ) {
      setMessage("Choose image files smaller than 15 MB each.");
      return;
    }

    const updated = [...photoUrlsRef.current];
    const replaced: string[] = [];
    const incoming = files.slice(0, photoCount);

    for (const [offset, file] of incoming.entries()) {
      const slot = (selectedSlot + offset) % photoCount;
      if (updated[slot]) replaced.push(updated[slot]);
      updated[slot] = URL.createObjectURL(file);
    }

    photoUrlsRef.current = updated;
    setPhotos(updated);
    for (const url of replaced) {
      URL.revokeObjectURL(url);
    }

    const nextEmpty = updated.slice(0, photoCount).indexOf(null);
    if (nextEmpty !== -1) {
      setSelectedSlot(nextEmpty);
    } else {
      setSelectedSlot(0);
      setStage("edit");
    }
    setMessage(
      files.length > photoCount
        ? `Only ${photoCount} photos fit in this layout.`
        : "",
    );
  }

  function waitOneSecond(): Promise<void> {
    return new Promise((resolve) => {
      captureWaitResolveRef.current = resolve;
      captureTimerRef.current = window.setTimeout(() => {
        captureTimerRef.current = null;
        captureWaitResolveRef.current = null;
        resolve();
      }, 1000);
    });
  }

  function captureFrame(): Promise<Blob> {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) {
      throw new Error("The camera is not ready yet.");
    }

    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    const sourceRatio = sourceWidth / sourceHeight;

    // Match the centered 4:3 object-cover viewfinder exactly.
    const cropWidth =
      sourceRatio > PHOTO_ASPECT_RATIO
        ? sourceHeight * PHOTO_ASPECT_RATIO
        : sourceWidth;
    const cropHeight =
      sourceRatio > PHOTO_ASPECT_RATIO
        ? sourceHeight
        : sourceWidth / PHOTO_ASPECT_RATIO;

    const canvas = document.createElement("canvas");
    canvas.width = Math.min(Math.round(cropWidth), 1200);
    canvas.height = Math.round(canvas.width / PHOTO_ASPECT_RATIO);
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not capture a photo on this device.");
    }

    // Mirror the centered crop just like the live selfie preview.
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(
      video,
      (sourceWidth - cropWidth) / 2,
      (sourceHeight - cropHeight) / 2,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Could not capture a photo. Please try again."));
          }
        },
        "image/jpeg",
        0.9,
      );
    });
  }

  async function captureSequence() {
    if (!cameraActive || captureBusyRef.current) return;

    const targets =
      captureMode === "single"
        ? [selectedSlot]
        : SLOT_IDS.slice(0, photoCount)
            .map((_, index) => index)
            .filter((index) => photoUrlsRef.current[index] === null);

    if (targets.length === 0) {
      setMessage("All slots are filled. Choose Single shot to retake a frame.");
      return;
    }

    const run = ++captureRunRef.current;
    captureBusyRef.current = true;
    setCaptureBusy(true);
    setMessage("");

    try {
      for (const slot of targets) {
        if (run !== captureRunRef.current) return;
        setSelectedSlot(slot);
        setCurrentShot(slot + 1);

        for (let seconds = countdownSeconds; seconds > 0; seconds--) {
          setCountdown(seconds);
          await waitOneSecond();
          if (run !== captureRunRef.current) return;
        }

        setCountdown(null);
        const blob = await captureFrame();
        if (run !== captureRunRef.current || !mountedRef.current) return;

        replacePhoto(slot, URL.createObjectURL(blob));
        setFlashCount((current) => current + 1);
      }

      if (run !== captureRunRef.current) return;

      const nextEmpty = photoUrlsRef.current.slice(0, photoCount).indexOf(null);

      if (nextEmpty === -1) {
        setSelectedSlot(0);
        setStage("edit");
      } else {
        setSelectedSlot(nextEmpty);
      }
    } catch (error) {
      if (run === captureRunRef.current) {
        setMessage(
          error instanceof Error ? error.message : "Could not capture a photo.",
        );
      }
    } finally {
      if (run === captureRunRef.current) {
        captureBusyRef.current = false;
        setCaptureBusy(false);
        setCountdown(null);
        setCurrentShot(null);
      }
    }
  }

  function movePhoto(direction: -1 | 1) {
    const target = selectedSlot + direction;
    if (target < 0 || target >= photoCount) return;

    const updated = [...photoUrlsRef.current];
    [updated[selectedSlot], updated[target]] = [
      updated[target],
      updated[selectedSlot],
    ];
    photoUrlsRef.current = updated;
    setPhotos(updated);
    setSelectedSlot(target);
  }

  function removeSelectedPhoto() {
    replacePhoto(selectedSlot, null);
    setCaptureMode("single");
    setStage("capture");
  }

  function retakeSelectedPhoto() {
    setCaptureMode("single");
    setStage("capture");
  }

  async function downloadStrip() {
    const imageUrls = photos
      .slice(0, photoCount)
      .filter((url): url is string => url !== null);
    if (imageUrls.length !== photoCount || saveBusy) return;

    setSaveBusy(true);
    setMessage("");
    try {
      const layout = photoCount === 4 ? printLayout : "strip";
      const blob = await exportPhotoboothPng(
        imageUrls,
        frame,
        filter,
        caption,
        layout,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orbit-booth-${photoCount}-${layout}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not export your photos.",
      );
    } finally {
      setSaveBusy(false);
    }
  }

  const activePhotos = photos.slice(0, photoCount);
  const filledCount = activePhotos.filter(Boolean).length;
  const remaining = photoCount - filledCount;
  const activeLayout = photoCount === 4 ? printLayout : "strip";

  return (
    <div className="mx-auto flex w-full max-w-[1020px] flex-col gap-4 pb-5 sm:gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] tracking-[.14em] text-[#eb9fc9]">
            {stage === "capture" ? "01 / CAPTURE" : "02 / EDIT"}
          </span>
          <span className="h-3 w-px bg-white/15" aria-hidden="true" />
          <h3 className="font-display text-base font-semibold tracking-tight text-white sm:text-lg">
            {stage === "capture" ? "Take your photos" : "Make it yours"}
          </h3>
        </div>
        <span className="shrink-0 font-mono text-[11px] text-[#acb5c9]">
          {filledCount} / {photoCount} shots
        </span>
      </div>

      {stage === "capture" ? (
        <div className="mx-auto flex w-full max-w-[660px] flex-col gap-3">
          <section
            aria-label="Camera preview"
            className="relative aspect-[4/3] w-full overflow-hidden rounded-[18px] border border-white/10 bg-[#070b14] shadow-[0_16px_50px_rgba(0,0,0,.28)]"
          >
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              aria-label="Live camera preview"
              className={[
                "absolute inset-0 h-full w-full -scale-x-100 object-cover",
                cameraActive ? "block" : "hidden",
              ].join(" ")}
            />
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_50%_35%,#24263b,#090d17_75%)] px-5 text-center">
                {cameraBusy ? (
                  <LoaderCircle
                    size={30}
                    className="animate-spin text-[#eda8cd]"
                    aria-hidden="true"
                  />
                ) : (
                  <Camera
                    size={30}
                    className="text-[#eda8cd]"
                    aria-hidden="true"
                  />
                )}
                <p className="font-display text-sm font-semibold text-white">
                  {cameraBusy ? "Opening camera" : "Camera unavailable"}
                </p>
                <p className="max-w-[250px] text-xs leading-5 text-[#a8b2c8]">
                  {cameraBusy
                    ? "Allow access in your browser to start."
                    : "Retry the camera or upload your own photos."}
                </p>
              </div>
            )}
            {cameraActive && (
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/40 to-transparent px-3 py-3 sm:px-4">
                <span className="flex items-center gap-2 rounded-full bg-black/40 px-2.5 py-1 font-mono text-[10px] tracking-[.06em] text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f3b0d6]" />
                  LIVE
                </span>
                <span className="rounded-full bg-black/40 px-2.5 py-1 font-mono text-[10px] text-white/90">
                  4:3 FRAME
                </span>
              </div>
            )}
            <AnimatePresence mode="wait">
              {countdown !== null && (
                <motion.div
                  key={countdown}
                  role="status"
                  aria-live="assertive"
                  initial={{ opacity: 0, scale: 1.15 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/35"
                >
                  <span className="font-display text-[clamp(5rem,16vw,9rem)] leading-none font-bold text-white">
                    {countdown}
                  </span>
                  <span className="mt-2 font-mono text-xs text-white">
                    Shot {currentShot} of {photoCount}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {flashCount > 0 && (
                <motion.div
                  key={flashCount}
                  aria-hidden="true"
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.28 }}
                  className="pointer-events-none absolute inset-0 bg-white"
                />
              )}
            </AnimatePresence>
          </section>

          <fieldset
            aria-label="Captured photos"
            className="grid grid-cols-4 gap-2"
          >
            {SLOT_IDS.slice(0, photoCount).map((slotId, index) => (
              <button
                key={slotId}
                type="button"
                aria-label={`Choose photo slot ${index + 1} for a single shot`}
                aria-pressed={
                  captureMode === "single" && selectedSlot === index
                }
                disabled={captureBusy}
                onClick={() => {
                  setSelectedSlot(index);
                  setCaptureMode("single");
                }}
                className={[
                  "relative aspect-[4/3] min-w-0 overflow-hidden rounded-lg border bg-[#171e2d] transition-colors disabled:cursor-default",
                  captureMode === "single" && selectedSlot === index
                    ? "border-[#f0a6d2] ring-1 ring-[#f0a6d2]/40"
                    : "border-white/10 hover:border-white/35",
                ].join(" ")}
              >
                {activePhotos[index] ? (
                  // Browser blob URLs cannot use the Next.js image optimizer.
                  // biome-ignore lint/performance/noImgElement: Local visitor photos.
                  <img
                    src={activePhotos[index] ?? undefined}
                    alt={`Captured shot ${index + 1}`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-xs text-[#8894ab]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                )}
                {activePhotos[index] && (
                  <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                )}
              </button>
            ))}
          </fieldset>

          <div className="flex flex-wrap items-end gap-x-5 gap-y-3 border-t border-white/10 pt-3">
            <fieldset className="min-w-0">
              <legend className={legendClass}>Shots</legend>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    aria-pressed={photoCount === count}
                    disabled={captureBusy}
                    onClick={() => {
                      setPhotoCount(count);
                      setSelectedSlot((slot) => Math.min(slot, count - 1));
                      setMessage("");
                    }}
                    className={[
                      "h-9 min-w-9 rounded-lg border px-2 text-xs font-semibold transition-colors disabled:opacity-40",
                      photoCount === count ? selectedChoice : normalChoice,
                    ].join(" ")}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="min-w-0">
              <legend className={legendClass}>Timer</legend>
              <div className="flex gap-1">
                {COUNTDOWN_OPTIONS.map((seconds) => (
                  <button
                    key={seconds}
                    type="button"
                    aria-pressed={countdownSeconds === seconds}
                    disabled={captureBusy}
                    onClick={() => setCountdownSeconds(seconds)}
                    className={[
                      "h-9 min-w-9 rounded-lg border px-2 text-xs font-semibold transition-colors disabled:opacity-40",
                      countdownSeconds === seconds
                        ? selectedChoice
                        : normalChoice,
                    ].join(" ")}
                  >
                    {seconds === 0 ? "Off" : `${seconds}s`}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className={legendClass}>Capture</legend>
              <div className="flex gap-1">
                {(["strip", "single"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={captureMode === mode}
                    disabled={captureBusy}
                    onClick={() => setCaptureMode(mode)}
                    className={[
                      "h-9 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:opacity-40",
                      captureMode === mode ? selectedChoice : normalChoice,
                    ].join(" ")}
                  >
                    {mode === "strip" ? "Auto" : "Single"}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={cameraActive ? "Turn off camera" : "Retry camera"}
                title={cameraActive ? "Turn off camera" : "Retry camera"}
                disabled={cameraBusy || captureBusy}
                onClick={cameraActive ? stopCamera : () => void startCamera()}
                className={actionClass}
              >
                {cameraBusy ? (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : cameraActive ? (
                  <VideoOff size={16} aria-hidden="true" />
                ) : (
                  <Camera size={16} aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                disabled={captureBusy}
                className={actionClass}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus size={16} aria-hidden="true" />
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleFiles}
              />
            </div>

            {captureBusy ? (
              <button
                type="button"
                onClick={cancelCapture}
                className="inline-flex min-h-11 min-w-[145px] items-center justify-center gap-2 rounded-xl border border-[#f0a6d2]/50 bg-[#f0a6d2]/10 px-4 text-xs font-semibold text-[#ffe4f1]"
              >
                <X size={16} aria-hidden="true" />
                Cancel capture
              </button>
            ) : remaining === 0 && captureMode === "strip" ? (
              <button
                type="button"
                onClick={() => setStage("edit")}
                className="min-h-11 min-w-[145px] rounded-xl bg-[#efb0d5] px-4 text-sm font-semibold text-[#28172c] transition-colors hover:bg-[#ffd0e9]"
              >
                Edit print
              </button>
            ) : (
              <button
                type="button"
                disabled={!cameraActive}
                onClick={() => void captureSequence()}
                className="inline-flex min-h-11 min-w-[145px] items-center justify-center gap-2 rounded-xl bg-[#efb0d5] px-4 text-sm font-semibold text-[#28172c] transition-colors hover:bg-[#ffd0e9] disabled:cursor-not-allowed disabled:bg-[#554553] disabled:text-[#aca3b1]"
              >
                <Camera size={17} aria-hidden="true" />
                {captureMode === "single"
                  ? `Take shot ${selectedSlot + 1}`
                  : `Take ${remaining}${remaining === 1 ? " photo" : " photos"}`}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(290px,330px)]">
          <section
            aria-label="Finished print preview"
            className={`flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[radial-gradient(ellipse_at_50%_34%,#232239_0%,#111724_65%,#0d1320_100%)] ${photoCount === 4 ? "min-h-[min(75dvh,620px)]" : "min-h-[350px]"}`}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <span className="text-xs font-semibold text-[#f2e9f4]">
                Your print
              </span>
              <span className="font-mono text-[10px] text-[#aeb5c8]">
                {activeLayout === "grid" ? "2 × 2 GRID" : "FILM STRIP"}
              </span>
            </div>
            <div className="flex min-h-[310px] flex-1 items-center justify-center px-4 pb-5 sm:px-6">
              <PhotoboothPrintPreview
                photos={activePhotos}
                photoCount={photoCount}
                layout={activeLayout}
                frame={frame}
                filter={filter}
                caption={caption}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-[#111725]/80 px-3 py-3 sm:px-4">
              <span className="mr-auto shrink-0 font-mono text-[11px] text-[#d9c7dc]">
                Photo {String(selectedSlot + 1).padStart(2, "0")}
              </span>
              <button
                type="button"
                className={actionClass}
                aria-label="Move selected photo earlier"
                title="Move earlier"
                disabled={selectedSlot === 0}
                onClick={() => movePhoto(-1)}
              >
                <ArrowLeft size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={actionClass}
                aria-label="Move selected photo later"
                title="Move later"
                disabled={selectedSlot === photoCount - 1}
                onClick={() => movePhoto(1)}
              >
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={actionClass}
                onClick={removeSelectedPhoto}
              >
                <Trash2 size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Remove</span>
              </button>
              <button
                type="button"
                className={actionClass}
                onClick={retakeSelectedPhoto}
              >
                <RotateCcw size={16} aria-hidden="true" />
                Retake
              </button>
            </div>
          </section>

          <aside
            aria-label="Print customization"
            className="flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[#101625]"
          >
            <div className="border-b border-white/10 px-4 py-3 sm:px-5">
              <h4 className="font-display text-sm font-semibold text-[#f4eaf5]">
                Style & finish
              </h4>
              <p className="mt-1 text-xs leading-5 text-[#9ba8bc]">
                Select any photo in the print to reorder or retake it.
              </p>
            </div>
            <div className="flex-1 px-4 py-4 sm:px-5">
              <PhotoboothEditorControls
                photoCount={photoCount}
                layout={activeLayout}
                onLayoutChange={setPrintLayout}
                frame={frame}
                onFrameChange={setFrame}
                filter={filter}
                onFilterChange={setFilter}
                caption={caption}
                onCaptionChange={setCaption}
              />
            </div>
            <div className="border-t border-white/10 p-4 sm:px-5">
              <button
                type="button"
                disabled={saveBusy || remaining > 0}
                onClick={() => void downloadStrip()}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#efb0d5] px-4 text-sm font-semibold text-[#28172c] transition-colors hover:bg-[#ffd0e9] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saveBusy ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Download size={17} aria-hidden="true" />
                )}
                {saveBusy ? "Saving..." : "Download PNG"}
              </button>
            </div>
          </aside>
        </div>
      )}

      {message && (
        <p role="status" className="text-xs leading-5 text-[#ffc7d8]">
          {message}
        </p>
      )}
    </div>
  );
}
