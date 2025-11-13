import { MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const FloatingAIButton = () => {
  return (
    <Link to="/contact">
      <Button
        size="lg"
        className="fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 p-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-float bg-light-purple-accent hover:bg-light-purple-accent/90"
        title="AI Customer Service"
      >
        <MessageSquare className="h-6 w-6 text-black" />
      </Button>
    </Link>
  );
};
