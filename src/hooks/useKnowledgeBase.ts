import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useKnowledgeBase = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addUrl = async (url: string, title: string) => {
    setIsLoading(true);
    try {
      // First, insert the URL into the database
      const { data, error } = await supabase
        .from('knowledge_urls')
        .insert({ url, title })
        .select()
        .single();

      if (error) throw error;

      // Fetch the content and process it
      const response = await fetch(url);
      const content = await response.text();

      // Process the content using the Edge Function
      const { error: processError } = await supabase.functions.invoke('process-document', {
        body: { type: 'url', content, id: data.id },
      });

      if (processError) throw processError;

      toast({
        title: "Success",
        description: "URL added to knowledge base",
      });

      return true;
    } catch (error) {
      console.error('Error adding URL:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add URL to knowledge base",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPdf = async (file: File) => {
    setIsLoading(true);
    try {
      // Upload file to storage
      const filePath = `${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('knowledge_pdfs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database entry
      const { data, error: dbError } = await supabase
        .from('knowledge_pdfs')
        .insert({
          filename: file.name,
          file_path: filePath,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Process the PDF using the Edge Function
      const formData = new FormData();
      formData.append('file', file);
      
      const { error: processError } = await supabase.functions.invoke('process-document', {
        body: { type: 'pdf', content: await file.text(), id: data.id },
      });

      if (processError) throw processError;

      toast({
        title: "Success",
        description: "PDF uploaded to knowledge base",
      });

      return true;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload PDF",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    addUrl,
    uploadPdf,
  };
};