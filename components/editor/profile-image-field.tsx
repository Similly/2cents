"use client";

import {ImageUp, Trash2} from "lucide-react";
import Image from "next/image";
import {useEffect, useMemo, useRef, useState} from "react";
import {Button} from "@/components/ui/button";

type ProfileImageFieldProps = {
  defaultValue?: string;
  label?: string;
  inputName?: string;
};

const CROPPER_SIZE = 320;

type CropSession = {
  src: string;
  width: number;
  height: number;
  fileName: string;
  fileType: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDisplayMetrics(width: number, height: number, zoom: number) {
  const baseScale = Math.max(CROPPER_SIZE / width, CROPPER_SIZE / height);
  const scale = baseScale * zoom;
  const displayWidth = width * scale;
  const displayHeight = height * scale;
  return {scale, displayWidth, displayHeight};
}

function clampOffset(width: number, height: number, zoom: number, x: number, y: number) {
  const {displayWidth, displayHeight} = getDisplayMetrics(width, height, zoom);
  const minX = CROPPER_SIZE - displayWidth;
  const minY = CROPPER_SIZE - displayHeight;
  return {
    x: clamp(x, minX, 0),
    y: clamp(y, minY, 0),
  };
}

async function loadImageMeta(file: File): Promise<CropSession> {
  const src = URL.createObjectURL(file);

  const dimensions = await new Promise<{width: number; height: number}>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve({width: img.naturalWidth, height: img.naturalHeight});
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden."));
    img.src = src;
  });

  return {
    src,
    width: dimensions.width,
    height: dimensions.height,
    fileName: file.name,
    fileType: file.type || "image/jpeg",
  };
}

async function cropToBlob(crop: CropSession, zoom: number, offsetX: number, offsetY: number) {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Bild konnte nicht verarbeitet werden."));
    image.src = crop.src;
  });

  const {scale} = getDisplayMetrics(crop.width, crop.height, zoom);
  const srcX = Math.max(0, -offsetX / scale);
  const srcY = Math.max(0, -offsetY / scale);
  const srcSize = Math.min(crop.width - srcX, crop.height - srcY, CROPPER_SIZE / scale);

  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas-Kontext nicht verfügbar.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, canvas.width, canvas.height);

  const outputType =
    crop.fileType === "image/png" || crop.fileType === "image/webp" ? crop.fileType : "image/jpeg";

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Konnte das zugeschnittene Bild nicht erzeugen."));
        }
      },
      outputType,
      0.92
    );
  });
}

