import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bot, MessageSquare, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  angle: number; // degrees from horizontal left (0 = left, positive = upward)
}

export const FloatingMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems: MenuItem[] = [
    {
      icon: <Ticket className="h-5 w-5 text-primary" />,
      label: 'Create Ticket',
      path: '/dashboard/help',
      angle: 70, // upper diagonal
    },
    {
      icon: <MessageSquare className="h-5 w-5 text-primary" />,
      label: 'Messages',
      path: '/dashboard/messages',
      angle: 45, // mid diagonal
    },
    {
      icon: <Bot className="h-5 w-5 text-primary" />,
      label: 'AI Support',
      path: '/ai-support',
      angle: 20, // lower diagonal (but still above horizontal)
    },
  ];

  const handleItemClick = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  // Calculate position based on angle - all items go left and upward
  const getItemPosition = (angle: number, distance: number = 70) => {
    const radians = (angle * Math.PI) / 180;
    const x = -Math.cos(radians) * distance; // negative for left
    const y = -Math.sin(radians) * distance; // negative for upward in CSS
    return { x, y };
  };

  return (
    <div className="fixed bottom-24 right-6 z-50">
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Items - Fan Layout (all upward-left) */}
      {menuItems.map((item, index) => {
        const pos = getItemPosition(item.angle);
        return (
          <button
            key={item.label}
            onClick={() => handleItemClick(item.path)}
            className={cn(
              'absolute bottom-0 right-0 group flex items-center transition-all duration-300 ease-out',
              isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            style={{
              transform: isOpen 
                ? `translate(${pos.x}px, ${pos.y}px)` 
                : 'translate(0, 0)',
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
            }}
          >
            {/* Label tooltip */}
            <span
              className={cn(
                'absolute right-full mr-3 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap',
                'bg-white/80 backdrop-blur-xl border border-white/30 shadow-lg text-foreground',
                'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0',
                'transition-all duration-200'
              )}
            >
              {item.label}
            </span>
            
            {/* Icon button with glassmorphism */}
            <div
              className={cn(
                'h-12 w-12 rounded-full flex items-center justify-center',
                'bg-white/60 backdrop-blur-xl border border-white/40',
                'shadow-lg hover:shadow-xl transition-all duration-200',
                'hover:scale-110 active:scale-95 hover:bg-white/80'
              )}
            >
              {item.icon}
            </div>
          </button>
        );
      })}

      {/* Main Toggle Button with glassmorphism */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative h-14 w-14 rounded-full flex items-center justify-center',
          'bg-white/70 backdrop-blur-xl border border-white/40',
          'shadow-lg hover:shadow-xl transition-all duration-300 ease-out',
          'hover:scale-105 active:scale-95 hover:bg-white/90'
        )}
        title={isOpen ? 'Close menu' : 'Open menu'}
      >
        <div className="relative h-6 w-6">
          {/* Hamburger icon (3 lines) */}
          <div
            className={cn(
              'absolute inset-0 flex flex-col justify-center items-center gap-1.5 transition-all duration-300',
              isOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
            )}
          >
            <span className="w-5 h-0.5 bg-primary rounded-full" />
            <span className="w-5 h-0.5 bg-primary rounded-full" />
            <span className="w-5 h-0.5 bg-primary rounded-full" />
          </div>
          
          {/* X icon for close */}
          <X
            className={cn(
              'absolute inset-0 h-6 w-6 text-primary transition-all duration-300',
              isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
            )}
          />
        </div>
      </button>
    </div>
  );
};
