import { Button } from "@/components/ui/button";
import { Thread } from "@/types/thread";
import { PlusCircle } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
  return (
    <Sidebar>
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
                  <SidebarMenuButton
                    onClick={() => onThreadSelect(thread.id)}
                    className={activeThreadId === thread.id ? "bg-accent" : ""}
                  >
                    <span>{thread.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(thread.updated_at).toLocaleDateString()}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};