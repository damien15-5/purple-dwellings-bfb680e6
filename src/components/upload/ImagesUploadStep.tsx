import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

type Props = {
  images: File[];
  setImages: (images: File[]) => void;
  hasReceipt: boolean;
  setHasReceipt: (value: boolean) => void;
  propertyType: string;
};

export const ImagesUploadStep = ({ images, setImages, hasReceipt, setHasReceipt, propertyType }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > 15) {
      toast.error('Maximum 15 images allowed');
      return;
    }

    setImages([...images, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const isLand = propertyType === 'Land';
  const showReceiptWarning = !isLand && !hasReceipt && images.length >= 3;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Upload Property Images</h2>
        <p className="text-muted-foreground">Upload at least 3 high-quality images of your property (max 15)</p>
      </div>

      {/* Receipt Requirement Warning */}
      {!isLand && (
        <div className="bg-accent/50 border border-border rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-2">Receipt Required</p>
            <p className="text-sm text-muted-foreground mb-3">
              For non-land properties, you must upload a House Rent/Sale Receipt. You can include it here as one of your images or upload it in the documents step.
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasReceipt"
                checked={hasReceipt}
                onCheckedChange={(checked) => setHasReceipt(checked as boolean)}
              />
              <Label htmlFor="hasReceipt" className="cursor-pointer font-normal text-sm">
                I have uploaded/will upload the receipt
              </Label>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-accent/20"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <p className="text-lg font-medium text-foreground">Click to upload images</p>
          <p className="text-sm text-muted-foreground">Drag and drop or browse files</p>
          <p className="text-xs text-muted-foreground mt-2">
            {images.length}/15 images uploaded (minimum 3 required)
          </p>
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={URL.createObjectURL(image)}
                alt={`Property ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeImage(index)}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Remove
                </Button>
              </div>
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Thumbnail
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Status Message */}
      {images.length > 0 && images.length < 3 && (
        <div className="text-center text-sm text-muted-foreground">
          Upload {3 - images.length} more image{3 - images.length !== 1 ? 's' : ''} to continue
        </div>
      )}

      {showReceiptWarning && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">
            Please confirm that you have uploaded the receipt or will upload it in the documents step
          </p>
        </div>
      )}
    </div>
  );
};
