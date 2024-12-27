import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Thread } from "@/types/thread";
import { Edit2 } from "lucide-react";
import { useState } from "react";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

interface ThreadItemProps {
  thread: Thread;
  isActive: boolean;
  onSelect: (threadId: string) => void;
  onEditSave: (threadId: string, newTitle: string) => void;
}

export const ThreadItem = ({
  thread,
  isActive,
  onSelect,
  onEditSave,
}: ThreadItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);

  const handleEditStart = () => {
    setIsEditing(true);
    setEditTitle(thread.title);
  };

  const handleEditSave = () => {
    onEditSave(thread.id, editTitle);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <SidebarMenuItem>
      {isEditing ? (
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
            onClick={() => onSelect(thread.id)}
            className={`w-full ${isActive ? "bg-accent" : ""}`}
          >
            <span className="flex-1 truncate text-left">{thread.title}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(thread.updated_at).toLocaleDateString()}
            </span>
          </SidebarMenuButton>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              handleEditStart();
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </SidebarMenuItem>
  );
};