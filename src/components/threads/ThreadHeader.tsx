import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { SidebarGroupLabel } from "@/components/ui/sidebar";

interface ThreadHeaderProps {
  onNewThread: () => void;
}

export const ThreadHeader = ({ onNewThread }: ThreadHeaderProps) => {
  return (
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
  );
};