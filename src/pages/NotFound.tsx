import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background px-4">
      <div className="text-center max-w-md w-full animate-fade-in">
        <div className="mb-6 mx-auto w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
          <Home className="w-12 h-12 text-destructive" />
        </div>
        <h1 className="mb-4 text-6xl sm:text-8xl font-bold text-foreground">404</h1>
        <h2 className="mb-3 text-2xl sm:text-3xl font-semibold text-foreground">Page Not Found</h2>
        <p className="mb-6 text-base sm:text-lg text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            Redirecting to home in <span className="text-2xl font-bold text-primary">{countdown}</span> {countdown === 1 ? 'second' : 'seconds'}...
          </p>
        </div>
        <a 
          href="/" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
        >
          <Home className="w-5 h-5" />
          Go Home Now
        </a>
      </div>
    </div>
  );
};

export default NotFound;
