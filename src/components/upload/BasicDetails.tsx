import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadFormData } from '@/pages/UploadListing';

const PROPERTY_TYPES = [
  'Apartment', 'Duplex', 'Bungalow', 'Detached House', 'Semi-Detached House',
  'Terrace', 'Self-contain / Mini-flat', 'Land', 'Office space', 
  'Shop / Commercial space', 'Warehouse', 'Event center', 
  'Short-let apartment', 'Hostel / Lodge', 'Others'
];

const LISTING_TYPES = [
  { value: 'rent', label: 'Rent' },
  { value: 'sale', label: 'Sale' },
  { value: 'short-let', label: 'Short-let' },
  { value: 'lease', label: 'Lease' },
  { value: 'joint-venture', label: 'Joint Venture' },
  { value: 'co-living', label: 'Co-living' },
  { value: 'airbnb', label: 'AirBnB-type listing' },
  { value: 'off-plan', label: 'Off-plan property' },
  { value: 'distress-sale', label: 'Distress sale' },
];

type Props = {
  formData: UploadFormData;
  updateFormData: (updates: Partial<UploadFormData>) => void;
};

export const BasicDetails = ({ formData, updateFormData }: Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Basic Property Details</h2>
        <p className="text-muted-foreground">Provide essential information about your property</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Property Type */}
        <div className="space-y-2">
          <Label htmlFor="propertyType">Property Type *</Label>
          <Select value={formData.propertyType} onValueChange={(value) => updateFormData({ propertyType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              {PROPERTY_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Other Property Type (if Others selected) */}
        {formData.propertyType === 'Others' && (
          <div className="space-y-2">
            <Label htmlFor="otherPropertyType">Specify Property Type *</Label>
            <Input
              id="otherPropertyType"
              value={formData.otherPropertyType}
              onChange={(e) => updateFormData({ otherPropertyType: e.target.value })}
              placeholder="Enter property type"
            />
          </div>
        )}

        {/* Listing Type */}
        <div className="space-y-2">
          <Label htmlFor="listingType">Listing Type *</Label>
          <Select value={formData.listingType} onValueChange={(value) => updateFormData({ listingType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select listing type" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              {LISTING_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => updateFormData({ state: e.target.value })}
            placeholder="e.g., Lagos"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => updateFormData({ city: e.target.value })}
            placeholder="e.g., Ikeja"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="street">Street / Area *</Label>
          <Input
            id="street"
            value={formData.street}
            onChange={(e) => updateFormData({ street: e.target.value })}
            placeholder="e.g., Allen Avenue"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="locationLink">Google Maps Link (Optional)</Label>
        <Input
          id="locationLink"
          value={formData.locationLink}
          onChange={(e) => updateFormData({ locationLink: e.target.value })}
          placeholder="Paste Google Maps link here"
        />
      </div>

      {/* Price and Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="price">Price (₦) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => updateFormData({ price: e.target.value })}
            placeholder="e.g., 5000000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="size">Size (sqm) *</Label>
          <Input
            id="size"
            type="number"
            value={formData.size}
            onChange={(e) => updateFormData({ size: e.target.value })}
            placeholder="e.g., 250"
          />
        </div>
      </div>

      {/* Conditional Fields - Short-let */}
      {formData.listingType === 'short-let' && (
        <div className="space-y-4 p-4 bg-accent/50 rounded-lg">
          <h3 className="font-semibold text-foreground">Short-let Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dailyPrice">Daily Price (₦)</Label>
              <Input
                id="dailyPrice"
                type="number"
                value={formData.dailyPrice || ''}
                onChange={(e) => updateFormData({ dailyPrice: e.target.value })}
                placeholder="e.g., 50000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weeklyPrice">Weekly Price (₦)</Label>
              <Input
                id="weeklyPrice"
                type="number"
                value={formData.weeklyPrice || ''}
                onChange={(e) => updateFormData({ weeklyPrice: e.target.value })}
                placeholder="e.g., 300000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyPrice">Monthly Price (₦)</Label>
              <Input
                id="monthlyPrice"
                type="number"
                value={formData.monthlyPrice || ''}
                onChange={(e) => updateFormData({ monthlyPrice: e.target.value })}
                placeholder="e.g., 1000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceFee">Service Fee (₦)</Label>
              <Input
                id="serviceFee"
                type="number"
                value={formData.serviceFee || ''}
                onChange={(e) => updateFormData({ serviceFee: e.target.value })}
                placeholder="e.g., 50000"
              />
            </div>
          </div>
        </div>
      )}

      {/* Conditional Fields - Rent */}
      {formData.listingType === 'rent' && (
        <div className="space-y-4 p-4 bg-accent/50 rounded-lg">
          <h3 className="font-semibold text-foreground">Rent Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rentDuration">Rent Duration</Label>
              <Input
                id="rentDuration"
                value={formData.rentDuration || ''}
                onChange={(e) => updateFormData({ rentDuration: e.target.value })}
                placeholder="e.g., 1 year"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agencyFee">Agency Fee (₦)</Label>
              <Input
                id="agencyFee"
                type="number"
                value={formData.agencyFee || ''}
                onChange={(e) => updateFormData({ agencyFee: e.target.value })}
                placeholder="e.g., 500000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agreementFee">Agreement Fee (₦)</Label>
              <Input
                id="agreementFee"
                type="number"
                value={formData.agreementFee || ''}
                onChange={(e) => updateFormData({ agreementFee: e.target.value })}
                placeholder="e.g., 100000"
              />
            </div>
          </div>
        </div>
      )}

      {/* Conditional Fields - Sale */}
      {formData.listingType === 'sale' && (
        <div className="space-y-4 p-4 bg-accent/50 rounded-lg">
          <h3 className="font-semibold text-foreground">Sale Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titleType">Title Type</Label>
              <Input
                id="titleType"
                value={formData.titleType || ''}
                onChange={(e) => updateFormData({ titleType: e.target.value })}
                placeholder="e.g., C of O, Deed of Assignment"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landSize">Land Size (sqm)</Label>
              <Input
                id="landSize"
                type="number"
                value={formData.landSize || ''}
                onChange={(e) => updateFormData({ landSize: e.target.value })}
                placeholder="e.g., 500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Property Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Describe your property in detail..."
          className="min-h-[120px]"
        />
      </div>
    </div>
  );
};
