-- Add new columns to properties table for comprehensive listing details

-- Listing details
ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'sale';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_link TEXT;

-- Property details
ALTER TABLE properties ADD COLUMN IF NOT EXISTS other_property_type TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS toilets INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS kitchens INTEGER DEFAULT 1;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_spaces INTEGER DEFAULT 0;

-- Amenities (boolean fields)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_balcony BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_wardrobes BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_pop_ceiling BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_water_supply BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_power_supply BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_security BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_cctv BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_gatehouse BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_swimming_pool BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_gym BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_elevator BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_accessibility BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_pet_friendly BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_internet BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_playground BOOLEAN DEFAULT false;

-- Furnishing
ALTER TABLE properties ADD COLUMN IF NOT EXISTS furnishing_status TEXT; -- furnished/semi-furnished/unfurnished

-- Finishing details
ALTER TABLE properties ADD COLUMN IF NOT EXISTS flooring_type TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS kitchen_type TEXT; -- open/closed
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_air_conditioning BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_water_heater BOOLEAN DEFAULT false;

-- Short-let specific fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS daily_price NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS weekly_price NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS monthly_price NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS service_fee NUMERIC;

-- Rent specific fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rent_duration TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS agency_fee NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS agreement_fee NUMERIC;

-- Sale specific fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS title_type TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_size NUMERIC;

-- Receipt requirement tracking
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_receipt BOOLEAN DEFAULT false;

COMMENT ON COLUMN properties.listing_type IS 'Type of listing: rent, sale, short-let, lease, joint-venture, co-living, airbnb, off-plan, distress-sale';
COMMENT ON COLUMN properties.furnishing_status IS 'Furnishing status: furnished, semi-furnished, unfurnished';
COMMENT ON COLUMN properties.kitchen_type IS 'Kitchen type: open, closed';
COMMENT ON COLUMN properties.flooring_type IS 'Flooring type: tiles, marble, terrazzo, wood, cement';
COMMENT ON COLUMN properties.title_type IS 'Property title type for sales';
COMMENT ON COLUMN properties.has_receipt IS 'Whether property has uploaded receipt document';