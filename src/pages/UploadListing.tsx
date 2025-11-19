import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Check } from 'lucide-react';
import { BasicDetails } from '@/components/upload/BasicDetails';
import { AmenitiesStep } from '@/components/upload/AmenitiesStep';
import { ImagesUploadStep } from '@/components/upload/ImagesUploadStep';
import { DocumentsUploadStep } from '@/components/upload/DocumentsUploadStep';
import { ReviewStep } from '@/components/upload/ReviewStep';

export type UploadFormData = {
  // Basic details
  propertyType: string;
  otherPropertyType: string;
  listingType: string;
  state: string;
  city: string;
  street: string;
  locationLink: string;
  price: string;
  size: string;
  description: string;
  
  // Amenities
  bedrooms: string;
  bathrooms: string;
  toilets: string;
  kitchens: string;
  parkingSpaces: string;
  hasBalcony: boolean;
  hasWardrobes: boolean;
  hasPopCeiling: boolean;
  hasWaterSupply: boolean;
  hasPowerSupply: boolean;
  hasSecurity: boolean;
  hasCctv: boolean;
  hasGatehouse: boolean;
  hasSwimmingPool: boolean;
  hasGym: boolean;
  hasElevator: boolean;
  hasAccessibility: boolean;
  isPetFriendly: boolean;
  hasInternet: boolean;
  hasPlayground: boolean;
  furnishingStatus: string;
  
  // Finishing
  flooringType: string;
  kitchenType: string;
  hasAirConditioning: boolean;
  hasWaterHeater: boolean;
  
  // Conditional fields
  dailyPrice?: string;
  weeklyPrice?: string;
  monthlyPrice?: string;
  serviceFee?: string;
  rentDuration?: string;
  agencyFee?: string;
  agreementFee?: string;
  titleType?: string;
  landSize?: string;
};

const STEPS = [
  { id: 1, name: 'Basic Details', icon: '📝' },
  { id: 2, name: 'Amenities', icon: '✨' },
  { id: 3, name: 'Images', icon: '📷' },
  { id: 4, name: 'Documents', icon: '📄' },
  { id: 5, name: 'Review', icon: '👀' },
];

