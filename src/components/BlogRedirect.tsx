import { useEffect } from 'react';

export const BlogRedirect = () => {
  useEffect(() => {
    window.location.href = 'https://blog.xavorian.xyz';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Blog...</h1>
        <p className="text-muted-foreground">If you are not redirected automatically, 
          <a href="https://blog.xavorian.xyz" className="text-primary underline ml-1">click here</a>
        </p>
      </div>
    </div>
  );
};
