import { PDFMerger } from "@/components/PDFMerger";
import { ImageToPDF } from "@/components/ImageToPDF";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { PdfEditor } from "@/components/PdfEditor";
import { FileText } from "lucide-react";
import { Footer } from "@/components/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-hero)] opacity-10" />
        <div
          className="absolute inset-0"
          style={{ boxShadow: "var(--shadow-glow)" }}
        />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">
                PDF Tools Suite
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Bug's PDF Editor & Markdown
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Merge PDFs, convert images to PDF, edit PDF pages, and write
              beautiful markdown documents
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="h-auto w-full flex-wrap gap-1 bg-muted/70 p-1">
              <TabsTrigger value="edit" className="flex-1 min-w-[120px]">
                PDF Editor
              </TabsTrigger>
              <TabsTrigger value="merge" className="flex-1 min-w-[120px]">
                Merge PDFs
              </TabsTrigger>
              <TabsTrigger value="image" className="flex-1 min-w-[120px]">
                Images to PDF
              </TabsTrigger>
              <TabsTrigger value="markdown" className="flex-1 min-w-[120px]">
                Markdown
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit">
              <PdfEditor />
            </TabsContent>
            <TabsContent value="merge">
              <PDFMerger />
            </TabsContent>
            <TabsContent value="image">
              <ImageToPDF />
            </TabsContent>
            <TabsContent value="markdown">
              <MarkdownEditor />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
