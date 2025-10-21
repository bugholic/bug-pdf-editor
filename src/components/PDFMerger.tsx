import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Upload, X, Download } from "lucide-react";
import { toast } from "sonner";

export const PDFMerger = () => {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    onDrop: (acceptedFiles) => {
      setPdfFiles((prev) => [...prev, ...acceptedFiles]);
      toast.success(`Added ${acceptedFiles.length} PDF(s)`);
    },
  });

  const removeFile = (index: number) => {
    setPdfFiles((prev) => prev.filter((_, i) => i !== index));
    toast.info("PDF removed");
  };

  const mergePDFs = async () => {
    if (pdfFiles.length < 2) {
      toast.error("Please add at least 2 PDFs to merge");
      return;
    }

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of pdfFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([new Uint8Array(mergedPdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "merged.pdf";
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDFs merged successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to merge PDFs");
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-b from-card to-card/50 shadow-[var(--shadow-elegant)]">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Merge PDFs</h2>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            {isDragActive ? "Drop PDFs here" : "Drag & drop PDFs here"}
          </p>
          <p className="text-xs text-muted-foreground">or click to browse</p>
        </div>

        {pdfFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{pdfFiles.length} PDF(s) selected:</p>
            {pdfFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {pdfFiles.length >= 2 && (
          <Button
            onClick={mergePDFs}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Merge & Download
          </Button>
        )}
      </div>
    </Card>
  );
};
