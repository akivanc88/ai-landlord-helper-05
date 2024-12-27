import { Button } from "@/components/ui/button";
import { UserRole } from "@/types/chat";

interface AppHeaderProps {
  role: UserRole;
  onRoleSwitch: () => void;
  onSignOut: () => void;
}

export const AppHeader = ({ role, onRoleSwitch, onSignOut }: AppHeaderProps) => {
  return (
    <header className="border-b bg-primary py-4">
      <div className="container mx-auto flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">
          BC Housing Legal Assistant
        </h1>
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRoleSwitch}
            className="text-sm font-semibold bg-secondary text-black hover:bg-secondary/90"
          >
            Switch to {role === "landlord" ? "Tenant" : "Landlord"}
          </Button>
          <span className="rounded bg-accent px-4 py-1 text-sm text-white">
            {role === "landlord" ? "Landlord" : "Tenant"}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={onSignOut}
            className="text-sm font-semibold bg-secondary text-black hover:bg-secondary/90"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};