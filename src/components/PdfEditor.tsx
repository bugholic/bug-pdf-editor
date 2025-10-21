import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Upload,
  Type,
  Image as ImageIcon,
  Download,
  Trash2,
  Move,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

// Configure PDF.js worker for react-pdf (Vite-friendly local worker)
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

type Tool = "select" | "text" | "image";

type OverlayBase = {
  id: string;
  pageIndex: number; // zero-based page
  xPercent: number; // 0..1 left
  yPercent: number; // 0..1 top
  widthPercent: number; // 0..1 width relative to page width
  heightPercent: number; // 0..1 height relative to page height
  rotationDeg?: number;
  type: "text" | "image";
};

type TextOverlay = OverlayBase & {
  type: "text";
  text: string;
  fontSize: number; // in points; exported directly
  color: string; // hex
  bold: boolean;
};

type ImageOverlay = OverlayBase & {
  type: "image";
  file: File;
  src: string; // object URL for preview
};

type Overlay = TextOverlay | ImageOverlay;

export const PdfEditor = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [tool, setTool] = useState<Tool>("select");
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const selectedOverlay = useMemo(
    () => overlays.find((o) => o.id === selectedId) ?? null,
    [overlays, selectedId]
  );

  useEffect(() => {
    return () => {
      // cleanup object URLs for image overlays
      overlays.forEach((o) => {
        if (o.type === "image") URL.revokeObjectURL(o.src);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPdfSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.type !== "application/pdf") {
        toast.error("Please select a PDF file");
        return;
      }
      setPdfFile(file);
      setOverlays([]);
      setSelectedId(null);
    },
    []
  );

  const onDocumentLoad = useCallback(
    ({ numPages: nextNumPages }: { numPages: number }) => {
      setNumPages(nextNumPages);
    },
    []
  );

  const addTextOverlayAt = useCallback(
    (pageIndex: number, clientX: number, clientY: number) => {
      const pageEl = pageRefs.current[pageIndex];
      if (!pageEl) return;
      const rect = pageEl.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;

      const id = crypto.randomUUID();
      const overlay: TextOverlay = {
        id,
        pageIndex,
        xPercent: Math.max(0, Math.min(1, x)),
        yPercent: Math.max(0, Math.min(1, y)),
        widthPercent: 0.3,
        heightPercent: 0.06,
        rotationDeg: 0,
        type: "text",
        text: "Edit me",
        fontSize: 14,
        color: "#111111",
        bold: false,
      };
      setOverlays((prev) => [...prev, overlay]);
      setSelectedId(id);
      setTool("select");
    },
    []
  );

  const onPageClick = useCallback(
    (pageIndex: number, e: React.MouseEvent) => {
      if (tool === "text") {
        addTextOverlayAt(pageIndex, e.clientX, e.clientY);
      }
    },
    [addTextOverlayAt, tool]
  );

  const onImageSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      // place image roughly at center of first visible page (0 if unknown)
      const pageIndex = 0;
      const src = URL.createObjectURL(file);
      const id = crypto.randomUUID();
      const overlay: ImageOverlay = {
        id,
        pageIndex,
        xPercent: 0.35,
        yPercent: 0.35,
        widthPercent: 0.3,
        heightPercent: 0.2,
        rotationDeg: 0,
        type: "image",
        file,
        src,
      };
      setOverlays((prev) => [...prev, overlay]);
      setSelectedId(id);
      setTool("select");
      // reset input value to allow re-selecting same file later
      if (imageInputRef.current) imageInputRef.current.value = "";
    },
    []
  );

  const handleDrag = useCallback(
    (overlayId: string, pageIndex: number, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const pageEl = pageRefs.current[pageIndex];
      if (!pageEl) return;
      const rect = pageEl.getBoundingClientRect();

      const startX = e.clientX;
      const startY = e.clientY;
      const startOverlay = overlays.find((o) => o.id === overlayId);
      if (!startOverlay) return;
      const initX = startOverlay.xPercent;
      const initY = startOverlay.yPercent;

      const onMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - startX) / rect.width;
        const dy = (ev.clientY - startY) / rect.height;
        setOverlays((prev) =>
          prev.map((o) =>
            o.id === overlayId
              ? {
                  ...o,
                  xPercent: Math.max(
                    0,
                    Math.min(1 - o.widthPercent, initX + dx)
                  ),
                  yPercent: Math.max(
                    0,
                    Math.min(1 - o.heightPercent, initY + dy)
                  ),
                }
              : o
          )
        );
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp, { once: true });
    },
    [overlays]
  );

  const handleResize = useCallback(
    (overlayId: string, pageIndex: number, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const pageEl = pageRefs.current[pageIndex];
      if (!pageEl) return;
      const rect = pageEl.getBoundingClientRect();

      const startX = e.clientX;
      const startY = e.clientY;
      const startOverlay = overlays.find((o) => o.id === overlayId);
      if (!startOverlay) return;
      const initW = startOverlay.widthPercent;
      const initH = startOverlay.heightPercent;

      const onMove = (ev: PointerEvent) => {
        const dw = (ev.clientX - startX) / rect.width;
        const dh = (ev.clientY - startY) / rect.height;
        setOverlays((prev) =>
          prev.map((o) =>
            o.id === overlayId
              ? {
                  ...o,
                  widthPercent: Math.max(
                    0.02,
                    Math.min(1 - o.xPercent, initW + dw)
                  ),
                  heightPercent: Math.max(
                    0.02,
                    Math.min(1 - o.yPercent, initH + dh)
                  ),
                }
              : o
          )
        );
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp, { once: true });
    },
    [overlays]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setOverlays((prev) => prev.filter((o) => o.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const exportPdf = useCallback(async () => {
    if (!pdfFile) {
      toast.error("Please upload a PDF first");
      return;
    }
    try {
      const originalBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(originalBytes);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Group overlays by page for efficient processing
      const byPage = new Map<number, Overlay[]>();
      overlays.forEach((o) => {
        const arr = byPage.get(o.pageIndex) ?? [];
        arr.push(o);
        byPage.set(o.pageIndex, arr);
      });

      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const page = pdfDoc.getPage(i);
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();
        const items = byPage.get(i) ?? [];
        for (const item of items) {
          const x = item.xPercent * pageWidth;
          const yTop = item.yPercent * pageHeight;
          const w = item.widthPercent * pageWidth;
          const h = item.heightPercent * pageHeight;
          const y = pageHeight - yTop - h; // convert top-left to PDF bottom-left

          if (item.type === "text") {
            const font = item.bold ? helveticaBold : helvetica;
            // Center-left baseline positioning: drawText uses bottom-left; use y + (h - fontSize) / 2 for better centering
            const fontSize = item.fontSize;
            page.drawText(item.text, {
              x: x + 2,
              y: y + Math.max(0, (h - fontSize) / 2),
              size: fontSize,
              font,
              color: rgb(
                parseInt(item.color.slice(1, 3), 16) / 255,
                parseInt(item.color.slice(3, 5), 16) / 255,
                parseInt(item.color.slice(5, 7), 16) / 255
              ),
              rotate: item.rotationDeg ? degrees(item.rotationDeg) : undefined,
              maxWidth: w - 4,
            });
          } else if (item.type === "image") {
            const arrayBuffer = await item.file.arrayBuffer();
            const isPng = item.file.type === "image/png";
            const embedded = isPng
              ? await pdfDoc.embedPng(arrayBuffer)
              : await pdfDoc.embedJpg(arrayBuffer);
            page.drawImage(embedded, {
              x,
              y,
              width: w,
              height: h,
              rotate: item.rotationDeg ? degrees(item.rotationDeg) : undefined,
            });
          }
        }
      }

      const bytes = await pdfDoc.save();
      // Create a fresh ArrayBuffer to avoid SharedArrayBuffer typing issues
      const safeBuffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(safeBuffer).set(bytes);
      const blob = new Blob([safeBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "edited.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported edited PDF");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF");
    }
  }, [overlays, pdfFile]);

  return (
    <Card className="p-6 bg-gradient-to-b from-card to-card/50 shadow-[var(--shadow-elegant)]">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-xl">PDF Editor</CardTitle>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={onPdfSelected}
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onImageSelected}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => pdfInputRef.current?.click()}
            >
              <Upload className="mr-2" /> Upload PDF
            </Button>
            <Button
              variant={tool === "select" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("select")}
              title="Select / Move"
            >
              <Move className="mr-2" /> Select
            </Button>
            <Button
              variant={tool === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("text")}
              title="Add Text"
            >
              <Type className="mr-2" /> Text
            </Button>
            <Button
              variant={tool === "image" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTool("image");
                imageInputRef.current?.click();
              }}
              title="Add Image"
            >
              <ImageIcon className="mr-2" /> Image
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportPdf}
              disabled={!pdfFile}
            >
              <Download className="mr-2" /> Export
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteSelected}
              disabled={!selectedId}
            >
              <Trash2 className="mr-2" /> Delete
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {!pdfFile ? (
          <div className="border border-dashed rounded-md p-8 text-center text-muted-foreground">
            <p className="mb-4">Upload a PDF to start editing.</p>
            <Button
              variant="outline"
              onClick={() => pdfInputRef.current?.click()}
            >
              <Upload className="mr-2" /> Choose PDF
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoad}
              onLoadError={(err) => {
                console.error(err);
                toast.error(
                  "Failed to load PDF. Ensure it's a valid PDF file."
                );
              }}
              renderMode="canvas"
            >
              {Array.from({ length: numPages }, (_, i) => (
                <div
                  key={i}
                  className="relative border rounded-md overflow-hidden"
                  ref={(el) => (pageRefs.current[i] = el)}
                >
                  <div onClick={(e) => onPageClick(i, e)}>
                    <Page
                      pageNumber={i + 1}
                      width={800}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </div>

                  {overlays
                    .filter((o) => o.pageIndex === i)
                    .map((o) => {
                      const commonStyle: React.CSSProperties = {
                        position: "absolute",
                        left: `${o.xPercent * 100}%`,
                        top: `${o.yPercent * 100}%`,
                        width: `${o.widthPercent * 100}%`,
                        height: `${o.heightPercent * 100}%`,
                        transform: o.rotationDeg
                          ? `rotate(${o.rotationDeg}deg)`
                          : undefined,
                        outline:
                          o.id === selectedId
                            ? "2px solid hsl(var(--primary))"
                            : "none",
                        cursor: tool === "select" ? "move" : "default",
                        userSelect: "none",
                      };

                      if (o.type === "text") {
                        return (
                          <div
                            key={o.id}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(o.id);
                            }}
                            onPointerDown={(e) =>
                              tool === "select" && handleDrag(o.id, i, e)
                            }
                            style={commonStyle}
                            className="bg-background/60 backdrop-blur-[1px] rounded-sm shadow-sm"
                          >
                            <textarea
                              value={o.text}
                              onChange={(e) =>
                                setOverlays((prev) =>
                                  prev.map((x) =>
                                    x.id === o.id && x.type === "text"
                                      ? { ...x, text: e.target.value }
                                      : x
                                  )
                                )
                              }
                              style={{
                                width: "100%",
                                height: "100%",
                                fontSize: o.fontSize,
                                color: o.color,
                                fontWeight: o.bold ? 700 : 400,
                                background: "transparent",
                                resize: "none",
                                outline: "none",
                                padding: 6,
                              }}
                            />
                            <div
                              onPointerDown={(e) => handleResize(o.id, i, e)}
                              className="absolute right-0 bottom-0 w-3 h-3 bg-primary rounded-sm cursor-nwse-resize"
                            />
                            {o.id === selectedId && (
                              <div className="absolute -top-8 left-0 flex items-center gap-2 bg-background/80 px-2 py-1 rounded-md text-xs border">
                                <label className="flex items-center gap-1">
                                  Size
                                  <input
                                    type="number"
                                    className="w-14 bg-transparent border rounded px-1 py-0.5"
                                    value={o.fontSize}
                                    onChange={(e) =>
                                      setOverlays((prev) =>
                                        prev.map((x) =>
                                          x.id === o.id && x.type === "text"
                                            ? {
                                                ...x,
                                                fontSize: Number(
                                                  e.target.value || 12
                                                ),
                                              }
                                            : x
                                        )
                                      )
                                    }
                                  />
                                </label>
                                <label className="flex items-center gap-1">
                                  Color
                                  <input
                                    type="color"
                                    value={o.color}
                                    onChange={(e) =>
                                      setOverlays((prev) =>
                                        prev.map((x) =>
                                          x.id === o.id && x.type === "text"
                                            ? { ...x, color: e.target.value }
                                            : x
                                        )
                                      )
                                    }
                                  />
                                </label>
                                <label className="flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    checked={o.bold}
                                    onChange={(e) =>
                                      setOverlays((prev) =>
                                        prev.map((x) =>
                                          x.id === o.id && x.type === "text"
                                            ? { ...x, bold: e.target.checked }
                                            : x
                                        )
                                      )
                                    }
                                  />
                                  Bold
                                </label>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Image overlay
                      return (
                        <div
                          key={o.id}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(o.id);
                          }}
                          onPointerDown={(e) =>
                            tool === "select" && handleDrag(o.id, i, e)
                          }
                          style={commonStyle}
                          className="bg-transparent"
                        >
                          <img
                            src={o.src}
                            alt="overlay"
                            className="w-full h-full object-contain select-none pointer-events-none"
                          />
                          <div
                            onPointerDown={(e) => handleResize(o.id, i, e)}
                            className="absolute right-0 bottom-0 w-3 h-3 bg-primary rounded-sm cursor-nwse-resize"
                          />
                        </div>
                      );
                    })}
                </div>
              ))}
            </Document>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PdfEditor;
