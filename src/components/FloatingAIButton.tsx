import { Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const FloatingAIButton = () => {
  return (
    <Link to="/ai-support">
      <Button
        size="lg"
        className="fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 p-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-float bg-primary hover:bg-primary/90"
        title="Xavi - AI Customer Support"
      >
        <Bot className="h-6 w-6 text-primary-foreground" />
      </Button>
    </Link>
  );
};
