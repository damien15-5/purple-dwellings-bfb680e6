export interface AreaData {
  slug: string;
  name: string;
  description: string;
}

export interface CityData {
  slug: string;
  name: string;
  state: string;
  description: string;
  areas: AreaData[];
}

export const cities: CityData[] = [
  {
    slug: 'benin-city',
    name: 'Benin City',
    state: 'Edo State',
    description: 'Benin City, the capital of Edo State, is one of Nigeria\'s fastest-growing real estate markets. With a rich cultural heritage and expanding infrastructure, the city offers diverse property options from affordable student housing near UNIBEN to premium estates in GRA. The property market here combines value pricing with strong appreciation potential.',
    areas: [
      { slug: 'ugbowo', name: 'Ugbowo', description: 'Ugbowo is a vibrant area close to the University of Benin, popular for student accommodation and residential properties. It offers affordable housing options with good transport links to the city center.' },
      { slug: 'gra', name: 'GRA', description: 'The Government Reserved Area (GRA) is Benin City\'s most prestigious neighborhood, home to upscale residences, embassies, and corporate offices. Properties here command premium prices but offer excellent security and infrastructure.' },
      { slug: 'ikpoba-hill', name: 'Ikpoba Hill', description: 'Ikpoba Hill is a rapidly developing area with a mix of residential and commercial properties. It offers good value for money with proximity to major roads and markets.' },
      { slug: 'sapele-road', name: 'Sapele Road', description: 'Sapele Road is one of Benin City\'s major commercial corridors, ideal for mixed-use properties and businesses. The area is well-connected and offers diverse property types.' },
      { slug: 'new-benin', name: 'New Benin', description: 'New Benin is a bustling commercial and residential district known for its markets and transport hubs. It offers affordable properties with high rental demand.' },
      { slug: 'aduwawa', name: 'Aduwawa', description: 'Aduwawa is a growing residential area along the Benin-Auchi road, offering spacious plots and new developments at competitive prices.' },
      { slug: 'uniben-area', name: 'UNIBEN Area', description: 'The area surrounding the University of Benin is prime territory for student accommodation investments, with consistent rental demand throughout the academic year.' },
    ],
  },
  {
    slug: 'lagos',
    name: 'Lagos',
    state: 'Lagos State',
    description: 'Lagos is Nigeria\'s economic powerhouse and largest city, with one of Africa\'s most dynamic real estate markets. From luxury waterfront apartments in Ikoyi to affordable housing in emerging areas, Lagos offers opportunities across every property segment. The city\'s ongoing infrastructure development continues to drive property values upward.',
    areas: [
      { slug: 'lekki', name: 'Lekki', description: 'Lekki is Lagos\'s fastest-growing luxury real estate corridor, featuring modern estates, shopping malls, and excellent infrastructure. It\'s the preferred choice for upscale living.' },
      { slug: 'ikoyi', name: 'Ikoyi', description: 'Ikoyi is Lagos\'s most exclusive residential neighborhood, home to high-net-worth individuals, diplomatic residences, and premium commercial properties.' },
      { slug: 'ibeju-lekki', name: 'Ibeju-Lekki', description: 'Ibeju-Lekki is the hottest investment destination in Lagos, driven by the Lekki Free Trade Zone, Dangote Refinery, and new international airport. Land prices have seen significant appreciation.' },
      { slug: 'yaba', name: 'Yaba', description: 'Yaba is Lagos\'s tech hub and a vibrant mixed-use district near the University of Lagos. It attracts young professionals and offers good rental yields.' },
      { slug: 'victoria-island', name: 'Victoria Island', description: 'Victoria Island is Lagos\'s premier business district, home to major banks, multinational corporations, and luxury hospitality. Commercial and residential properties command top-tier prices.' },
    ],
  },
  {
    slug: 'abuja',
    name: 'Abuja',
    state: 'FCT',
    description: 'Abuja, Nigeria\'s capital city, features a well-planned urban layout with organized districts and world-class infrastructure. The city\'s real estate market is characterized by government-driven demand, diplomatic presence, and steady appreciation. Abuja offers some of the most structured property markets in Nigeria.',
    areas: [
      { slug: 'maitama', name: 'Maitama', description: 'Maitama is Abuja\'s most prestigious district, hosting embassies, government officials\' residences, and luxury properties. It\'s the gold standard for high-end real estate in the capital.' },
      { slug: 'wuse', name: 'Wuse', description: 'Wuse is a major commercial and residential hub in Abuja, offering a mix of offices, shopping centers, and mid-to-high-end housing options.' },
      { slug: 'garki', name: 'Garki', description: 'Garki is Abuja\'s central business district with a blend of government buildings, corporate offices, and residential properties. It\'s ideal for professionals working in the city center.' },
    ],
  },
  {
    slug: 'port-harcourt',
    name: 'Port Harcourt',
    state: 'Rivers State',
    description: 'Port Harcourt, the oil capital of Nigeria, has a thriving real estate market driven by the energy sector. The city offers diverse property options from executive apartments in GRA to affordable housing in emerging suburbs. Oil industry demand keeps rental markets strong.',
    areas: [],
  },
];

