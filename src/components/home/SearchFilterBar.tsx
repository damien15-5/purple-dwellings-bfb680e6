import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SearchFilterBarProps = {
  priceRange: number[];
  setPriceRange: (value: number[]) => void;
  location: string;
  setLocation: (value: string) => void;
  propertyType: string;
  setPropertyType: (value: string) => void;
  bedrooms: string;
  setBedrooms: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  onReset?: () => void;
};

export const SearchFilterBar = ({
  priceRange,
  setPriceRange,
  location,
  setLocation,
  propertyType,
  setPropertyType,
  bedrooms,
  setBedrooms,
  status,
  setStatus,
  onReset
}: SearchFilterBarProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section className="bg-card border-b sticky top-0 z-40 shadow-sm animate-fade-in">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Filter Properties</h3>
          </div>
          {onReset && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              Reset Filters
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Price Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Price Range</label>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={200000000}
              step={5000000}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>{formatPrice(priceRange[0])}</span>
              <span>{formatPrice(priceRange[1])}</span>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Location</label>
            <Input
              placeholder="Enter location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Property Type</label>
            <Select value={propertyType || "all"} onValueChange={(value) => setPropertyType(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="House">House</SelectItem>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Land">Land</SelectItem>
                <SelectItem value="Duplex">Duplex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bedrooms */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Bedrooms</label>
            <Select value={bedrooms || "all"} onValueChange={(value) => setBedrooms(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="1">1 Bedroom</SelectItem>
                <SelectItem value="2">2 Bedrooms</SelectItem>
                <SelectItem value="3">3 Bedrooms</SelectItem>
                <SelectItem value="4">4 Bedrooms</SelectItem>
                <SelectItem value="5">5+ Bedrooms</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Listing Status</label>
            <Select value={status || "all"} onValueChange={(value) => setStatus(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Sold">Sold/Rented</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </section>
  );
};