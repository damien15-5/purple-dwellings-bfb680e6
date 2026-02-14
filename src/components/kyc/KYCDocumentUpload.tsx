import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Camera, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createWorker, Worker } from 'tesseract.js';
import { extractDataByDocType } from '@/utils/nigerianData';
import imageCompression from 'browser-image-compression';

interface Props {
  docType: string;
  onComplete: (imageFile: File, imagePreview: string, ocrData: any, rawText: string) => void;
  onBack: () => void;
}

/**
 * Enhanced image preprocessing for maximum OCR accuracy.
 * Converts to high-contrast grayscale with adaptive thresholding.
 */
function preprocessForOCR(canvas: HTMLCanvasElement, img: HTMLImageElement): void {
  const ctx = canvas.getContext('2d')!;
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Step 1: Convert to grayscale
  const gray = new Float32Array(pixels.length / 4);
  for (let i = 0; i < pixels.length; i += 4) {
    gray[i / 4] = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
  }

  // Step 2: Compute histogram for auto-levels
  const hist = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) {
    hist[Math.round(gray[i])]++;
  }

  // Find 1st and 99th percentile for contrast stretching
  const total = gray.length;
  let cumulative = 0;
  let low = 0, high = 255;
  for (let i = 0; i < 256; i++) {
    cumulative += hist[i];
    if (cumulative >= total * 0.01 && low === 0) low = i;
    if (cumulative >= total * 0.99) { high = i; break; }
  }
  if (high <= low) { low = 0; high = 255; }

  // Step 3: Apply contrast stretch + sharpening
  const range = high - low || 1;
  for (let i = 0; i < gray.length; i++) {
    // Stretch contrast
    let val = ((gray[i] - low) / range) * 255;
    val = Math.max(0, Math.min(255, val));

    // Boost contrast further with S-curve
    val = val / 255;
    val = val < 0.5
      ? 2 * val * val
      : 1 - 2 * (1 - val) * (1 - val);
    val = val * 255;

    const idx = i * 4;
    pixels[idx] = pixels[idx + 1] = pixels[idx + 2] = Math.round(val);
    pixels[idx + 3] = 255; // Full opacity
  }

  ctx.putImageData(imageData, 0, 0);

  // Step 4: Apply unsharp mask for sharpening (simple approach)
  // Re-read the contrast-enhanced image, blur it, then sharpen
  const enhanced = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const sharpened = ctx.createImageData(canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;
  const strength = 1.5;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      // Simple Laplacian sharpening
      for (let c = 0; c < 3; c++) {
        const center = enhanced.data[idx + c];
        const top = enhanced.data[((y - 1) * w + x) * 4 + c];
        const bottom = enhanced.data[((y + 1) * w + x) * 4 + c];
        const left = enhanced.data[(y * w + (x - 1)) * 4 + c];
        const right = enhanced.data[(y * w + (x + 1)) * 4 + c];
        const laplacian = 4 * center - top - bottom - left - right;
        sharpened.data[idx + c] = Math.max(0, Math.min(255, Math.round(center + strength * laplacian)));
      }
      sharpened.data[idx + 3] = 255;
    }
  }
  // Copy edges
  for (let x = 0; x < w; x++) {
    for (const y of [0, h - 1]) {
      const idx = (y * w + x) * 4;
      for (let c = 0; c < 4; c++) sharpened.data[idx + c] = enhanced.data[idx + c];
    }
  }
  for (let y = 0; y < h; y++) {
    for (const x of [0, w - 1]) {
      const idx = (y * w + x) * 4;
      for (let c = 0; c < 4; c++) sharpened.data[idx + c] = enhanced.data[idx + c];
    }
  }

  ctx.putImageData(sharpened, 0, 0);
}

export const KYCDocumentUpload = ({ docType, onComplete, onBack }: Props) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const workerReadyRef = useRef<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');

  // Pre-initialize Tesseract worker on mount for instant OCR
  const initWorker = useCallback(async (): Promise<Worker | null> => {
    // If already ready, return existing
    if (workerRef.current && workerReadyRef.current) return workerRef.current;

    const createWithRetry = async (attempt = 1): Promise<Worker> => {
      try {
        const w = await createWorker('eng', 1, {
          workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
          corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd-lstm.wasm.js',
        });
        await w.setParameters({
          tessedit_pageseg_mode: '6' as any,
          preserve_interword_spaces: '1' as any,
        });
        return w;
      } catch (err) {
        if (attempt < 3) {
          console.warn(`Tesseract init attempt ${attempt} failed, retrying...`);
          await new Promise(r => setTimeout(r, 500 * attempt));
          return createWithRetry(attempt + 1);
        }
        throw err;
      }
    };

    try {
      const w = await createWithRetry();
      workerRef.current = w;
      workerReadyRef.current = true;
      console.log('Tesseract worker ready');
      return w;
    } catch (err) {
      console.error('Failed to init Tesseract worker:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    initWorker().then(w => {
      if (cancelled && w) w.terminate();
    });
    return () => {
      cancelled = true;
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
        workerReadyRef.current = false;
      }
    };
  }, [initWorker]);

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
    setProgressText('Preprocessing image for maximum clarity...');

    try {
      // Load image into canvas for preprocessing
      const img = new Image();
      img.src = imagePreview;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      preprocessForOCR(canvas, img);

      setProgress(30);
      setProgressText('Extracting text...');

      // Use pre-loaded worker or init with retry
      const worker = await initWorker();
      if (!worker) throw new Error('OCR engine failed to load. Please check your internet connection and try again.');

      setProgress(40);
      setProgressText('Scanning document...');

      const { data } = await worker.recognize(canvas);

      console.log('OCR raw text:', data.text);
      console.log('OCR confidence:', data.confidence);

      setProgress(90);
      setProgressText('Extracting fields...');

      const extracted = extractDataByDocType(data.text, docType);
      console.log('Extracted data:', extracted);

      setProgress(100);
      setProgressText('Complete!');

      setTimeout(() => {
        onComplete(imageFile, imagePreview, extracted, data.text);
      }, 300);
    } catch (error: any) {
      console.error('OCR Error:', error);
      toast({ title: 'OCR Failed', description: error?.message || 'Unable to read document. Please retake photo with better lighting.', variant: 'destructive' });
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
