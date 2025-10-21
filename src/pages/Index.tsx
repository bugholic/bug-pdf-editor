import { PDFMerger } from "@/components/PDFMerger";
import { ImageToPDF } from "@/components/ImageToPDF";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { FileText } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-hero)] opacity-10" />
        <div className="absolute inset-0" style={{ boxShadow: "var(--shadow-glow)" }} />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">PDF Tools Suite</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              PDF Editor & Markdown
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Merge PDFs, convert images to PDF, and write beautiful markdown documents
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Left Column - PDF Tools */}
          <div className="space-y-6">
            <PDFMerger />
            <ImageToPDF />
          </div>

          {/* Right Column - Markdown Editor */}
          <div>
            <MarkdownEditor />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t">
        <p className="text-center text-sm text-muted-foreground">
          Built with React, TypeScript & pdf-lib
        </p>
      </footer>
    </div>
  );
};

export default Index;
