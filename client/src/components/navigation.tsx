import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { User, Heart, ShoppingBag } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="text-2xl font-bold cursor-pointer" data-testid="link-home">ZARA</div>
            </Link>
            <div className="hidden md:flex items-center space-x-1 text-sm font-medium">
              <span className="text-muted-foreground">Virtual</span>
              <span className="text-primary">Try-On</span>
              <span className="text-muted-foreground">Studio</span>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/">
              <Button 
                variant={location === "/" ? "default" : "ghost"} 
                size="sm"
                data-testid="link-nav-home"
              >
                Home
              </Button>
            </Link>
            <Link href="/try">
              <Button 
                variant={location === "/try" ? "default" : "ghost"} 
                size="sm"
                data-testid="link-nav-tryon"
              >
                Try-On
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" data-testid="button-user">
              <User className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-favorites">
              <Heart className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-cart">
              <ShoppingBag className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
