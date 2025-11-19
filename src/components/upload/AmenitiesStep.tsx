import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadFormData } from '@/pages/UploadListing';

type Props = {
  formData: UploadFormData;
  updateFormData: (updates: Partial<UploadFormData>) => void;
};

export const AmenitiesStep = ({ formData, updateFormData }: Props) => {
  const isLand = formData.propertyType === 'Land';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Amenities & Features</h2>
        <p className="text-muted-foreground">Select all amenities available in your property</p>
      </div>

      {/* Basic Property Info (hidden for Land) */}
      {!isLand && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                min="0"
                value={formData.bedrooms}
                onChange={(e) => updateFormData({ bedrooms: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                min="0"
                value={formData.bathrooms}
                onChange={(e) => updateFormData({ bathrooms: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toilets">Toilets</Label>
              <Input
                id="toilets"
                type="number"
                min="0"
                value={formData.toilets}
                onChange={(e) => updateFormData({ toilets: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kitchens">Kitchens</Label>
              <Input
                id="kitchens"
                type="number"
                min="0"
                value={formData.kitchens}
                onChange={(e) => updateFormData({ kitchens: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parkingSpaces">Parking</Label>
              <Input
                id="parkingSpaces"
                type="number"
                min="0"
                value={formData.parkingSpaces}
                onChange={(e) => updateFormData({ parkingSpaces: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* General Features */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">General Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: 'hasBalcony', label: 'Balcony' },
            { key: 'hasWardrobes', label: 'Wardrobes' },
            { key: 'hasPopCeiling', label: 'POP Ceiling' },
            { key: 'hasWaterSupply', label: 'Water Supply' },
            { key: 'hasPowerSupply', label: 'Power Supply' },
            { key: 'hasSecurity', label: 'Security' },
            { key: 'hasCctv', label: 'CCTV' },
            { key: 'hasGatehouse', label: 'Gatehouse' },
            { key: 'hasSwimmingPool', label: 'Swimming Pool' },
            { key: 'hasGym', label: 'Gym' },
            { key: 'hasElevator', label: 'Elevator' },
            { key: 'hasAccessibility', label: 'Accessibility Features' },
            { key: 'isPetFriendly', label: 'Pet Friendly' },
            { key: 'hasInternet', label: 'Internet Availability' },
            { key: 'hasPlayground', label: 'Children Playground' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={formData[key as keyof UploadFormData] as boolean}
                onCheckedChange={(checked) => updateFormData({ [key]: checked })}
              />
              <Label htmlFor={key} className="cursor-pointer font-normal">{label}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Furnishing Status */}
      {!isLand && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Furnishing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="furnishingStatus">Furnishing Status</Label>
              <Select value={formData.furnishingStatus} onValueChange={(value) => updateFormData({ furnishingStatus: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="furnished">Furnished</SelectItem>
                  <SelectItem value="semi-furnished">Semi-furnished</SelectItem>
                  <SelectItem value="unfurnished">Unfurnished</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Finishing Features */}
      {!isLand && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Finishing Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flooringType">Flooring Type</Label>
              <Select value={formData.flooringType} onValueChange={(value) => updateFormData({ flooringType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select flooring" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="tiles">Tiles</SelectItem>
                  <SelectItem value="marble">Marble</SelectItem>
                  <SelectItem value="terrazzo">Terrazzo</SelectItem>
                  <SelectItem value="wood">Wood</SelectItem>
                  <SelectItem value="cement">Cement Floor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kitchenType">Kitchen Type</Label>
              <Select value={formData.kitchenType} onValueChange={(value) => updateFormData({ kitchenType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select kitchen type" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="open">Open Kitchen</SelectItem>
                  <SelectItem value="closed">Closed Kitchen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasAirConditioning"
                checked={formData.hasAirConditioning}
                onCheckedChange={(checked) => updateFormData({ hasAirConditioning: checked as boolean })}
              />
              <Label htmlFor="hasAirConditioning" className="cursor-pointer font-normal">Air Conditioning</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasWaterHeater"
                checked={formData.hasWaterHeater}
                onCheckedChange={(checked) => updateFormData({ hasWaterHeater: checked as boolean })}
              />
              <Label htmlFor="hasWaterHeater" className="cursor-pointer font-normal">Water Heater</Label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
