import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import imageCompression from 'browser-image-compression';

interface Props {
  onComplete: (file: File, preview: string) => void;
  onBack: () => void;
}

export const KYCSelfieUpload = ({ onComplete, onBack }: Props) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(selected.type)) {
      toast({ title: 'Invalid format', description: 'Please use JPEG or PNG', variant: 'destructive' });
      return;
    }

    try {
      const compressed = await imageCompression(selected, { maxSizeMB: 1, maxWidthOrHeight: 1280, useWebWorker: true });
      setPreview(URL.createObjectURL(compressed));
      setFile(compressed);
    } catch {
      toast({ title: 'Error', description: 'Failed to process image', variant: 'destructive' });
    }
  };

  const clear = () => {
    setPreview(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-accent-purple" />
            Take a Selfie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Instructions:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Remove glasses and hats</li>
              <li>Look directly at the camera</li>
              <li>Ensure good lighting on your face</li>
              <li>No face coverings</li>
            </ul>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" capture="user" onChange={handleFileSelect} className="hidden" />

          {!preview ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => { fileInputRef.current?.setAttribute('capture', 'user'); fileInputRef.current?.click(); }}>
                <Camera className="h-8 w-8 text-accent-purple" />
                <span>Take Selfie</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => { fileInputRef.current?.removeAttribute('capture'); fileInputRef.current?.click(); }}>
                <Upload className="h-8 w-8 text-accent-purple" />
                <span>Upload Photo</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative max-w-xs mx-auto">
                <img src={preview} alt="Selfie preview" className="w-full rounded-lg border border-border" />
                <button onClick={clear} className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={clear}>Retake</Button>
                <Button variant="hero" onClick={() => file && preview && onComplete(file, preview)}>Continue</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
      </div>
    </div>
  );
};
