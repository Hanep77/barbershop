import { Link } from "react-router";
import { Home, Search } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="font-bold text-4xl text-foreground mb-4">
          Page Not Found
        </h1>
        
        <p className="text-muted-foreground font-light text-lg mb-8 leading-relaxed">
          Sorry, we couldn't find the page you're looking for. The page may have been moved or doesn't exist.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse Barbershops
          </Link>
        </div>
      </div>
    </div>
  );
}
