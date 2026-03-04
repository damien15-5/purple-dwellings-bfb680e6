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

const MAX_IMAGES = 15;
const MAX_VIDEOS = 1;

export const ImagesUploadStep = ({ images, setImages, hasReceipt, setHasReceipt, propertyType }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const imageFiles = images.filter(f => f.type.startsWith('image/'));
    const videoFiles = images.filter(f => f.type.startsWith('video/'));
    const newImageFiles = files.filter(f => f.type.startsWith('image/'));
    const newVideoFiles = files.filter(f => f.type.startsWith('video/'));
    
    if (imageFiles.length + newImageFiles.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    if (videoFiles.length + newVideoFiles.length > MAX_VIDEOS) {
      toast.error(`Maximum ${MAX_VIDEOS} video allowed`);
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
          Upload Property Images & Video
        </h2>
        <p className="text-muted-foreground text-lg">Upload at least 1 image or video (max 15 images, 1 video)</p>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-primary/5 to-accent-purple/5 border-2 border-primary/20 rounded-xl p-5 flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground mb-1">Media Upload Tips</p>
          <p className="text-sm text-muted-foreground">
            Upload clear, well-lit photos showing different angles of your property. The first image will be used as the thumbnail (cover image). You can also upload 1 video to showcase your property.
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
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
            <Upload className="w-10 h-10 text-primary-foreground" />
          </div>
          <p className="text-xl font-bold text-foreground">Click to upload images & video</p>
          <p className="text-muted-foreground">Drag and drop or browse files</p>
          <div className="mt-2 px-4 py-2 bg-primary/10 rounded-full">
            <p className="text-sm font-semibold text-primary">
              {images.filter(f => f.type.startsWith('image/')).length}/{MAX_IMAGES} images • {images.filter(f => f.type.startsWith('video/')).length}/{MAX_VIDEOS} video (min 1 media required)
            </p>
          </div>
        </div>
      </div>

      {/* Media Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((file, index) => {
            const isVideo = file.type.startsWith('video/');
            const isFirstImage = !isVideo && images.slice(0, index).every(f => f.type.startsWith('video/'));
            
            return (
              <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                {isVideo ? (
                  <video
                    src={URL.createObjectURL(file)}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Property ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
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
                {isFirstImage && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Thumbnail (Cover Image)
                  </div>
                )}
                {isVideo && (
                  <div className="absolute top-2 left-2 bg-accent-purple text-primary-foreground text-xs px-2 py-1 rounded">
                    Video
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Status Message */}
      {images.length > 0 && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <Check className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-primary">
              Ready to proceed! You can upload more media if needed
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
