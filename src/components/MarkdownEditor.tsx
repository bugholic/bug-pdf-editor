import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, FileCode } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const defaultMarkdown = `# Welcome to Markdown Editor

## Features
- **Bold** and *italic* text
- Lists and bullet points
- Code blocks
- Links and more!

### Example Code
\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

> This is a blockquote`;

export const MarkdownEditor = () => {
  const [markdown, setMarkdown] = useState(defaultMarkdown);

  const exportToPDF = async () => {
    try {
      const element = document.getElementById("markdown-preview");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save("markdown.pdf");
      toast.success("Markdown exported to PDF!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PDF");
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-b from-card to-card/50 shadow-[var(--shadow-elegant)]">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-semibold">Markdown Editor</h2>
          </div>
          <Button
            onClick={exportToPDF}
            variant="outline"
            size="sm"
            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export to PDF
          </Button>
        </div>

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="space-y-4">
            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Write your markdown here..."
              className="min-h-[400px] font-mono text-sm"
            />
          </TabsContent>
          <TabsContent value="preview">
            <div
              id="markdown-preview"
              className="min-h-[400px] p-6 bg-background rounded-lg border prose prose-slate max-w-none dark:prose-invert"
            >
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};
