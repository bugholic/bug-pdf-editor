import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Upload, X, Download } from "lucide-react";
import { toast } from "sonner";

export const ImageToPDF = () => {
  const [images, setImages] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    onDrop: (acceptedFiles) => {
      setImages((prev) => [...prev, ...acceptedFiles]);
      toast.success(`Added ${acceptedFiles.length} image(s)`);
    },
  });

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    toast.info("Image removed");
  };

  const createPDFFromImages = async () => {
    if (images.length === 0) {
      toast.error("Please add at least one image");
      return;
    }

    try {
      const pdfDoc = await PDFDocument.create();

      for (const imageFile of images) {
        const arrayBuffer = await imageFile.arrayBuffer();
        let image;

        if (imageFile.type === "image/png") {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else {
          image = await pdfDoc.embedJpg(arrayBuffer);
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "images.pdf";
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF created successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create PDF from images");
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-b from-card to-card/50 shadow-[var(--shadow-elegant)]">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-secondary" />
          <h2 className="text-xl font-semibold">Images to PDF</h2>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? "border-secondary bg-secondary/5 scale-[1.02]"
              : "border-border hover:border-secondary/50 hover:bg-muted/50"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            {isDragActive ? "Drop images here" : "Drag & drop images here"}
          </p>
          <p className="text-xs text-muted-foreground">PNG, JPG, JPEG, WEBP supported</p>
        </div>

        {images.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{images.length} image(s) selected:</p>
            <div className="grid grid-cols-2 gap-2">
              {images.map((file, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden aspect-video bg-muted"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                    <p className="text-xs text-white truncate">{file.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {images.length > 0 && (
          <Button
            onClick={createPDFFromImages}
            className="w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90 transition-opacity"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Create PDF & Download
          </Button>
        )}
      </div>
    </Card>
  );
};
