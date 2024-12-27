import { Thread } from "@/types/thread";
import { SidebarMenu } from "@/components/ui/sidebar";
import { ThreadItem } from "./ThreadItem";

interface ThreadListProps {
  threads: Thread[];
  activeThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onEditSave: (threadId: string, newTitle: string) => void;
}

export const ThreadList = ({
  threads,
  activeThreadId,
  onThreadSelect,
  onEditSave,
}: ThreadListProps) => {
  return (
    <SidebarMenu>
      {threads.map((thread) => (
        <ThreadItem
          key={thread.id}
          thread={thread}
          isActive={activeThreadId === thread.id}
          onSelect={onThreadSelect}
          onEditSave={onEditSave}
        />
      ))}
    </SidebarMenu>
  );
};