export const UploadListing = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<UploadFormData>({
    propertyType: '',
    otherPropertyType: '',
    listingType: 'sale',
    state: '',
    city: '',
    street: '',
    locationLink: '',
    price: '',
    size: '',
    description: '',
    bedrooms: '0',
    bathrooms: '0',
    toilets: '0',
    kitchens: '1',
    parkingSpaces: '0',
    hasBalcony: false,
    hasWardrobes: false,
    hasPopCeiling: false,
    hasWaterSupply: false,
    hasPowerSupply: false,
    hasSecurity: false,
    hasCctv: false,
    hasGatehouse: false,
    hasSwimmingPool: false,
    hasGym: false,
    hasElevator: false,
    hasAccessibility: false,
    isPetFriendly: false,
    hasInternet: false,
    hasPlayground: false,
    furnishingStatus: '',
    flooringType: '',
    kitchenType: '',
    hasAirConditioning: false,
    hasWaterHeater: false,
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<{ type: string; file: File }[]>([]);
  const [hasReceipt, setHasReceipt] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login to upload listings');
        navigate('/login');
      } else {
        setUserId(session.user.id);
      }
    };
    checkAuth();
  }, [navigate]);

  const updateFormData = (updates: Partial<UploadFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1) {
      const required = ['propertyType', 'listingType', 'state', 'city', 'price', 'size', 'description'];
      const missing = required.filter(field => !formData[field as keyof UploadFormData]);
      
      if (missing.length > 0) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      if (formData.propertyType === 'Others' && !formData.otherPropertyType) {
        toast.error('Please specify the property type');
        return;
      }
    }
    
    if (currentStep === 3) {
      if (images.length < 3) {
        toast.error('Please upload at least 3 images');
        return;
      }
    }
    
    if (currentStep === 4) {
      // Require at least 3 documents total
      if (documents.length < 3) {
        toast.error('Please upload at least 3 documents');
        return;
      }
      
      // Check receipt for non-land properties
      if (formData.propertyType !== 'Land' && !hasReceipt) {
        toast.error('Please upload a receipt document');
        return;
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    setUploading(true);

    try {
      // Upload images
      const imageUrls: string[] = [];
      for (const image of images) {
        const fileName = `${userId}/${Date.now()}_${image.name}`;
        const { error: uploadError, data } = await supabase.storage
          .from('property-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      // Upload documents
      const documentData: any[] = [];
      for (const doc of documents) {
        const fileName = `${userId}/docs/${Date.now()}_${doc.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, doc.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        documentData.push({
          type: doc.type,
          url: publicUrl,
          name: doc.file.name,
        });
      }

      // Insert property
      const { error: insertError } = await supabase
        .from('properties')
        .insert({
          user_id: userId,
          title: `${formData.propertyType} in ${formData.city}`,
          description: formData.description,
          property_type: formData.propertyType === 'Others' ? formData.otherPropertyType : formData.propertyType,
          listing_type: formData.listingType,
          address: `${formData.street}, ${formData.city}, ${formData.state}`,
          state: formData.state,
          city: formData.city,
          street: formData.street,
          location_link: formData.locationLink,
          price: parseFloat(formData.price),
          area: parseFloat(formData.size),
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseInt(formData.bathrooms),
          toilets: parseInt(formData.toilets),
          kitchens: parseInt(formData.kitchens),
          parking_spaces: parseInt(formData.parkingSpaces),
          has_balcony: formData.hasBalcony,
          has_wardrobes: formData.hasWardrobes,
          has_pop_ceiling: formData.hasPopCeiling,
          has_water_supply: formData.hasWaterSupply,
          has_power_supply: formData.hasPowerSupply,
          has_security: formData.hasSecurity,
          has_cctv: formData.hasCctv,
          has_gatehouse: formData.hasGatehouse,
          has_swimming_pool: formData.hasSwimmingPool,
          has_gym: formData.hasGym,
          has_elevator: formData.hasElevator,
          has_accessibility: formData.hasAccessibility,
          is_pet_friendly: formData.isPetFriendly,
          has_internet: formData.hasInternet,
          has_playground: formData.hasPlayground,
          furnishing_status: formData.furnishingStatus,
          flooring_type: formData.flooringType,
          kitchen_type: formData.kitchenType,
          has_air_conditioning: formData.hasAirConditioning,
          has_water_heater: formData.hasWaterHeater,
          daily_price: formData.dailyPrice ? parseFloat(formData.dailyPrice) : null,
          weekly_price: formData.weeklyPrice ? parseFloat(formData.weeklyPrice) : null,
          monthly_price: formData.monthlyPrice ? parseFloat(formData.monthlyPrice) : null,
          service_fee: formData.serviceFee ? parseFloat(formData.serviceFee) : null,
          rent_duration: formData.rentDuration,
          agency_fee: formData.agencyFee ? parseFloat(formData.agencyFee) : null,
          agreement_fee: formData.agreementFee ? parseFloat(formData.agreementFee) : null,
          title_type: formData.titleType,
          land_size: formData.landSize ? parseFloat(formData.landSize) : null,
          has_receipt: hasReceipt,
          images: imageUrls,
          documents: documentData,
          status: 'pending',
        });

      if (insertError) throw insertError;

      toast.success('Property listed successfully! Pending verification.');
      navigate('/dashboard/listings');
    } catch (error: any) {
      console.error('Error uploading property:', error);
      toast.error(error.message || 'Failed to upload property');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 -left-40 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-accent-purple to-primary-light bg-clip-text text-transparent">
            List Your Property
          </h1>
          <p className="text-lg text-muted-foreground">Complete all steps to publish your listing</p>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8 p-6 border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold transition-all duration-500 shadow-md ${
                      currentStep > step.id
                        ? 'bg-gradient-to-br from-primary to-primary-light text-primary-foreground scale-110'
                        : currentStep === step.id
                        ? 'bg-gradient-to-br from-primary to-primary-light text-primary-foreground scale-110 animate-pulse shadow-primary'
                        : 'bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-7 h-7" /> : step.icon}
                  </div>
                  <span className={`text-xs mt-2 text-center font-medium transition-colors ${
                    currentStep === step.id ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {step.name}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="relative w-20 h-2 mx-3">
                    <div className="absolute inset-0 bg-muted/50 rounded-full" />
                    <div
                      className={`absolute inset-0 bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500 ${
                        currentStep > step.id ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Step Content */}
        <Card className="p-8 border-border/50 bg-card/80 backdrop-blur-sm shadow-xl mb-6 hover:shadow-2xl transition-shadow duration-300">
          {currentStep === 1 && (
            <BasicDetails formData={formData} updateFormData={updateFormData} />
          )}
          
          {currentStep === 2 && (
            <AmenitiesStep formData={formData} updateFormData={updateFormData} />
          )}
          
          {currentStep === 3 && (
            <ImagesUploadStep 
              images={images} 
              setImages={setImages}
              hasReceipt={hasReceipt}
              setHasReceipt={setHasReceipt}
              propertyType={formData.propertyType}
            />
          )}
          
          {currentStep === 4 && (
            <DocumentsUploadStep 
              documents={documents} 
              setDocuments={setDocuments}
              hasReceipt={hasReceipt}
              setHasReceipt={setHasReceipt}
              propertyType={formData.propertyType}
            />
          )}
          
          {currentStep === 5 && (
            <ReviewStep 
              formData={formData} 
              images={images}
              documents={documents}
              onEdit={(step) => setCurrentStep(step)}
            />
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || uploading}
            className="px-10 h-12 text-base font-semibold border-2 hover:border-primary hover:bg-primary/5"
          >
            Back
          </Button>
          
          <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
            Step {currentStep} of {STEPS.length}
          </div>

          {currentStep < 5 ? (
            <Button 
              onClick={handleNext} 
              disabled={uploading} 
              className="px-10 h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary-light hover:shadow-primary shadow-lg"
            >
              Next →
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={uploading} 
              className="px-10 h-12 text-base font-semibold bg-gradient-to-r from-primary via-accent-purple to-primary-light hover:shadow-primary shadow-lg"
            >
              {uploading ? 'Publishing...' : 'Publish Listing 🚀'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
