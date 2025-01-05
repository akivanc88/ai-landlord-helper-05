import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";

export const AdminKnowledgeBase = () => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { isLoading, addUrl, uploadPdf } = useKnowledgeBase();

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url && title) {
      await addUrl(url, title);
      setUrl("");
      setTitle("");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    }
  };

  const handlePdfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      await uploadPdf(selectedFile);
      setSelectedFile(null);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-4">Add Knowledge Source</h2>
        
        <div className="space-y-6">
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter website URL"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter source title"
                className="mt-1"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !url || !title}
              className="w-full"
            >
              {isLoading ? "Adding..." : "Add URL"}
            </Button>
          </form>

          <div className="border-t pt-6">
            <form onSubmit={handlePdfSubmit} className="space-y-4">
              <div>
                <Label htmlFor="pdf">PDF Document</Label>
                <Input
                  id="pdf"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || !selectedFile}
                className="w-full"
              >
                {isLoading ? "Uploading..." : "Upload PDF"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};