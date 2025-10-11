import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, X, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const UploadListing = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    propertyType: '',
    address: '',
    description: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    yearBuilt: '',
    condition: '',
    amenities: [] as string[],
    status: 'draft',
  });

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

  const amenitiesList = [
    'Pool', 'Garden', 'Security', 'Gym', 'Parking', 
    'Solar', 'Generator', 'Air Conditioning', 'Balcony'
  ];

  const handleNext = () => {
    if (step === 1 && (!formData.title || !formData.propertyType)) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (step === 4 && images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    setStep(step + 1);
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    const newImages = Array.from(files).slice(0, 20 - images.length);
    setImages([...images, ...newImages]);
    toast.success(`${newImages.length} image(s) uploaded`);
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('property-images')
        .upload(filePath, image);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    setUploading(true);
    
    try {
      // Upload images
      const imageUrls = await uploadImages();

      // Insert property
      const { data, error } = await supabase
        .from('properties')
        .insert([
          {
            user_id: userId,
            title: formData.title,
            description: formData.description,
            property_type: formData.propertyType,
            address: formData.address,
            price: parseFloat(formData.price),
            bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
            bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
            area: formData.area ? parseFloat(formData.area) : null,
            year_built: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
            condition: formData.condition,
            amenities: formData.amenities,
            status: 'published',
            images: imageUrls,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Listing published successfully!');
      setStep(6);
    } catch (error: any) {
      console.error('Error uploading listing:', error);
      toast.error(error.message || 'Failed to upload listing');
    } finally {
      setUploading(false);
    }
  };

  if (step === 6) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full animate-scale-in">
          <CardContent className="text-center py-12">
            <CheckCircle2 className="h-24 w-24 text-success mx-auto mb-6 animate-float" />
            <h1 className="text-3xl font-bold mb-4">Listing Published Successfully!</h1>
            <p className="text-muted-foreground mb-8">
              Your listing is now visible to buyers on the marketplace
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/my-listings')} className="w-full hover-lift">
                View My Listings
              </Button>
              <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    s <= step ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'
                  }`}
                >
                  {s}
                </div>
                {s < 5 && (
                  <div className={`flex-1 h-1 mx-2 transition-all ${s < step ? 'bg-primary' : 'bg-accent'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="card-glow">
          <CardHeader>
            <CardTitle>Create New Listing</CardTitle>
            <CardDescription>
              Step {step} of 5: {
                ['Basic Information', 'Property Details', 'Amenities & Features', 'Media Upload', 'Review & Publish'][step - 1]
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <Label htmlFor="title">Property Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Modern 3-Bedroom House in Lekki"
                  />
                </div>
                <div>
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="House">House</SelectItem>
                      <SelectItem value="Apartment">Apartment</SelectItem>
                      <SelectItem value="Villa">Villa</SelectItem>
                      <SelectItem value="Land">Land</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Property address"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your property..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (₦) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="45000000"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      placeholder="2"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="area">Property Area (sqm)</Label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="2500"
                  />
                </div>
                <div>
                  <Label htmlFor="yearBuilt">Year Built</Label>
                  <Input
                    id="yearBuilt"
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                    placeholder="2020"
                  />
                </div>
                <div>
                  <Label>Property Condition</Label>
                  <RadioGroup
                    value={formData.condition}
                    onValueChange={(value) => setFormData({ ...formData, condition: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="excellent" id="excellent" />
                      <Label htmlFor="excellent">Excellent</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="good" id="good" />
                      <Label htmlFor="good">Good</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fair" id="fair" />
                      <Label htmlFor="fair">Fair</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 3: Amenities */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <Label>Select Amenities</Label>
                <div className="grid grid-cols-2 gap-4">
                  {amenitiesList.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity}
                        checked={formData.amenities.includes(amenity)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, amenities: [...formData.amenities, amenity] });
                          } else {
                            setFormData({ ...formData, amenities: formData.amenities.filter(a => a !== amenity) });
                          }
                        }}
                      />
                      <Label htmlFor={amenity} className="cursor-pointer">{amenity}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Media */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <Label>Property Images (Up to 20)</Label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:bg-accent/50 transition-colors mt-2">
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-1">Drop images here or click to browse</p>
                    <p className="text-xs text-muted-foreground">{images.length} of 20 uploaded</p>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e.target.files)}
                    />
                  </label>
                  {images.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`Upload ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-accent/50 p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold text-lg">Review Your Listing</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Title</span>
                      <p className="font-medium">{formData.title}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Price</span>
                      <p className="font-medium">₦{Number(formData.price).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Property Type</span>
                      <p className="font-medium">{formData.propertyType}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Images</span>
                      <p className="font-medium">{images.length} uploaded</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="hover-lift"
              >
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Save as Draft
                </Button>
                {step < 5 ? (
                  <Button onClick={handleNext} className="hover-lift" disabled={uploading}>
                    Next Step
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} className="hover-lift animate-glow" disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Publish Listing'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
