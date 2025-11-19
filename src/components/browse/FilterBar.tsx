import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  propertyType: string;
  setPropertyType: (value: string) => void;
  priceRange: [number, number];
  setPriceRange: (value: [number, number]) => void;
  bedrooms: string;
  setBedrooms: (value: string) => void;
  bathrooms: string;
  setBathrooms: (value: string) => void;
  country: string;
  setCountry: (value: string) => void;
  state: string;
  setState: (value: string) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (value: boolean) => void;
  onClearFilters: () => void;
  totalResults: number;
}

export const FilterBar = ({
  searchTerm,
  setSearchTerm,
  propertyType,
  setPropertyType,
  priceRange,
  setPriceRange,
  bedrooms,
  setBedrooms,
  bathrooms,
  setBathrooms,
  country,
  setCountry,
  state,
  setState,
  verifiedOnly,
  setVerifiedOnly,
  onClearFilters,
  totalResults
}: FilterBarProps) => {
  const [open, setOpen] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      notation: 'compact'
    }).format(price);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Price Range</Label>
        <Slider
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          max={500000000}
          step={1000000}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Property Type</Label>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="House">House</SelectItem>
              <SelectItem value="Apartment">Apartment</SelectItem>
              <SelectItem value="Duplex">Duplex</SelectItem>
              <SelectItem value="Villa">Villa</SelectItem>
              <SelectItem value="Land">Land</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Bedrooms</Label>
          <Select value={bedrooms} onValueChange={setBedrooms}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Bathrooms</Label>
          <Select value={bathrooms} onValueChange={setBathrooms}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Country</Label>
          <Input
            placeholder="e.g., Nigeria"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label>State</Label>
          <Input
            placeholder="e.g., Lagos"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="verified">Verified Listings Only</Label>
        <Switch
          id="verified"
          checked={verifiedOnly}
          onCheckedChange={setVerifiedOnly}
        />
      </div>

      <Button onClick={onClearFilters} variant="outline" className="w-full">
        <X className="w-4 h-4 mr-2" />
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border py-4 mb-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by location, property name, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Desktop Filters */}
          <div className="hidden lg:flex gap-2">
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="House">House</SelectItem>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="Duplex">Duplex</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Land">Land</SelectItem>
              </SelectContent>
            </Select>

            <Select value={bedrooms} onValueChange={setBedrooms}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Beds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setOpen(true)}
              className="gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              More Filters
            </Button>
          </div>

          {/* Mobile Filter Button */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" className="w-full md:w-auto">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filter Properties</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground whitespace-nowrap hidden md:block">
            {totalResults} {totalResults === 1 ? 'property' : 'properties'}
          </div>
        </div>
      </div>
    </div>
  );
};
