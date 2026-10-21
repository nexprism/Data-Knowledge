import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Check, X, RotateCcw, Move, Camera, Loader2 } from 'lucide-react';

interface AvatarCropModalProps {
    isOpen: boolean;
    imageSrc: string | null;
    studentName?: string;
    onCropComplete: (croppedFile: File, croppedPreviewUrl: string) => void;
    onClose: () => void;
}

// Convert dataURL to File helper
function dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
    isOpen,
    imageSrc,
    studentName = 'Student',
    onCropComplete,
    onClose,
}) => {
    const [safeImageSrc, setSafeImageSrc] = useState<string | null>(null);
    const [zoom, setZoom] = useState<number>(1);
    const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);
    const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [isApplying, setIsApplying] = useState<boolean>(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);

    // Viewport dimensions
    const CROP_DIAMETER = 220; // 220px circular crop window

    // Ensure imageSrc is safe from CORS canvas tainting
    useEffect(() => {
        if (!isOpen || !imageSrc) {
            setSafeImageSrc(null);
            return;
        }

        // If it's already a blob or data URL, it is local and safe
        if (imageSrc.startsWith('blob:') || imageSrc.startsWith('data:')) {
            setSafeImageSrc(imageSrc);
            return;
        }

        // For HTTP/HTTPS URLs, fetch as blob so canvas never gets tainted by cross-origin security
        let cancelled = false;
        let createdBlobUrl = '';

        fetch(imageSrc, { mode: 'cors' })
            .then((res) => {
                if (!res.ok) throw new Error('Fetch failed');
                return res.blob();
            })
            .then((blob) => {
                if (cancelled) return;
                createdBlobUrl = URL.createObjectURL(blob);
                setSafeImageSrc(createdBlobUrl);
            })
            .catch(() => {
                if (!cancelled) setSafeImageSrc(imageSrc);
            });

        return () => {
            cancelled = true;
            if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
        };
    }, [isOpen, imageSrc]);

    // Reset crop state on open
    useEffect(() => {
        if (isOpen) {
            setZoom(1);
            setPan({ x: 0, y: 0 });
            setImageLoaded(false);
            setIsApplying(false);
        }
    }, [isOpen, safeImageSrc]);

    // Check if image is already loaded/cached in DOM
    useEffect(() => {
        if (!isOpen || !safeImageSrc) return;

        const checkDimensions = () => {
            const img = imageRef.current;
            if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
                setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                setImageLoaded(true);
            }
        };

        checkDimensions();
        const t1 = setTimeout(checkDimensions, 50);
        const t2 = setTimeout(checkDimensions, 200);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [isOpen, safeImageSrc]);

    // Handle Image Load event
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
            setImageLoaded(true);
        }
    };

    // Calculate base scale to make sure image covers the crop circle initially
    const getBaseScale = useCallback(() => {
        const img = imageRef.current;
        const w = img?.naturalWidth || naturalSize.width;
        const h = img?.naturalHeight || naturalSize.height;
        if (!w || !h) return 1;
        return Math.max(CROP_DIAMETER / w, CROP_DIAMETER / h);
    }, [naturalSize.width, naturalSize.height, CROP_DIAMETER]);

    // Pointer events for smooth drag/pan
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
            // ignore
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(false);
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            // ignore
        }
    };

    // Mouse wheel to zoom
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.12 : -0.12;
        setZoom((prev) => Math.min(3.5, Math.max(1, +(prev + delta).toFixed(2))));
    };

    // Update real-time mini preview canvas
    useEffect(() => {
        if (!isOpen || !previewCanvasRef.current) return;

        const img = imageRef.current;
        const natW = img?.naturalWidth || naturalSize.width;
        const natH = img?.naturalHeight || naturalSize.height;

        if (!img || !natW || !natH) return;

        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const PREVIEW_SIZE = 120;
        canvas.width = PREVIEW_SIZE;
        canvas.height = PREVIEW_SIZE;

        ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

        // Circular clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

        const ratio = PREVIEW_SIZE / CROP_DIAMETER;
        const currentScale = getBaseScale() * zoom;

        // Position image exactly as centered in crop circle
        ctx.translate(PREVIEW_SIZE / 2 + pan.x * ratio, PREVIEW_SIZE / 2 + pan.y * ratio);
        ctx.scale(currentScale * ratio, currentScale * ratio);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, -natW / 2, -natH / 2, natW, natH);
        ctx.restore();
    }, [isOpen, imageLoaded, zoom, pan, naturalSize, getBaseScale, safeImageSrc]);

    // Handle Crop & Save
    const handleApplyCrop = () => {
        if (isApplying) return;
        setIsApplying(true);

        const executeCrop = (sourceImg: CanvasImageSource, natW: number, natH: number) => {
            try {
                // High resolution output (480x480 square)
                const OUTPUT_SIZE = 480;
                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = OUTPUT_SIZE;
                offscreenCanvas.height = OUTPUT_SIZE;
                const ctx = offscreenCanvas.getContext('2d');

                if (!ctx) {
                    setIsApplying(false);
                    return;
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // White background (in case of transparent PNG)
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

                const base = Math.max(CROP_DIAMETER / natW, CROP_DIAMETER / natH);
                const currentScale = base * zoom;
                const ratio = OUTPUT_SIZE / CROP_DIAMETER;

                // Draw image exactly as framed
                ctx.save();
                ctx.translate(OUTPUT_SIZE / 2 + pan.x * ratio, OUTPUT_SIZE / 2 + pan.y * ratio);
                ctx.scale(currentScale * ratio, currentScale * ratio);
                ctx.drawImage(sourceImg, -natW / 2, -natH / 2, natW, natH);
                ctx.restore();

                const completeWithDataUrl = () => {
                    try {
                        const dataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.92);
                        const file = dataURLtoFile(dataUrl, `avatar-${Date.now()}.jpg`);
                        onCropComplete(file, dataUrl);
                        setIsApplying(false);
                        onClose();
                    } catch (dataUrlErr) {
                        console.error('[AvatarCropModal] toDataURL error:', dataUrlErr);
                        setIsApplying(false);
                        alert('Could not export cropped image. Please try uploading the image again.');
                    }
                };

                // Attempt toBlob first, with toDataURL fallback
                try {
                    offscreenCanvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const croppedFile = new File([blob], `avatar-${Date.now()}.jpg`, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                });
                                const previewUrl = URL.createObjectURL(blob);
                                onCropComplete(croppedFile, previewUrl);
                                setIsApplying(false);
                                onClose();
                            } else {
                                completeWithDataUrl();
                            }
                        },
                        'image/jpeg',
                        0.92
                    );
                } catch {
                    completeWithDataUrl();
                }
            } catch (err) {
                console.error('[AvatarCropModal] Crop error:', err);
                setIsApplying(false);
                alert('An error occurred while cropping the image. Please try again.');
            }
        };

        const img = imageRef.current;
        const domW = img?.naturalWidth || naturalSize.width;
        const domH = img?.naturalHeight || naturalSize.height;

        if (img && domW > 0 && domH > 0) {
            executeCrop(img, domW, domH);
        } else if (safeImageSrc) {
            // Asynchronous fallback if DOM image hasn't completed loading yet
            const tempImg = new Image();
            if (safeImageSrc.startsWith('http')) {
                tempImg.crossOrigin = 'anonymous';
            }
            tempImg.onload = () => {
                executeCrop(tempImg, tempImg.naturalWidth, tempImg.naturalHeight);
            };
            tempImg.onerror = () => {
                setIsApplying(false);
                alert('Could not load image dimensions. Please try re-selecting the file.');
            };
            tempImg.src = safeImageSrc;
        } else {
            setIsApplying(false);
        }
    };

    if (!isOpen || !safeImageSrc) return null;

    const currentScale = getBaseScale() * zoom;

    return (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-gray-700 flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-gray-700 bg-slate-50/80 dark:bg-gray-850">
                    <div>
                        <div className="flex items-center gap-2">
                            <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                Crop & Center Avatar
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                            Drag to center face. Use zoom slider for perfect alignment.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 dark:hover:bg-gray-700 transition-all cursor-pointer"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body: Interactive Cropper Viewport */}
                <div className="p-6 flex flex-col items-center">
                    <div
                        ref={containerRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onWheel={handleWheel}
                        className="relative w-[320px] h-[320px] bg-slate-900 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none shadow-inner border border-slate-700 flex items-center justify-center touch-none"
                    >
                        {/* Image element: crossOrigin ONLY for remote HTTP URLs, NEVER for blob/data schemes */}
                        <img
                            ref={imageRef}
                            src={safeImageSrc}
                            alt="To Crop"
                            crossOrigin={safeImageSrc.startsWith('http') ? 'anonymous' : undefined}
                            onLoad={handleImageLoad}
                            style={{
                                transform: `translate(${pan.x}px, ${pan.y}px) scale(${currentScale})`,
                                transformOrigin: 'center center',
                                maxWidth: 'none',
                                maxHeight: 'none',
                                pointerEvents: 'none',
                                willChange: 'transform',
                            }}
                            className="absolute"
                        />

                        {/* Circular Mask Cutout with 72% dark surround overlay */}
                        <div
                            style={{ width: `${CROP_DIAMETER}px`, height: `${CROP_DIAMETER}px` }}
                            className="pointer-events-none absolute rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.72)] z-10 flex items-center justify-center"
                        >
                            {/* Subtle Center Crosshairs */}
                            <div className="w-4 h-[1px] bg-white/50 absolute" />
                            <div className="h-4 w-[1px] bg-white/50 absolute" />
                        </div>

                        {/* Floating Gesture Hint */}
                        <div className="absolute bottom-2 left-2 right-2 text-center pointer-events-none z-20">
                            <span className="text-[10px] font-semibold text-white/90 bg-slate-950/75 backdrop-blur-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                <Move className="w-2.5 h-2.5 text-blue-400" /> Drag to reposition • Scroll to zoom
                            </span>
                        </div>
                    </div>

                    {/* Zoom & Positioning Controls */}
                    <div className="w-full max-w-[320px] mt-4 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-gray-300">
                            <span className="flex items-center gap-1.5">
                                <ZoomIn className="w-3.5 h-3.5 text-blue-500" /> Zoom Level
                            </span>
                            <span className="text-blue-600 dark:text-blue-400 font-extrabold text-[11px] bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-md">
                                {Math.round(zoom * 100)}%
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setZoom((z) => Math.max(1, +(z - 0.15).toFixed(2)))}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>

                            <input
                                type="range"
                                min="1"
                                max="3.5"
                                step="0.05"
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none"
                            />

                            <button
                                type="button"
                                onClick={() => setZoom((z) => Math.min(3.5, +(z + 0.15).toFixed(2)))}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                                title="Zoom In"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setZoom(1);
                                    setPan({ x: 0, y: 0 });
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-gray-700 dark:text-gray-300 transition-colors cursor-pointer shrink-0"
                                title="Reset Position & Zoom"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Live Preview Card Badge */}
                    <div className="w-full max-w-[320px] mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-gray-750 border border-slate-200/80 dark:border-gray-700 flex items-center gap-3">
                        <canvas
                            ref={previewCanvasRef}
                            width="120"
                            height="120"
                            className="w-12 h-12 rounded-2xl border-2 border-blue-400 shadow-xs shrink-0 object-cover bg-slate-200"
                        />
                        <div className="min-w-0">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                                Live Review Card Preview
                            </span>
                            <p className="text-xs font-bold text-slate-800 dark:text-white truncate mt-0.5">
                                {studentName || 'Student Name'}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-gray-400">
                                Centered & formatted for web
                            </p>
                        </div>
                    </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-gray-700 bg-slate-50/80 dark:bg-gray-850">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isApplying}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 dark:text-gray-300 dark:hover:bg-gray-700 transition-all cursor-pointer disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleApplyCrop();
                        }}
                        disabled={isApplying}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {isApplying ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Applying...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                Apply & Use Avatar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarCropModal;
