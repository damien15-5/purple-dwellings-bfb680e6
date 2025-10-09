import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Maximize2, ZoomIn, ZoomOut, Download, Share2, RotateCcw, Move } from 'lucide-react';
import { toast } from 'sonner';

export const ThreeDTour = () => {
  const { id } = useParams();
  const [selectedRoom, setSelectedRoom] = useState('living-room');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const rooms = [
    { id: 'living-room', name: 'Living Room', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200' },
    { id: 'kitchen', name: 'Kitchen', image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200' },
    { id: 'master-bedroom', name: 'Master Bedroom', image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200' },
    { id: 'bathroom', name: 'Bathroom', image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200' },
    { id: 'balcony', name: 'Balcony', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200' },
  ];

  const currentRoom = rooms.find(r => r.id === selectedRoom) || rooms[0];

  const handleFullscreen = () => {
    document.documentElement.requestFullscreen();
    toast.success('Entered fullscreen mode');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('3D Tour link copied to clipboard');
  };

  const handleDownload = () => {
    toast.success('Floor plan download started');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
      
      // Calculate rotation based on horizontal movement
      const rotationChange = (e.movementX * 0.5);
      setRotation(prev => (prev + rotationChange) % 360);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setZoom(100);
    toast.success('View reset');
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link to={`/property/${id}`}>
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Listing
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={resetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleFullscreen}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main 3D Viewer */}
      <div className="flex h-screen">
        {/* Room Selector Sidebar */}
        <div className="w-64 bg-black/90 border-r border-white/10 p-4 overflow-y-auto">
          <h3 className="text-white font-semibold mb-4">Select Room</h3>
          <div className="space-y-2">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room.id)}
                className={`w-full text-left p-3 rounded-lg transition-all hover-lift ${
                  selectedRoom === room.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                <div className="font-medium">{room.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3D Viewer Area */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div
            className="w-full h-full bg-cover bg-center transition-transform duration-100"
            style={{
              backgroundImage: `url(${currentRoom.image})`,
              transform: `scale(${zoom / 100}) translateX(${position.x}px) translateY(${position.y}px) perspective(1000px) rotateY(${rotation}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Overlay with room info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
              <div className="text-white">
                <h2 className="text-3xl font-bold mb-2 animate-fade-in">{currentRoom.name}</h2>
                <div className="flex items-center gap-2 text-white/80">
                  <Move className="w-4 h-4" />
                  <p>Drag to rotate • Scroll to zoom • Click rooms to explore</p>
                </div>
              </div>
            </div>
            
            {/* 360° indicator */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg text-white">
              <p className="text-sm font-medium">360° View</p>
              <p className="text-xs text-white/70">Rotation: {Math.round(rotation)}°</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="container mx-auto flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-white font-medium">{zoom}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => setZoom(Math.min(200, zoom + 10))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
