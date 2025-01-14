import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

export const NavigationBar = () => {
  const { user } = useAuth();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-primary">
              BC Housing Legal Assistant
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Features
              </Link>
              <Link to="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link to="/#contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Contact
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {!user ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.href = "/?showAuth=true"}
                className="text-sm font-semibold"
              >
                Sign In
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
};