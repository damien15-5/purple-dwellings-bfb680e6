import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit, MapPin, Home, Image as ImageIcon } from 'lucide-react';
import { UploadFormData } from '@/pages/UploadListing';

type Props = {
  formData: UploadFormData;
  images: File[];
  documents: { type: string; file: File }[];
  onEdit: (step: number) => void;
};

export const ReviewStep = ({ formData, images, documents, onEdit }: Props) => {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const propertyType = formData.propertyType === 'Others' 
    ? formData.otherPropertyType 
    : formData.propertyType;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Review Your Listing</h2>
        <p className="text-muted-foreground">Please review all details before publishing</p>
      </div>

      {/* Basic Details */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Home className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Basic Details</h3>
          </div>
          <Button size="sm" variant="outline" onClick={() => onEdit(1)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Property Type</p>
            <p className="font-medium text-foreground">{propertyType}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Listing Type</p>
            <p className="font-medium text-foreground capitalize">{formData.listingType.replace('-', ' ')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Location</p>
            <p className="font-medium text-foreground">{formData.street}, {formData.city}, {formData.state}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Price</p>
            <p className="font-medium text-foreground">{formatCurrency(formData.price)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Size</p>
            <p className="font-medium text-foreground">{formData.size} sqm</p>
          </div>
        </div>
        
        <div>
          <p className="text-muted-foreground text-sm mb-2">Description</p>
          <p className="text-foreground text-sm">{formData.description}</p>
        </div>
      </Card>

      {/* Amenities */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Amenities</h3>
          </div>
          <Button size="sm" variant="outline" onClick={() => onEdit(2)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        {formData.propertyType !== 'Land' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Bedrooms</p>
              <p className="font-medium text-foreground">{formData.bedrooms}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Bathrooms</p>
              <p className="font-medium text-foreground">{formData.bathrooms}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Toilets</p>
              <p className="font-medium text-foreground">{formData.toilets}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Parking</p>
              <p className="font-medium text-foreground">{formData.parkingSpaces}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {[
            formData.hasBalcony && 'Balcony',
            formData.hasWardrobes && 'Wardrobes',
            formData.hasPopCeiling && 'POP Ceiling',
            formData.hasWaterSupply && 'Water Supply',
            formData.hasPowerSupply && 'Power Supply',
            formData.hasSecurity && 'Security',
            formData.hasCctv && 'CCTV',
            formData.hasGatehouse && 'Gatehouse',
            formData.hasSwimmingPool && 'Swimming Pool',
            formData.hasGym && 'Gym',
            formData.hasElevator && 'Elevator',
            formData.hasAccessibility && 'Accessibility',
            formData.isPetFriendly && 'Pet Friendly',
            formData.hasInternet && 'Internet',
            formData.hasPlayground && 'Playground',
            formData.hasAirConditioning && 'Air Conditioning',
            formData.hasWaterHeater && 'Water Heater',
          ].filter(Boolean).map((amenity, i) => (
            <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
              {amenity}
            </span>
          ))}
        </div>
      </Card>

      {/* Images */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Images ({images.length})</h3>
          </div>
          <Button size="sm" variant="outline" onClick={() => onEdit(3)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {images.slice(0, 10).map((image, index) => (
            <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={URL.createObjectURL(image)}
                alt={`Property ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        {images.length > 10 && (
          <p className="text-sm text-muted-foreground">+{images.length - 10} more images</p>
        )}
      </Card>

    </div>
  );
};
