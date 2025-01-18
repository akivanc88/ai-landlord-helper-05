import { Button } from "@/components/ui/button";
import { Thread } from "@/types/thread";
import { PlusCircle, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

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
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const { toast } = useToast();

  const handleEditStart = (thread: Thread) => {
    setEditingThreadId(thread.id);
    setEditTitle(thread.title);
  };

  const handleEditSave = async () => {
    if (!editingThreadId) return;

    try {
      const { error } = await supabase
        .from('conversation_threads')
        .update({ title: editTitle })
        .eq('id', editingThreadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Thread title updated successfully",
      });

      // Update the thread title in the local state through a page refresh
      window.location.reload();
    } catch (error) {
      console.error('Error updating thread title:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update thread title",
      });
    }

    setEditingThreadId(null);
  };

  const handleDelete = async (threadId: string) => {
    try {
      const { error } = await supabase
        .from('conversation_threads')
        .delete()
        .eq('id', threadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Conversation deleted successfully",
      });

      // Refresh the page to update the threads list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete conversation",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      setEditingThreadId(null);
    }
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between px-4 py-2">
            <SidebarGroupLabel>Conversations</SidebarGroupLabel>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewThread}
              className="h-8 w-8"
            >
              <PlusCircle className="h-5 w-5" />
            </Button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {threads.map((thread) => (
                <SidebarMenuItem key={thread.id}>
                  {editingThreadId === thread.id ? (
                    <div className="flex w-full gap-2 px-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onBlur={handleEditSave}
                        autoFocus
                        className="h-8"
                      />
                    </div>
                  ) : (
                    <div className="group relative w-full">
                      <SidebarMenuButton
                        onClick={() => onThreadSelect(thread.id)}
                        className={`w-full ${
                          activeThreadId === thread.id ? "bg-accent" : ""
                        }`}
                      >
                        <span className="flex-1 truncate text-left">
                          {thread.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(thread.updated_at).toLocaleDateString()}
                        </span>
                      </SidebarMenuButton>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditStart(thread);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(thread.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};