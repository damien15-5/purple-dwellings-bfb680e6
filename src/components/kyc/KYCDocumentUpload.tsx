import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Camera, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createWorker } from 'tesseract.js';
import { extractDataByDocType } from '@/utils/nigerianData';
import imageCompression from 'browser-image-compression';

interface Props {
  docType: string;
  onComplete: (imageFile: File, imagePreview: string, ocrData: any, rawText: string) => void;
  onBack: () => void;
}

export const KYCDocumentUpload = ({ docType, onComplete, onBack }: Props) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');

  const validateImage = (file: File): { valid: boolean; error?: string } => {
    if (file.size < 50000) return { valid: false, error: 'Image too small. Please capture a clearer photo.' };
    if (file.size > 10000000) return { valid: false, error: 'Image too large. Max 10MB allowed.' };
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      return { valid: false, error: 'Invalid format. Use JPEG, PNG or WebP.' };
    }
    return { valid: true };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      toast({ title: 'Invalid Image', description: validation.error, variant: 'destructive' });
      return;
    }

    try {
      const compressed = await imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true });
      const preview = URL.createObjectURL(compressed);
      setImagePreview(preview);
      setImageFile(compressed);
    } catch {
      toast({ title: 'Error', description: 'Failed to process image', variant: 'destructive' });
    }
  };

  const handleProcessOCR = async () => {
    if (!imageFile || !imagePreview) return;
    setProcessing(true);
    setProgress(10);
    setProgressText('Initializing OCR engine...');

    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const p = Math.round((m.progress || 0) * 100);
            setProgress(10 + p * 0.8);
            if (p < 30) setProgressText('Detecting text...');
            else if (p < 60) setProgressText('Reading data...');
            else if (p < 90) setProgressText('Validating...');
            else setProgressText('Almost done...');
          }
        },
      });

      const { data } = await worker.recognize(imagePreview);
      await worker.terminate();

      setProgress(100);
      setProgressText('Complete!');

      const extracted = extractDataByDocType(data.text, docType);
      
      setTimeout(() => {
        onComplete(imageFile, imagePreview, extracted, data.text);
      }, 500);
    } catch (error: any) {
      toast({ title: 'OCR Failed', description: 'Unable to read document. Please retake photo with better lighting.', variant: 'destructive' });
      setProcessing(false);
      setProgress(0);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setProgress(0);
    setProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-accent-purple" />
            Upload Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!imagePreview ? (
            <>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Tips for a good capture:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Ensure good lighting — avoid glare and shadows</li>
                  <li>Capture the full document</li>
                  <li>Keep the document flat on a surface</li>
                  <li>Use a high-resolution image (min 800×600)</li>
                </ul>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => { fileInputRef.current?.setAttribute('capture', 'environment'); fileInputRef.current?.click(); }}>
                  <Camera className="h-8 w-8 text-accent-purple" />
                  <span>Take Photo</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => { fileInputRef.current?.removeAttribute('capture'); fileInputRef.current?.click(); }}>
                  <Upload className="h-8 w-8 text-accent-purple" />
                  <span>Upload File</span>
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img src={imagePreview} alt="Document preview" className="w-full max-h-80 object-contain rounded-lg border border-border" />
                {!processing && (
                  <button onClick={clearImage} className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {processing ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-accent-purple" />
                    <span className="text-sm text-foreground">{progressText}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">{Math.round(progress)}%</p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={clearImage} className="flex-1">Retake</Button>
                  <Button variant="hero" onClick={handleProcessOCR} className="flex-1">Process Document</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!processing && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>Back</Button>
        </div>
      )}
    </div>
  );
};
