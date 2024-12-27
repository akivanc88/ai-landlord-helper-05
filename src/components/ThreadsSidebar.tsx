import { Thread } from "@/types/thread";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ThreadHeader } from "./threads/ThreadHeader";
import { ThreadList } from "./threads/ThreadList";

interface ThreadsSidebarProps {
  threads: Thread[];
  activeThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
}

export const ThreadsSidebar = ({
  threads,
  activeThreadId,
  onThreadSelect,
  onNewThread,
}: ThreadsSidebarProps) => {
  const { toast } = useToast();

  const handleEditSave = async (threadId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('conversation_threads')
        .update({ title: newTitle })
        .eq('id', threadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Thread title updated successfully",
      });

      window.location.reload();
    } catch (error) {
      console.error('Error updating thread title:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update thread title",
      });
    }
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <ThreadHeader onNewThread={onNewThread} />
          <SidebarGroupContent>
            <ThreadList
              threads={threads}
              activeThreadId={activeThreadId}
              onThreadSelect={onThreadSelect}
              onEditSave={handleEditSave}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};