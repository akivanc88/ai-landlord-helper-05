import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type KnowledgeSource = {
  id: string;
  title?: string | null;
  url?: string;
  filename?: string;
  created_at: string;
  type: 'url' | 'pdf';
};

export const KnowledgeSourceManager = () => {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();

  const fetchSources = async () => {
    try {
      // Fetch URLs
      const { data: urls, error: urlError } = await supabase
        .from('knowledge_urls')
        .select('id, url, title, created_at')
        .eq('is_active', true);

      if (urlError) throw urlError;

      // Fetch PDFs
      const { data: pdfs, error: pdfError } = await supabase
        .from('knowledge_pdfs')
        .select('id, filename, created_at')
        .eq('is_active', true);

      if (pdfError) throw pdfError;

      // Combine and format the sources
      const formattedSources: KnowledgeSource[] = [
        ...(urls?.map(url => ({
          ...url,
          type: 'url' as const,
        })) || []),
        ...(pdfs?.map(pdf => ({
          ...pdf,
          type: 'pdf' as const,
        })) || []),
      ].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setSources(formattedSources);
    } catch (error) {
      console.error('Error fetching sources:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch knowledge sources",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (source: KnowledgeSource) => {
    try {
      const table = source.type === 'url' ? 'knowledge_urls' : 'knowledge_pdfs';
      const { error } = await supabase
        .from(table)
        .update({ is_active: false })
        .eq('id', source.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${source.type.toUpperCase()} source deleted successfully`,
      });

      // Refresh the list
      fetchSources();
    } catch (error) {
      console.error('Error deleting source:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete source",
      });
    }
  };

  const fetchRedditPosts = async () => {
    setIsFetching(true);
    try {
      const { error } = await supabase.functions.invoke('fetch-reddit-posts');
      
      if (error) throw error;

      toast({
        title: "Success",
        description: "Reddit posts fetched successfully",
      });
    } catch (error) {
      console.error('Error fetching Reddit posts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch Reddit posts",
      });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  if (isLoading) {
    return <div>Loading sources...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary">Knowledge Sources</h2>
        <Button 
          onClick={fetchRedditPosts}
          disabled={isFetching}
        >
          {isFetching ? "Fetching..." : "Fetch Reddit Posts"}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Title/Filename</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Added On</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((source) => (
            <TableRow key={source.id}>
              <TableCell className="font-medium">
                {source.type.toUpperCase()}
              </TableCell>
              <TableCell>
                {source.type === 'url' ? source.title : source.filename}
              </TableCell>
              <TableCell>
                {source.type === 'url' && (
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {source.url}
                  </a>
                )}
              </TableCell>
              <TableCell>
                {new Date(source.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(source)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {sources.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No knowledge sources found
        </div>
      )}
    </div>
  );
};