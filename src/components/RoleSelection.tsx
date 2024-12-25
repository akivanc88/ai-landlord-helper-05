import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface RoleSelectionProps {
  onSelect: (role: "landlord" | "tenant") => void;
}

export const RoleSelection = ({ onSelect }: RoleSelectionProps) => {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card
        className="flex cursor-pointer flex-col items-center gap-4 p-6 transition-all hover:shadow-lg"
        onClick={() => onSelect("landlord")}
      >
        <div className="rounded-full bg-primary p-4">
          <svg
            className="h-8 w-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold">I'm a Landlord</h3>
        <p className="text-center text-sm text-slate-600">
          Get assistance with property management and tenant relations
        </p>
      </Card>

      <Card
        className="flex cursor-pointer flex-col items-center gap-4 p-6 transition-all hover:shadow-lg"
        onClick={() => onSelect("tenant")}
      >
        <div className="rounded-full bg-secondary p-4">
          <svg
            className="h-8 w-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold">I'm a Tenant</h3>
        <p className="text-center text-sm text-slate-600">
          Learn about your rights and responsibilities as a tenant
        </p>
      </Card>
    </div>
  );
};