import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, AlertCircle, Check } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent-purple bg-clip-text text-transparent mb-2">
          Upload Property Images
        </h2>
        <p className="text-muted-foreground text-lg">Upload at least 3 high-quality images of your property (max 15)</p>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-primary/5 to-accent-purple/5 border-2 border-primary/20 rounded-xl p-5 flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground mb-1">Image Tips</p>
          <p className="text-sm text-muted-foreground">
            Upload clear, well-lit photos showing different angles of your property. The first image will be used as the thumbnail.
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className="border-3 border-dashed border-primary/30 rounded-2xl p-12 text-center hover:border-primary hover:bg-gradient-to-br hover:from-primary/5 hover:to-accent-purple/5 transition-all duration-300 cursor-pointer bg-accent/10 group"
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
            <Upload className="w-10 h-10 text-primary-foreground" />
          </div>
          <p className="text-xl font-bold text-foreground">Click to upload images</p>
          <p className="text-muted-foreground">Drag and drop or browse files</p>
          <div className="mt-2 px-4 py-2 bg-primary/10 rounded-full">
            <p className="text-sm font-semibold text-primary">
              {images.length}/15 images uploaded (minimum 3 required)
            </p>
          </div>
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
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <p className="text-sm font-medium text-primary">
              Upload {3 - images.length} more image{3 - images.length !== 1 ? 's' : ''} to continue
            </p>
          </div>
        </div>
      )}

      {images.length >= 3 && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <Check className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-primary">
              Ready to proceed! You can upload more images if needed
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