export const getCityBySlug = (slug: string): CityData | undefined =>
  cities.find(c => c.slug === slug);

export const getAreaBySlug = (citySlug: string, areaSlug: string): AreaData | undefined => {
  const city = getCityBySlug(citySlug);
  return city?.areas.find(a => a.slug === areaSlug);
};

// Landing page configs
export interface LandingPageConfig {
  slug: string;
  h1: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  filters: {
    property_type?: string;
    listing_type?: string;
    state?: string;
    city?: string;
  };
  locationLinks: { label: string; to: string }[];
}

export const landingPages: LandingPageConfig[] = [
  {
    slug: 'land-for-sale-lagos',
    h1: 'Land for Sale in Lagos',
    description: 'Find verified plots and acres of land for sale across Lagos State. From Ibeju-Lekki to Epe, browse affordable and premium land deals with verified documentation on Xavorian.',
    metaTitle: 'Land for Sale in Lagos – Verified Plots | Xavorian',
    metaDescription: 'Browse verified land for sale in Lagos. Affordable plots in Ibeju-Lekki, Epe, Ikorodu & more. Scam-free transactions on Xavorian.',
    filters: { property_type: 'land', listing_type: 'sale', state: 'Lagos' },
    locationLinks: [
      { label: 'Lekki Properties', to: '/location/lagos/lekki' },
      { label: 'Ibeju-Lekki Properties', to: '/location/lagos/ibeju-lekki' },
    ],
  },
  {
    slug: 'land-for-sale-benin-city',
    h1: 'Land for Sale in Benin City',
    description: 'Explore verified land listings in Benin City, Edo State. Whether you\'re looking for residential or commercial plots, find trusted sellers and secure transactions on Xavorian.',
    metaTitle: 'Land for Sale in Benin City – Verified Plots | Xavorian',
    metaDescription: 'Find verified land for sale in Benin City, Edo State. Residential and commercial plots with trusted sellers on Xavorian.',
    filters: { property_type: 'land', listing_type: 'sale', city: 'Benin City' },
    locationLinks: [
      { label: 'GRA Properties', to: '/location/benin-city/gra' },
      { label: 'Ikpoba Hill Properties', to: '/location/benin-city/ikpoba-hill' },
    ],
  },
  {
    slug: 'cheap-land-ibeju-lekki',
    h1: 'Cheap Land in Ibeju-Lekki',
    description: 'Discover affordable land opportunities in Ibeju-Lekki, one of Lagos\'s fastest-appreciating areas. Verified listings near the Lekki Free Trade Zone and Dangote Refinery.',
    metaTitle: 'Cheap Land in Ibeju-Lekki – Affordable Plots | Xavorian',
    metaDescription: 'Buy cheap land in Ibeju-Lekki near Dangote Refinery & Free Trade Zone. Verified plots with secure transactions on Xavorian.',
    filters: { property_type: 'land', city: 'Ibeju-Lekki' },
    locationLinks: [
      { label: 'Ibeju-Lekki Area', to: '/location/lagos/ibeju-lekki' },
      { label: 'Lagos Properties', to: '/location/lagos' },
    ],
  },
  {
    slug: 'duplex-for-sale-lekki',
    h1: 'Duplex for Sale in Lekki',
    description: 'Browse luxury and semi-detached duplexes for sale in Lekki, Lagos. Verified listings with complete documentation and secure payment options on Xavorian.',
    metaTitle: 'Duplex for Sale in Lekki – Luxury & Semi-Detached | Xavorian',
    metaDescription: 'Find verified duplexes for sale in Lekki, Lagos. Luxury & semi-detached homes with secure transactions on Xavorian.',
    filters: { property_type: 'house', listing_type: 'sale', city: 'Lekki' },
    locationLinks: [
      { label: 'Lekki Area', to: '/location/lagos/lekki' },
      { label: 'Lagos Properties', to: '/location/lagos' },
    ],
  },
  {
    slug: 'apartments-for-rent-benin-city',
    h1: 'Apartments for Rent in Benin City',
    description: 'Find affordable and verified apartments for rent in Benin City. From self-contained to 3-bedroom flats, discover listings with trusted landlords on Xavorian.',
    metaTitle: 'Apartments for Rent in Benin City | Xavorian',
    metaDescription: 'Rent verified apartments in Benin City. Self-con to 3-bed flats with trusted landlords. Scam-free on Xavorian.',
    filters: { property_type: 'apartment', listing_type: 'rent', city: 'Benin City' },
    locationLinks: [
      { label: 'Ugbowo Listings', to: '/location/benin-city/ugbowo' },
      { label: 'UNIBEN Area', to: '/location/benin-city/uniben-area' },
    ],
  },
  {
    slug: 'student-accommodation-benin-city',
    h1: 'Student Accommodation in Benin City',
    description: 'Find affordable student housing near the University of Benin and other institutions. Self-contained rooms, shared apartments, and hostels with verified landlords.',
    metaTitle: 'Student Accommodation in Benin City | UNIBEN | Xavorian',
    metaDescription: 'Find affordable student housing near UNIBEN. Self-con, shared flats & hostels with verified landlords on Xavorian.',
    filters: { listing_type: 'rent', city: 'Benin City' },
    locationLinks: [
      { label: 'Ugbowo Listings', to: '/location/benin-city/ugbowo' },
      { label: 'UNIBEN Area', to: '/location/benin-city/uniben-area' },
    ],
  },
  {
    slug: 'houses-for-rent-ugbowo',
    h1: 'Houses for Rent in Ugbowo, Benin City',
    description: 'Browse verified houses and apartments for rent in Ugbowo, near the University of Benin. Affordable options for students and families.',
    metaTitle: 'Houses for Rent in Ugbowo, Benin City | Xavorian',
    metaDescription: 'Rent verified houses in Ugbowo, Benin City. Near UNIBEN with affordable prices. Trusted landlords on Xavorian.',
    filters: { listing_type: 'rent', city: 'Ugbowo' },
    locationLinks: [
      { label: 'Ugbowo Area', to: '/location/benin-city/ugbowo' },
      { label: 'Benin City Properties', to: '/location/benin-city' },
    ],
  },
  {
    slug: 'property-for-sale-edo-state',
    h1: 'Property for Sale in Edo State',
    description: 'Discover verified properties for sale across Edo State. Houses, land, and commercial properties in Benin City and surrounding areas with secure transactions.',
    metaTitle: 'Property for Sale in Edo State – Verified Listings | Xavorian',
    metaDescription: 'Buy verified property in Edo State. Houses, land & commercial listings in Benin City & surrounds. Secure on Xavorian.',
    filters: { listing_type: 'sale', state: 'Edo' },
    locationLinks: [
      { label: 'Benin City Properties', to: '/location/benin-city' },
      { label: 'GRA Listings', to: '/location/benin-city/gra' },
    ],
  },
];

export const getLandingPageBySlug = (slug: string): LandingPageConfig | undefined =>
  landingPages.find(lp => lp.slug === slug);