export function ProfileImageField({
  defaultValue = "",
  label = "Profilbild",
  inputName = "profileImage",
}: ProfileImageFieldProps) {
  const [imagePath, setImagePath] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [cropSession, setCropSession] = useState<CropSession | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [cropError, setCropError] = useState<string | null>(null);
  const [processingCrop, setProcessingCrop] = useState(false);

  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const displayMetrics = useMemo(() => {
    if (!cropSession) return null;
    return getDisplayMetrics(cropSession.width, cropSession.height, zoom);
  }, [cropSession, zoom]);

  useEffect(() => {
    return () => {
      if (cropSession) {
        URL.revokeObjectURL(cropSession.src);
      }
    };
  }, [cropSession]);

  async function openFilePicker() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        setCropError(null);
        const nextSession = await loadImageMeta(file);
        const centered = clampOffset(
          nextSession.width,
          nextSession.height,
          1,
          (CROPPER_SIZE - getDisplayMetrics(nextSession.width, nextSession.height, 1).displayWidth) / 2,
          (CROPPER_SIZE - getDisplayMetrics(nextSession.width, nextSession.height, 1).displayHeight) / 2
        );
        setZoom(1);
        setOffsetX(centered.x);
        setOffsetY(centered.y);
        setCropSession((current) => {
          if (current) URL.revokeObjectURL(current.src);
          return nextSession;
        });
      } catch (error) {
        setCropError(error instanceof Error ? error.message : "Bild konnte nicht geöffnet werden.");
      }
    };

    input.click();
  }

  function closeCropper() {
    setCropSession((current) => {
      if (current) URL.revokeObjectURL(current.src);
      return null;
    });
    setCropError(null);
    setProcessingCrop(false);
  }

  async function confirmCropAndUpload() {
    if (!cropSession) return;

    setProcessingCrop(true);
    setUploading(true);
    setCropError(null);

    try {
      const blob = await cropToBlob(cropSession, zoom, offsetX, offsetY);
      const extension = cropSession.fileName.split(".").pop() || "jpg";
      const file = new File([blob], `profile-${Date.now()}.${extension}`, {type: blob.type || "image/jpeg"});

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        throw new Error(errorJson?.error || "Upload fehlgeschlagen.");
      }

      const json = await res.json();
      const path = json?.asset?.path;
      if (typeof path !== "string" || !path) {
        throw new Error("Upload-Antwort war ungültig.");
      }

      setImagePath(path);
      closeCropper();
    } catch (error) {
      setCropError(error instanceof Error ? error.message : "Bild konnte nicht hochgeladen werden.");
    } finally {
      setProcessingCrop(false);
      setUploading(false);
    }
  }

  function onCropPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!cropSession) return;
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offsetX,
      originY: offsetY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onCropPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!cropSession || !dragState.current || dragState.current.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.current.startX;
    const deltaY = event.clientY - dragState.current.startY;
    const next = clampOffset(
      cropSession.width,
      cropSession.height,
      zoom,
      dragState.current.originX + deltaX,
      dragState.current.originY + deltaY
    );
    setOffsetX(next.x);
    setOffsetY(next.y);
  }

  function onCropPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current?.pointerId !== event.pointerId) return;
    dragState.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div>
      <label className="mb-1 block text-sm text-site-muted">{label}</label>
      <input name={inputName} type="hidden" value={imagePath} />

      {imagePath ? (
        <div className="rounded-xl border border-site-border bg-site-panel p-3">
          <Image
            alt="Profilbild"
            className="h-40 w-40 rounded-xl object-cover"
            height={160}
            src={imagePath}
            width={160}
          />
          <div className="mt-3 flex gap-2">
            <Button disabled={uploading} onClick={openFilePicker} type="button" variant="outline">
              <ImageUp className="mr-1 h-4 w-4" />
              {uploading ? "Uploading..." : "Ändern"}
            </Button>
            <Button
              disabled={uploading}
              onClick={() => setImagePath("")}
              type="button"
              variant="outline"
            >
              <Trash2 className="mr-1 h-4 w-4" /> Entfernen
            </Button>
          </div>
        </div>
      ) : (
        <button
          className="grid h-32 w-full place-items-center rounded-md border border-dashed border-site-border bg-site text-site-muted hover:bg-white"
          onClick={openFilePicker}
          type="button"
        >
          <span className="inline-flex items-center gap-2 text-sm">
            <ImageUp className="h-5 w-5" /> {uploading ? "Uploading..." : "Profilbild hochladen"}
          </span>
        </button>
      )}

      {cropSession ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-[760px] rounded-xl border border-site-border bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-2xl text-site-ink">Profilbild zuschneiden</h3>
                <p className="text-sm text-site-muted">Ziehe das Bild und passe den Zoom an.</p>
              </div>
              <Button disabled={processingCrop} onClick={closeCropper} type="button" variant="outline">
                Abbrechen
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-[auto,1fr]">
              <div
                className="relative h-[320px] w-[320px] touch-none overflow-hidden rounded-xl border border-site-border bg-site"
                onPointerDown={onCropPointerDown}
                onPointerMove={onCropPointerMove}
                onPointerUp={onCropPointerUp}
              >
                {displayMetrics ? (
                  <Image
                    alt="Crop Vorschau"
                    className="pointer-events-none select-none"
                    draggable={false}
                    height={Math.round(displayMetrics.displayHeight)}
                    src={cropSession.src}
                    style={{
                      left: `${offsetX}px`,
                      maxWidth: "none",
                      position: "absolute",
                      top: `${offsetY}px`,
                    }}
                    unoptimized
                    width={Math.round(displayMetrics.displayWidth)}
                  />
                ) : null}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-site-muted">Zoom</label>
                  <input
                    className="w-full accent-site-accent"
                    disabled={processingCrop}
                    max={3}
                    min={1}
                    onChange={(event) => {
                      if (!cropSession) return;
                      const nextZoom = Number(event.target.value);
                      setZoom(nextZoom);
                      const next = clampOffset(cropSession.width, cropSession.height, nextZoom, offsetX, offsetY);
                      setOffsetX(next.x);
                      setOffsetY(next.y);
                    }}
                    step={0.01}
                    type="range"
                    value={zoom}
                  />
                </div>

                <p className="text-xs text-site-muted">Tipp: Ziehe das Bild im Quadrat, bis der Ausschnitt passt.</p>

                {cropError ? (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {cropError}
                  </p>
                ) : null}

                <div className="pt-2">
                  <Button
                    className="w-full"
                    disabled={processingCrop}
                    onClick={confirmCropAndUpload}
                    type="button"
                  >
                    {processingCrop ? "Speichert..." : "Zuschneiden & Hochladen"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
