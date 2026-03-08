import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Check, Loader2 } from 'lucide-react';
import { BasicDetails } from '@/components/upload/BasicDetails';
import { AmenitiesStep } from '@/components/upload/AmenitiesStep';
import { ImagesUploadStep } from '@/components/upload/ImagesUploadStep';
import { ReviewStep } from '@/components/upload/ReviewStep';
import { optimizeImageForWeb } from '@/utils/mediaOptimizer';
import { validateVideo, formatFileSize } from '@/utils/videoOptimizer';
import { uploadToCloudinary } from '@/utils/cloudinaryUpload';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

const generateVideoThumbnail = (videoFile: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(videoFile);
    video.src = url;
    video.onloadeddata = () => {
      video.currentTime = 1; // Seek to 1 second
    };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error('Failed to create thumbnail'));
      }, 'image/webp', 0.7);
    };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load video')); };
  });
};

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
  { id: 1, name: 'Basic Details' },
  { id: 2, name: 'Amenities' },
  { id: 3, name: 'Images' },
  { id: 4, name: 'Review' },
];

export const UploadListing = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  
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
  const [isKycVerified, setIsKycVerified] = useState<boolean | null>(null);
  const [kycLoading, setKycLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login to upload listings');
        navigate('/login');
        return;
      }
      setUserId(session.user.id);

      // Check KYC status
      const { data: kyc } = await supabase
        .from('kyc_documents')
        .select('status')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setIsKycVerified(kyc?.status === 'verified');
      setKycLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const updateFormData = (updates: Partial<UploadFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = async () => {
    // Validation for each step
    if (currentStep === 1) {
      const required = ['propertyType', 'listingType', 'state', 'city', 'price', 'description'];
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
      const imageCount = images.filter(f => f.type.startsWith('image/')).length;
      const videoFiles = images.filter(f => f.type.startsWith('video/'));
      
      if (images.length === 0) {
        toast.error('Please upload at least 1 image or video');
        return;
      }

      // Validate video files
      for (const video of videoFiles) {
        const validation = await validateVideo(video);
        if (!validation.valid) {
          toast.error(validation.message || 'Invalid video file');
          return;
        }
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    // Prevent double submission
    if (uploading || submitted) return;
    setSubmitted(true);

    // Check if seller has verified bank account
    const { data: profile } = await supabase
      .from('profiles')
      .select('bank_verified, account_number')
      .eq('id', userId)
      .single();

    if (!profile?.bank_verified || !profile?.account_number) {
      toast.error('You must verify your bank account before publishing a listing. Go to Settings → Bank Account.');
      return;
    }

    setUploading(true);
    setUploadProgress('Optimizing images...');

    try {
      // Separate images and videos
      const imageFiles = images.filter(f => f.type.startsWith('image/'));
      const videoFiles = images.filter(f => f.type.startsWith('video/'));

      // Optimize and upload images to GCS with aggressive compression
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploadProgress(`Compressing ${imageFiles.length} images to WebP...`);
        
        const imageUploads = imageFiles.map(async (image, index) => {
          const optimizedImage = await optimizeImageForWeb(image, {
            maxSizeMB: 0.1,
            maxWidthOrHeight: 1200,
            quality: 0.6,
          });
          
          console.log(`Image ${index + 1}: ${formatFileSize(image.size)} → ${formatFileSize(optimizedImage.size)}`);
          
          const result = await uploadToCloudinary(
            optimizedImage,
            `property-images/${userId}`
          );
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to upload image');
          }
          
          return result.url!;
        });

        setUploadProgress('Uploading images to cloud...');
        imageUrls = await Promise.all(imageUploads);
      }

      // Upload videos to GCS
      let videoUrl: string | null = null;
      if (videoFiles.length > 0) {
        setUploadProgress('Uploading video to cloud...');
        const video = videoFiles[0];
        
        const result = await uploadToCloudinary(
          video,
          `property-videos/${userId}`
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to upload video');
        }
        
        videoUrl = result.url!;

        // If no images uploaded, generate thumbnail from video
        if (imageUrls.length === 0) {
          setUploadProgress('Generating video thumbnail...');
          try {
            const thumbnailBlob = await generateVideoThumbnail(video);
            const thumbnailFile = new File([thumbnailBlob], 'video-thumbnail.webp', { type: 'image/webp' });
            const thumbResult = await uploadToCloudinary(
              thumbnailFile,
              `property-images/${userId}`
            );
            if (thumbResult.success && thumbResult.url) {
              imageUrls = [thumbResult.url];
            }
          } catch (thumbError) {
            console.warn('Failed to generate video thumbnail:', thumbError);
          }
        }
      }

      setUploadProgress('Publishing listing...');

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
          has_receipt: false,
          images: imageUrls,
          video_url: videoUrl,
          documents: [],
          is_verified: isKycVerified === true,
          status: 'published',
        });

      if (insertError) throw insertError;

      // Notify admin via Telegram
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({
            type: 'new_listing',
            data: {
              title: `${formData.propertyType} in ${formData.city}`,
              price: formData.price,
              propertyType: formData.propertyType === 'Others' ? formData.otherPropertyType : formData.propertyType,
              state: formData.state,
              city: formData.city,
              userId,
              images: imageUrls,
            },
          }),
        });
      } catch (e) { console.error('Telegram notify error:', e); }

      toast.success('Property published successfully!');
      navigate('/dashboard/listings');
    } catch (error: any) {
      console.error('Error uploading property:', error);
      toast.error(error.message || 'Failed to upload property');
      setSubmitted(false); // Allow retry on error
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  if (kycLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isKycVerified === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-background flex items-center justify-center px-4">
        <Card className="max-w-lg w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">KYC Verification Required</h2>
          <p className="text-muted-foreground">
            You must complete your identity verification (KYC) before you can upload properties. This helps us ensure trust and safety on our platform.
          </p>
          <Button
            onClick={() => navigate('/dashboard/verification')}
            className="bg-gradient-to-r from-primary to-primary-light"
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Complete KYC Verification
          </Button>
        </Card>
      </div>
    );
  }

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
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 shadow-md ${
                      currentStep > step.id
                        ? 'bg-gradient-to-br from-primary to-primary-light text-primary-foreground scale-110'
                        : currentStep === step.id
                        ? 'bg-gradient-to-br from-primary to-primary-light text-primary-foreground scale-110 ring-4 ring-primary/20'
                        : 'bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
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
              hasReceipt={false}
              setHasReceipt={() => {}}
              propertyType={formData.propertyType}
            />
          )}
          
          {currentStep === 4 && (
            <ReviewStep 
              formData={formData} 
              images={images}
              documents={[]}
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
          
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
              Step {currentStep} of {STEPS.length}
            </div>
            {uploadProgress && (
              <p className="text-xs text-primary mt-2 flex items-center justify-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                {uploadProgress}
              </p>
            )}
          </div>

          {currentStep < STEPS.length ? (
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
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish Listing'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
