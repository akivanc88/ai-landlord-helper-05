import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

export const NavigationBar = () => {
  const { user } = useAuth();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-primary">
              BC Housing Legal Assistant
            </Link>
            <div className="hidden md:flex space-x-6">
              <button 
                onClick={() => scrollToSection('features')} 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('pricing')} 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Pricing
              </button>
              <button 
                onClick={() => scrollToSection('contact')} 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Contact
              </button>
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