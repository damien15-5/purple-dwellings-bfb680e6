import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Bot, MessageSquare, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  color: string;
}

export const FloatingMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems: MenuItem[] = [
    {
      icon: <Bot className="h-5 w-5" />,
      label: 'AI Support',
      path: '/ai-support',
      color: 'bg-primary',
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      label: 'Messages',
      path: '/my-chats',
      color: 'bg-blue-500',
    },
    {
      icon: <Ticket className="h-5 w-5" />,
      label: 'Create Ticket',
      path: '/dashboard/help',
      color: 'bg-amber-500',
    },
  ];

  const handleItemClick = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
      {/* Menu Items */}
      <div
        className={cn(
          'flex flex-col-reverse gap-3 transition-all duration-300 ease-out',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {menuItems.map((item, index) => (
          <button
            key={item.label}
            onClick={() => handleItemClick(item.path)}
            className={cn(
              'group flex items-center gap-3 transition-all duration-300 ease-out',
              isOpen
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-4'
            )}
            style={{
              transitionDelay: isOpen ? `${index * 75}ms` : '0ms',
            }}
          >
            {/* Label tooltip */}
            <span
              className={cn(
                'px-3 py-1.5 rounded-lg bg-card text-card-foreground text-sm font-medium shadow-lg',
                'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0',
                'transition-all duration-200 whitespace-nowrap border border-border'
              )}
            >
              {item.label}
            </span>
            
            {/* Icon button */}
            <div
              className={cn(
                item.color,
                'h-12 w-12 rounded-full flex items-center justify-center text-white',
                'shadow-lg hover:shadow-xl transition-all duration-200',
                'hover:scale-110 active:scale-95'
              )}
            >
              {item.icon}
            </div>
          </button>
        ))}
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-14 w-14 rounded-full flex items-center justify-center',
          'bg-primary text-primary-foreground shadow-lg hover:shadow-xl',
          'transition-all duration-300 ease-out hover:scale-105 active:scale-95',
          isOpen && 'rotate-90 bg-muted text-muted-foreground'
        )}
        title={isOpen ? 'Close menu' : 'Open menu'}
      >
        <div className="relative h-6 w-6">
          <Menu
            className={cn(
              'absolute inset-0 h-6 w-6 transition-all duration-300',
              isOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
            )}
          />
          <X
            className={cn(
              'absolute inset-0 h-6 w-6 transition-all duration-300',
              isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
            )}
          />
        </div>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
