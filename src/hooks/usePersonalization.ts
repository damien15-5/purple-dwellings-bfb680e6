import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserPreferences = {
  preferredTypes: Record<string, number>;
  preferredStates: Record<string, number>;
  preferredCities: Record<string, number>;
  preferredListingTypes: Record<string, number>;
  avgPrice: number;
  avgBedrooms: number;
  totalViews: number;
};

const EMPTY_PREFS: UserPreferences = {
  preferredTypes: {},
  preferredStates: {},
  preferredCities: {},
  preferredListingTypes: {},
  avgPrice: 0,
  avgBedrooms: 0,
  totalViews: 0,
};

export const usePersonalization = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(EMPTY_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch last 100 views for preference building
      const { data: views } = await supabase
        .from('user_property_views')
        .select('property_type, price, city, state, bedrooms, listing_type')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(100);

      if (!views || views.length === 0) {
        setLoading(false);
        return;
      }

      const prefs: UserPreferences = {
        preferredTypes: {},
        preferredStates: {},
        preferredCities: {},
        preferredListingTypes: {},
        avgPrice: 0,
        avgBedrooms: 0,
        totalViews: views.length,
      };

      let totalPrice = 0;
      let totalBedrooms = 0;
      let priceCount = 0;
      let bedroomCount = 0;

      views.forEach((v) => {
        if (v.property_type) {
          prefs.preferredTypes[v.property_type] = (prefs.preferredTypes[v.property_type] || 0) + 1;
        }
        if (v.state) {
          prefs.preferredStates[v.state.toLowerCase()] = (prefs.preferredStates[v.state.toLowerCase()] || 0) + 1;
        }
        if (v.city) {
          prefs.preferredCities[v.city.toLowerCase()] = (prefs.preferredCities[v.city.toLowerCase()] || 0) + 1;
        }
        if (v.listing_type) {
          prefs.preferredListingTypes[v.listing_type] = (prefs.preferredListingTypes[v.listing_type] || 0) + 1;
        }
        if (v.price) {
          totalPrice += Number(v.price);
          priceCount++;
        }
        if (v.bedrooms) {
          totalBedrooms += v.bedrooms;
          bedroomCount++;
        }
      });

      prefs.avgPrice = priceCount > 0 ? totalPrice / priceCount : 0;
      prefs.avgBedrooms = bedroomCount > 0 ? totalBedrooms / bedroomCount : 0;

      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  return { preferences, loading };
};

/**
 * Calculate a personalization score for a property (0-100).
 * Higher = more relevant to user's viewing history.
 */
export const getPersonalizationScore = (
  property: {
    type?: string;
    property_type?: string;
    state?: string;
    city?: string;
    price?: number;
    bedrooms?: number;
    listing_type?: string;
  },
  prefs: UserPreferences
): number => {
  if (prefs.totalViews === 0) return 50; // neutral if no history

  let score = 0;
  let factors = 0;

  // Property type match (weight: 30)
  const pType = property.type || property.property_type || '';
  if (pType && prefs.preferredTypes[pType]) {
    score += (prefs.preferredTypes[pType] / prefs.totalViews) * 30;
  }
  factors += 30;

  // State match (weight: 25)
  const pState = (property.state || '').toLowerCase();
  if (pState && prefs.preferredStates[pState]) {
    score += (prefs.preferredStates[pState] / prefs.totalViews) * 25;
  }
  factors += 25;

  // City match (weight: 20)
  const pCity = (property.city || '').toLowerCase();
  if (pCity && prefs.preferredCities[pCity]) {
    score += (prefs.preferredCities[pCity] / prefs.totalViews) * 20;
  }
  factors += 20;

  // Price proximity (weight: 15) - closer to avg = higher score
  if (prefs.avgPrice > 0 && property.price) {
    const priceDiff = Math.abs(property.price - prefs.avgPrice) / prefs.avgPrice;
    const priceScore = Math.max(0, 1 - priceDiff) * 15;
    score += priceScore;
  }
  factors += 15;

  // Bedrooms proximity (weight: 10)
  if (prefs.avgBedrooms > 0 && property.bedrooms) {
    const bedDiff = Math.abs(property.bedrooms - prefs.avgBedrooms);
    const bedScore = Math.max(0, 1 - bedDiff / 3) * 10;
    score += bedScore;
  }
  factors += 10;

  return Math.round((score / factors) * 100);
};

/**
 * Track a property view for the current user.
 */
export const trackPropertyView = async (property: {
  id: string;
  property_type: string;
  price: number;
  city?: string;
  state?: string;
  bedrooms?: number;
  listing_type?: string;
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_property_views').insert({
      user_id: user.id,
      property_id: property.id,
      property_type: property.property_type,
      price: property.price,
      city: property.city || null,
      state: property.state || null,
      bedrooms: property.bedrooms || null,
      listing_type: property.listing_type || null,
    });
  } catch (error) {
    // Silent fail - don't disrupt UX for tracking
    console.error('Error tracking view:', error);
  }
};
